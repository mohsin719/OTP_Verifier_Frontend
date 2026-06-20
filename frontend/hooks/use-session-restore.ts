"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Waits for persisted auth + cookie refresh before rendering protected UI.
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
      await useAuthStore.getState().restoreSession();
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
