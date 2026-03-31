import type {PriceMode, ProductType} from "@prisma/client";

type ProductFiltersProps = {
  locale: string;
  labels: {
    search: string;
    searchPlaceholder: string;
    productType: string;
    priceMode: string;
    sortBy: string;
    all: string;
    wigs: string;
    perfumes: string;
    fixed: string;
    negotiable: string;
    newest: string;
    priceLowToHigh: string;
    priceHighToLow: string;
    apply: string;
    reset: string;
  };
  value: {
    q: string;
    type: ProductType | "ALL";
    priceMode: PriceMode | "ALL";
    sort: "newest" | "price-asc" | "price-desc";
  };
};

export function ProductFilters({locale, labels, value}: ProductFiltersProps) {
  return (
    <form
      action={`/${locale}/products`}
      method="GET"
      className="grid gap-3 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5 shadow-lg shadow-charcoal-900/5 md:grid-cols-12 animate-fade-up-delay-1"
    >
      <div className="md:col-span-4">
        <label htmlFor="q" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          {labels.search}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={value.q}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="type" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          {labels.productType}
        </label>
        <select
          id="type"
          name="type"
          defaultValue={value.type}
          className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        >
          <option value="ALL">{labels.all}</option>
          <option value="WIG">{labels.wigs}</option>
          <option value="PERFUME">{labels.perfumes}</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="priceMode" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          {labels.priceMode}
        </label>
        <select
          id="priceMode"
          name="priceMode"
          defaultValue={value.priceMode}
          className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        >
          <option value="ALL">{labels.all}</option>
          <option value="FIXED">{labels.fixed}</option>
          <option value="NEGOTIABLE">{labels.negotiable}</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="sort" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          {labels.sortBy}
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={value.sort}
          className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        >
          <option value="newest">{labels.newest}</option>
          <option value="price-asc">{labels.priceLowToHigh}</option>
          <option value="price-desc">{labels.priceHighToLow}</option>
        </select>
      </div>

      <div className="flex gap-2 md:col-span-2 md:items-end">
        <button
          type="submit"
          className="w-full rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
        >
          {labels.apply}
        </button>
        <a
          href={`/${locale}/products`}
          className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-center text-sm font-semibold text-charcoal-900 transition hover:bg-cream-100"
        >
          {labels.reset}
        </a>
      </div>
    </form>
  );
}
