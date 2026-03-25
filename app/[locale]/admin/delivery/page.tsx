import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {DeliveryOperations} from "@/components/admin/delivery-operations";
import {listAssignableOrders, listDeliveryZones, listRiders} from "@/lib/admin-delivery";
import {requirePermission} from "@/lib/guards";
import {routing} from "@/i18n/routing";

export default async function AdminDeliveryPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requirePermission("orders.write");

  if (!session) {
    redirect(`/${locale}/unauthorized`);
  }

  const [t, zones, riders, orders] = await Promise.all([
    getTranslations({locale, namespace: "adminDelivery"}),
    listDeliveryZones(),
    listRiders(),
    listAssignableOrders(80),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <DeliveryOperations
        zones={zones.map((zone) => ({
          id: zone.id,
          zoneName: zone.zoneName,
          city: zone.city,
          deliveryPrice: zone.deliveryPrice.toString(),
          isActive: zone.isActive,
        }))}
        riders={riders.map((rider) => ({
          id: rider.id,
          fullName: rider.fullName,
          phone: rider.phone,
          isActive: rider.isActive,
        }))}
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          delivery: order.delivery
            ? {
                id: order.delivery.id,
                status: order.delivery.status,
                riderId: order.delivery.riderId,
                rider: order.delivery.rider,
              }
            : null,
        }))}
        labels={{
          zones: t("zones"),
          riders: t("riders"),
          assignments: t("assignments"),
          addZone: t("addZone"),
          addRider: t("addRider"),
          assign: t("assign"),
          save: t("save"),
          saving: t("saving"),
          city: t("city"),
          zoneName: t("zoneName"),
          price: t("price"),
          riderName: t("riderName"),
          riderPhone: t("riderPhone"),
          order: t("order"),
          rider: t("rider"),
          deliveryStatus: t("deliveryStatus"),
        }}
      />
    </section>
  );
}
