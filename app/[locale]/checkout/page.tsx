import Link from "next/link";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {CheckoutForm} from "@/components/storefront/checkout-form";
import {auth} from "@/lib/auth";
import {formatXaf} from "@/lib/format";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";
import {getActiveDeliveryZones} from "@/lib/storefront-order";
import {extractSizePricing, formatSizePricingSummary} from "@/lib/product-pricing";

type SearchParams = {
  product?: string;
  variant?: string;
};

function asSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params?: {locale: string};
  searchParams?: SearchParams;
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const slug = asSingle(searchParams?.product);
  const requestedVariant = asSingle(searchParams?.variant)?.trim();
  const t = await getTranslations({locale, namespace: "checkout"});
  const session = await auth();

  if (!slug) {
    const quickPickProducts = await prisma.product.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        salePrice: {
          not: null,
        },
      },
      select: {
        slug: true,
        name: true,
        salePrice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    return (
      <section className="w-full overflow-x-hidden space-y-6 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-8 shadow-xl shadow-charcoal-900/5">
        <div className="text-center">
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-charcoal-900">{t("missingProductTitle")}</h1>
          <p className="mt-2 text-xs sm:text-sm text-charcoal-700">{t("missingProductMessage")}</p>
        </div>

        {quickPickProducts.length ? (
          <div>
            <p className="mb-3 text-center text-xs sm:text-sm font-semibold text-charcoal-800">{t("quickPickTitle")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickPickProducts.map((product) => (
                <Link
                  key={product.slug}
                  href={`/${locale}/checkout?product=${product.slug}`}
                  className="rounded-2xl border border-charcoal-900/10 bg-white p-4 transition hover:border-charcoal-900/25"
                >
                  <p className="font-semibold text-charcoal-900">{product.name}</p>
                  <p className="mt-1 text-sm text-charcoal-700">
                    {formatXaf(Number(product.salePrice), locale)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="text-center">
          <Link
            href={`/${locale}/products`}
            className="inline-flex rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
          >
            {t("backToCatalog")}
          </Link>
        </div>
      </section>
    );
  }

  const [product, deliveryZones, profile] = await Promise.all([
    prisma.product.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        salePrice: true,
        currency: true,
      },
    }),
    getActiveDeliveryZones(),
    session?.user?.id
      ? prisma.user.findUnique({
          where: {id: session.user.id},
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!product) {
    notFound();
  }

  const sizePricing = extractSizePricing(`${product.name}\n${product.description ?? ""}`);
  const requiresExplicitVariantChoice = sizePricing.length > 1;
  const selectedVariant = (() => {
    if (requestedVariant) {
      const [sizePart, pricePart] = requestedVariant.split("|");
      const parsedPrice = Number(pricePart);
      const matchedByVariant = sizePricing.find((entry) => entry.size === sizePart && entry.price === parsedPrice);
      if (matchedByVariant) {
        return matchedByVariant;
      }
    }

    if (requiresExplicitVariantChoice) {
      return null;
    }

    if (sizePricing.length === 1) {
      return sizePricing[0];
    }

    if (product.salePrice) {
      return {size: "", price: Number(product.salePrice)};
    }

    return null;
  })();

  if (requiresExplicitVariantChoice && !selectedVariant) {
    const hasInvalidVariantRequest = Boolean(requestedVariant);

    return (
      <section className="space-y-6 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-6 shadow-xl shadow-charcoal-900/5">
        <header className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal-900">{t("chooseVariantTitle", {product: product.name})}</h1>
          <p className="text-sm text-charcoal-700">{t("chooseVariantSubtitle")}</p>
          {hasInvalidVariantRequest ? <p className="text-sm font-semibold text-red-700">{t("invalidVariantMessage")}</p> : null}
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sizePricing.map((variant) => {
            const variantLabel = variant.size || t("singlePriceLabel");
            const variantHref = `/${locale}/checkout?product=${slug}&variant=${encodeURIComponent(`${variant.size}|${variant.price}`)}`;

            return (
              <Link
                key={`${variant.size}-${variant.price}`}
                href={variantHref}
                className="rounded-2xl border border-charcoal-900/15 bg-white p-4 transition hover:border-charcoal-900/40 hover:shadow-md"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{variantLabel}</p>
                <p className="mt-1 text-lg font-semibold text-charcoal-900">{formatXaf(variant.price, locale)}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("selectVariantAction")}</p>
              </Link>
            );
          })}
        </div>

        <div>
          <Link href={`/${locale}/products/${slug}`} className="inline-flex text-sm font-semibold text-charcoal-700 underline hover:text-charcoal-900">
            {t("backToCatalog")}
          </Link>
        </div>
      </section>
    );
  }

  if (!selectedVariant) {
    notFound();
  }

  const selectedVariantLabel = selectedVariant.size ? `${selectedVariant.size} - ${formatXaf(selectedVariant.price, locale)}` : undefined;
  const sizeSummary = formatSizePricingSummary(sizePricing, 2);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle", {product: product.name})}</p>
        {sizeSummary ? <p className="mt-2 text-sm text-charcoal-700">{t("sizesTitle")} : {sizeSummary}</p> : null}
        {selectedVariantLabel ? <p className="mt-2 text-sm font-semibold text-charcoal-800">{selectedVariantLabel}</p> : null}
      </header>

      <CheckoutForm
        locale={locale}
        product={{
          id: product.id,
          name: product.name,
          unitPrice: selectedVariant.price.toString(),
          currency: product.currency,
        }}
        selectedVariantLabel={selectedVariantLabel}
        storeWhatsAppNumber={process.env.WHATSAPP_NUMBER || "237691949858"}
        authenticatedCustomerName={session?.user?.name ?? undefined}
        initialCustomerName={
          profile ? `${profile.firstName} ${profile.lastName}`.trim() : session?.user?.name ?? ""
        }
        initialCustomerPhone={profile?.phone ?? ""}
        initialCustomerEmail={profile?.email ?? session?.user?.email ?? ""}
        deliveryZones={deliveryZones.map((zone) => ({
          id: zone.id,
          city: zone.city,
          zoneName: zone.zoneName,
          deliveryPrice: zone.deliveryPrice.toString(),
        }))}
        labels={{
          yourName: t("form.yourName"),
          phone: t("form.phone"),
          email: t("form.email"),
          quantity: t("form.quantity"),
          deliveryMethod: t("form.deliveryMethod"),
          paymentMethod: t("form.paymentMethod"),
          paymentReference: t("form.paymentReference"),
          pickup: t("form.pickup"),
          delivery: t("form.delivery"),
          orangeMoney: t("form.orangeMoney"),
          mtnMomo: t("form.mtnMomo"),
          bankTransfer: t("form.bankTransfer"),
          deliveryZone: t("form.deliveryZone"),
          deliveryLocationTitle: t("form.deliveryLocationTitle"),
          deliveryLocationHelp: t("form.deliveryLocationHelp"),
          useCurrentLocation: t("form.useCurrentLocation"),
          detectingLocation: t("form.detectingLocation"),
          locationUnsupported: t("form.locationUnsupported"),
          locationPermissionDenied: t("form.locationPermissionDenied"),
          locationRequired: t("form.locationRequired"),
          locationSelected: t("form.locationSelected"),
          mapClickHint: t("form.mapClickHint"),
          selectedAddress: t("form.selectedAddress"),
          resolvingAddress: t("form.resolvingAddress"),
          addressUnavailable: t("form.addressUnavailable"),
          latitude: t("form.latitude"),
          longitude: t("form.longitude"),
          zoneAutoFillHint: t("form.zoneAutoFillHint"),
          notes: t("form.notes"),
          subtotal: t("form.subtotal"),
          deliveryFee: t("form.deliveryFee"),
          total: t("form.total"),
          submit: t("form.submit"),
          submitting: t("form.submitting"),
          errorFallback: t("form.errorFallback"),
        }}
      />
    </section>
  );
}
