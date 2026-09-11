"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { authLogin } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GuestOnly } from "@/components/auth/guest-only";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const submitLockRef = useRef(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (submitLockRef.current || pending) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    submitLockRef.current = true;
    setPending(true);
    try {
      const result = await authLogin({ email: normalizedEmail, password });
      if (!result.success) {
        const err = result.error || "";
        if (err.toLowerCase().includes("confirm") || err.toLowerCase().includes("verif")) {
          toast.error("Account not confirmed. Please open your email and click the confirmation link/code.", {
            duration: 7000,
          });
        } else {
          toast.error(err || "Login failed. Please check your credentials.");
        }
        return;
      }
      setAuth(result.data.accessToken, result.data.user);
      const isRoleAdmin = result.data.user?.role === "ADMIN";
      const searchRedirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      const storedRedirect =
        typeof window !== "undefined"
          ? sessionStorage.getItem("auth_redirect")
          : null;
      const targetRedirect = searchRedirect || storedRedirect;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("auth_redirect");
      }
      const destination = isRoleAdmin
        ? "/manage"
        : (targetRedirect && targetRedirect.startsWith("/") ? targetRedirect : "/dashboard");

      toast.success(
        isRoleAdmin
          ? "Welcome Admin! Redirecting to admin panel..."
          : "Welcome back! Redirecting..."
      );
      router.push(destination);
      router.refresh();
    } finally {
      setPending(false);
      submitLockRef.current = false;
    }
  }

  async function handleGoogleSignIn(): Promise<void> {
    setGooglePending(true);
    try {
      const searchRedirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      if (searchRedirect && typeof window !== "undefined") {
        sessionStorage.setItem("auth_redirect", searchRedirect);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message || "Failed to initiate Google sign in.");
      }
    } catch {
      toast.error("Google authentication error.");
    } finally {
      setGooglePending(false);
    }
  }

  return (
    <GuestOnly>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100/80 px-4 py-10 sm:px-6">
        {/* Main Form Card */}
        <div className="w-full max-w-md mx-auto">
          {/* Brand Logo Centered Above Card */}
          <div className="flex justify-center mb-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03]"
            >
              <Image
                src="/brand/logo.png"
                alt="US Num Hub"
                width={42}
                height={42}
                priority
                className="h-10 w-auto object-contain drop-shadow-sm"
              />
              <span className="flex items-center gap-1 font-extrabold text-xl tracking-tight text-slate-900">
                <span className="text-blue-600">US</span>
                <span>Num</span>
                <span className="ml-0.5 rounded-md bg-gradient-to-r from-red-500 to-rose-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                  HUB
                </span>
              </span>
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/40 space-y-6">
            {/* Greeting Header */}
            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sign in to manage your numbers and view incoming messages.
              </p>
            </div>

            {/* Social / Google Sign-in */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={googlePending || pending}
                className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {googlePending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Or continue with email
                </div>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-600 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    prefetch={false}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-600 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={pending || googlePending}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] text-sm cursor-pointer mt-2"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in…</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer / Switcher */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  prefetch={false}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Create Free Account →
                </Link>
              </p>
            </div>
          </div>

          {/* Security Guarantee & Policy Links */}
          <div className="mt-5 space-y-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>256-Bit SSL Encrypted · Private Virtual Numbers</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-400">
              <Link href="/policies" className="hover:text-slate-600 transition-colors">
                Terms of Service
              </Link>
              <span>·</span>
              <Link href="/policies" className="hover:text-slate-600 transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link href="/faq" className="hover:text-slate-600 transition-colors">
                Support &amp; FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </GuestOnly>
  );
}
