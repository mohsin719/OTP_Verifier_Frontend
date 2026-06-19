"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
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
import { useAuthStore } from "@/stores/auth-store";

type Step = "idle" | "otp-sent" | "done";

export default function AdminSettingsPage() {
  const { token, user } = useAuthStore();
  const [step, setStep] = useState<Step>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSendOtp(): Promise<void> {
    if (!token) return;
    setSendingOtp(true);
    const res = await apiFetch<void>("/api/admin/change-password/request-otp", {
      method: "POST",
      accessToken: token,
    });
    setSendingOtp(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setStep("otp-sent");
    toast.success(`Verification code sent to ${user?.email ?? "your email"}.`);
  }

  async function onConfirm(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (!token) return;
    setConfirming(true);
    const res = await apiFetch<void>("/api/admin/change-password/confirm", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({ otp, newPassword }),
    });
    setConfirming(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setStep("done");
    toast.success("Password changed successfully!");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage your admin account security settings.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Account information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <span className="text-muted-foreground">Admin ID</span>
            <span className="font-mono font-medium">{user?.publicId}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <span className="text-muted-foreground">Role</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {user?.role}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change password
          </CardTitle>
          <CardDescription>
            For security, a verification code will be sent to your admin email
            before changing your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "done" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold">Password changed successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Your admin password has been updated.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("idle");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Change again
              </Button>
            </div>
          ) : step === "idle" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>
                    A 6-digit code will be sent to{" "}
                    <strong className="text-foreground">{user?.email}</strong>
                  </span>
                </div>
              </div>
              <Button
                id="send-otp-btn"
                onClick={() => void handleSendOtp()}
                disabled={sendingOtp}
                className="w-full"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  "Send verification code to email"
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void onConfirm(e)} className="space-y-4">
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-muted-foreground">
                Code sent to{" "}
                <strong className="text-foreground">{user?.email}</strong>.
                Check your inbox.
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-otp">Verification code</Label>
                <Input
                  id="admin-otp"
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
                <Label htmlFor="admin-new-password">New password</Label>
                <PasswordInput
                  id="admin-new-password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(ev) => setNewPassword(ev.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirm password</Label>
                <PasswordInput
                  id="admin-confirm-password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(ev) => setConfirmPassword(ev.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("idle")}
                  disabled={confirming}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={confirming}>
                  {confirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing password…
                    </>
                  ) : (
                    "Change password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
