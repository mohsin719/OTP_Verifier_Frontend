"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, CheckCircle2, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyRecoverySession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !data?.session?.user) {
          // If no active session, wait 1 second and retry once in case auth state is hydrating
          setTimeout(async () => {
            if (!mounted) return;
            const retry = await supabase.auth.getSession();
            if (retry.data?.session?.user?.email) {
              setEmail(retry.data.session.user.email);
            }
            setCheckingSession(false);
          }, 1000);
          return;
        }

        setEmail(data.session.user.email ?? null);
        setCheckingSession(false);
      } catch {
        if (mounted) setCheckingSession(false);
      }
    }

    void verifyRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      // 1. Update password in Supabase Auth
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(updateError.message || "Failed to update password in Supabase.");
        setPending(false);
        return;
      }

      // 2. Sync updated password hash with PostgreSQL backend database
      const userEmail = email || updateData?.user?.email;
      if (userEmail) {
        await apiFetch<{ success: boolean }>("/api/auth/reset-password/supabase", {
          method: "POST",
          body: JSON.stringify({
            email: userEmail,
            newPassword,
          }),
        });
      }

      setDone(true);
      toast.success("Password reset successfully! You can now log in.");
    } catch {
      toast.error("An error occurred while resetting password.");
    } finally {
      setPending(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Verifying reset authorization…</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4 bg-slate-50">
        <Card className="w-full max-w-md border-slate-200/90 shadow-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
              <AlertCircle className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Reset Link Expired or Invalid</h2>
              <p className="mt-2 text-sm text-slate-600">
                This password reset link is invalid, expired, or has already been used. Please request a fresh recovery email.
              </p>
            </div>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 font-bold mt-2">
              <Link href="/forgot-password">Request New Recovery Link</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4 bg-slate-50">
      <Card className="w-full max-w-md border-slate-200/90 shadow-md">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-200">
            <KeyRound className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold">Set New Password</CardTitle>
          <CardDescription>
            {email ? (
              <span>
                Resetting password for <strong className="text-slate-900">{email}</strong>
              </span>
            ) : (
              "Choose and confirm your new secure password."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Password Changed!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Your new password is now active for both regular and Google sign-in.
                </p>
              </div>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 font-bold gap-2 mt-2">
                <Link href="/login">
                  <span>Sign In Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-new-password">New Password</Label>
                <PasswordInput
                  id="reset-new-password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                <PasswordInput
                  id="reset-confirm-password"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving New Password…
                  </>
                ) : (
                  "Save New Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
