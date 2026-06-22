"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/auth-types";
import { authLogout, authRefresh } from "@/lib/api";
import { useWalletStore } from "@/stores/wallet-store";

export type { AuthUser };

const REFRESH_RETRY_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY_MS = 700;

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  /** Blocks cookie-based auto-login after explicit logout */
  sessionRevoked: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  setPreferredPlatform: (platform: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  restoreSession: () => Promise<boolean>;
  /** Try httpOnly cookie when localStorage has no session (login/dashboard entry). */
  restoreFromCookie: () => Promise<boolean>;
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
      sessionRevoked: false,
      setAuth: (token, user) => {
        const prevUserId = get().user?.id;
        const walletOwnerId = useWalletStore.getState().ownerUserId;
        if (
          (prevUserId && prevUserId !== user.id) ||
          (walletOwnerId && walletOwnerId !== user.id)
        ) {
          useWalletStore.getState().invalidate();
        }
        set({ token, user, sessionRevoked: false });
      },
      setPreferredPlatform: (platform) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, preferredPlatform: platform }
            : null,
        })),
      logout: async () => {
        const accessToken = get().token;
        useWalletStore.getState().invalidate();
        set({ sessionRevoked: true, token: null, user: null });
        try {
          await authLogout(accessToken);
        } catch {
          // local session already cleared; cookie clear is best-effort
        }
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
        if (get().sessionRevoked) {
          return false;
        }

        const { token, user } = get();
        if (!token || !user) {
          return false;
        }

        const refreshed = await refreshWithRetries();
        if (refreshed.ok) {
          const prevUserId = get().user?.id;
          if (prevUserId && prevUserId !== refreshed.user.id) {
            useWalletStore.getState().invalidate();
          }
          set({ token: refreshed.accessToken, user: refreshed.user });
          return true;
        }

        useWalletStore.getState().invalidate();
        set({ token: null, user: null });
        return false;
      },
      restoreFromCookie: async () => {
        if (get().sessionRevoked) {
          return false;
        }

        const { token, user } = get();
        if (token && user) {
          return get().restoreSession();
        }

        const refreshed = await refreshWithRetries();
        if (!refreshed.ok) {
          return false;
        }

        useWalletStore.getState().invalidate();
        set({ token: refreshed.accessToken, user: refreshed.user });
        return true;
      },
    }),
    {
      name: "vsms-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        sessionRevoked: state.sessionRevoked,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
