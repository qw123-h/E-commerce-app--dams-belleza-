import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {routing} from "@/i18n/routing";
import {auth} from "@/lib/auth";
import {sessionHasPermission} from "@/lib/rbac";

export default async function UnauthorizedPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const t = await getTranslations({locale, namespace: "errors"});
  const session = await auth();

  const adminDestination = (() => {
    if (sessionHasPermission(session, "orders.read")) {
      return `/${locale}/admin/orders`;
    }
    if (sessionHasPermission(session, "payments.review")) {
      return `/${locale}/admin/payments`;
    }
    if (sessionHasPermission(session, "orders.write")) {
      return `/${locale}/admin/delivery`;
    }
    if (sessionHasPermission(session, "reports.read")) {
      return `/${locale}/admin/reports`;
    }
    if (sessionHasPermission(session, "roles.manage")) {
      return `/${locale}/admin/roles`;
    }

    return null;
  })();

  const actionHref = adminDestination ?? `/${locale}`;
  const actionLabel = adminDestination ? t("goAllowedAdmin") : t("goHome");

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-charcoal-900/10 bg-cream-50 p-8 text-center shadow-xl shadow-charcoal-900/10">
      <h1 className="font-display text-3xl text-charcoal-900">{t("unauthorizedTitle")}</h1>
      <p className="mt-3 text-charcoal-700">{t("unauthorizedMessage")}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
