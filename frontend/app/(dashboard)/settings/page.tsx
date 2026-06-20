"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { AvatarPickerDialog } from "@/components/dashboard/avatar-picker-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { apiFetch } from "@/lib/api";
import { resolveAvatarId } from "@/lib/profile-avatars";
import { toast } from "sonner";
import {
  Camera,
  Fingerprint,
  Loader2,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";

type Step = "idle" | "otp-sent" | "done";

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-0.5 truncate text-sm font-semibold sm:text-base ${mono ? "font-mono" : ""}`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { token, logout } = useAuthStore();
  const storedAvatarId = useProfileStore((s) =>
    user ? (s.avatarByUserId[user.id] ?? null) : null,
  );
  const setAvatarForUser = useProfileStore((s) => s.setAvatarForUser);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const resolvedAvatarId = user
    ? resolveAvatarId(storedAvatarId, user.id)
    : "aria";

  function handleAvatarConfirm(nextAvatarId: string): void {
    if (!user) return;
    setAvatarForUser(user.id, nextAvatarId);
    toast.success("Profile avatar updated.");
  }

  function handleLogout(): void {
    void (async () => {
      await logout();
      router.replace("/login");
    })();
  }

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
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Account identifiers used for support and WhatsApp top-ups.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Password changed!</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your password has been successfully updated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Update your avatar, account details, and security settings.
        </p>
      </div>

      <Card className="overflow-hidden border-border/80">
        <div className="h-24 bg-linear-to-r from-primary/20 via-primary/10 to-transparent sm:h-28" />
        <CardContent className="relative -mt-14 space-y-5 pb-8 sm:-mt-16">
          {user ? (
            <>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <button
                    type="button"
                    onClick={() => setAvatarDialogOpen(true)}
                    className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Change profile picture"
                  >
                    <UserAvatar
                      userId={user.id}
                      username={user.username}
                      publicId={user.publicId}
                      className="h-24 w-24 border-4 border-background shadow-lg sm:h-28 sm:w-28"
                    />
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-7 w-7 text-white" />
                    </span>
                  </button>
                  <div className="min-w-0 pb-1">
                    <p className="truncate text-xl font-bold sm:text-2xl">
                      {user.username || user.publicId}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {user.publicId}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2 self-start sm:self-auto"
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                  Change avatar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click your photo to pick a unique illustrated avatar for your
                account.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <AvatarPickerDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        selectedId={resolvedAvatarId}
        onConfirm={handleAvatarConfirm}
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Account details</CardTitle>
        </CardHeader>
        <CardContent className="grid w-full min-w-0 gap-3 sm:grid-cols-2">
          <DetailRow
            icon={Fingerprint}
            label="Public User ID"
            value={user?.publicId}
            mono
          />
          <DetailRow icon={User} label="Username" value={user?.username} />
          <DetailRow icon={Mail} label="Email" value={user?.email} />
          <DetailRow icon={Shield} label="Role" value={user?.role} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Security</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "idle" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We&apos;ll email a verification code to confirm any password
                change.
              </p>
              <Button
                onClick={() => void handleSendOtp()}
                className="w-full sm:w-auto"
                disabled={sendingOtp}
              >
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-lg tracking-widest ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("idle")}
                  disabled={confirming}
                >
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

      <Card className="border-destructive/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Sign out from this device. You can log in again anytime.
          </p>
          <Button
            variant="outline"
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
