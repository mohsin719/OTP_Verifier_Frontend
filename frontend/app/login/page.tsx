"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { authLogin } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GuestOnly } from "@/components/auth/guest-only";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setPending(true);
    const result = await authLogin({ email, password });
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setAuth(result.data.accessToken, result.data.user);
    toast.success("Welcome back.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <GuestOnly>
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your dashboard and leased numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  prefetch={false}
                  className="text-xs text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" prefetch={false} className="text-primary underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
    </GuestOnly>
  );
}
