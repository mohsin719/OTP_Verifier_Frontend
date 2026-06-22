"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

const REFRESH_INTERVAL_MS = 4 * 60 * 1000;

/**
 * Keeps the user signed in via httpOnly refresh cookie + proactive token refresh.
 * Only explicit logout should clear the session.
 */
export function SessionKeeper(): null {
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    void useAuthStore.getState().restoreSession();
  }, [hydrated]);

  useEffect(() => {
    const runSync = () => {
      void useAuthStore.getState().restoreSession();
    };

    const syncSession = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(runSync, { timeout: 2500 });
        return;
      }
      window.setTimeout(runSync, 0);
    };

    const intervalId = window.setInterval(syncSession, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        syncSession();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []); // keep cookie/local session alive even when tab was closed

  return null;
}
