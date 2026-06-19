"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/auth-types";
import { toast } from "sonner";
import { authRefresh } from "@/lib/api";

export type { AuthUser };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setHydrated: (value: boolean) => void;
};

if (typeof window !== "undefined") {
  // Clean up any legacy localStorage keys to prevent session carryover
  const legacyKeys = ["vsms-auth", "vsms-auth-user", "vsms-auth-admin", "accessToken"];
  for (const legacyKey of legacyKeys) {
    localStorage.removeItem(legacyKey);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setHydrated: (value) => set({ hydrated: value }),
      refreshToken: async () => {
        try {
          const result = await authRefresh();
          if (result.success && result.data) {
            set({ token: result.data.accessToken, user: result.data.user });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Token refresh failed:", error);
          return false;
        }
      },
    }),
    {
      name: "vsms-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);



// Global 401 handler - silent logout with user-friendly toast

if (typeof window !== "undefined") {
  let isHandlingUnauthorized = false;
  window.addEventListener("vsms:auth-unauthorized", async () => {
    if (isHandlingUnauthorized) return;
    isHandlingUnauthorized = true;
    const { logout, refreshToken } = useAuthStore.getState();
    // Try to refresh token first
    const refreshed = await refreshToken();
    if (!refreshed) {
      logout();
      toast.info("Session expired. Please login again.");
    }
    setTimeout(() => { isHandlingUnauthorized = false; }, 3000);
  });

}

