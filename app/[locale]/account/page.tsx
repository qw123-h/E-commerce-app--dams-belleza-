import Link from "next/link";
import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {auth} from "@/lib/auth";
import {formatXaf} from "@/lib/format";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";

export default async function AccountPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await auth();

  if (!session?.user?.id) {
    const signInUrl = `/${locale}/auth/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/account`)}`;
    redirect(signInUrl);
  }

  const [t, user] = await Promise.all([
    getTranslations({locale, namespace: "account"}),
    prisma.user.findUnique({
      where: {id: session.user.id},
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        createdAt: true,
        orders: {
          where: {deletedAt: null},
          orderBy: {createdAt: "desc"},
          select: {
            id: true,
            orderNumber: true,
            status: true,
            deliveryMethod: true,
            totalAmount: true,
            createdAt: true,
            deliveryZone: {
              select: {
                city: true,
                zoneName: true,
              },
            },
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            payments: {
              orderBy: {createdAt: "desc"},
              take: 1,
              select: {
                status: true,
                method: true,
                amount: true,
                reference: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const totalOrders = user.orders.length;
  const pendingOrders = user.orders.filter((order) => order.status === "PENDING").length;
  const deliveredOrders = user.orders.filter((order) => order.status === "DELIVERED").length;

  return (
    <section className="w-full overflow-x-hidden space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-4 py-5 sm:px-6 sm:py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-sm sm:text-base text-charcoal-700">{t("subtitle")}</p>
      </header>

      <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-6 shadow-lg shadow-charcoal-900/5">
        <h2 className="font-display text-lg sm:text-xl lg:text-2xl text-charcoal-900">{t("profileTitle")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("fullName")}:</span> {`${user.firstName} ${user.lastName}`}</p>
          <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("email")}:</span> {user.email}</p>
          <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("phone")}:</span> {user.phone ?? t("notProvided")}</p>
          <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("whatsapp")}:</span> {user.whatsappNumber ?? t("notProvided")}</p>
        </div>
      </article>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4 shadow">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal-600">{t("stats.totalOrders")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-semibold text-charcoal-900">{totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4 shadow">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal-600">{t("stats.pending")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-semibold text-charcoal-900">{pendingOrders}</p>
        </article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4 shadow">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal-600">{t("stats.delivered")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-semibold text-charcoal-900">{deliveredOrders}</p>
        </article>
      </section>

      <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-6 shadow-lg shadow-charcoal-900/5">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="font-display text-lg sm:text-xl lg:text-2xl text-charcoal-900">{t("ordersTitle")}</h2>
          <Link href={`/${locale}/products`} className="text-xs sm:text-sm font-semibold text-charcoal-800 underline">{t("continueShopping")}</Link>
        </div>

        {user.orders.length ? (
          <div className="space-y-4">
            {user.orders.map((order) => {
              const latestPayment = order.payments[0];

              return (
                <article key={order.id} className="rounded-2xl border border-charcoal-900/10 bg-white p-3 sm:p-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("orderNumber")}:</span> {order.orderNumber}</p>
                    <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("status")}:</span> {order.status}</p>
                    <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("deliveryMethod")}:</span> {order.deliveryMethod}</p>
                    <p className="text-sm text-charcoal-700"><span className="font-semibold text-charcoal-900">{t("total")}:</span> {formatXaf(Number(order.totalAmount), locale)}</p>
                  </div>

                  {order.deliveryZone ? (
                    <p className="mt-2 text-sm text-charcoal-700">
                      <span className="font-semibold text-charcoal-900">{t("deliveryZone")}:</span> {order.deliveryZone.zoneName}, {order.deliveryZone.city}
                    </p>
                  ) : null}

                  {latestPayment ? (
                    <p className="mt-2 text-sm text-charcoal-700">
                      <span className="font-semibold text-charcoal-900">{t("payment")}:</span> {latestPayment.method} ({latestPayment.status})
                    </p>
                  ) : null}

                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-700">{t("items")}</p>
                    <ul className="mt-2 space-y-1">
                      {order.items.map((item, index) => (
                        <li key={`${order.id}-${index}`} className="text-sm text-charcoal-700">
                          {item.quantity}x {item.product.name} - {formatXaf(Number(item.totalPrice), locale)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-charcoal-700">{t("noOrders")}</p>
        )}
      </article>
    </section>
  );
}