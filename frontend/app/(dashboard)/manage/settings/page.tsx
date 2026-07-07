"use client";

import { useEffect, useState, type FormEvent } from "react";
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
type ServiceTariffs = {
  facebook: number;
  amazon: number;
  whatsapp: number;
  whatsappFivesim: number;
  whatsappTelnyx: number;
  others: number;
};

type WhatsAppProviderBalances = {
  smsBower: number | null;
  fiveSim: number | null;
  telnyx: number | null;
  updatedAt: string;
};

const TARIFF_DEFAULTS: ServiceTariffs = {
  facebook: 30,
  amazon: 60,
  whatsapp: 60,
  whatsappFivesim: 75,
  whatsappTelnyx: 60,
  others: 60,
};

export default function AdminSettingsPage() {
  const { token, user } = useAuthStore();
  const [step, setStep] = useState<Step>("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tariffs, setTariffs] = useState<ServiceTariffs>(TARIFF_DEFAULTS);
  const [tariffInputs, setTariffInputs] = useState<Record<keyof ServiceTariffs, string>>({
    facebook: "30",
    amazon: "60",
    whatsapp: "60",
    whatsappFivesim: "75",
    whatsappTelnyx: "60",
    others: "60",
  });
  const [loadingTariffs, setLoadingTariffs] = useState(false);
  const [savingTariffs, setSavingTariffs] = useState(false);
  const { data: providerBalances, mutate: refreshProviderBalances } =
    useApi<WhatsAppProviderBalances>("/api/manage/whatsapp-provider-balances", {
      cacheTtlMs: 30_000,
      disableDedupe: true,
    });

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoadingTariffs(true);
    void apiFetch<ServiceTariffs>("/api/manage/service-tariffs", {
      accessToken: token,
      disableDedupe: true,
      cacheTtlMs: 0,
    })
      .then((res) => {
        if (!mounted || !res.success) {
          if (mounted && !res.success) {
            toast.error(res.error);
          }
          return;
        }
        const nextTariffs: ServiceTariffs = {
          facebook: Number(res.data.facebook),
          amazon: Number(res.data.amazon),
          whatsapp: Number(res.data.whatsapp),
          whatsappFivesim: Number(res.data.whatsappFivesim),
          whatsappTelnyx: Number(res.data.whatsappTelnyx),
          others: Number(res.data.others),
        };
        setTariffs(nextTariffs);
        setTariffInputs({
          facebook: String(nextTariffs.facebook),
          amazon: String(nextTariffs.amazon),
          whatsapp: String(nextTariffs.whatsapp),
          whatsappFivesim: String(nextTariffs.whatsappFivesim),
          whatsappTelnyx: String(nextTariffs.whatsappTelnyx),
          others: String(nextTariffs.others),
        });
      })
      .finally(() => {
        if (mounted) {
          setLoadingTariffs(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  function updateTariffInput(key: keyof ServiceTariffs, value: string): void {
    setTariffInputs((prev) => ({
      ...prev,
      [key]: value.replace(/[^\d]/g, ""),
    }));
  }

  async function handleSaveTariffs(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!token) return;

    const payload: ServiceTariffs = {
      facebook: Number(tariffInputs.facebook),
      amazon: Number(tariffInputs.amazon),
      whatsapp: Number(tariffInputs.whatsapp),
      whatsappFivesim: Number(tariffInputs.whatsappFivesim),
      whatsappTelnyx: Number(tariffInputs.whatsappTelnyx),
      others: Number(tariffInputs.others),
    };

    const invalid = Object.entries(payload).find(([, amount]) => !Number.isInteger(amount) || amount < 0 || amount > 500000);
    if (invalid) {
      toast.error("Each price must be an integer between 0 and 500000.");
      return;
    }

    setSavingTariffs(true);
    const res = await apiFetch<ServiceTariffs>("/api/manage/service-tariffs", {
      method: "PATCH",
      accessToken: token,
      body: JSON.stringify(payload),
    });
    setSavingTariffs(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    const saved = {
      facebook: Number(res.data.facebook),
      amazon: Number(res.data.amazon),
      whatsapp: Number(res.data.whatsapp),
      whatsappFivesim: Number(res.data.whatsappFivesim),
      whatsappTelnyx: Number(res.data.whatsappTelnyx),
      others: Number(res.data.others),
    };
    setTariffs(saved);
    setTariffInputs({
      facebook: String(saved.facebook),
      amazon: String(saved.amazon),
      whatsapp: String(saved.whatsapp),
      whatsappFivesim: String(saved.whatsappFivesim),
      whatsappTelnyx: String(saved.whatsappTelnyx),
      others: String(saved.others),
    });
    toast.success("OTP service prices updated.");
  }

  async function handleSendOtp(): Promise<void> {
    if (!token) return;
    setSendingOtp(true);
    const res = await apiFetch<void>("/api/manage/change-password/request-otp", {
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
    const res = await apiFetch<void>("/api/manage/change-password/confirm", {
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
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-8">
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

      <Card>
        <CardHeader>
          <CardTitle>OTP service pricing</CardTitle>
          <CardDescription>
            Set per-platform OTP charges. User wallet deduction uses these values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSaveTariffs(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price-facebook">Facebook (Rs)</Label>
                <Input
                  id="price-facebook"
                  inputMode="numeric"
                  value={tariffInputs.facebook}
                  onChange={(ev) => updateTariffInput("facebook", ev.target.value)}
                  disabled={loadingTariffs || savingTariffs}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-amazon">Amazon (Rs)</Label>
                <Input
                  id="price-amazon"
                  inputMode="numeric"
                  value={tariffInputs.amazon}
                  onChange={(ev) => updateTariffInput("amazon", ev.target.value)}
                  disabled={loadingTariffs || savingTariffs}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-whatsapp">WhatsApp (Rs)</Label>
                <Input
                  id="price-whatsapp"
                  inputMode="numeric"
                  value={tariffInputs.whatsapp}
                  onChange={(ev) => updateTariffInput("whatsapp", ev.target.value)}
                  disabled={loadingTariffs || savingTariffs}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-whatsapp-fivesim">WhatsApp 5SIM (Rs)</Label>
                <Input
                  id="price-whatsapp-fivesim"
                  inputMode="numeric"
                  value={tariffInputs.whatsappFivesim}
                  onChange={(ev) => updateTariffInput("whatsappFivesim", ev.target.value)}
                  disabled={loadingTariffs || savingTariffs}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-whatsapp-telnyx">WhatsApp Telnyx (Rs)</Label>
                <Input
                  id="price-whatsapp-telnyx"
                  inputMode="numeric"
                  value={tariffInputs.whatsappTelnyx}
                  onChange={(ev) => updateTariffInput("whatsappTelnyx", ev.target.value)}
                  disabled={loadingTariffs || savingTariffs}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-others">Others/Default (Rs)</Label>
                <Input
                  id="price-others"
                  inputMode="numeric"
                  value={tariffInputs.others}
                  onChange={(ev) => updateTariffInput("others", ev.target.value)}
                  disabled={loadingTariffs || savingTariffs}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Live tariffs: FB Rs {tariffs.facebook}, Amazon Rs {tariffs.amazon}, WhatsApp Rs {tariffs.whatsapp}, WhatsApp 5SIM Rs {tariffs.whatsappFivesim}, WhatsApp Telnyx Rs {tariffs.whatsappTelnyx}, Others Rs {tariffs.others}
              </p>
              <Button type="submit" disabled={loadingTariffs || savingTariffs}>
                {savingTariffs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving prices…
                  </>
                ) : (
                  "Save OTP prices"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp provider balances</CardTitle>
          <CardDescription>
            Live balance visibility for SMS Bower, 5SIM, and Telnyx fallback routing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">SMS Bower</p>
              <p className="mt-1 text-lg font-semibold">
                {providerBalances?.smsBower == null ? "N/A" : providerBalances.smsBower}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">5SIM</p>
              <p className="mt-1 text-lg font-semibold">
                {providerBalances?.fiveSim == null ? "N/A" : providerBalances.fiveSim}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Telnyx</p>
              <p className="mt-1 text-lg font-semibold">
                {providerBalances?.telnyx == null ? "N/A" : providerBalances.telnyx}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Updated:{" "}
              {providerBalances?.updatedAt
                ? new Date(providerBalances.updatedAt).toLocaleString()
                : "—"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshProviderBalances(undefined, { revalidate: true })}
            >
              Refresh balances
            </Button>
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
