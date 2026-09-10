export function formatMinorUnits(
  amountMinor: number,
  currency: string,
  locale = "en-KE",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

/** Parse a major-unit amount string (e.g. "150.50") into minor units. */
export function parseMajorToMinor(amountMajor: string): number | null {
  const trimmed = amountMajor.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = (fraction + "00").slice(0, 2);
  return Number(whole) * 100 + Number(cents);
}
