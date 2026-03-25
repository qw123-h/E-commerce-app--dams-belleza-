import type {Metadata} from "next";
import {Playfair_Display, Manrope} from "next/font/google";
import {NextIntlClientProvider, hasLocale} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
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
  const [messages, nav] = await Promise.all([
    getMessages(),
    getTranslations({locale, namespace: "common.nav"}),
  ]);

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-luxury-gradient text-charcoal-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-charcoal-900/10 bg-cream-50/90 py-4 backdrop-blur">
              <div className="flex items-center gap-8">
                <div>
                  <p className="font-display text-xl tracking-wide text-charcoal-900">Dam's belleza</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-charcoal-600">Yaounde • Mokolo</p>
                </div>
                <nav className="hidden items-center gap-4 text-sm font-semibold text-charcoal-800 md:flex">
                  <a href={`/${locale}/products`} className="transition hover:text-charcoal-900">
                    {nav("products")}
                  </a>
                  <a href={`/${locale}/checkout`} className="transition hover:text-charcoal-900">
                    {nav("checkout")}
                  </a>
                  <a href={`/${locale}/admin/orders`} className="transition hover:text-charcoal-900">
                    {nav("adminOrders")}
                  </a>
                  <a href={`/${locale}/admin/payments`} className="transition hover:text-charcoal-900">
                    {nav("adminPayments")}
                  </a>
                  <a href={`/${locale}/admin/delivery`} className="transition hover:text-charcoal-900">
                    {nav("adminDelivery")}
                  </a>
                  <a href={`/${locale}/admin/roles`} className="transition hover:text-charcoal-900">
                    {nav("adminRoles")}
                  </a>
                  <a href={`/${locale}/admin/reports`} className="transition hover:text-charcoal-900">
                    {nav("adminReports")}
                  </a>
                  <a href={`/${locale}/admin/notifications`} className="transition hover:text-charcoal-900">
                    {nav("adminNotifications")}
                  </a>
                  <a href={`/${locale}/track-order`} className="transition hover:text-charcoal-900">
                    {nav("trackOrder")}
                  </a>
                </nav>
              </div>
              <LanguageSwitcher />
            </header>
            <main className="flex-1 py-8">{children}</main>
          </div>
          <WhatsAppFloat />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
