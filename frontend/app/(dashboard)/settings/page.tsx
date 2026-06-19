"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck } from "lucide-react";

type Step = "idle" | "otp-sent" | "done";

export default function SettingsPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { token } = useAuthStore();
  const [step, setStep] = useState<Step>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSendOtp(): Promise<void> {
    if (!token) return;
    setSendingOtp(true);
    const res = await apiFetch<void>("/api/auth/change-password/request-otp", {
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
    const res = await apiFetch<void>("/api/auth/change-password/confirm", {
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

  if (step === "done") {
    return (
      <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Account identifiers used for support and WhatsApp top-ups.
          </p>
        </div>
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold">Password changed!</h2>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully updated.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Account identifiers used for support and WhatsApp top-ups.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm sm:text-base">
          <div>
            <p className="text-muted-foreground">Public User ID</p>
            <p className="font-mono text-base sm:text-lg font-medium">{user?.publicId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Username</p>
            <p>{user?.username}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p>{user?.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p>{user?.role}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "idle" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to send a verification code to your email. You&apos;ll use this code to confirm your password change.
              </p>
              <Button onClick={() => void handleSendOtp()} className="w-full sm:w-auto" disabled={sendingOtp}>
                {sendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send verification code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void onConfirm(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, ""))}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-lg tracking-widest"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("idle")} disabled={confirming}>
                  Back
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
