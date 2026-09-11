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
import { useAuthStore } from "@/stores/auth-store";
import { GuestOnly } from "@/components/auth/guest-only";
import { Check, AlertCircle } from "lucide-react";

interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

function getPasswordRules(value: string): PasswordRule[] {
  return [
    { id: "length", label: "At least 8 characters", met: value.length >= 8 },
    { id: "upper", label: "Starts with an uppercase letter (A-Z)", met: /^[A-Z]/.test(value) },
    { id: "lower", label: "Contains at least one lowercase letter (a-z)", met: /[a-z]/.test(value) },
    { id: "number", label: "Contains at least one digit (0-9)", met: /[0-9]/.test(value) },
    { id: "special", label: "Contains at least one special character (!@#$...)", met: /[^A-Za-z0-9]/.test(value) },
  ];
}

function getPasswordStrength(rules: PasswordRule[]): {
  score: number;
  label: string;
  color: string;
  barColor: string;
} {
  const metCount = rules.filter((r) => r.met).length;
  if (metCount === 0) {
    return { score: 0, label: "", color: "text-muted-foreground", barColor: "bg-slate-200 dark:bg-slate-700" };
  }
  if (metCount <= 2) {
    return { score: 1, label: "Weak", color: "text-rose-600 dark:text-rose-400", barColor: "bg-rose-500" };
  }
  if (metCount <= 3) {
    return { score: 2, label: "Fair", color: "text-amber-600 dark:text-amber-400", barColor: "bg-amber-500" };
  }
  if (metCount === 4) {
    return { score: 3, label: "Good", color: "text-blue-600 dark:text-blue-400", barColor: "bg-blue-500" };
  }
  return { score: 4, label: "Strong", color: "text-emerald-600 dark:text-emerald-400", barColor: "bg-emerald-500" };
}

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const rules = getPasswordRules(password);
  const strength = getPasswordStrength(rules);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please ensure both password fields match.", {
        duration: 5000,
      });
      return;
    }

    if (!isValidPasswordFormat(password)) {
      toast.error("Password must start with an uppercase letter, be at least 8 characters, and include a lowercase letter, a digit, and a special character.", {
        duration: 6000,
      });
      return;
    }

    setPending(true);
    const result = await authRegister({
      username,
      email,
      password,
      preferredPlatform: "Facebook",
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
      const err = result.error || "";
      if (err.toLowerCase().includes("expire") || err.toLowerCase().includes("invalid")) {
        toast.error("Verification code has expired or is invalid. Please register again to get a fresh code.", {
          duration: 7000,
        });
      } else {
        toast.error(err || "Verification failed. Please try again.");
      }
      return;
    }
    setAuth(result.data.accessToken, result.data.user);
    toast.success("Email verified successfully!");
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
    router.push(destination);
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

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Strength:</span>
                      <span className={`font-bold ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>

                    {/* Visual 4-bar meter */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strength.score >= step
                              ? strength.barColor
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-1 gap-1 pt-1.5 text-xs text-muted-foreground">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-1.5 transition-colors ${
                            rule.met
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {rule.met ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1 shrink-0" />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {password.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters, start with an uppercase letter, and include at least one lowercase letter, one digit, and one special character.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(ev) => setConfirmPassword(ev.target.value)}
                  required
                />
                {passwordsMatch && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Passwords match</span>
                  </p>
                )}
                {passwordsMismatch && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Passwords do not match</span>
                  </p>
                )}
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
