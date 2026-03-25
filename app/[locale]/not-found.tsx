import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {routing} from "@/i18n/routing";

export default async function LocaleNotFound({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const t = await getTranslations({locale, namespace: "errors"});

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-charcoal-900/10 bg-cream-50 p-8 text-center shadow-xl shadow-charcoal-900/10">
      <h1 className="font-display text-3xl text-charcoal-900">{t("notFoundTitle")}</h1>
      <p className="mt-3 text-charcoal-700">{t("notFoundMessage")}</p>
      <Link
        href={`/${locale}`}
        className="mt-6 inline-flex rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
      >
        {t("goHome")}
      </Link>
    </section>
  );
}
