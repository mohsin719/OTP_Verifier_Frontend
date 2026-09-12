"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export type TopupCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

type TopupNotificationState = {
  counts: TopupCounts;
  pendingCount: number;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setCounts: (counts: Partial<TopupCounts>) => void;
  fetchPendingCount: (accessToken: string) => Promise<number>;
};

export const useTopupNotificationStore = create<TopupNotificationState>()((set, get) => ({
  counts: {
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
  pendingCount: 0,
  isLoading: false,
  lastFetchedAt: null,

  setCounts: (newCounts) => {
    set((state) => {
      const merged = { ...state.counts, ...newCounts };
      return {
        counts: merged,
        pendingCount: merged.pending,
        lastFetchedAt: Date.now(),
      };
    });
  },

  fetchPendingCount: async (accessToken: string) => {
    if (!accessToken) return 0;
    set({ isLoading: true });
    try {
      // 1. Try dedicated fast count endpoint
      const res = await apiFetch<TopupCounts>("/api/manage/topups/counts", {
        accessToken,
        disableDedupe: true,
      });

      if (res.success && res.data && typeof res.data.pending === "number") {
        get().setCounts(res.data);
        return res.data.pending;
      }

      // 2. Fallback to list endpoint with limit=1
      const fallback = await apiFetch<{ counts?: TopupCounts }>("/api/manage/topups?limit=1", {
        accessToken,
        disableDedupe: true,
      });

      if (fallback.success && fallback.data?.counts) {
        get().setCounts(fallback.data.counts);
        return fallback.data.counts.pending;
      }

      return 0;
    } catch {
      return get().pendingCount;
    } finally {
      set({ isLoading: false });
    }
  },
}));
