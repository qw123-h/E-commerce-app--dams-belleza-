import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {formatXaf} from "@/lib/format";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";
import {auth} from "@/lib/auth";
import {sessionHasPermission} from "@/lib/rbac";

export default async function HomePage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await auth();
  const isAdminUser =
    sessionHasPermission(session, "orders.read") ||
    sessionHasPermission(session, "payments.review") ||
    sessionHasPermission(session, "reports.read") ||
    sessionHasPermission(session, "roles.manage") ||
    sessionHasPermission(session, "orders.write");

  if (isAdminUser) {
    redirect(`/${locale}/admin/orders`);
  }

  const t = await getTranslations({locale, namespace: "home"});
  const featuredProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      images: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      productType: true,
      salePrice: true,
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
        select: {
          url: true,
          altText: true,
        },
      },
      stock: {
        select: {
          quantityOnHand: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });

  const promoBadges = [t("promo.hot"), t("promo.fastShip"), t("promo.topSupplier")];

  return (
    <section className="space-y-6 animate-fade-up">
      <article className="relative overflow-hidden rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-16 shadow-2xl shadow-charcoal-900/10 sm:px-10 animate-fade-up-delay-1">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-gold-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-charcoal-400/15 blur-3xl" />
        <div className="relative max-w-4xl space-y-6">
          <span className="inline-flex rounded-full border border-charcoal-900/15 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-700">
            {t("badge")}
          </span>
          <h1 className="font-display text-4xl leading-tight text-charcoal-900 sm:text-6xl">
            {t("headline")}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-charcoal-700 sm:text-lg">
            {t("subheadline")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/products`}
              className="rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
            >
              {t("ctaProducts")}
            </Link>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="rounded-full border border-charcoal-900/30 bg-white px-6 py-3 text-sm font-semibold text-charcoal-900 transition hover:bg-cream-100"
            >
              {t("ctaConnect")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {promoBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-charcoal-900/20 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-6 shadow-lg shadow-charcoal-900/5 animate-fade-up-delay-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl text-charcoal-900">{t("featuredTitle")}</h2>
          <Link href={`/${locale}/products`} className="text-sm font-semibold text-charcoal-800 underline">
            {t("seeAll")}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product, index) => {
            const badge = promoBadges[index % promoBadges.length];
            return (
              <Link key={product.id} href={`/${locale}/products/${product.slug}`} className="group rounded-2xl border border-charcoal-900/10 bg-white p-3 transition hover:border-charcoal-900/25 hover:shadow-lg">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-gold-200/35 via-cream-100 to-charcoal-300/20">
                  {product.images[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">
                      {product.productType}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-charcoal-900/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-cream-50">
                    {badge}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="line-clamp-1 font-semibold text-charcoal-900">{product.name}</p>
                  <p className="text-sm text-charcoal-700">
                    {product.salePrice ? formatXaf(Number(product.salePrice), locale) : t("priceOnRequest")}
                  </p>
                  <p className="text-xs text-charcoal-600">
                    {(product.stock?.quantityOnHand ?? 0) > 0
                      ? t("stockNow", {count: product.stock?.quantityOnHand ?? 0})
                      : t("stockOut")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
}
