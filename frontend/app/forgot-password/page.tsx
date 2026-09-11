"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    setPending(true);
    try {
      // 1. Verify if the email is already registered in the system
      const checkRes = await apiFetch<{ exists: boolean }>("/api/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!checkRes.success || !checkRes.data?.exists) {
        toast.error("This email is not registered in our system. Please register first.");
        setPending(false);
        return;
      }

      // 2. If registered, proceed to send the Supabase recovery email
      const origin = typeof window !== "undefined" ? window.location.origin : "https://www.usnumhub.com";
      const callbackUrl = `${origin}/auth/callback?type=recovery`;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: callbackUrl,
      });

      if (error) {
        toast.error(error.message || "Failed to send reset email.");
        return;
      }

      setSent(true);
      toast.success("Password recovery link sent! Check your inbox.");
    } catch {
      toast.error("An error occurred while sending reset email.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4 bg-slate-50">
      <Card className="w-full max-w-md border-slate-200/90 shadow-md">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-200">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your registered email address and we&apos;ll send you a password recovery link via Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Recovery Link Sent!</p>
                <p className="text-sm text-slate-600 mt-1">
                  We sent a confirmation email to <strong className="text-slate-900">{email}</strong>.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Please check your inbox or spam folder and click the link to set your new password.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setSent(false)}
              >
                Send to another email
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Recovery Link…
                  </>
                ) : (
                  "Send Recovery Link"
                )}
              </Button>
            </form>
          )}
          <p className="mt-4 flex items-center justify-center gap-1 text-center text-sm text-slate-500">
            <ArrowLeft className="h-3.5 w-3.5" />
            <Link href="/login" prefetch={false} className="text-blue-600 font-semibold hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

