"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Wallet,
  Smartphone,
} from "lucide-react";
import { SiBinance, SiTether } from "react-icons/si";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PAYMENT_METHODS,
  type PaymentMethodConfig,
} from "@/lib/payment-methods";
import { useAuthStore } from "@/stores/auth-store";
import { useCurrencyStore, formatDualPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface AddBalanceHubProps {
  initialMethodId?: string;
  onSuccessClose?: () => void;
  compact?: boolean;
}

export function AddBalanceHub({
  initialMethodId = "usdt-trc20",
  onSuccessClose,
  compact = false,
}: AddBalanceHubProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { exchangeRate } = useCurrencyStore();

  const [activeCategory, setActiveCategory] = useState<"crypto" | "local">("crypto");
  const [selectedMethodId, setSelectedMethodId] = useState<string>(initialMethodId);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("10");
  const [amountCurrency, setAmountCurrency] = useState<"USD" | "PKR">("USD");
  const [userTxId, setUserTxId] = useState<string>("");

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
      toast.error("Failed to copy. Please select and copy manually.");
    }
  };


  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    activeMethod.accountNumberOrAddress
  )}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div className="space-y-5">
      {/* ─── Category Tabs (Crypto & Binance vs Local PKR Wallets) ─── */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner max-w-md mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => handleCategoryChange("crypto")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
            activeCategory === "crypto"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <SiBinance className="h-4 w-4 text-[#F3BA2F]" />
          <span>Binance &amp; Crypto</span>
          <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
            USDT
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange("local")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
            activeCategory === "local"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <Smartphone className="h-4 w-4 text-emerald-600" />
          <span>JazzCash &amp; EasyPaisa</span>
          <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
            PKR
          </span>
        </button>
      </div>

      {/* ─── Method Pills Selector ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredMethods.map((method) => {
          const isSelected = method.id === activeMethod.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethodId(method.id)}
              className={cn(
                "flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                isSelected
                  ? "border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs ring-1 ring-blue-600/30"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/80"
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  {method.category === "crypto" ? (
                    method.id === "binance-pay" ? (
                      <SiBinance className="h-4 w-4 text-[#F3BA2F] shrink-0" />
                    ) : (
                      <SiTether className="h-4 w-4 text-emerald-500 shrink-0" />
                    )
                  ) : (
                    <Wallet className="h-4 w-4 text-blue-600 shrink-0" />
                  )}
                  <span className="font-bold text-xs truncate">{method.title}</span>
                </div>
                {isSelected && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate">{method.subtitle}</p>
              {method.badge && (
                <span className="mt-1.5 self-start inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                  {method.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Active Payment Details Card ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Method Header & Network info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
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
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                {activeMethod.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {activeMethod.networkOrBank ? `Network: ${activeMethod.networkOrBank}` : activeMethod.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQr(!showQr)}
              className="h-8 gap-1.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <QrCode className="h-3.5 w-3.5 text-blue-600" />
              <span>{showQr ? "Hide QR" : "Show QR"}</span>
            </Button>
          </div>
        </div>

        {/* QR Code Popover Preview if toggled */}
        {showQr && (
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2 animate-in fade-in duration-200">
            { }
            <img
              src={qrImageUrl}
              alt={`${activeMethod.title} QR Code`}
              className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-xs"
            />
            <p className="text-xs font-semibold text-slate-600">
              Scan with {activeMethod.category === "crypto" ? "Binance App or Web3 Wallet" : "Banking App"}
            </p>
          </div>
        )}

        {/* Main Address / Account Number Copy Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
              {activeMethod.category === "crypto"
                ? activeMethod.id === "binance-pay"
                  ? "Binance Pay ID"
                  : "Deposit Wallet Address"
                : "Account Mobile Number / IBAN"}
            </span>
            {activeMethod.accountTitleOrMemo && (
              <span className="text-slate-500 font-semibold text-[11px]">
                Title: <strong className="text-slate-800">{activeMethod.accountTitleOrMemo}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5">
            <code className="flex-1 font-mono font-bold text-xs sm:text-sm text-slate-900 break-all select-all px-1">
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
              className="h-8 shrink-0 gap-1 font-bold text-xs bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs cursor-pointer"
            >
              {copiedKey === "main-addr" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Deposit Calculator / Amount Selector */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Deposit Amount Calculator</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-slate-500">Currency:</span>
              <button
                type="button"
                onClick={() => setAmountCurrency(amountCurrency === "USD" ? "PKR" : "USD")}
                className="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
              >
                {amountCurrency} ⇄ {amountCurrency === "USD" ? "PKR" : "USD"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                {amountCurrency === "USD" ? "$" : "Rs"}
              </span>
              <input
                type="number"
                min={activeMethod.category === "crypto" ? 2 : 500}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-extrabold text-blue-900">
                {amountCurrency === "USD" ? `≈ Rs ${computedDual.pkr}` : `≈ $${computedDual.usd} USD`}
              </p>
              <p className="text-[10px] text-blue-700/80">Rate: $1 ≈ Rs {exchangeRate}</p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick:</span>
            {(amountCurrency === "USD" ? ["5", "10", "25", "50", "100"] : ["500", "1000", "2500", "5000"]).map(
              (val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDepositAmount(val)}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                    depositAmount === val
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {amountCurrency === "USD" ? `$${val}` : `Rs ${val}`}
                </button>
              )
            )}
          </div>
        </div>

        {/* Instructions list */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>How to pay &amp; get balance:</span>
          </p>
          <ul className="text-[11px] text-slate-600 space-y-1 pl-5 list-decimal">
            {activeMethod.instructions.map((step, idx) => (
              <li key={idx} className="leading-snug">
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Optional TxID / TRX ID Input for fast matching */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Transaction ID / Hash (TxID)</span>
            <span className="text-[10px] font-normal text-slate-400">Optional but recommended</span>
          </label>
          <input
            type="text"
            value={userTxId}
            onChange={(e) => setUserTxId(e.target.value)}
            placeholder={
              activeMethod.category === "crypto"
                ? "Paste blockchain TxID or Binance Order ID..."
                : "Paste 11-digit JazzCash/EasyPaisa TID..."
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ─── Manual Verification Action CTA ─── */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            className="flex-1 h-11 font-extrabold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-xl gap-2 cursor-pointer"
            onClick={() => {
              const amt = amountCurrency === "USD" ? computedDual.usd : computedDual.pkr;
              router.push(`/deposit?method=${activeMethod.id}&amount=${amt}&txid=${encodeURIComponent(userTxId)}`);
              if (onSuccessClose) onSuccessClose();
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Submit Payment Proof &amp; Verify</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              copyToClipboard(
                `Deposit Request:\nUser ID: ${user?.publicId || "N/A"}\nMethod: ${activeMethod.title}\nAmount: $${computedDual.usd} (Rs ${computedDual.pkr})\nTxID: ${userTxId || "Pending submission"}`,
                "Deposit Details",
                "proof-msg"
              )
            }
            className="h-11 font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copiedKey === "proof-msg" ? "Copied!" : "Copy Details"}</span>
          </Button>
        </div>

        {/* User Public ID & Live Guarantee Assurance */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Typical admin approval: <strong>1 to 5 minutes</strong></span>
          </span>
          {user?.publicId && (
            <span className="font-mono text-slate-600">
              Your User ID: <strong className="text-slate-900">{user.publicId}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
