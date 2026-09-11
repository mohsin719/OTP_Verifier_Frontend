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
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

import {
  getStoredPaymentSettings,
  saveStoredPaymentSettings,
  resetStoredPaymentSettings,
  type StoredPaymentSettings,
} from "@/lib/payment-methods";
import {
  CreditCard,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Save,
  Smartphone,
  Wallet,
} from "lucide-react";
import { SiBinance, SiTether } from "react-icons/si";

export default function AdminSettingsPage() {
  const { token, user } = useAuthStore();

  // Change password state (Old Password + New Password + Confirm Password)
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Payment settings state
  const [paymentConfig, setPaymentConfig] = useState<StoredPaymentSettings>(() => getStoredPaymentSettings());
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  useEffect(() => {
    setPaymentConfig(getStoredPaymentSettings());
  }, []);

  function handleUpdatePaymentField<K extends keyof StoredPaymentSettings>(
    field: K,
    value: StoredPaymentSettings[K]
  ) {
    setPaymentConfig((prev) => ({ ...prev, [field]: value }));
  }

  function handleSavePaymentSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSavingPayment(true);
    try {
      saveStoredPaymentSettings(paymentConfig);
      toast.success("Payment methods & WhatsApp settings saved successfully!");
    } catch {
      toast.error("Failed to save payment settings.");
    } finally {
      setIsSavingPayment(false);
    }
  }

  function handleResetPaymentSettings() {
    if (!window.confirm("Are you sure you want to reset all payment details to system defaults?")) return;
    const defaults = resetStoredPaymentSettings();
    setPaymentConfig(defaults);
    toast.success("Payment methods reset to system defaults.");
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!token) return;

    if (!oldPassword) {
      toast.error("Please enter your current (old) password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password cannot be the same as your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch<void>("/api/auth/change-password", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to change password. Please check your old password.");
        return;
      }

      // Also keep Supabase Auth in sync if session exists
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {
        // Non-blocking
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Admin password changed successfully!");
    } catch {
      toast.error("A network or server error occurred. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage system payment methods, admin account credentials, and platform security.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Account Information
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

      {/* Payment Methods & Deposit Configuration */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/[0.02] to-transparent shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Payment Methods &amp; Deposit Configuration
              </CardTitle>
              <CardDescription>
                Configure the payment receiving accounts and WhatsApp support number shown to users on the Deposit page.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="border-slate-200 gap-1.5 text-slate-700 hover:bg-slate-50">
                <a href="/deposit" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Preview Deposit Page
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePaymentSettings} className="space-y-6">
            {/* 1. Admin WhatsApp Support */}
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Admin Support &amp; Deposit Proof WhatsApp</span>
                </div>
                {paymentConfig.adminWhatsapp && (
                  <a
                    href={`https://wa.me/${paymentConfig.adminWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>Test WhatsApp Link</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-whatsapp" className="text-xs font-semibold text-slate-700">
                  WhatsApp Number (with country code, e.g. +923233371766)
                </Label>
                <Input
                  id="admin-whatsapp"
                  type="text"
                  value={paymentConfig.adminWhatsapp}
                  onChange={(e) => handleUpdatePaymentField("adminWhatsapp", e.target.value)}
                  placeholder="+923233371766"
                  required
                  className="bg-white font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Users clicking &quot;Confirm on WhatsApp&quot; will be redirected directly to this number with pre-filled User ID, amount, and payment details.
                </p>
              </div>
            </div>

            {/* 2. Local PKR Wallets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-slate-900">Local Pakistani Wallets (PKR)</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* JazzCash */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-red-600 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                      JazzCash
                    </span>
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold px-1.5 py-0.5 rounded">
                      Local PKR
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="jazzcash-number" className="text-xs">Account / Mobile Number</Label>
                    <Input
                      id="jazzcash-number"
                      value={paymentConfig.jazzcashNumber}
                      onChange={(e) => handleUpdatePaymentField("jazzcashNumber", e.target.value)}
                      placeholder="03233371766"
                      required
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="jazzcash-title" className="text-xs">Account Title</Label>
                    <Input
                      id="jazzcash-title"
                      value={paymentConfig.jazzcashTitle}
                      onChange={(e) => handleUpdatePaymentField("jazzcashTitle", e.target.value)}
                      placeholder="Account Title"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="jazzcash-min" className="text-xs">Minimum Deposit (PKR)</Label>
                    <Input
                      id="jazzcash-min"
                      type="number"
                      min={100}
                      value={paymentConfig.jazzcashMinPkr}
                      onChange={(e) => handleUpdatePaymentField("jazzcashMinPkr", parseInt(e.target.value) || 500)}
                      placeholder="500"
                      required
                    />
                  </div>
                </div>

                {/* EasyPaisa */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-600 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      EasyPaisa
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded">
                      Local PKR
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="easypaisa-number" className="text-xs">Account / Mobile Number</Label>
                    <Input
                      id="easypaisa-number"
                      value={paymentConfig.easypaisaNumber}
                      onChange={(e) => handleUpdatePaymentField("easypaisaNumber", e.target.value)}
                      placeholder="03233371766"
                      required
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="easypaisa-title" className="text-xs">Account Title</Label>
                    <Input
                      id="easypaisa-title"
                      value={paymentConfig.easypaisaTitle}
                      onChange={(e) => handleUpdatePaymentField("easypaisaTitle", e.target.value)}
                      placeholder="Account Title"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="easypaisa-min" className="text-xs">Minimum Deposit (PKR)</Label>
                    <Input
                      id="easypaisa-min"
                      type="number"
                      min={100}
                      value={paymentConfig.easypaisaMinPkr}
                      onChange={(e) => handleUpdatePaymentField("easypaisaMinPkr", parseInt(e.target.value) || 500)}
                      placeholder="500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Cryptocurrency & Web3 (USD) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-slate-900">Cryptocurrency Gateways (USD)</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Binance Pay */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <SiBinance className="h-4 w-4 text-[#F3BA2F]" />
                      Binance Pay
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-1.5 py-0.5 rounded">
                      0% Fee • USD
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="binance-pay-id" className="text-xs">Binance Pay ID</Label>
                    <Input
                      id="binance-pay-id"
                      value={paymentConfig.binancePayId}
                      onChange={(e) => handleUpdatePaymentField("binancePayId", e.target.value)}
                      placeholder="834910283"
                      required
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="binance-pay-title" className="text-xs">Merchant / Account Title</Label>
                    <Input
                      id="binance-pay-title"
                      value={paymentConfig.binancePayTitle}
                      onChange={(e) => handleUpdatePaymentField("binancePayTitle", e.target.value)}
                      placeholder="USNumHub Merchant"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="binance-min" className="text-xs">Minimum Deposit (USD)</Label>
                    <Input
                      id="binance-min"
                      type="number"
                      min={1}
                      value={paymentConfig.binanceMinUsd}
                      onChange={(e) => handleUpdatePaymentField("binanceMinUsd", parseInt(e.target.value) || 2)}
                      placeholder="2"
                      required
                    />
                  </div>
                </div>

                {/* USDT TRC-20 */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-600 flex items-center gap-1.5">
                      <SiTether className="h-4 w-4 text-emerald-500" />
                      USDT (TRC-20)
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded">
                      TRON Network
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="usdt-trc20-address" className="text-xs">TRC-20 Wallet Address</Label>
                    <Input
                      id="usdt-trc20-address"
                      value={paymentConfig.usdtTrc20Address}
                      onChange={(e) => handleUpdatePaymentField("usdtTrc20Address", e.target.value)}
                      placeholder="TXbBq78pUQ9w8mKq18hZb1Ew8qZf3jPXYZ"
                      required
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="usdt-trc20-title" className="text-xs">Network / Memo Title</Label>
                    <Input
                      id="usdt-trc20-title"
                      value={paymentConfig.usdtTrc20Title}
                      onChange={(e) => handleUpdatePaymentField("usdtTrc20Title", e.target.value)}
                      placeholder="TRON Network"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="usdt-min" className="text-xs">Minimum Deposit (USD)</Label>
                    <Input
                      id="usdt-min"
                      type="number"
                      min={1}
                      value={paymentConfig.usdtMinUsd}
                      onChange={(e) => handleUpdatePaymentField("usdtMinUsd", parseInt(e.target.value) || 5)}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetPaymentSettings}
                className="text-slate-600 hover:text-red-600 gap-1.5 cursor-pointer w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>

              <Button
                type="submit"
                disabled={isSavingPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer w-full sm:w-auto shadow-sm"
              >
                <Save className="h-4 w-4" />
                {isSavingPayment ? "Saving Details…" : "Save Payment Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>



      {/* Change Password */}
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Enter your current old password, then choose and confirm your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-old-password">Old / Current Password</Label>
              <PasswordInput
                id="admin-old-password"
                autoComplete="current-password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(ev) => setOldPassword(ev.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-new-password">New Password</Label>
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
              <Label htmlFor="admin-confirm-password">Confirm New Password</Label>
              <PasswordInput
                id="admin-confirm-password"
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={changingPassword} className="w-full">
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password…
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
