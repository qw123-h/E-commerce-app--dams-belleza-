import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {routing} from "@/i18n/routing";

type SearchParams = {
  order?: string;
  invoice?: string;
  token?: string;
  wa?: string;
};

function asSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params?: {locale: string};
  searchParams?: SearchParams;
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const order = asSingle(searchParams?.order) ?? "-";
  const invoice = asSingle(searchParams?.invoice);
  const token = asSingle(searchParams?.token);
  const whatsappLink = asSingle(searchParams?.wa);
  const t = await getTranslations({locale, namespace: "checkout"});

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-8 text-center shadow-xl shadow-charcoal-900/5">
      <h1 className="font-display text-4xl text-charcoal-900">{t("success.title")}</h1>
      <p className="mt-3 text-charcoal-700">{t("success.message")}</p>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-charcoal-700">
        {t("success.orderNumber")}: {order}
      </p>
      {invoice && token ? (
        <a
          href={`/api/documents/invoices/${encodeURIComponent(invoice)}?token=${encodeURIComponent(token)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full border border-charcoal-900/20 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal-900 transition hover:bg-cream-100"
        >
          {t("success.invoice")}
        </a>
      ) : null}
      {whatsappLink ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-charcoal-700">{t("success.whatsappHint")}</p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-charcoal-900/20 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal-900 transition hover:bg-cream-100"
          >
            {t("success.whatsapp")}
          </a>
        </div>
      ) : null}
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href={`/${locale}`}
          className="rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
        >
          {t("success.home")}
        </Link>
        <Link
          href={`/${locale}/products`}
          className="rounded-full border border-charcoal-900/20 bg-white px-6 py-3 text-sm font-semibold text-charcoal-900 transition hover:bg-cream-100"
        >
          {t("success.products")}
        </Link>
      </div>
    </section>
  );
}
