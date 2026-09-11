import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiFetch } from "@/lib/api";

export const DEFAULT_EXCHANGE_RATE_PKR_PER_USD = 280;

interface CurrencyStore {
  exchangeRate: number;
  loading: boolean;
  setExchangeRate: (rate: number) => void;
  fetchExchangeRate: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      exchangeRate: DEFAULT_EXCHANGE_RATE_PKR_PER_USD,
      loading: false,
      setExchangeRate: (rate: number) => {
        if (rate > 0) {
          set({ exchangeRate: Math.round(rate * 100) / 100 });
        }
      },
      fetchExchangeRate: async () => {
        try {
          set({ loading: true });
          const res = await apiFetch<{ exchangeRate: number }>("/api/services/exchange-rate", {
            cacheTtlMs: 15_000,
          });
          if (res.success && res.data && typeof res.data.exchangeRate === "number") {
            set({ exchangeRate: Math.max(1, Math.round(res.data.exchangeRate * 100) / 100), loading: false });
          } else {
            set({ loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },
    }),
    {
      name: "usnumhub-currency-rate",
    }
  )
);

/**
 * Convert PKR to USD with 2 decimal precision.
 * Example: 60 PKR at 280 rate = $0.21
 */
export function pkrToUsd(
  pkr: number,
  rate = DEFAULT_EXCHANGE_RATE_PKR_PER_USD
): number {
  if (!pkr || pkr <= 0 || !rate || rate <= 0) return 0;
  return Math.round((pkr / rate) * 100) / 100;
}

/**
 * Convert USD to PKR (rounded to whole PKR).
 * Example: $0.25 at 280 rate = 70 PKR
 */
export function usdToPkr(
  usd: number,
  rate = DEFAULT_EXCHANGE_RATE_PKR_PER_USD
): number {
  if (!usd || usd <= 0 || !rate || rate <= 0) return 0;
  return Math.round(usd * rate);
}

/**
 * Format a USD number nicely: $0.21, $1.50, $0.072 (sub-cent prices).
 */
export function formatUsd(amountUsd: number | null | undefined): string {
  if (amountUsd === null || amountUsd === undefined || isNaN(amountUsd)) {
    return "$0.00";
  }
  // If price has more than 2 decimal digits (e.g. 0.072, 0.035), format with up to 3 or 4 decimal places
  const hasSubCent = Math.abs(amountUsd * 100 - Math.round(amountUsd * 100)) > 0.0001;
  const maxDecimals = hasSubCent ? (amountUsd < 0.01 ? 4 : 3) : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(amountUsd);
}

/**
 * Format a PKR number nicely: Rs 60, Rs 500, etc.
 */
export function formatPkr(amountPkr: number | null | undefined): string {
  if (amountPkr === null || amountPkr === undefined || isNaN(amountPkr)) {
    return "Rs 0";
  }
  return `Rs ${new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountPkr))}`;
}

/**
 * Returns dual-currency object for any price given in PKR, optionally accepting exact USD.
 * E.g. for pkr = 20, exactUsd = 0.072 -> { usd: "$0.072", pkr: "Rs 20", rawUsd: 0.072, rawPkr: 20 }
 */
export function formatDualPrice(
  pkr: number,
  rate = DEFAULT_EXCHANGE_RATE_PKR_PER_USD,
  exactUsd?: number | null
): {
  usd: string;
  pkr: string;
  rawUsd: number;
  rawPkr: number;
} {
  const rawUsd =
    typeof exactUsd === "number" && !isNaN(exactUsd) && exactUsd > 0
      ? exactUsd
      : pkrToUsd(pkr, rate);

  return {
    usd: formatUsd(rawUsd),
    pkr: formatPkr(pkr),
    rawUsd,
    rawPkr: Math.round(pkr),
  };
}

/**
 * Returns dual-currency object for user balance given in PKR.
 */
export function formatDualBalance(
  pkr: number | null | undefined,
  rate = DEFAULT_EXCHANGE_RATE_PKR_PER_USD
): {
  usd: string;
  pkr: string;
  rawUsd: number;
  rawPkr: number;
} {
  if (pkr === null || pkr === undefined) {
    return {
      usd: "$0.00",
      pkr: "Rs 0",
      rawUsd: 0,
      rawPkr: 0,
    };
  }
  const rawUsd = pkrToUsd(pkr, rate);
  return {
    usd: formatUsd(rawUsd),
    pkr: formatPkr(pkr),
    rawUsd,
    rawPkr: Math.round(pkr),
  };
}
