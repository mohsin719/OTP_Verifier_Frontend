"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

type WalletState = {
  balancePkr: number | null;
  ownerUserId: string | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setBalance: (pkr: number, userId: string) => void;
  setLoading: (v: boolean) => void;
  invalidate: () => void;
  fetchBalance: (accessToken: string, userId: string) => Promise<number | null>;
};

export const useWalletStore = create<WalletState>()((set, get) => ({
  balancePkr: null,
  ownerUserId: null,
  isLoading: false,
  lastFetchedAt: null,
  setBalance: (pkr, userId) => {
    set({
      balancePkr: pkr,
      ownerUserId: userId,
      isLoading: false,
      lastFetchedAt: Date.now(),
    });
  },
  setLoading: (v) => set({ isLoading: v }),
  invalidate: () => {
    set({
      balancePkr: null,
      ownerUserId: null,
      lastFetchedAt: null,
      isLoading: false,
    });
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
