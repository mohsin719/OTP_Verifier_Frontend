"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { SiBinance, SiTether } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { useCurrencyStore, formatDualBalance } from "@/lib/currency";
import { cn } from "@/lib/utils";

import {
  getStoredPaymentSettings,
  PAYMENT_SETTINGS_UPDATED_EVENT,
  type StoredPaymentSettings,
  buildPaymentWhatsAppUrl,
} from "@/lib/payment-methods";

type SimpleMethod = {
  id: string;
  name: string;
  currency: "PKR" | "USD";
  accountNumber: string;
  accountTitle: string;
  minAmount: number;
  icon: "jazzcash" | "easypaisa" | "binance" | "usdt";
};

function buildSimpleMethods(s: StoredPaymentSettings): SimpleMethod[] {
  return [
    {
      id: "jazzcash",
      name: "JazzCash",
      currency: "PKR",
      accountNumber: s.jazzcashNumber,
      accountTitle: s.jazzcashTitle,
      minAmount: s.jazzcashMinPkr,
      icon: "jazzcash",
    },
    {
      id: "easypaisa",
      name: "EasyPaisa",
      currency: "PKR",
      accountNumber: s.easypaisaNumber,
      accountTitle: s.easypaisaTitle,
      minAmount: s.easypaisaMinPkr,
      icon: "easypaisa",
    },
    {
      id: "binance-pay",
      name: "Binance Pay",
      currency: "USD",
      accountNumber: s.binancePayId,
      accountTitle: s.binancePayTitle,
      minAmount: s.binanceMinUsd,
      icon: "binance",
    },
    {
      id: "usdt-trc20",
      name: "USDT TRC20",
      currency: "USD",
      accountNumber: s.usdtTrc20Address,
      accountTitle: s.usdtTrc20Title,
      minAmount: s.usdtMinUsd,
      icon: "usdt",
    },
  ];
}

export default function DepositPage() {
  const user = useAuthStore((s) => s.user);
  const { balancePkr } = useWalletStore();
  const { exchangeRate } = useCurrencyStore();

  const [paymentSettings, setPaymentSettings] = useState<StoredPaymentSettings>(() => getStoredPaymentSettings());
  const [selectedId, setSelectedId] = useState<string>("jazzcash");
  const [amount, setAmount] = useState<string>("500");
  const [tid, setTid] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPaymentSettings(getStoredPaymentSettings());
    const handleConfigUpdate = () => {
      setPaymentSettings(getStoredPaymentSettings());
    };
    window.addEventListener(PAYMENT_SETTINGS_UPDATED_EVENT, handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);
    return () => {
      window.removeEventListener(PAYMENT_SETTINGS_UPDATED_EVENT, handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  const methods = useMemo(() => buildSimpleMethods(paymentSettings), [paymentSettings]);

  const method = useMemo(() => {
    return methods.find((m) => m.id === selectedId) || methods[0];
  }, [methods, selectedId]);

  const dualBalance = formatDualBalance(balancePkr, exchangeRate);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const req = params.get("required") || params.get("amount");
    if (req) {
      const n = parseFloat(req);
      if (!isNaN(n) && n > 0) {
        setAmount(Math.max(500, Math.round(n)).toString());
      }
    }
  }, []);

  const handleSelectMethod = (m: SimpleMethod) => {
    setSelectedId(m.id);
    setCopied(false);
    if (m.currency === "PKR" && (amount === "2" || amount === "5" || amount === "10")) {
      setAmount("500");
    } else if (m.currency === "USD" && parseInt(amount) >= 500) {
      setAmount("5");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(method.accountNumber);
      setCopied(true);
      toast.success(`${method.name} details copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const handleWhatsApp = () => {
    const amtNumber = parseFloat(amount) || 0;
    if (amtNumber < method.minAmount) {
      toast.error(
        `Minimum deposit for ${method.name} is ${
          method.currency === "PKR" ? `Rs ${method.minAmount}` : `$${method.minAmount} USD`
        }`
      );
      return;
    }

    const userId = user?.publicId || user?.username || user?.id || "N/A";
    const amtText = method.currency === "PKR" ? `Rs ${amtNumber}` : `$${amtNumber} USD`;
    const tidText = tid.trim() ? tid.trim() : "Attached via screenshot";

    const text = `Hello Admin,

I have sent a deposit payment:
• User ID: ${userId}
• Payment Method: ${method.name}
• Amount: ${amtText}
• TID / Trx ID: ${tidText}

Please verify and credit my wallet balance. Thank you!`;

    const whatsappClean = (paymentSettings.adminWhatsapp || "+923233371766").replace(/\D/g, "");
    const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-4 px-4">
      {/* ─── Centered Compact Box Container (Max Width: 420px) ─── */}
      <div className="w-full max-w-[420px] space-y-3.5">
        {/* Navigation & Balance Bar */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Wallet</span>
          </Link>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 shadow-2xs">
            <Wallet className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-black text-slate-900 tabular-nums">
              {dualBalance.usd}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
              ({dualBalance.pkr})
            </span>
          </div>
        </div>

        {/* Main Sleek Centered Card */}
        <Card className="border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <CardContent className="p-5 sm:p-6 space-y-4.5">
            {/* Header */}
            <div className="text-center space-y-0.5 pb-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Deposit Funds
              </h1>
              <p className="text-xs text-slate-500">
                Choose a payment method &amp; confirm on WhatsApp.
              </p>
            </div>

            {/* Step 1: Method Selector Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                1. Select Method
              </span>

              <div className="grid grid-cols-2 gap-2">
                {methods.map((m) => {
                  const isSelected = m.id === selectedId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMethod(m)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer relative",
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs"
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                        {m.icon === "jazzcash" && <Smartphone className="h-3.5 w-3.5 text-red-600" />}
                        {m.icon === "easypaisa" && <Smartphone className="h-3.5 w-3.5 text-emerald-600" />}
                        {m.icon === "binance" && <SiBinance className="h-3.5 w-3.5 text-[#F3BA2F]" />}
                        {m.icon === "usdt" && <SiTether className="h-3.5 w-3.5 text-emerald-500" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{m.name}</p>
                        <p className="text-[10px] font-bold text-slate-500">{m.currency}</p>
                      </div>

                      {isSelected && (
                        <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check className="h-2 w-2 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Account Details Box */}
            <div className="space-y-1.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                  2. Transfer to Account
                </span>
                <span className="text-blue-700 font-bold">{method.name}</span>
              </div>

              {/* Number and Copy */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-2xs">
                <span className="font-mono font-black text-sm text-slate-900 break-all select-all flex-1 px-1">
                  {method.accountNumber}
                </span>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7.5 shrink-0 gap-1 font-bold text-[11px] bg-slate-900 hover:bg-slate-800 text-white shadow-2xs rounded-lg px-2.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Verified Account Name */}
              <div className="flex items-center justify-between text-[11px] bg-white/90 border border-blue-100 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-500 font-medium">Account Title:</span>
                <span className="font-black text-slate-900">{method.accountTitle}</span>
              </div>
            </div>

            {/* Step 3: Amount & Optional TID */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                3. Amount &amp; TID
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Amount */}
                <div className="space-y-1">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                      {method.currency === "PKR" ? "Rs" : "$"}
                    </span>
                    <input
                      type="number"
                      min={method.minAmount}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min: ${method.minAmount}`}
                      className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400">
                    Min: {method.currency === "PKR" ? `Rs ${method.minAmount}` : `$${method.minAmount}`}
                  </p>
                </div>

                {/* TID */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={tid}
                    onChange={(e) => setTid(e.target.value)}
                    placeholder={method.currency === "PKR" ? "TID (Optional)" : "TxID (Optional)"}
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <p className="text-[9px] text-slate-400">From SMS or receipt</p>
                </div>
              </div>
            </div>

            {/* Step 4: WhatsApp Confirmation CTA */}
            <div className="pt-1 space-y-2">
              <Button
                type="button"
                onClick={handleWhatsApp}
                className="w-full h-11 font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 rounded-xl gap-2 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                <span>Confirm on WhatsApp</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Button>

              <p className="text-center text-[10px] text-slate-400 leading-tight">
                Pre-fills your User ID &amp; payment details for fast 1–5 min crediting.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Small Bottom Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 text-center pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>100% Protected &amp; Guaranteed Balance Crediting</span>
        </div>
      </div>
    </div>
  );
}
