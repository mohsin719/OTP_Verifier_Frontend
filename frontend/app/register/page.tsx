"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { authRegister, authVerifySignup } from "@/lib/api";
import { PLATFORM_OPTIONS } from "@/lib/platforms";
import { useAuthStore } from "@/stores/auth-store";
import { GuestOnly } from "@/components/auth/guest-only";

function isValidPasswordFormat(value: string): boolean {
  if (value.length < 8) return false;
  if (!/^[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredPlatform, setPreferredPlatform] = useState("");
  const [pending, setPending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const platformOptions = [...PLATFORM_OPTIONS];

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (!isValidPasswordFormat(password)) {
      toast.error("Invalid password format. Please check the requirements and try again.");
      return;
    }

    if (!preferredPlatform) {
      toast.error("Please select an OTP platform.");
      return;
    }

    setPending(true);
    const result = await authRegister({
      username,
      email,
      password,
      preferredPlatform,
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setOtpSent(true);
    toast.success("Account created. Check your email for the verification code.");
  }

  async function onVerifyOtp(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setPending(true);
    const result = await authVerifySignup({ email, otp });
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setAuth(result.data.accessToken, result.data.user);
    toast.success("Email verified successfully!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <GuestOnly>
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden p-4">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle>{otpSent ? "Verify your email" : "Create account"}</CardTitle>
          <CardDescription>
            {otpSent
              ? "Enter the 6-digit code sent to your email."
              : "You will receive a unique User ID (e.g. USR-10293)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(ev) => setUsername(ev.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters, start with an uppercase letter, and include at least one lowercase letter, one digit, and one special character.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Select OTP Platform (Required)</Label>
                <select
                  id="platform"
                  value={preferredPlatform}
                  onChange={(ev) => setPreferredPlatform(ev.target.value)}
                  required
                  className={`flex h-10 w-full rounded-lg border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 ${
                    preferredPlatform ? "" : "text-muted-foreground"
                  }`}
                >
                  <option value="" disabled>
                    Select platform
                  </option>
                  {platformOptions.map((platform) => (
                    <option
                      key={platform}
                      value={platform}
                      className="bg-background text-foreground"
                    >
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Creating…" : "Register"}
              </Button>
            </form>
          ) : (
            <form onSubmit={(e) => void onVerifyOtp(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(ev) => setOtp(ev.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Verifying…" : "Verify"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setOtpSent(false)}
                disabled={pending}
              >
                Back to register
              </Button>
            </form>
          )}
          {!otpSent && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" prefetch={false} className="text-primary underline">
                Sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
    </GuestOnly>
  );
}
