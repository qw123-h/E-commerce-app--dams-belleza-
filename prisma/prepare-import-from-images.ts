import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const DEFAULT_IMAGE_DIR = path.resolve(process.cwd(), "public/catalog/real");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "data/product-import-auto.csv");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSizesPricing(input: string) {
  const regex = /T\s*(\d+)\s+([0-9][0-9\s.,]*)/gi;
  const matches: Array<{size: string; price: number}> = [];

  let current = regex.exec(input);
  while (current) {
    const size = `T${current[1]}`;
    const price = parseNumber(current[2]);
    if (price !== null) {
      matches.push({size, price});
    }
    current = regex.exec(input);
  }

  return matches;
}

function inferType(text: string) {
  const lower = text.toLowerCase();
  if (/(perfume|parfum|fragrance|eau de|oud|musk|elixir|cologne)/.test(lower)) {
    return "perfume";
  }

  return "wig";
}

function normalizeBaseText(filenameWithoutExt: string) {
  return filenameWithoutExt
    .replace(/[_]+/g, " ")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stableSkuFromFileName(fileName: string, type: "wig" | "perfume") {
  const noExt = fileName.replace(path.extname(fileName), "");
  let hash = 2166136261;

  for (let index = 0; index < noExt.length; index += 1) {
    hash ^= noExt.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const suffix = Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  const prefix = type === "perfume" ? "PERF-FN" : "WIG-FN";
  return `${prefix}-${suffix}`;
}

function buildRow(fileName: string) {
  const noExt = fileName.replace(path.extname(fileName), "");
  const normalized = normalizeBaseText(noExt);

  const sizePricing = parseSizesPricing(normalized);

  let name = normalized;
  if (sizePricing.length > 0) {
    const firstSizeIdx = normalized.search(/T\s*\d+\s+[0-9]/i);
    if (firstSizeIdx > 0) {
      name = normalized.slice(0, firstSizeIdx).trim();
    }
  }

  if (!name) {
    name = normalized;
  }

  const type = inferType(normalized);
  const salePrice = sizePricing.length === 1 ? String(sizePricing[0].price) : "";
  const costPrice = sizePricing.length > 0 ? String(Math.min(...sizePricing.map((entry) => entry.price))) : "";
  const priceMode = sizePricing.length > 1 ? "NEGOTIABLE" : type === "perfume" ? "FIXED" : "NEGOTIABLE";
  const sizesPricesText = sizePricing.map((entry) => `${entry.size} ${entry.price}`).join("; ");
  const sku = stableSkuFromFileName(fileName, type);

  return {
    type,
    name,
    description: normalized,
    sizes_prices: sizesPricesText,
    sale_price: salePrice,
    cost_price: costPrice,
    price_mode: priceMode,
    image_file: fileName,
    is_published: "true",
    stock: type === "perfume" ? "20" : "5",
    reorder_level: type === "perfume" ? "6" : "2",
    currency: "XAF",
    sku,
  };
}

function main() {
  const imageDir = path.resolve(process.cwd(), process.argv[2] || DEFAULT_IMAGE_DIR);
  const outputPath = path.resolve(process.cwd(), process.argv[3] || DEFAULT_OUTPUT);

  if (!fs.existsSync(imageDir)) {
    throw new Error(`Image directory not found: ${imageDir}`);
  }

  const files = fs.readdirSync(imageDir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No supported images found in ${imageDir}`);
  }

  const rows = files.map((file) => buildRow(file));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "type",
      "name",
      "description",
      "sizes_prices",
      "sale_price",
      "cost_price",
      "price_mode",
      "image_file",
      "is_published",
      "stock",
      "reorder_level",
      "currency",
      "sku",
    ],
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "products");

  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  XLSX.writeFile(workbook, outputPath);

  console.log(`Prepared import file: ${outputPath}`);
  console.log(`Rows generated from filenames: ${rows.length}`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
