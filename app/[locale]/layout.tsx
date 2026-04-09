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
import {MobileHeaderMenu} from "@/components/storefront/mobile-header-menu";
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

  const mobileLinks = [
    session?.user?.id ? {href: `/${locale}/account`, label: nav("myAccount")} : null,
    !isAdminUser ? {href: `/${locale}/products`, label: nav("products")} : null,
    !isAdminUser ? {href: `/${locale}/checkout`, label: nav("checkout")} : null,
    !isAdminUser ? {href: `/${locale}/track-order`, label: nav("trackOrder")} : null,
    canReadProducts ? {href: `/${locale}/admin/products`, label: nav("adminProducts")} : null,
    canReadOrders ? {href: `/${locale}/admin/orders`, label: nav("adminOrders")} : null,
    canReviewPayments ? {href: `/${locale}/admin/payments`, label: nav("adminPayments")} : null,
    canManageDelivery ? {href: `/${locale}/admin/delivery`, label: nav("adminDelivery")} : null,
    canReadReports ? {href: `/${locale}/admin/reports`, label: nav("adminReports")} : null,
    canReadReports ? {href: `/${locale}/admin/notifications`, label: nav("adminNotifications")} : null,
    canManageRoles ? {href: `/${locale}/admin/roles`, label: nav("adminRoles")} : null,
  ].filter((item): item is {href: string; label: string} => item !== null);


  return (
    <html lang={locale} className={`${display.variable} ${body.variable} overflow-x-hidden w-full`}>
      <body className="min-h-screen w-full overflow-x-hidden bg-luxury-gradient text-charcoal-900 antialiased">
        <IntlProvider locale={locale} messages={messages} timeZone="Africa/Douala">
          <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 w-full border-b border-white/60 bg-cream-50/80 px-4 py-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(31,27,26,0.08)] sm:px-6 lg:px-8 animate-fade-up overflow-x-hidden">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-charcoal-900/5 bg-white/35 px-3 py-2 shadow-sm shadow-charcoal-900/5 sm:px-4 sm:py-3">
                <Link href={`/${locale}`} className="min-w-0 shrink-0">
                  <p className="font-display text-lg leading-none tracking-wide text-charcoal-900 sm:text-2xl">Dam's belleza</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-charcoal-600 sm:text-xs sm:tracking-[0.2em]">Yaounde • Mokolo</p>
                </Link>

                <nav className="hidden items-center gap-5 text-sm font-semibold text-charcoal-800 xl:flex">
                  {session?.user?.id ? (
                    <Link href={`/${locale}/account`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("myAccount")}
                    </Link>
                  ) : null}
                  {!isAdminUser ? (
                    <>
                      <Link href={`/${locale}/products`} className="transition hover:text-charcoal-900 hover:opacity-80">
                        {nav("products")}
                      </Link>
                      <Link href={`/${locale}/checkout`} className="transition hover:text-charcoal-900 hover:opacity-80">
                        {nav("checkout")}
                      </Link>
                      <Link href={`/${locale}/track-order`} className="transition hover:text-charcoal-900 hover:opacity-80">
                        {nav("trackOrder")}
                      </Link>
                    </>
                  ) : null}
                  {canReadProducts ? (
                    <Link href={`/${locale}/admin/products`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminProducts")}
                    </Link>
                  ) : null}
                  {canReadOrders ? (
                    <Link href={`/${locale}/admin/orders`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminOrders")}
                    </Link>
                  ) : null}
                  {canReviewPayments ? (
                    <Link href={`/${locale}/admin/payments`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminPayments")}
                    </Link>
                  ) : null}
                  {canManageDelivery ? (
                    <Link href={`/${locale}/admin/delivery`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminDelivery")}
                    </Link>
                  ) : null}
                  {canReadReports ? (
                    <Link href={`/${locale}/admin/reports`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminReports")}
                    </Link>
                  ) : null}
                  {canReadReports ? (
                    <Link href={`/${locale}/admin/notifications`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminNotifications")}
                    </Link>
                  ) : null}
                  {canManageRoles ? (
                    <Link href={`/${locale}/admin/roles`} className="transition hover:text-charcoal-900 hover:opacity-80">
                      {nav("adminRoles")}
                    </Link>
                  ) : null}
                </nav>

                <div className="hidden xl:flex items-center gap-2">
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

                <MobileHeaderMenu
                  menuLabel={nav("menu")}
                  connectHref={`/${locale}/auth/sign-in`}
                  connectLabel={nav("connect")}
                  logoutLabel={nav("logout")}
                  signedIn={Boolean(session?.user?.id)}
                  links={mobileLinks}
                />
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
