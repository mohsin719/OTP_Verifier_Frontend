"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/auth-types";
import { authLogout, authRefresh } from "@/lib/api";

export type { AuthUser };

const REFRESH_RETRY_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY_MS = 700;

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  restoreSession: () => Promise<boolean>;
  setHydrated: (value: boolean) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

if (typeof window !== "undefined") {
  const legacyKeys = ["vsms-auth-user", "vsms-auth-admin", "accessToken"];
  for (const legacyKey of legacyKeys) {
    localStorage.removeItem(legacyKey);
  }
}

async function refreshWithRetries(): Promise<
  { ok: true; accessToken: string; user: AuthUser } | { ok: false }
> {
  for (let attempt = 0; attempt < REFRESH_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await authRefresh();
      if (result.success && result.data) {
        return {
          ok: true,
          accessToken: result.data.accessToken,
          user: result.data.user,
        };
      }
    } catch {
      // network blip — retry
    }

    if (attempt < REFRESH_RETRY_ATTEMPTS - 1) {
      await sleep(REFRESH_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return { ok: false };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        void authLogout().catch(() => {
          // still clear local session if API unreachable
        });
        set({ token: null, user: null });
      },
      setHydrated: (value) => set({ hydrated: value }),
      refreshToken: async () => {
        const refreshed = await refreshWithRetries();
        if (!refreshed.ok) {
          return false;
        }
        set({ token: refreshed.accessToken, user: refreshed.user });
        return true;
      },
      restoreSession: async () => {
        const { token, user } = get();
        if (token && user) {
          const refreshed = await refreshWithRetries();
          if (refreshed.ok) {
            set({ token: refreshed.accessToken, user: refreshed.user });
            return true;
          }
          // Keep existing session on transient network errors.
          return true;
        }

        const refreshed = await refreshWithRetries();
        if (!refreshed.ok) {
          return false;
        }
        set({ token: refreshed.accessToken, user: refreshed.user });
        return true;
      },
    }),
    {
      name: "vsms-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
