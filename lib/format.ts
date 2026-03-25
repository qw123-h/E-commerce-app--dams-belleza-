export function formatXaf(amount: number, locale = "fr"): string {
  const intlLocale = locale === "en" ? "en-US" : "fr-FR";
  return `${new Intl.NumberFormat(intlLocale).format(amount)} XAF`;
}
