import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {routing} from "@/i18n/routing";

export default async function HomePage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const t = await getTranslations({locale, namespace: "home"});

  return (
    <section className="relative overflow-hidden rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-16 shadow-2xl shadow-charcoal-900/10 sm:px-10">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-gold-300/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-charcoal-400/15 blur-3xl" />
      <div className="relative max-w-3xl space-y-6">
        <span className="inline-flex rounded-full border border-charcoal-900/15 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-700">
          {t("badge")}
        </span>
        <h1 className="font-display text-4xl leading-tight text-charcoal-900 sm:text-6xl">
          {t("headline")}
        </h1>
        <p className="max-w-2xl text-base leading-8 text-charcoal-700 sm:text-lg">
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
            href="https://wa.me/237691949858"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-charcoal-900/30 bg-cream-100 px-6 py-3 text-sm font-semibold text-charcoal-900 transition hover:bg-rose-gold-100"
          >
            {t("ctaWhatsApp")}
          </Link>
        </div>
      </div>
    </section>
  );
}
