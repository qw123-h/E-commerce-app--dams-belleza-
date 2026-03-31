export function formatXaf(amount: number, locale = "fr"): string {
  const intlLocale = locale === "en" ? "en-US" : "fr-FR";
  return `${new Intl.NumberFormat(intlLocale).format(amount)} XAF`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

