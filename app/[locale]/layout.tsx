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
import {LogoutButton} from "@/components/auth/logout-button";

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
  const canReadProducts = sessionHasPermission(session, "products.read");
  const canReviewPayments = sessionHasPermission(session, "payments.review");
  const canManageDelivery = sessionHasPermission(session, "orders.write");
  const canReadReports = sessionHasPermission(session, "reports.read");
  const canManageRoles = sessionHasPermission(session, "roles.manage");
  const isAdminUser = canReadOrders || canReadProducts || canReviewPayments || canManageDelivery || canReadReports || canManageRoles;


  return (
    <html lang={locale} className={`${display.variable} ${body.variable} overflow-x-hidden w-full`}>
      <body className="min-h-screen w-full overflow-x-hidden bg-luxury-gradient text-charcoal-900 antialiased">
        <IntlProvider locale={locale} messages={messages} timeZone="Africa/Douala">
          <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 w-full border-b border-charcoal-900/10 bg-cream-50/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 animate-fade-up overflow-x-hidden">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/${locale}`} className="min-w-0">
                  <p className="font-display text-xl leading-none tracking-wide text-charcoal-900 sm:text-2xl">Dam's belleza</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-charcoal-600 sm:text-xs sm:tracking-[0.2em]">Yaounde • Mokolo</p>
                </Link>

                <nav className="hidden items-center gap-4 text-sm font-semibold text-charcoal-800 lg:flex">
                  {session?.user?.id ? (
                    <Link href={`/${locale}/account`} className="transition hover:text-charcoal-900">
                      {nav("myAccount")}
                    </Link>
                  ) : null}
                  {!isAdminUser ? (
                    <>
                      <Link href={`/${locale}/products`} className="transition hover:text-charcoal-900">
                        {nav("products")}
                      </Link>
                      <Link href={`/${locale}/checkout`} className="transition hover:text-charcoal-900">
                        {nav("checkout")}
                      </Link>
                      <Link href={`/${locale}/track-order`} className="transition hover:text-charcoal-900">
                        {nav("trackOrder")}
                      </Link>
                    </>
                  ) : null}
                  {canReadProducts ? (
                    <Link href={`/${locale}/admin/products`} className="transition hover:text-charcoal-900">
                      {nav("adminProducts")}
                    </Link>
                  ) : null}
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

                <div className="hidden lg:flex items-center gap-2">
                  {session?.user?.id ? (
                    <LogoutButton label={nav("logout")} locale={locale} />
                  ) : (
                    <Link
                      href={`/${locale}/auth/sign-in`}
                      className="rounded-full border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 transition hover:bg-cream-100"
                    >
                      {nav("connect")}
                    </Link>
                  )}
                  <LanguageSwitcher />
                </div>

                <details className="relative lg:hidden">
                  <summary className="list-none cursor-pointer rounded-full border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-900">
                    {nav("menu")}
                  </summary>
                  <div className="absolute right-0 top-full mt-2 w-[min(92vw,22rem)] rounded-2xl border border-charcoal-900/10 bg-cream-50 p-3 shadow-lg shadow-charcoal-900/10">
                    <nav className="grid gap-1 text-sm font-semibold text-charcoal-800">
                      {session?.user?.id ? <Link href={`/${locale}/account`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("myAccount")}</Link> : null}
                      {!isAdminUser ? <Link href={`/${locale}/products`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("products")}</Link> : null}
                      {!isAdminUser ? <Link href={`/${locale}/checkout`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("checkout")}</Link> : null}
                      {!isAdminUser ? <Link href={`/${locale}/track-order`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("trackOrder")}</Link> : null}
                      {canReadProducts ? <Link href={`/${locale}/admin/products`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminProducts")}</Link> : null}
                      {canReadOrders ? <Link href={`/${locale}/admin/orders`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminOrders")}</Link> : null}
                      {canReviewPayments ? <Link href={`/${locale}/admin/payments`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminPayments")}</Link> : null}
                      {canManageDelivery ? <Link href={`/${locale}/admin/delivery`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminDelivery")}</Link> : null}
                      {canReadReports ? <Link href={`/${locale}/admin/reports`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminReports")}</Link> : null}
                      {canReadReports ? <Link href={`/${locale}/admin/notifications`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminNotifications")}</Link> : null}
                      {canManageRoles ? <Link href={`/${locale}/admin/roles`} className="rounded-lg px-2 py-2 transition hover:bg-cream-100">{nav("adminRoles")}</Link> : null}
                    </nav>

                    <div className="mt-3 border-t border-charcoal-900/10 pt-3 space-y-2">
                      <LanguageSwitcher />
                      {session?.user?.id ? (
                        <LogoutButton label={nav("logout")} locale={locale} />
                      ) : (
                        <Link
                          href={`/${locale}/auth/sign-in`}
                          className="inline-flex rounded-full border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 transition hover:bg-cream-100"
                        >
                          {nav("connect")}
                        </Link>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            </header>
            <main className="flex-1 w-full overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 animate-fade-up-delay-1">{children}</main>
          </div>
          <WhatsAppFloat />
        </IntlProvider>
      </body>
    </html>
  );
}
