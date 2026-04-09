import Link from "next/link";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {formatXaf} from "@/lib/format";
import {auth} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";

export default async function ProductDetailPage({
  params,
}: {
  params?: {locale: string; slug: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const slug = params?.slug;

  if (!slug) {
    notFound();
  }

  const [t, product] = await Promise.all([
    getTranslations({locale, namespace: "catalog"}),
    prisma.product.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        stock: {
          select: {
            quantityOnHand: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
            url: true,
            altText: true,
          },
        },
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    const callbackUrl = `/${locale}/products/${product.slug}`;

    return (
      <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-8 text-center shadow-xl shadow-charcoal-900/5">
        <h1 className="font-display text-3xl text-charcoal-900">{t("labels.accountRequiredTitle")}</h1>
        <p className="text-charcoal-700">{t("labels.accountRequiredMessage")}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${locale}/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
          >
            {t("labels.createAccountToContinue")}
          </Link>
          <Link
            href={`/${locale}/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="rounded-full border border-charcoal-900/20 bg-white px-6 py-3 text-sm font-semibold text-charcoal-900 transition hover:bg-cream-100"
          >
            {t("labels.signInToContinue")}
          </Link>
        </div>

        <Link href={`/${locale}/products`} className="inline-flex text-sm font-semibold text-charcoal-700 underline hover:text-charcoal-900">
          {t("labels.backToCatalog")}
        </Link>
      </section>
    );
  }

  const hasPrice = product.salePrice !== null;

  return (
    <section className="space-y-6">
      <a href={`/${locale}/products`} className="inline-flex text-sm font-semibold text-charcoal-700 transition hover:text-charcoal-900">
        {t("labels.backToCatalog")}
      </a>

      <article className="grid gap-6 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-6 shadow-xl shadow-charcoal-900/5 md:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-rose-gold-200/35 via-cream-200 to-charcoal-300/20">
            {product.images[0] ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].altText ?? product.name}
                className="h-80 w-full object-cover"
              />
            ) : (
              <div className="flex h-80 items-center justify-center">
                <span className="rounded-full border border-charcoal-900/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-700">
                  {product.productType}
                </span>
              </div>
            )}
          </div>

          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.altText ?? product.name}
                  className="h-20 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">
            {t("labels.category")}: {product.category.name}
          </p>
          <h1 className="font-display text-4xl text-charcoal-900">{product.name}</h1>

          <p className="text-charcoal-700">{product.description ?? t("labels.noDescription")}</p>

          <p className="text-2xl font-semibold text-charcoal-900">
            {hasPrice ? formatXaf(Number(product.salePrice), locale) : t("labels.negotiable")}
          </p>

          <p className="text-sm text-charcoal-700">
            {(product.stock?.quantityOnHand ?? 0) > 0
              ? `${t("labels.inStock")}: ${product.stock?.quantityOnHand ?? 0}`
              : t("labels.outOfStock")}
          </p>

          {hasPrice ? (
            <div className="space-y-2">
              <a
                href={`/${locale}/checkout?product=${product.slug}`}
                className="inline-flex rounded-full border border-charcoal-900/20 bg-white px-6 py-3 text-sm font-semibold text-charcoal-900 transition hover:bg-cream-100"
              >
                {t("labels.buyNow")}
              </a>
              <p className="text-xs text-charcoal-700">{t("labels.buyNowHint")}</p>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
