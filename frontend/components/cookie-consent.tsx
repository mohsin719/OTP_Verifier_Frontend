"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "cookie_consent";

export function CookieConsent(): React.ReactElement | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Small delay so it doesn't flash on first render
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable (SSR / privacy mode) — hide banner
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch { /* ignore */ }
    setVisible(false);
  }

  function reject() {
    try {
      localStorage.setItem(CONSENT_KEY, "rejected");
    } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="mx-auto max-w-5xl px-4 pb-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4">
          {/* Icon */}
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-blue-50 p-2.5">
            <Cookie className="h-5 w-5 text-blue-600" />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              We use cookies to keep you signed in
            </p>
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
              We use essential cookies to remember your login session and
              preferences. No tracking or advertising — just what&apos;s needed to
              keep the site working smoothly.{" "}
              <Link
                href="/cookies"
                className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
              >
                Learn more
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              id="cookie-reject-btn"
              type="button"
              onClick={reject}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
            >
              Reject
            </button>
            <button
              id="cookie-accept-btn"
              type="button"
              onClick={accept}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 cursor-pointer"
            >
              Accept
            </button>
            <button
              id="cookie-dismiss-btn"
              type="button"
              onClick={reject}
              aria-label="Dismiss"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
