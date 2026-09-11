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
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          toast.error("Google authentication failed. Please try again.");
          router.push("/login");
          return;
        }

        const sessionUser = data.session.user;
        const email = sessionUser.email;
        if (!email) {
          toast.error("Email not provided by Google account.");
          router.push("/login");
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
          router.push("/login");
          return;
        }

        setAuth(result.data.accessToken, result.data.user);
        const isRoleAdmin = result.data.user?.role === "ADMIN";
        toast.success(
          isRoleAdmin
            ? "Welcome Admin! Redirecting to admin panel..."
            : "Welcome! Logged in with Google."
        );
        router.push(isRoleAdmin ? "/manage" : "/dashboard");
        router.refresh();
      } catch {
        toast.error("An error occurred during authentication.");
        router.push("/login");
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
