import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {PaymentStatusControl} from "@/components/admin/payment-status-control";
import {getPaymentMetrics, listRecentPayments} from "@/lib/admin-payments";
import {formatXaf} from "@/lib/format";
import {requirePermission} from "@/lib/guards";
import {routing} from "@/i18n/routing";

export default async function AdminPaymentsPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requirePermission("payments.review");

  if (!session) {
    redirect(`/${locale}/unauthorized`);
  }

  const [t, metrics, payments] = await Promise.all([
    getTranslations({locale, namespace: "adminPayments"}),
    getPaymentMetrics(),
    listRecentPayments(80),
  ]);

  const confirmedAmount = payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.total")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{metrics.totalPayments}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.pending")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{metrics.pendingPayments}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.confirmed")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{metrics.confirmedPayments}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.confirmedAmount")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{formatXaf(confirmedAmount, locale)}</p>
        </article>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-charcoal-900/10 bg-cream-50 shadow-lg shadow-charcoal-900/5">
        <table className="min-w-full divide-y divide-charcoal-900/10 text-sm">
          <thead className="bg-cream-100/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.payment")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.order")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.method")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.amount")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.status")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-900/10">
            {payments.map((payment) => {
              const phoneLine = (payment.order.notes ?? "")
                .split("|")
                .map((part) => part.trim())
                .find((part) => part.toLowerCase().startsWith("phone:"));
              const rawPhone = phoneLine?.split(":")[1]?.trim() ?? "";
              const whatsappPhone = rawPhone.replace(/\D/g, "");

              return (
              <tr key={payment.id}>
                <td className="px-4 py-3 align-top text-charcoal-700">
                  <p className="font-semibold text-charcoal-900">{payment.reference || "-"}</p>
                  <p className="text-xs">{new Date(payment.createdAt).toLocaleString(locale === "en" ? "en-US" : "fr-FR")}</p>
                </td>
                <td className="px-4 py-3 align-top text-charcoal-700">
                  {payment.order.orderNumber}
                  {whatsappPhone ? (
                    <a
                      href={`https://wa.me/${whatsappPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs font-semibold text-charcoal-900 underline"
                    >
                      {t("table.whatsapp")}
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top text-charcoal-700">{t(`method.${payment.method}`)}</td>
                <td className="px-4 py-3 align-top font-semibold text-charcoal-900">{formatXaf(Number(payment.amount), locale)}</td>
                <td className="px-4 py-3 align-top text-charcoal-700">
                  {t(`status.${payment.status}`)}
                  {payment.order.receipts[0]?.receiptNumber ? (
                    <a
                      href={`/api/documents/receipts/${payment.order.receipts[0].receiptNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs font-semibold text-charcoal-900 underline"
                    >
                      {t("table.receipt")}
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <PaymentStatusControl
                    paymentId={payment.id}
                    currentStatus={payment.status}
                    labels={{
                      save: t("action.save"),
                      saving: t("action.saving"),
                      rejectReason: t("action.rejectReason"),
                      error: t("action.error"),
                      statuses: {
                        PENDING: t("status.PENDING"),
                        CONFIRMED: t("status.CONFIRMED"),
                        REJECTED: t("status.REJECTED"),
                        REFUNDED: t("status.REFUNDED"),
                      },
                    }}
                  />
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </section>
  );
}
