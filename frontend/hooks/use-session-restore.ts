"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Waits for persisted auth before rendering guest-only UI (login/register).
 * Only calls refresh when localStorage already has a session.
 */
export function useSessionRestore(): {
  ready: boolean;
  hydrated: boolean;
  token: string | null;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  isAuthenticated: boolean;
} {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const state = useAuthStore.getState();
      // Guests with no saved session: skip refresh API (avoids 401 console noise).
      if (!state.sessionRevoked && state.token && state.user) {
        await useAuthStore.getState().restoreSession();
      }
      setReady(true);
    })();
  }, [hydrated]);

  return {
    ready,
    hydrated,
    token,
    user,
    isAuthenticated: Boolean(token && user),
  };
}
