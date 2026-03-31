import {ProductType, PriceMode} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {generateSlug} from "@/lib/format";

export type ProductInput = {
  name: string;
  description?: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  salePrice: number;
  costPrice?: number | null;
  categoryId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageAltText?: string;
  quantityOnHand?: number;
  currency?: string;
  isPublished?: boolean;
};

export type ProductUpdateInput = Partial<ProductInput>;

async function resolveCategoryId(productType: ProductType, explicitCategoryId?: string) {
  if (explicitCategoryId) {
    const existing = await prisma.category.findUnique({
      where: {id: explicitCategoryId},
      select: {id: true},
    });

    if (!existing) {
      throw new Error("Category not found");
    }

    return existing.id;
  }

  const preferredSlug = productType === "WIG" ? "wigs" : "perfumes";
  const preferred = await prisma.category.findFirst({
    where: {slug: preferredSlug, deletedAt: null},
    select: {id: true},
  });

  if (preferred) {
    return preferred.id;
  }

  const fallback = await prisma.category.findFirst({
    where: {deletedAt: null},
    orderBy: {createdAt: "asc"},
    select: {id: true},
  });

  if (!fallback) {
    throw new Error("No category available. Please create a category first.");
  }

  return fallback.id;
}

// Generate deterministic SKU based on name and type
export function generateProductSku(name: string, productType: ProductType): string {
  const prefix = productType === "WIG" ? "WIG" : "PERF";
  const hash = Math.abs(
    name
      .toLowerCase()
      .split("")
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `${prefix}-${hash.slice(0, 6)}`;
}

export async function createProduct(
  data: ProductInput,
  createdById: string
) {
  const slug = generateSlug(data.name);
  const sku = generateProductSku(data.name, data.productType);
  const categoryId = await resolveCategoryId(data.productType, data.categoryId);

  // Check if SKU already exists
  const existingSku = await prisma.product.findUnique({
    where: {sku},
    select: {id: true},
  });

  if (existingSku) {
    throw new Error(`Product with SKU ${sku} already exists`);
  }

  // Check if slug already exists
  const existingSlug = await prisma.product.findUnique({
    where: {slug},
    select: {id: true},
  });

  if (existingSlug) {
    throw new Error(`A product with a similar name already exists`);
  }

  const imageUrls = (data.imageUrls?.length ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [])
    .map((url) => url.trim())
    .filter(Boolean);

  // Create product with transaction
  const product = await prisma.product.create({
    data: {
      sku,
      slug,
      name: data.name,
      description: data.description || null,
      productType: data.productType,
      priceMode: data.priceMode,
      salePrice: data.salePrice,
      costPrice: data.costPrice || null,
      categoryId,
      currency: data.currency || "XAF",
      isPublished: data.isPublished !== false,
      createdById,
      // Create stock record
      stock: {
        create: {
          quantityOnHand: data.quantityOnHand || 0,
          reorderLevel: 5,
        },
      },
      // Create product images if provided
      ...(imageUrls.length > 0
        ? {
            images: {
              create: imageUrls.map((url, index) => ({
                url,
                altText: data.imageAltText || data.name,
                isPrimary: index === 0,
                sortOrder: index,
                cloudinaryPublicId: "", // Will be set if using Cloudinary
              })),
            },
          }
        : {}),
    },
    include: {
      stock: true,
      images: true,
      category: {
        select: {name: true},
      },
    },
  });

  return product;
}

export async function updateProduct(
  productId: string,
  data: ProductUpdateInput,
  updatedById: string
) {
  // Verify product exists
  const product = await prisma.product.findUnique({
    where: {id: productId},
    select: {id: true, slug: true, sku: true, stock: true},
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // If name is being updated, check if new slug would conflict
  if (data.name && data.name !== product.sku) {
    const newSlug = generateSlug(data.name);
    const existingSlug = await prisma.product.findFirst({
      where: {
        slug: newSlug,
        id: {not: productId},
      },
      select: {id: true},
    });

    if (existingSlug) {
      throw new Error("A product with a similar name already exists");
    }
  }

  // Verify category exists if being updated
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: {id: data.categoryId},
      select: {id: true},
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  // Build update object
  const updateData: any = {
    ...(data.name && {
      name: data.name,
      slug: generateSlug(data.name),
    }),
    ...(data.description !== undefined && {description: data.description}),
    ...(data.productType && {productType: data.productType}),
    ...(data.priceMode && {priceMode: data.priceMode}),
    ...(data.salePrice !== undefined && {salePrice: data.salePrice}),
    ...(data.costPrice !== undefined && {costPrice: data.costPrice}),
    ...(data.categoryId && {categoryId: data.categoryId}),
    ...(data.currency && {currency: data.currency}),
    ...(data.isPublished !== undefined && {isPublished: data.isPublished}),
    updatedById,
  };

  // Update product
  const updatedProduct = await prisma.product.update({
    where: {id: productId},
    data: updateData,
    include: {
      stock: true,
      images: true,
      category: {
        select: {name: true},
      },
    },
  });

  // Update stock if quantity was changed
  if (data.quantityOnHand !== undefined && product.stock) {
    await prisma.stock.update({
      where: {productId},
      data: {quantityOnHand: data.quantityOnHand},
    });
  }

  return updatedProduct;
}

export async function deleteProduct(productId: string) {
  // Soft delete
  const deleted = await prisma.product.update({
    where: {id: productId},
    data: {deletedAt: new Date()},
  });

  return deleted;
}

export async function purgePermanently(productId: string) {
  // Hard delete - use with caution
  const deleted = await prisma.product.delete({
    where: {id: productId},
  });

  return deleted;
}

export async function listAdminProducts(query?: {
  search?: string;
  type?: ProductType;
  categoryId?: string;
  includeDeleted?: boolean;
}) {
  const search = query?.search?.trim();

  return prisma.product.findMany({
    where: {
      ...(query?.includeDeleted ? {} : {deletedAt: null}),
      ...(query?.type && {productType: query.type}),
      ...(query?.categoryId && {categoryId: query.categoryId}),
      ...(search
        ? {
            OR: [
              {name: {contains: search, mode: "insensitive"}},
              {sku: {contains: search, mode: "insensitive"}},
              {description: {contains: search, mode: "insensitive"}},
            ],
          }
        : {}),
    },
    select: {
      id: true,
      sku: true,
      name: true,
      productType: true,
      priceMode: true,
      salePrice: true,
      costPrice: true,
      currency: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      stock: {
        select: {
          quantityOnHand: true,
        },
      },
      images: {
        where: {isPrimary: true},
        take: 1,
        select: {
          url: true,
          altText: true,
        },
      },
    },
    orderBy: {createdAt: "desc"},
  });
}

export async function getProductById(productId: string) {
  return prisma.product.findUnique({
    where: {id: productId},
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      stock: true,
      images: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    where: {deletedAt: null},
    select: {
      id: true,
      name: true,
    },
    orderBy: {name: "asc"},
  });
}
