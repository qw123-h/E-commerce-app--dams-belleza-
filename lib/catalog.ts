import type {PriceMode, ProductType} from "@prisma/client";
import {prisma} from "@/lib/prisma";

export type CatalogQuery = {
  q?: string;
  type?: ProductType | "ALL";
  priceMode?: PriceMode | "ALL";
  sort?: "newest" | "price-asc" | "price-desc";
};

export async function getStorefrontProducts(query: CatalogQuery) {
  const search = query.q?.trim();

  return prisma.product.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      ...(query.type && query.type !== "ALL" ? {productType: query.type} : {}),
      ...(query.priceMode && query.priceMode !== "ALL" ? {priceMode: query.priceMode} : {}),
      ...(search
        ? {
            OR: [
              {name: {contains: search, mode: "insensitive"}},
              {description: {contains: search, mode: "insensitive"}},
              {sku: {contains: search, mode: "insensitive"}},
              {category: {name: {contains: search, mode: "insensitive"}}},
            ],
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      productType: true,
      priceMode: true,
      salePrice: true,
      currency: true,
      createdAt: true,
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      stock: {
        select: {
          quantityOnHand: true,
        },
      },
      images: {
        where: {
          isPrimary: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
        select: {
          url: true,
          altText: true,
        },
      },
    },
    orderBy:
      query.sort === "price-asc"
        ? {salePrice: "asc"}
        : query.sort === "price-desc"
          ? {salePrice: "desc"}
          : {createdAt: "desc"},
  });
}
