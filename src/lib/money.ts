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
