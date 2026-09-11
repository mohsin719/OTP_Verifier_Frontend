"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { authGoogleSync } from "@/lib/api";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const syncExecutedRef = useRef(false);

  useEffect(() => {
    async function handleAuthCallback() {
      if (syncExecutedRef.current) return;
      syncExecutedRef.current = true;

      try {
        const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
        const code = url?.searchParams.get("code");
        const type = url?.searchParams.get("type");
        const errorParam = url?.searchParams.get("error");
        const errorDescription = url?.searchParams.get("error_description");

        if (errorParam || errorDescription) {
          toast.error(errorDescription || errorParam || "Authentication error occurred.");
          router.replace("/login");
          return;
        }

        let sessionUser = null;

        // 1. If PKCE code is in URL, exchange it for session
        if (code) {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Supabase code exchange error:", exchangeError);
          } else if (exchangeData?.session) {
            sessionUser = exchangeData.session.user;
          }
        }

        // 2. Fallback to getSession() (for implicit/hash or already exchanged session)
        if (!sessionUser) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && sessionData?.session) {
            sessionUser = sessionData.session.user;
          }
        }

        if (!sessionUser) {
          toast.error("Google authentication failed or expired. Please try again.");
          router.replace("/login");
          return;
        }

        // If this callback was triggered from a password reset email:
        if (type === "recovery") {
          toast.success("Identity verified. Please set your new password.");
          router.replace("/reset-password");
          return;
        }

        const email = sessionUser.email;
        if (!email) {
          toast.error("Email not provided by Google account.");
          router.replace("/login");
          return;
        }

        const username =
          sessionUser.user_metadata?.full_name ||
          sessionUser.user_metadata?.name ||
          email.split("@")[0];

        // Sync user with backend NestJS database & generate backend JWT + refresh cookie
        const result = await authGoogleSync({ email, username });
        if (!result.success) {
          toast.error(result.error || "Failed to initialize backend session.");
          router.replace("/login");
          return;
        }

        setAuth(result.data.accessToken, result.data.user);
        const isRoleAdmin = result.data.user?.role === "ADMIN";
        const storedRedirect =
          typeof window !== "undefined"
            ? sessionStorage.getItem("auth_redirect")
            : null;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("auth_redirect");
        }
        const destination = isRoleAdmin
          ? "/manage"
          : (storedRedirect && storedRedirect.startsWith("/") ? storedRedirect : "/dashboard");

        toast.success(
          isRoleAdmin
            ? "Welcome Admin! Redirecting to admin panel..."
            : "Welcome! Logged in with Google."
        );
        router.push(destination);
        router.refresh();
      } catch (err) {
        console.error("Auth callback exception:", err);
        toast.error("An error occurred during authentication.");
        router.replace("/login");
      }
    }

    void handleAuthCallback();
  }, [router, setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm font-semibold text-slate-600">
        Completing Google sign in…
      </p>
    </div>
  );
}
