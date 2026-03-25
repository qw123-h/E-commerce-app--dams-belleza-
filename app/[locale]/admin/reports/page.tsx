import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {ReportsDashboard} from "@/components/admin/reports-dashboard";
import {requirePermission} from "@/lib/guards";
import {getReportSummary} from "@/lib/reports";
import {routing} from "@/i18n/routing";

export default async function AdminReportsPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requirePermission("reports.read");

  if (!session) {
    redirect(`/${locale}/unauthorized`);
  }

  const [summary, t] = await Promise.all([
    getReportSummary("monthly"),
    getTranslations({locale, namespace: "adminReports"}),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <ReportsDashboard
        locale={locale}
        initialSummary={{
          ...summary,
          from: summary.from.toISOString(),
          to: summary.to.toISOString(),
        }}
        labels={{
          range: t("filters.range"),
          daily: t("filters.daily"),
          weekly: t("filters.weekly"),
          monthly: t("filters.monthly"),
          custom: t("filters.custom"),
          from: t("filters.from"),
          to: t("filters.to"),
          apply: t("filters.apply"),
          snapshot: t("filters.snapshot"),
          snapshotting: t("filters.snapshotting"),
          exportPdf: t("filters.exportPdf"),
          exportExcel: t("filters.exportExcel"),
          wigs: t("mix.wigs"),
          perfumes: t("mix.perfumes"),
          lowStock: t("lowStock"),
        }}
      />
    </section>
  );
}
