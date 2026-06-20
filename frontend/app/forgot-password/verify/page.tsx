"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

const RESEND_COOLDOWN_SEC = 60;

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pwd_reset_email");
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(stored);
  }, [router]);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SEC);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleResend(): Promise<void> {
    if (!email || cooldown > 0) return;
    setResendPending(true);
    const res = await apiFetch<void>("/api/auth/forgot-password/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setResendPending(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success("A new code has been sent. Check your inbox or spam folder.");
    startCooldown();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setPending(true);
    const res = await apiFetch<void>("/api/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
    setPending(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setDone(true);
    sessionStorage.removeItem("pwd_reset_email");
    toast.success("Password changed successfully! Please log in.");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  if (done) {
    return (
      <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4">
        <Card className="w-full max-w-md border-border/80">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold">Password changed!</h2>
              <p className="text-sm text-muted-foreground">
                Redirecting to login…
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Verify & reset password</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span> and
            your new password. You have 5 attempts before needing a new code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">Verification code</Label>
                <button
                  type="button"
                  id="resend-otp-btn"
                  onClick={() => void handleResend()}
                  disabled={resendPending || cooldown > 0}
                  className="flex items-center gap-1 text-xs text-primary underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, ""))}
                required
                className="font-mono text-lg tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password…
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
          <p className="mt-4 flex items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <ArrowLeft className="h-3 w-3" />
            <Link href="/login" prefetch={false} className="text-primary underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
