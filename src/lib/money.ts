export const EXCHANGE_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1 / 1600,
  GBP: 1 / 2100,
  EUR: 1 / 1800,
};

export const SUPPORTED_CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const SUPPORTED_COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "South Africa",
  "Ghana",
  "Kenya",
  "Other country",
];

export function formatMoney(amountInNGN: number, currency: string = "NGN"): string {
  const rate = EXCHANGE_RATES[currency] || 1;
  const converted = amountInNGN * rate;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(converted);
}
