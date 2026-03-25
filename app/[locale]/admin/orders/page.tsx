import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {OrderStatusControl} from "@/components/admin/order-status-control";
import {getOrderMetrics, listRecentOrders} from "@/lib/admin-orders";
import {requirePermission} from "@/lib/guards";
import {formatXaf} from "@/lib/format";
import {routing} from "@/i18n/routing";

export default async function AdminOrdersPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requirePermission("orders.read");

  if (!session) {
    redirect(`/${locale}/unauthorized`);
  }

  const [t, metrics, orders] = await Promise.all([
    getTranslations({locale, namespace: "adminOrders"}),
    getOrderMetrics(),
    listRecentOrders(60),
  ]);

  const totalRevenue = orders
    .filter((order) => order.status === "DELIVERED")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.totalOrders")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{metrics.totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.pending")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{metrics.pendingOrders}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.confirmed")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{metrics.confirmedOrders}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("metrics.deliveredRevenue")}</p>
          <p className="mt-2 text-2xl font-semibold text-charcoal-900">{formatXaf(totalRevenue, locale)}</p>
        </article>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-charcoal-900/10 bg-cream-50 shadow-lg shadow-charcoal-900/5">
        <table className="min-w-full divide-y divide-charcoal-900/10 text-sm">
          <thead className="bg-cream-100/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.order")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.customer")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.items")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.total")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.status")}</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("table.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-900/10">
            {orders.map((order) => {
              const customerExcerpt = (order.notes ?? "").split("|")[0]?.trim() || "-";
              const phoneLine = (order.notes ?? "")
                .split("|")
                .map((part) => part.trim())
                .find((part) => part.toLowerCase().startsWith("phone:"));
              const rawPhone = phoneLine?.split(":")[1]?.trim() ?? "";
              const whatsappPhone = rawPhone.replace(/\D/g, "");
              const itemText = order.items.map((item) => `${item.quantity}x ${item.product.name}`).join(", ");

              return (
                <tr key={order.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-charcoal-900">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-charcoal-600">{new Date(order.createdAt).toLocaleString(locale === "en" ? "en-US" : "fr-FR")}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-charcoal-700">
                    {customerExcerpt}
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
                  <td className="px-4 py-3 align-top text-charcoal-700">{itemText}</td>
                  <td className="px-4 py-3 align-top font-semibold text-charcoal-900">{formatXaf(Number(order.totalAmount), locale)}</td>
                  <td className="px-4 py-3 align-top text-charcoal-700">{t(`status.${order.status}`)}</td>
                  <td className="px-4 py-3 align-top">
                    <OrderStatusControl
                      orderId={order.id}
                      currentStatus={order.status}
                      labels={{
                        update: t("action.update"),
                        updating: t("action.updating"),
                        error: t("action.error"),
                        statuses: {
                          PENDING: t("status.PENDING"),
                          CONFIRMED: t("status.CONFIRMED"),
                          DISPATCHED: t("status.DISPATCHED"),
                          DELIVERED: t("status.DELIVERED"),
                          CANCELLED: t("status.CANCELLED"),
                        },
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
