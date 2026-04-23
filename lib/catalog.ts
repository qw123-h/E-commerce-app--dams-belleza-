import type {PriceMode, ProductType} from "@prisma/client";
import {prisma} from "@/lib/prisma";

export type CatalogQuery = {
  q?: string;
  type?: ProductType | "ALL";
  priceMode?: PriceMode | "ALL";
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

export async function getStorefrontProducts(query: CatalogQuery) {
  const search = query.q?.trim();
  const pageSize = Math.min(Math.max(query.pageSize ?? 12, 1), 48);
  const requestedPage = Math.max(query.page ?? 1, 1);

  const where = {
    deletedAt: null,
    isPublished: true,
    images: {
      some: {},
    },
    ...(query.type && query.type !== "ALL" ? {productType: query.type} : {}),
    ...(query.priceMode && query.priceMode !== "ALL" ? {priceMode: query.priceMode} : {}),
    ...(search
      ? {
          OR: [
            {name: {contains: search, mode: "insensitive" as const}},
            {description: {contains: search, mode: "insensitive" as const}},
            {sku: {contains: search, mode: "insensitive" as const}},
            {category: {name: {contains: search, mode: "insensitive" as const}}},
          ],
        }
      : {}),
  };

  const total = await prisma.product.count({where});
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const items = await prisma.product.findMany({
    where,
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
    skip,
    take: pageSize,
  });

  return {
    items,
    total,
    currentPage,
    totalPages,
    pageSize,
  };
}
