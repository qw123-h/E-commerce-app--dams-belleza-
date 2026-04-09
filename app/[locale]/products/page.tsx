import {PriceMode, ProductType} from "@prisma/client";
import {getTranslations} from "next-intl/server";
import {ProductCard} from "@/components/storefront/product-card";
import {ProductFilters} from "@/components/storefront/product-filters";
import {getStorefrontProducts} from "@/lib/catalog";
import {routing} from "@/i18n/routing";

type SearchParams = {
  q?: string;
  type?: string;
  priceMode?: string;
  sort?: string;
};

function asSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeType(value: string | undefined): ProductType | "ALL" {
  if (value === "WIG" || value === "PERFUME") {
    return value;
  }

  return "ALL";
}

function normalizePriceMode(value: string | undefined): PriceMode | "ALL" {
  if (value === "FIXED" || value === "NEGOTIABLE") {
    return value;
  }

  return "ALL";
}

function normalizeSort(value: string | undefined): "newest" | "price-asc" | "price-desc" {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }

  return "newest";
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params?: {locale: string};
  searchParams?: SearchParams;
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const t = await getTranslations({locale, namespace: "catalog"});

  const query = {
    q: asSingle(searchParams?.q) ?? "",
    type: normalizeType(asSingle(searchParams?.type)),
    priceMode: normalizePriceMode(asSingle(searchParams?.priceMode)),
    sort: normalizeSort(asSingle(searchParams?.sort)),
  };

  const products = await getStorefrontProducts(query);

  return (
    <section className="space-y-6 animate-fade-up">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5 animate-fade-up-delay-1">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-charcoal-700">{t("subtitle")}</p>
      </header>

      <ProductFilters
        locale={locale}
        labels={{
          search: t("filters.search"),
          searchPlaceholder: t("filters.searchPlaceholder"),
          productType: t("filters.productType"),
          priceMode: t("filters.priceMode"),
          sortBy: t("filters.sortBy"),
          all: t("filters.all"),
          wigs: t("filters.wigs"),
          perfumes: t("filters.perfumes"),
          fixed: t("filters.fixed"),
          newest: t("filters.newest"),
          priceLowToHigh: t("filters.priceLowToHigh"),
          priceHighToLow: t("filters.priceHighToLow"),
          apply: t("filters.apply"),
          reset: t("filters.reset"),
        }}
        value={query}
      />

      <div className="flex items-center justify-between animate-fade-up-delay-1">
        <p className="text-sm text-charcoal-700">
          {products.length} {products.length === 1 ? t("result") : t("results")}
        </p>
      </div>

      {products.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 animate-fade-up-delay-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              locale={locale}
              product={{
                slug: product.slug,
                name: product.name,
                description: product.description,
                productType: product.productType,
                priceMode: product.priceMode,
                salePrice: product.salePrice?.toString() ?? null,
                categoryName: product.category.name,
                imageUrl: product.images[0]?.url ?? null,
                imageAltText: product.images[0]?.altText ?? null,
                quantityOnHand: product.stock?.quantityOnHand ?? null,
              }}
              labels={{
                outOfStock: t("labels.outOfStock"),
                inStock: t("labels.inStock"),
                category: t("labels.category"),
                viewDetails: t("labels.viewDetails"),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-charcoal-900/20 bg-cream-50 p-10 text-center text-charcoal-700">
          {t("empty")}
        </div>
      )}
    </section>
  );
}
