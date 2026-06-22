"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

const LEGACY_WALLET_CACHE_KEY = "wallet_balance_cache";

function walletCacheKey(userId: string): string {
  return `wallet_balance_cache_${userId}`;
}

function writeBalanceCache(userId: string, balance: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    walletCacheKey(userId),
    JSON.stringify({ balance, userId, timestamp: Date.now() }),
  );
}

function readBalanceCache(
  userId: string,
  maxAgeMs: number,
): number | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(walletCacheKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      balance: number;
      userId?: string;
      timestamp: number;
    };
    if (parsed.userId && parsed.userId !== userId) {
      return null;
    }
    if (Date.now() - parsed.timestamp > maxAgeMs) {
      return null;
    }
    return parsed.balance;
  } catch {
    return null;
  }
}

function clearBalanceCaches(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_WALLET_CACHE_KEY);
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("wallet_balance_cache_")) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

type WalletState = {
  balancePkr: number | null;
  ownerUserId: string | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setBalance: (pkr: number, userId: string) => void;
  setLoading: (v: boolean) => void;
  adjustBalance: (deltaPkr: number) => void;
  invalidate: () => void;
  fetchBalance: (accessToken: string, userId: string) => Promise<number | null>;
  hydrateFromCache: (userId: string, maxAgeMs: number) => boolean;
};

export const useWalletStore = create<WalletState>()((set, get) => ({
  balancePkr: null,
  ownerUserId: null,
  isLoading: false,
  lastFetchedAt: null,
  setBalance: (pkr, userId) => {
    writeBalanceCache(userId, pkr);
    set({
      balancePkr: pkr,
      ownerUserId: userId,
      isLoading: false,
      lastFetchedAt: Date.now(),
    });
  },
  setLoading: (v) => set({ isLoading: v }),
  adjustBalance: (deltaPkr) => {
    const { balancePkr, ownerUserId } = get();
    if (balancePkr === null || ownerUserId === null || deltaPkr === 0) {
      return;
    }
    const next = Math.max(0, balancePkr + deltaPkr);
    writeBalanceCache(ownerUserId, next);
    set({ balancePkr: next, isLoading: false, lastFetchedAt: Date.now() });
  },
  invalidate: () => {
    clearBalanceCaches();
    set({
      balancePkr: null,
      ownerUserId: null,
      lastFetchedAt: null,
      isLoading: false,
    });
  },
  hydrateFromCache: (userId, maxAgeMs) => {
    const cached = readBalanceCache(userId, maxAgeMs);
    if (cached === null) {
      return false;
    }
    set({
      balancePkr: cached,
      ownerUserId: userId,
      isLoading: false,
      lastFetchedAt: Date.now(),
    });
    return true;
  },
  fetchBalance: async (accessToken, userId) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch<{ balancePkr: number }>("/api/wallet", {
        accessToken,
        disableDedupe: true,
        cacheTtlMs: 0,
      });
      if (res.success) {
        get().setBalance(res.data.balancePkr, userId);
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
