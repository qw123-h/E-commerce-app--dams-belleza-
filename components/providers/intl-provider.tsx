"use client";

import {NextIntlClientProvider} from "next-intl";

interface IntlProviderProps {
  children: React.ReactNode;
  messages: any;
  locale: string;
  timeZone?: string;
}

export function IntlProvider({children, messages, locale, timeZone = "Africa/Douala"}: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
