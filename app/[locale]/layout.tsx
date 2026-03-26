import type {Metadata} from "next";
import Link from "next/link";
import {Playfair_Display, Manrope} from "next/font/google";
import {hasLocale} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import {auth} from "@/lib/auth";
import {sessionHasPermission} from "@/lib/rbac";
import {IntlProvider} from "@/components/providers/intl-provider";
import {LanguageSwitcher} from "@/components/storefront/language-switcher";
import {WhatsAppFloat} from "@/components/storefront/whatsapp-float";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Dam's belleza",
  description: "Luxury wigs and perfumes in Yaounde",
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: {locale: string};
}) {
  const locale = params?.locale ?? routing.defaultLocale;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const [messages, nav, session] = await Promise.all([
    getMessages(),
    getTranslations({locale, namespace: "common.nav"}),
    auth(),
  ]);

  const canReadOrders = sessionHasPermission(session, "orders.read");
  const canReviewPayments = sessionHasPermission(session, "payments.review");
  const canManageDelivery = sessionHasPermission(session, "orders.write");
  const canReadReports = sessionHasPermission(session, "reports.read");
  const canManageRoles = sessionHasPermission(session, "roles.manage");

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-luxury-gradient text-charcoal-900 antialiased">
        <IntlProvider locale={locale} messages={messages}>
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-charcoal-900/10 bg-cream-50/90 py-4 backdrop-blur">
              <div className="flex items-center gap-8">
                <div>
                  <p className="font-display text-xl tracking-wide text-charcoal-900">Dam's belleza</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-charcoal-600">Yaounde • Mokolo</p>
                </div>
                <nav className="hidden items-center gap-4 text-sm font-semibold text-charcoal-800 md:flex">
                  <Link href={`/${locale}/products`} className="transition hover:text-charcoal-900">
                    {nav("products")}
                  </Link>
                  <Link href={`/${locale}/checkout`} className="transition hover:text-charcoal-900">
                    {nav("checkout")}
                  </Link>
                  <Link href={`/${locale}/track-order`} className="transition hover:text-charcoal-900">
                    {nav("trackOrder")}
                  </Link>
                  {canReadOrders ? (
                    <Link href={`/${locale}/admin/orders`} className="transition hover:text-charcoal-900">
                      {nav("adminOrders")}
                    </Link>
                  ) : null}
                  {canReviewPayments ? (
                    <Link href={`/${locale}/admin/payments`} className="transition hover:text-charcoal-900">
                      {nav("adminPayments")}
                    </Link>
                  ) : null}
                  {canManageDelivery ? (
                    <Link href={`/${locale}/admin/delivery`} className="transition hover:text-charcoal-900">
                      {nav("adminDelivery")}
                    </Link>
                  ) : null}
                  {canReadReports ? (
                    <Link href={`/${locale}/admin/reports`} className="transition hover:text-charcoal-900">
                      {nav("adminReports")}
                    </Link>
                  ) : null}
                  {canReadReports ? (
                    <Link href={`/${locale}/admin/notifications`} className="transition hover:text-charcoal-900">
                      {nav("adminNotifications")}
                    </Link>
                  ) : null}
                  {canManageRoles ? (
                    <Link href={`/${locale}/admin/roles`} className="transition hover:text-charcoal-900">
                      {nav("adminRoles")}
                    </Link>
                  ) : null}
                </nav>
                <details className="md:hidden">
                  <summary className="cursor-pointer rounded-full border border-charcoal-900/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-900">
                    {nav("menu")}
                  </summary>
                  <div className="absolute left-4 right-4 top-full mt-2 rounded-2xl border border-charcoal-900/10 bg-cream-50 p-3 shadow-lg shadow-charcoal-900/10">
                    <nav className="grid gap-2 text-sm font-semibold text-charcoal-800">
                      <Link href={`/${locale}/products`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("products")}</Link>
                      <Link href={`/${locale}/checkout`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("checkout")}</Link>
                      <Link href={`/${locale}/track-order`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("trackOrder")}</Link>
                      {canReadOrders ? <Link href={`/${locale}/admin/orders`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("adminOrders")}</Link> : null}
                      {canReviewPayments ? <Link href={`/${locale}/admin/payments`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("adminPayments")}</Link> : null}
                      {canManageDelivery ? <Link href={`/${locale}/admin/delivery`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("adminDelivery")}</Link> : null}
                      {canReadReports ? <Link href={`/${locale}/admin/reports`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("adminReports")}</Link> : null}
                      {canReadReports ? <Link href={`/${locale}/admin/notifications`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("adminNotifications")}</Link> : null}
                      {canManageRoles ? <Link href={`/${locale}/admin/roles`} className="rounded-lg px-2 py-1 transition hover:bg-cream-100">{nav("adminRoles")}</Link> : null}
                    </nav>
                  </div>
                </details>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/auth/sign-in`}
                  className="rounded-full border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 transition hover:bg-cream-100"
                >
                  {nav("connect")}
                </Link>
                <LanguageSwitcher />
              </div>
            </header>
            <main className="flex-1 py-8">{children}</main>
          </div>
          <WhatsAppFloat />
        </IntlProvider>
      </body>
    </html>
  );
}
