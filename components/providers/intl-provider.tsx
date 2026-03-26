"use client";

import {NextIntlClientProvider} from "next-intl";

interface IntlProviderProps {
  children: React.ReactNode;
  messages: any;
  locale: string;
}

export function IntlProvider({children, messages, locale}: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
