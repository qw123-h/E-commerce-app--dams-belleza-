import Link from "next/link";
import {getTranslations} from "next-intl/server";
import {prisma} from "@/lib/prisma";
import {routing} from "@/i18n/routing";

type SearchParams = {
  order?: string;
  phone?: string;
};

function asSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePhone(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function extractPhoneFromNotes(notes: string | null) {
  const phoneLine = (notes ?? "")
    .split("|")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("phone:"));

  return normalizePhone(phoneLine?.split(":")[1]);
}

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params?: {locale: string};
  searchParams?: SearchParams;
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const t = await getTranslations({locale, namespace: "trackOrder"});

  const orderNumber = asSingle(searchParams?.order)?.trim();
  const phone = normalizePhone(asSingle(searchParams?.phone));

  const lookupByOrder = Boolean(orderNumber && phone);
  const lookupByPhoneOnly = Boolean(!orderNumber && phone);

  const order =
    lookupByOrder
      ? await prisma.order.findFirst({
          where: {
            orderNumber,
            deletedAt: null,
          },
          select: {
            orderNumber: true,
            status: true,
            createdAt: true,
            notes: true,
            deliveryMethod: true,
            delivery: {
              select: {
                status: true,
                rider: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
                dispatchedAt: true,
                deliveredAt: true,
              },
            },
          },
        })
      : null;

  const matchesPhone = order ? extractPhoneFromNotes(order.notes) === phone : false;

  const recentOrdersByPhone = lookupByPhoneOnly
    ? (await prisma.order.findMany({
        where: {
          deletedAt: null,
          notes: {
            contains: "Phone:",
            mode: "insensitive",
          },
        },
        select: {
          orderNumber: true,
          status: true,
          createdAt: true,
          notes: true,
          deliveryMethod: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 40,
      }))
        .filter((item) => extractPhoneFromNotes(item.notes) === phone)
        .slice(0, 5)
    : [];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-4 py-5 sm:px-6 sm:py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-sm sm:text-base text-charcoal-700">{t("subtitle")}</p>
      </header>

      <form className="grid grid-cols-1 gap-3 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-5 shadow-lg shadow-charcoal-900/5 sm:grid-cols-3">
        <input
          name="order"
          defaultValue={orderNumber}
          placeholder={t("orderPlaceholder")}
          className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
        />
        <input
          name="phone"
          defaultValue={asSingle(searchParams?.phone) ?? ""}
          placeholder={t("phonePlaceholder")}
          className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50">
          {t("check")}
        </button>
      </form>

      {lookupByOrder ? (
        order && matchesPhone ? (
          <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-6 shadow-lg shadow-charcoal-900/5">
            <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("orderNumber")}</p>
            <p className="mt-1 text-lg sm:text-xl font-semibold text-charcoal-900">{order.orderNumber}</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("orderStatus")}</p>
                <p className="mt-1 text-sm font-semibold text-charcoal-900">{order.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("deliveryStatus")}</p>
                <p className="mt-1 text-sm font-semibold text-charcoal-900">{order.delivery?.status ?? t("notAssigned")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("deliveryMethod")}</p>
                <p className="mt-1 text-sm font-semibold text-charcoal-900">{order.deliveryMethod}</p>
              </div>
            </div>

            {order.delivery?.rider ? (
              <div className="mt-5 rounded-2xl border border-charcoal-900/10 bg-white p-4 text-sm text-charcoal-700">
                <p className="font-semibold text-charcoal-900">{t("rider")}: {order.delivery.rider.fullName}</p>
                <p className="mt-1">{t("riderPhone")}: {order.delivery.rider.phone}</p>
                <Link
                  href={`https://wa.me/${order.delivery.rider.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-xs font-semibold underline"
                >
                  {t("chatRider")}
                </Link>
              </div>
            ) : null}
          </article>
        ) : (
          <div className="rounded-3xl border border-dashed border-charcoal-900/20 bg-cream-50 p-8 text-center text-charcoal-700">
            {t("notFound")}
          </div>
        )
      ) : lookupByPhoneOnly ? (
        recentOrdersByPhone.length > 0 ? (
            <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-6 shadow-lg shadow-charcoal-900/5">
            <p className="text-sm font-semibold text-charcoal-900">{t("foundByPhoneTitle")}</p>
            <p className="mt-1 text-xs sm:text-sm text-charcoal-700">{t("foundByPhoneSubtitle")}</p>

            <div className="mt-4 space-y-3">
              {recentOrdersByPhone.map((candidate) => (
                <div key={candidate.orderNumber} className="rounded-2xl border border-charcoal-900/10 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{t("orderNumber")}</p>
                      <p className="text-base font-semibold text-charcoal-900">{candidate.orderNumber}</p>
                    </div>
                    <Link
                      href={`/${locale}/track-order?order=${encodeURIComponent(candidate.orderNumber)}&phone=${encodeURIComponent(asSingle(searchParams?.phone) ?? "")}`}
                      className="rounded-xl bg-charcoal-900 px-3 py-2 text-xs font-semibold text-cream-50"
                    >
                      {t("check")}
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-charcoal-700">{t("orderStatus")}: {candidate.status}</p>
                  <p className="text-xs text-charcoal-700">{t("deliveryMethod")}: {candidate.deliveryMethod}</p>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <div className="rounded-3xl border border-dashed border-charcoal-900/20 bg-cream-50 p-8 text-center text-charcoal-700">
            {t("notFound")}
          </div>
        )
      ) : null}
    </section>
  );
}
