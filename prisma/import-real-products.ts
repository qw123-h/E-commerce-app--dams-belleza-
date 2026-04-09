import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import {PrismaClient, PriceMode, ProductType} from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_INPUT = path.resolve(process.cwd(), "data/product-import-template.csv");
const DEFAULT_IMAGE_DIR = path.resolve(process.cwd(), "public/catalog/real");

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const cleaned = String(value).replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSizesPricing(input: string | undefined) {
  if (!input) {
    return [] as Array<{size: string; price: number}>;
  }

  const text = input.replace(/\r\n/g, "\n");
  const regex = /T\s*(\d+)\s+([0-9][0-9\s.,]*)/gi;
  const matches: Array<{size: string; price: number}> = [];

  let current = regex.exec(text);
  while (current) {
    const size = `T${current[1]}`;
    const price = parseNumber(current[2]);
    if (price !== null) {
      matches.push({size, price});
    }
    current = regex.exec(text);
  }

  return matches;
}

function buildDescription(baseDescription: string, sizePricing: Array<{size: string; price: number}>) {
  if (sizePricing.length === 0) {
    return baseDescription;
  }

  const pricingLines = sizePricing.map((entry) => `${entry.size} - ${entry.price} XAF`).join("\n");
  return `${baseDescription}\n\nTailles disponibles:\n${pricingLines}`;
}

function normalizeType(rawType: string): ProductType {
  const normalized = rawType.trim().toLowerCase();
  if (normalized === "perfume" || normalized === "parfum") {
    return ProductType.PERFUME;
  }

  return ProductType.WIG;
}

function normalizePriceMode(rawValue: unknown, productType: ProductType): PriceMode {
  const normalized = String(rawValue ?? "").trim().toUpperCase();
  if (normalized === PriceMode.FIXED || normalized === PriceMode.NEGOTIABLE) {
    return normalized as PriceMode;
  }

  return productType === ProductType.PERFUME ? PriceMode.FIXED : PriceMode.NEGOTIABLE;
}

async function generateSku(productType: ProductType) {
  const prefix = productType === ProductType.PERFUME ? "PERF" : "WIG";
  const last = await prisma.product.findFirst({
    where: {sku: {startsWith: `${prefix}-`}},
    orderBy: {sku: "desc"},
    select: {sku: true},
  });

  const lastNumber = last?.sku ? Number(last.sku.split("-")[1]) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

async function ensureUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.product.findUnique({where: {slug}, select: {id: true}})) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function importRows(filePath: string) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {defval: ""});

  if (rows.length === 0) {
    throw new Error("No rows found in import file.");
  }

  const [perfumeCategory, wigCategory] = await Promise.all([
    prisma.category.findUnique({where: {slug: "perfumes"}, select: {id: true}}),
    prisma.category.findUnique({where: {slug: "wigs"}, select: {id: true}}),
  ]);

  if (!perfumeCategory || !wigCategory) {
    throw new Error("Categories not found. Run seed first to create 'perfumes' and 'wigs'.");
  }

  let created = 0;
  let updated = 0;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const typeRaw = String(row.type ?? "").trim();
    const name = String(row.name ?? "").trim();

    if (!typeRaw || !name) {
      console.warn(`Skipping row ${rowNumber}: missing required 'type' or 'name'.`);
      continue;
    }

    const productType = normalizeType(typeRaw);
    const baseDescription = String(row.description ?? "").trim();
    const sizePricing = parseSizesPricing(String(row.sizes_prices ?? "").trim());

    const explicitSalePrice = parseNumber(row.sale_price);
    const inferredMinPrice = sizePricing.length > 0 ? Math.min(...sizePricing.map((entry) => entry.price)) : null;
    const salePrice = explicitSalePrice ?? inferredMinPrice;
    const costPrice = parseNumber(row.cost_price) ?? inferredMinPrice;

    const priceMode = PriceMode.FIXED;

    const description = buildDescription(baseDescription || name, sizePricing);
    const currency = String(row.currency || "XAF").trim() || "XAF";
    const isPublished = parseBoolean(row.is_published, true);
    const quantityOnHand = parseNumber(row.stock) ?? (productType === ProductType.PERFUME ? 20 : 5);
    const reorderLevel = parseNumber(row.reorder_level) ?? (productType === ProductType.PERFUME ? 6 : 2);

    const categoryId = productType === ProductType.PERFUME ? perfumeCategory.id : wigCategory.id;

    const requestedSku = String(row.sku ?? "").trim();
    const imageFile = String(row.image_file ?? "").trim();
    const imageUrl = imageFile ? `/catalog/real/${imageFile}` : "";

    let resolvedSku = requestedSku || (await generateSku(productType));

    let existingBySku = await prisma.product.findUnique({
      where: {sku: resolvedSku},
      select: {id: true, slug: true},
    });

    if (!existingBySku && imageUrl) {
      const existingByImage = await prisma.productImage.findFirst({
        where: {url: imageUrl},
        select: {
          product: {
            select: {id: true, sku: true, slug: true},
          },
        },
      });

      if (existingByImage?.product) {
        resolvedSku = existingByImage.product.sku;
        existingBySku = {id: existingByImage.product.id, slug: existingByImage.product.slug};
      }
    }

    const requestedSlug = slugify(name);

    const resolvedSlug = existingBySku
      ? existingBySku.slug
      : await ensureUniqueSlug(requestedSlug);

    const product = await prisma.product.upsert({
      where: {sku: resolvedSku},
      update: {
        name,
        slug: resolvedSlug,
        description,
        productType,
        priceMode,
        salePrice,
        costPrice,
        categoryId,
        currency,
        isPublished,
      },
      create: {
        sku: resolvedSku,
        name,
        slug: resolvedSlug,
        description,
        productType,
        priceMode,
        salePrice,
        costPrice,
        categoryId,
        currency,
        isPublished,
      },
      select: {id: true},
    });

    if (existingBySku) {
      updated += 1;
    } else {
      created += 1;
    }

    await prisma.stock.upsert({
      where: {productId: product.id},
      update: {
        quantityOnHand,
        reorderLevel,
      },
      create: {
        productId: product.id,
        quantityOnHand,
        reorderLevel,
      },
    });

    if (imageFile) {
      const imagePath = path.join(DEFAULT_IMAGE_DIR, imageFile);
      const imageExists = fs.existsSync(imagePath);

      if (!imageExists) {
        console.warn(`Image missing for row ${rowNumber}: ${imagePath}`);
      }

      await prisma.productImage.deleteMany({where: {productId: product.id}});
      await prisma.productImage.create({
        data: {
          productId: product.id,
          cloudinaryPublicId: `local/catalog/real/${imageFile}`,
          url: imageUrl,
          altText: name,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }
  }

  return {created, updated};
}

async function main() {
  const inputFile = path.resolve(process.cwd(), process.argv[2] || DEFAULT_INPUT);

  if (!fs.existsSync(inputFile)) {
    throw new Error(`Import file not found: ${inputFile}`);
  }

  const {created, updated} = await importRows(inputFile);
  console.log(`Import complete. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
