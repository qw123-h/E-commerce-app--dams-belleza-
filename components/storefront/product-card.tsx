import Link from "next/link";
import type {PriceMode, ProductType} from "@prisma/client";
import {formatXaf} from "@/lib/format";
import {extractSizePricing, formatSizePricingSummary} from "@/lib/product-pricing";

type ProductCardProps = {
  locale: string;
  product: {
    slug: string;
    name: string;
    description: string | null;
    productType: ProductType;
    priceMode: PriceMode;
    salePrice: string | null;
    categoryName: string;
    imageUrl: string | null;
    imageAltText: string | null;
    quantityOnHand: number | null;
  };
  labels: {
    outOfStock: string;
    inStock: string;
    category: string;
    viewDetails: string;
  };
};

export function ProductCard({locale, product, labels}: ProductCardProps) {
  const hasPrice = product.salePrice !== null;
  const hasStock = (product.quantityOnHand ?? 0) > 0;
  const sizeSummary = formatSizePricingSummary(extractSizePricing(product.description), 2);

  return (
    <article className="group overflow-hidden rounded-3xl border border-charcoal-900/10 bg-cream-50 shadow-lg shadow-charcoal-900/5 transition hover:-translate-y-0.5 hover:shadow-xl animate-fade-up-delay-2 alive-hover">
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-rose-gold-200/35 via-cream-200 to-charcoal-300/20">
        {product.imageUrl ? (
          // Using a native image tag keeps external image setup simple before Cloudinary optimization is configured.
          <img
            src={product.imageUrl}
            alt={product.imageAltText ?? product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="rounded-full border border-charcoal-900/15 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-700">
              {product.productType}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">
          {labels.category}: {product.categoryName}
        </p>
        <h3 className="font-display text-2xl text-charcoal-900">{product.name}</h3>
        <p className="line-clamp-2 min-h-10 text-sm text-charcoal-700">{product.description ?? ""}</p>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-charcoal-900">
              {hasPrice ? formatXaf(Number(product.salePrice), locale) : sizeSummary}
            </p>
            {sizeSummary ? <p className="mt-1 text-xs text-charcoal-600">{sizeSummary}</p> : null}
            <p className="mt-1 text-xs text-charcoal-600">
              {hasStock ? `${labels.inStock}: ${product.quantityOnHand ?? 0}` : labels.outOfStock}
            </p>
          </div>
          <Link
            href={`/${locale}/products/${product.slug}`}
            className="rounded-full border border-charcoal-900/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal-900 transition hover:bg-rose-gold-100"
          >
            {labels.viewDetails}
          </Link>
        </div>
      </div>
    </article>
  );
}
