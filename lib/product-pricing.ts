export type SizePrice = {
  size: string;
  price: number;
};

export function extractSizePricing(source: string | null | undefined): SizePrice[] {
  if (!source) {
    return [];
  }

  const normalized = source.replace(/\r\n/g, "\n");
  const regex = /\bT\s*(\d+)\b(?:[^0-9]*?)([0-9][0-9\s.,]*)/gi;
  const results: SizePrice[] = [];

  let match = regex.exec(normalized);
  while (match) {
    const price = Number(String(match[2]).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(price)) {
      results.push({size: `T${match[1]}`, price});
    }
    match = regex.exec(normalized);
  }

  return results;
}

export function formatSizePricingSummary(pricing: SizePrice[], limit = 2) {
  if (pricing.length === 0) {
    return "";
  }

  return pricing
    .slice(0, limit)
    .map((entry) => `${entry.size} ${entry.price.toLocaleString("fr-FR")}`)
    .join(" • ");
}
