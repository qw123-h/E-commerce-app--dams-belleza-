import Link from "next/link";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {CheckoutForm} from "@/components/storefront/checkout-form";
import {formatXaf} from "@/lib/format";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";
import {getActiveDeliveryZones} from "@/lib/storefront-order";

type SearchParams = {
  product?: string;
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
  const t = await getTranslations({locale, namespace: "checkout"});

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
      <section className="space-y-6 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-8 shadow-xl shadow-charcoal-900/5">
        <div className="text-center">
          <h1 className="font-display text-3xl text-charcoal-900">{t("missingProductTitle")}</h1>
          <p className="mt-2 text-charcoal-700">{t("missingProductMessage")}</p>
        </div>

        {quickPickProducts.length ? (
          <div>
            <p className="mb-3 text-center text-sm font-semibold text-charcoal-800">{t("quickPickTitle")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

  const [product, deliveryZones] = await Promise.all([
    prisma.product.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        salePrice: true,
        currency: true,
      },
    }),
    getActiveDeliveryZones(),
  ]);

  if (!product || !product.salePrice) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle", {product: product.name})}</p>
      </header>

      <CheckoutForm
        locale={locale}
        product={{
          id: product.id,
          name: product.name,
          unitPrice: product.salePrice.toString(),
          currency: product.currency,
        }}
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
