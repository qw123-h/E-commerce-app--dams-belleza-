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
  page?: string;
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

function normalizePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function buildPageHref(locale: string, query: {q: string; type: ProductType | "ALL"; priceMode: PriceMode | "ALL"; sort: "newest" | "price-asc" | "price-desc"}, page: number) {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.type !== "ALL") {
    params.set("type", query.type);
  }

  if (query.priceMode !== "ALL") {
    params.set("priceMode", query.priceMode);
  }

  if (query.sort !== "newest") {
    params.set("sort", query.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const qs = params.toString();
  return qs ? `/${locale}/products?${qs}` : `/${locale}/products`;
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
    page: normalizePage(asSingle(searchParams?.page)),
  };

  const products = await getStorefrontProducts(query);

  return (
    <section className="w-full overflow-x-hidden space-y-6 animate-fade-up">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-4 py-5 sm:px-6 sm:py-7 shadow-lg shadow-charcoal-900/5 animate-fade-up-delay-1">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-sm sm:text-base text-charcoal-700">{t("subtitle")}</p>
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
          negotiable: t("filters.negotiable"),
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
          {products.total} {products.total === 1 ? t("result") : t("results")}
        </p>
        <p className="text-xs text-charcoal-600">
          {t("filters.page")} {products.currentPage} / {products.totalPages}
        </p>
      </div>

      {products.items.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 animate-fade-up-delay-2">
          {products.items.map((product) => (
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

      {products.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3">
          <a
            href={buildPageHref(locale, query, Math.max(1, products.currentPage - 1))}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${products.currentPage === 1 ? "pointer-events-none border-charcoal-900/10 bg-cream-100 text-charcoal-500" : "border-charcoal-900/20 bg-white text-charcoal-900 hover:bg-cream-100"}`}
          >
            {t("filters.previous")}
          </a>
          <a
            href={buildPageHref(locale, query, Math.min(products.totalPages, products.currentPage + 1))}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${products.currentPage >= products.totalPages ? "pointer-events-none border-charcoal-900/10 bg-cream-100 text-charcoal-500" : "border-charcoal-900/20 bg-white text-charcoal-900 hover:bg-cream-100"}`}
          >
            {t("filters.next")}
          </a>
        </nav>
      ) : null}
    </section>
  );
}
