"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Smartphone,
  CreditCard,
  History,
  Lock,
  RefreshCw,
} from "lucide-react";
import { SiBinance, SiTether } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PAYMENT_METHODS,
  ADMIN_WHATSAPP_NUMBER,
  buildPaymentWhatsAppUrl,
  type PaymentMethodConfig,
} from "@/lib/payment-methods";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { useCurrencyStore, formatDualBalance, formatDualPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default function DepositPage() {
  const user = useAuthStore((s) => s.user);
  const { balancePkr, isLoading: balanceLoading } = useWalletStore();
  const { exchangeRate } = useCurrencyStore();

  const [activeCategory, setActiveCategory] = useState<"crypto" | "local">("crypto");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("usdt-trc20");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("10");
  const [amountCurrency, setAmountCurrency] = useState<"USD" | "PKR">("USD");
  const [userTxId, setUserTxId] = useState<string>("");

  const dualBalance = formatDualBalance(balancePkr, exchangeRate);

  const filteredMethods = useMemo(() => {
    return PAYMENT_METHODS.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

  const activeMethod = useMemo(() => {
    return (
      PAYMENT_METHODS.find((m) => m.id === selectedMethodId) ||
      filteredMethods[0] ||
      PAYMENT_METHODS[0]
    );
  }, [selectedMethodId, filteredMethods]);

  // Handle category switch
  const handleCategoryChange = (category: "crypto" | "local") => {
    setActiveCategory(category);
    const firstOfCat = PAYMENT_METHODS.find((m) => m.category === category);
    if (firstOfCat) {
      setSelectedMethodId(firstOfCat.id);
      if (category === "local") {
        setAmountCurrency("PKR");
        setDepositAmount("1000");
      } else {
        setAmountCurrency("USD");
        setDepositAmount("10");
      }
    }
  };

  // Convert amounts
  const computedDual = useMemo(() => {
    const num = parseFloat(depositAmount) || 0;
    if (amountCurrency === "USD") {
      const pkr = Math.round(num * exchangeRate);
      return { usd: num, pkr };
    } else {
      const usd = parseFloat((num / (exchangeRate || 280)).toFixed(2));
      return { usd, pkr: num };
    }
  }, [depositAmount, amountCurrency, exchangeRate]);

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const whatsappUrl = useMemo(() => {
    return buildPaymentWhatsAppUrl({
      userId: user?.publicId || user?.id || "N/A",
      methodTitle: activeMethod.title,
      networkOrBank: activeMethod.networkOrBank,
      amountPkr: computedDual.pkr > 0 ? computedDual.pkr : undefined,
      amountUsd: computedDual.usd > 0 ? computedDual.usd : undefined,
      txId: userTxId,
    });
  }, [user, activeMethod, computedDual, userTxId]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    activeMethod.accountNumberOrAddress
  )}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-20 pt-2 sm:pt-4">
      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Wallet</span>
            </Link>
            <span>/</span>
            <span className="text-blue-600 font-bold">Add Balance &amp; Deposit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Deposit Funds &amp; Add Balance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Choose your preferred channel (Binance Pay, USDT Crypto, or JazzCash/EasyPaisa) to instantly recharge your account.
          </p>
        </div>

        {/* Current Balance Snapshot Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 p-3 sm:px-4 sm:py-3 shadow-2xs self-start sm:self-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Balance
            </p>
            {balanceLoading ? (
              <div className="h-5 w-20 bg-slate-200 animate-pulse rounded mt-0.5" />
            ) : (
              <div className="flex items-baseline gap-1.5 leading-tight">
                <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                  {dualBalance.usd}
                </span>
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  ({dualBalance.pkr})
                </span>
              </div>
            )}
          </div>
          <Link
            href="/wallet"
            className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
          >
            <History className="h-3 w-3" />
            <span>Ledger</span>
          </Link>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN (Deposit Core System - 8 Cols) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category Switcher Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner max-w-md">
            <button
              type="button"
              onClick={() => handleCategoryChange("crypto")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                activeCategory === "crypto"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <SiBinance className="h-4 w-4 text-[#F3BA2F]" />
              <span>Binance &amp; Crypto</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900">
                USDT
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange("local")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                activeCategory === "local"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>JazzCash &amp; EasyPaisa</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900">
                PKR
              </span>
            </button>
          </div>

          {/* Payment Method Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {filteredMethods.map((method) => {
              const isSelected = method.id === activeMethod.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethodId(method.id)}
                  className={cn(
                    "flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs"
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                        {method.category === "crypto" ? (
                          method.id === "binance-pay" ? (
                            <SiBinance className="h-4 w-4 text-[#F3BA2F]" />
                          ) : (
                            <SiTether className="h-4 w-4 text-emerald-500" />
                          )
                        ) : (
                          <Wallet className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {method.title}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all",
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{method.subtitle}</p>
                  {method.badge && (
                    <span className="mt-2.5 self-start inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      {method.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailed Payment Configuration Box */}
          <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-[#F3BA2F]" />
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
                    {activeMethod.category === "crypto" ? (
                      activeMethod.id === "binance-pay" ? (
                        <SiBinance className="h-5 w-5 text-[#F3BA2F]" />
                      ) : (
                        <SiTether className="h-5 w-5 text-emerald-600" />
                      )
                    ) : (
                      <Smartphone className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900">
                      {activeMethod.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">
                      {activeMethod.networkOrBank ? `Network / Channel: ${activeMethod.networkOrBank}` : activeMethod.subtitle}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQr(!showQr)}
                    className="h-8.5 gap-1.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <QrCode className="h-3.5 w-3.5 text-blue-600" />
                    <span>{showQr ? "Hide QR Code" : "Show QR Code"}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* QR Code preview */}
              {showQr && (
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 animate-in fade-in duration-200">
                  { }
                  <img
                    src={qrImageUrl}
                    alt={`${activeMethod.title} QR Code`}
                    className="h-48 w-48 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
                  />
                  <p className="text-xs font-bold text-slate-700">
                    Scan with {activeMethod.category === "crypto" ? "Binance App or Crypto Wallet" : "Banking App"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Address: <code className="font-mono">{activeMethod.accountNumberOrAddress}</code>
                  </p>
                </div>
              )}

              {/* Deposit Address Box with 1-Click Copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                    {activeMethod.category === "crypto"
                      ? activeMethod.id === "binance-pay"
                        ? "Official Binance Pay ID"
                        : "Deposit Wallet Address"
                      : "Account Mobile Number / IBAN"}
                  </span>
                  {activeMethod.accountTitleOrMemo && (
                    <span className="text-slate-500 font-semibold text-xs">
                      Account Title: <strong className="text-slate-900">{activeMethod.accountTitleOrMemo}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
                  <code className="flex-1 font-mono font-bold text-xs sm:text-base text-slate-900 break-all select-all px-1">
                    {activeMethod.accountNumberOrAddress}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        activeMethod.accountNumberOrAddress,
                        activeMethod.title,
                        "main-addr"
                      )
                    }
                    className="h-9 shrink-0 gap-1.5 font-extrabold text-xs bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs cursor-pointer px-3 rounded-lg"
                  >
                    {copiedKey === "main-addr" ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-600" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Live Calculator & Amount Converter */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>Deposit Amount Calculator</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span className="text-slate-500">Currency:</span>
                    <button
                      type="button"
                      onClick={() => setAmountCurrency(amountCurrency === "USD" ? "PKR" : "USD")}
                      className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      {amountCurrency} ⇄ {amountCurrency === "USD" ? "PKR" : "USD"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">
                      {amountCurrency === "USD" ? "$" : "Rs"}
                    </span>
                    <input
                      type="number"
                      min={activeMethod.category === "crypto" ? 2 : 500}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter deposit amount..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm sm:text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-900">
                      {amountCurrency === "USD" ? `≈ Rs ${computedDual.pkr.toLocaleString()}` : `≈ $${computedDual.usd} USD`}
                    </p>
                    <p className="text-[10px] text-blue-700/80 font-medium">Rate: $1 ≈ Rs {exchangeRate}</p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick:</span>
                  {(amountCurrency === "USD" ? ["5", "10", "25", "50", "100", "200"] : ["500", "1000", "2500", "5000", "10000"]).map(
                    (val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDepositAmount(val)}
                        className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                          depositAmount === val
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {amountCurrency === "USD" ? `$${val}` : `Rs ${parseInt(val).toLocaleString()}`}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-slate-500" />
                  <span>How to transfer &amp; receive balance:</span>
                </p>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <ol className="text-xs text-slate-600 space-y-1.5 pl-4 list-decimal">
                    {activeMethod.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Transaction ID / Hash (TxID) Optional Input */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    Transaction ID / TxID / TID
                  </label>
                  <span className="text-[10px] text-slate-400">Optional (for faster verification)</span>
                </div>
                <input
                  type="text"
                  value={userTxId}
                  onChange={(e) => setUserTxId(e.target.value)}
                  placeholder={
                    activeMethod.category === "crypto"
                      ? "Paste blockchain TxID or Binance Order ID..."
                      : "Paste 11-digit JazzCash/EasyPaisa TID from SMS..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* WhatsApp Action Button & Copy Details */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  className="flex-1 h-12 font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 rounded-xl gap-2 cursor-pointer transition-transform active:scale-[0.98]"
                  onClick={() => {
                    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Send Payment Proof on WhatsApp</span>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      `Deposit Request:\nUser ID: ${user?.publicId || "N/A"}\nMethod: ${activeMethod.title}\nAmount: $${computedDual.usd} (Rs ${computedDual.pkr})\nTxID: ${userTxId || "Attached via screenshot"}`,
                      "Deposit Details",
                      "proof-msg"
                    )
                  }
                  className="h-12 font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl gap-1.5 px-4"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedKey === "proof-msg" ? "Details Copied!" : "Copy Details"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN (Account, Trust & Info Sidebar - 4 Cols) ─── */}
        <div className="lg:col-span-4 space-y-5">
          {/* User Account Card */}
          <Card className="border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Account Credentials</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">User ID:</span>
                <div className="flex items-center gap-1">
                  <code className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {user?.publicId || user?.id || "N/A"}
                  </code>
                  {user?.publicId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(user.publicId, "User ID", "uid")}
                      className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                      title="Copy User ID"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Account Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active &amp; Verified
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Available Balance:</span>
                <span className="font-black text-slate-900 text-sm">
                  {dualBalance.usd} <span className="text-slate-500 text-xs">({dualBalance.pkr})</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Guarantee & Speed Assurance */}
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white shadow-2xs rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>100% Guaranteed Deposit</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>1–5 Minutes Crediting:</strong> Admin confirms payments in real time and credits your ledger immediately.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Protected Funds:</strong> Your balance is charged strictly when SMS is received. Cancel anytime for full refund.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>24/7 Helpline:</strong> Dedicated support via WhatsApp ({ADMIN_WHATSAPP_NUMBER}) for any inquiries.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick FAQ summary */}
          <Card className="border-slate-200 bg-white shadow-2xs rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Deposit Guidelines
            </h4>
            <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
              <p>
                • <strong>Minimum Top-Up:</strong> Rs 500 (or $2 USDT).
              </p>
              <p>
                • <strong>Network Check:</strong> For TRC-20 USDT, only send via TRON network. For BEP-20, use BNB Smart Chain.
              </p>
              <p>
                • <strong>JazzCash/EasyPaisa:</strong> Always verify the title &apos;Muhammad Sami&apos; before confirming the transfer.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
