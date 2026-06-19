"use client";

import { create } from "zustand";

type WalletState = {
  balancePkr: number | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setBalance: (pkr: number) => void;
  setLoading: (v: boolean) => void;
  invalidate: () => void;
};

export const useWalletStore = create<WalletState>()((set) => ({
  balancePkr: null,
  isLoading: false,
  lastFetchedAt: null,
  setBalance: (pkr) =>
    set({ balancePkr: pkr, isLoading: false, lastFetchedAt: Date.now() }),
  setLoading: (v) => set({ isLoading: v }),
  invalidate: () => set({ balancePkr: null, lastFetchedAt: null }),
}));
