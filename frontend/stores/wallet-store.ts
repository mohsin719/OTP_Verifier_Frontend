"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

const WALLET_CACHE_KEY = "wallet_balance_cache";

function writeBalanceCache(balance: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    WALLET_CACHE_KEY,
    JSON.stringify({ balance, timestamp: Date.now() }),
  );
}

function clearBalanceCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WALLET_CACHE_KEY);
}

type WalletState = {
  balancePkr: number | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setBalance: (pkr: number) => void;
  setLoading: (v: boolean) => void;
  adjustBalance: (deltaPkr: number) => void;
  invalidate: () => void;
  fetchBalance: (accessToken: string) => Promise<number | null>;
};

export const useWalletStore = create<WalletState>()((set, get) => ({
  balancePkr: null,
  isLoading: false,
  lastFetchedAt: null,
  setBalance: (pkr) => {
    writeBalanceCache(pkr);
    set({ balancePkr: pkr, isLoading: false, lastFetchedAt: Date.now() });
  },
  setLoading: (v) => set({ isLoading: v }),
  adjustBalance: (deltaPkr) => {
    const current = get().balancePkr;
    if (current === null || deltaPkr === 0) {
      return;
    }
    const next = Math.max(0, current + deltaPkr);
    writeBalanceCache(next);
    set({ balancePkr: next, isLoading: false, lastFetchedAt: Date.now() });
  },
  invalidate: () => {
    clearBalanceCache();
    set({ balancePkr: null, lastFetchedAt: null });
  },
  fetchBalance: async (accessToken) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch<{ balancePkr: number }>("/api/wallet", {
        accessToken,
        disableDedupe: true,
        cacheTtlMs: 0,
      });
      if (res.success) {
        get().setBalance(res.data.balancePkr);
        return res.data.balancePkr;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
