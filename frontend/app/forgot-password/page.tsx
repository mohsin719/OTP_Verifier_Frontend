"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
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
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setPending(true);
    const res = await apiFetch<void>("/api/auth/forgot-password/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setPending(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setSent(true);
    toast.success("If that email is registered, a code has been sent. Check your inbox or spam folder.");

    // Store email in sessionStorage for the verify page
    sessionStorage.setItem("pwd_reset_email", email);

    setTimeout(() => {
      router.push("/forgot-password/verify");
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your registered email address and we&apos;ll send you a
            6-digit verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                <Mail className="h-7 w-7 text-green-500" />
              </div>
              <p className="font-medium">Code sent!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to verification…
              </p>
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
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  "Send verification code"
                )}
              </Button>
            </form>
          )}
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
