import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {NotificationsPanel} from "@/components/admin/notifications-panel";
import {requirePermission} from "@/lib/guards";
import {listUserNotifications} from "@/lib/notifications";
import {routing} from "@/i18n/routing";

export default async function AdminNotificationsPage({
  params,
}: {
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;
  const session = await requirePermission("reports.read");

  if (!session?.user?.id) {
    redirect(`/${locale}/unauthorized`);
  }

  const [t, notifications] = await Promise.all([
    getTranslations({locale, namespace: "adminNotifications"}),
    listUserNotifications(session.user.id, 80),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-charcoal-900/10 bg-cream-50 px-6 py-7 shadow-lg shadow-charcoal-900/5">
        <h1 className="font-display text-4xl text-charcoal-900">{t("title")}</h1>
        <p className="mt-2 text-charcoal-700">{t("subtitle")}</p>
      </header>

      <NotificationsPanel
        locale={locale}
        initialNotifications={notifications.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          body: item.body,
          isRead: item.isRead,
          createdAt: item.createdAt.toISOString(),
        }))}
        labels={{
          markRead: t("markRead"),
          markAllRead: t("markAllRead"),
          marking: t("marking"),
          empty: t("empty"),
          unread: t("unread"),
          all: t("all"),
        }}
      />
    </section>
  );
}
