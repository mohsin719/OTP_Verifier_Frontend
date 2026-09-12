"use client";

import { useState, useMemo, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Wallet,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  QrCode,
  Loader2,
  Building2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { useCurrencyStore, formatDualBalance } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  PaymentMethodConfig,
  fetchActivePaymentMethods,
  getCachedPaymentMethods,
  PAYMENT_SETTINGS_UPDATED_EVENT,
} from "@/lib/payment-methods";
import { PaymentMethodIcon } from "@/components/payment/payment-icons";
import { PaymentMethodDropdown } from "@/components/payment/payment-method-dropdown";

type UserTopupItem = {
  id: string;
  requestNumber: string;
  paymentMethod: string;
  amount: number;
  amountUsd?: number | null;
  currency: string;
  transactionId: string;
  senderDetails?: string | null;
  screenshotUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
};

function VerificationTimer({ createdAt }: { createdAt: string }) {
  const [timerState, setTimerState] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    title: string;
    description: string;
    isReminderStage: boolean;
  }>({
    hours: 3,
    minutes: 0,
    seconds: 0,
    title: "Guaranteed Verification: Within 3 Hours",
    description: "Your payment will be verified and credited to your wallet within 3 hours.",
    isReminderStage: false,
  });

  useEffect(() => {
    function update() {
      const createdTime = new Date(createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.max(0, now - createdTime);

      const HOUR_MS = 60 * 60 * 1000;
      const STAGE1_MS = 3 * HOUR_MS; // 3 hours
      const STAGE2_MS = 5 * HOUR_MS; // +2 hours (total 5 hours)
      const STAGE3_MS = 6 * HOUR_MS; // +1 hour (total 6 hours)

      let remainingMs = 0;
      let title = "";
      let description = "";
      let isReminderStage = false;

      if (elapsed < STAGE1_MS) {
        // Stage 1: Initial 3 Hours
        remainingMs = STAGE1_MS - elapsed;
        title = "Guaranteed Verification: Within 3 Hours";
        description = "Your payment will be verified and credited to your wallet within 3 hours.";
        isReminderStage = false;
      } else if (elapsed < STAGE2_MS) {
        // Stage 2: Next 2 Hours (after 3 hours expired)
        remainingMs = STAGE2_MS - elapsed;
        title = "Extended Review Window: Within 2 Hours";
        description = "Verification is taking a little longer than usual. An automated reminder has been sent to the admin; estimated within 2 hours.";
        isReminderStage = true;
      } else if (elapsed < STAGE3_MS) {
        // Stage 3: Next 1 Hour (after 2 hours expired)
        remainingMs = STAGE3_MS - elapsed;
        title = "Priority Verification: Within 1 Hour";
        description = "High-priority queue active. Your top-up is in final administrative review within 1 hour.";
        isReminderStage = true;
      } else {
        // Stage 4: Recurring 1 Hour reset cycle
        const overtime = elapsed - STAGE3_MS;
        remainingMs = HOUR_MS - (overtime % HOUR_MS);
        title = "Priority Verification Queue";
        description = "High-priority queue active. The administrator is reviewing your deposit queue shortly.";
        isReminderStage = true;
      }

      const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimerState({
        hours,
        minutes,
        seconds,
        title,
        description,
        isReminderStage,
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5 sm:p-4 space-y-2.5 shadow-2xs transition-all",
        timerState.isReminderStage
          ? "border-amber-300/90 bg-gradient-to-r from-amber-100/60 via-amber-50 to-orange-50/70"
          : "border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-orange-50/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-xs font-black text-amber-950">
            {timerState.title}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-amber-200/90 text-amber-950 font-mono font-black text-xs shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          <span>
            {pad(timerState.hours)}h {pad(timerState.minutes)}m {pad(timerState.seconds)}s remaining
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-amber-950 font-medium bg-white/85 rounded-xl px-3 py-1.5 border border-amber-200/60 shadow-2xs">
        <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span>{timerState.description}</span>
      </div>
    </div>
  );
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

export default function DepositPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { balancePkr } = useWalletStore();
  const { exchangeRate } = useCurrencyStore();

  const [methods, setMethods] = useState<PaymentMethodConfig[]>(() =>
    getCachedPaymentMethods()
  );
  const [selectedId, setSelectedId] = useState<string>("jazzcash");
  const [amount, setAmount] = useState<string>("500");
  const [transactionId, setTransactionId] = useState<string>("");
  const [senderDetails, setSenderDetails] = useState<string>("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");

  // History state
  const [historyItems, setHistoryItems] = useState<UserTopupItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live active payment methods from backend
  useEffect(() => {
    let isMounted = true;
    async function loadMethods() {
      const live = await fetchActivePaymentMethods();
      if (isMounted && live.length > 0) {
        setMethods(live);
      }
    }
    void loadMethods();

    const handleConfigUpdate = () => {
      void loadMethods();
    };
    window.addEventListener(PAYMENT_SETTINGS_UPDATED_EVENT, handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener(PAYMENT_SETTINGS_UPDATED_EVENT, handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  const method = useMemo(() => {
    return (
      methods.find((m) => m.id === selectedId || m.code === selectedId) ||
      methods[0]
    );
  }, [methods, selectedId]);

  const dualBalance = formatDualBalance(balancePkr, exchangeRate);

  // Read URL query parameters if navigated from Add Balance Hub
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const m = params.get("method");
    if (m) {
      setSelectedId(m);
    }
    const req = params.get("required") || params.get("amount");
    if (req) {
      const n = parseFloat(req);
      if (!isNaN(n) && n > 0) {
        setAmount(Math.round(n).toString());
      }
    }
    const tx = params.get("txid");
    if (tx) {
      setTransactionId(tx);
    }
  }, []);

  // Fetch top-up history
  const fetchHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await apiFetch<{ items: UserTopupItem[]; total: number }>("/api/topup/my-requests", {
        accessToken: token,
      });
      if (res.success) {
        setHistoryItems(res.data?.items || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void fetchHistory();
    }
  }, [token]);

  const handleSelectMethod = (m: PaymentMethodConfig) => {
    setSelectedId(m.id || m.code);
    setCopiedNumber(false);
    setCopiedTitle(false);
    setShowQr(false);
    if (m.currency === "PKR" && (amount === "2" || amount === "5" || amount === "10")) {
      setAmount(m.minAmountPkr ? m.minAmountPkr.toString() : "500");
    } else if (m.currency === "USD" && parseInt(amount) >= 100) {
      setAmount(m.minAmountUsd ? m.minAmountUsd.toString() : "5");
    }
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(method.accountNumberOrAddress);
      setCopiedNumber(true);
      toast.success(`${method.title} account number copied!`);
      setTimeout(() => setCopiedNumber(false), 2000);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const handleCopyTitle = async () => {
    if (!method.accountTitleOrMemo) return;
    try {
      await navigator.clipboard.writeText(method.accountTitleOrMemo);
      setCopiedTitle(true);
      toast.success(`Account title '${method.accountTitleOrMemo}' copied!`);
      setTimeout(() => setCopiedTitle(false), 2000);
    } catch {
      toast.error("Failed to copy title.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Screenshot file exceeds 3 MB limit. Please select a smaller file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Invalid file format. Only JPG, JPEG, PNG, and WEBP files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Convert amounts
  const computedPkr = useMemo(() => {
    const num = parseFloat(amount) || 0;
    if (method.currency === "USD") {
      return Math.round(num * (exchangeRate || 280));
    }
    return Math.round(num);
  }, [amount, method.currency, exchangeRate]);

  const minRequiredAmount = useMemo(() => {
    return method.currency === "USD" ? method.minAmountUsd : method.minAmountPkr;
  }, [method]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("You must be logged in to submit a top-up request.");
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum < minRequiredAmount) {
      toast.error(
        `Minimum top-up amount for ${method.title} is ${
          method.currency === "PKR" ? `Rs ${minRequiredAmount}` : `$${minRequiredAmount} USD`
        }`
      );
      return;
    }

    const cleanTx = transactionId.trim();
    if (!cleanTx || cleanTx.length < 3) {
      toast.error("Please provide a valid Transaction ID / TxID.");
      return;
    }

    if (!screenshotFile) {
      toast.error("Please upload your payment screenshot proof.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("paymentMethod", method.code || method.id);
      formData.append("amount", computedPkr.toString());
      if (method.currency === "USD") {
        formData.append("amountUsd", amtNum.toString());
      }
      formData.append("currency", method.currency);
      formData.append("transactionId", cleanTx);
      if (senderDetails.trim()) {
        formData.append("senderDetails", senderDetails.trim());
      }
      formData.append("screenshot", screenshotFile);

      const res = await apiFetch<{
        id: string;
        requestNumber: string;
        status: string;
      }>("/api/topup/request", {
        method: "POST",
        accessToken: token,
        body: formData,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit top-up request. Please try again.");
        return;
      }

      setSubmittedRequestNumber(res.data.requestNumber);
      toast.success(`Top-up request #${res.data.requestNumber} submitted successfully!`);

      // Reset form
      setTransactionId("");
      setSenderDetails("");
      handleRemoveScreenshot();

      // Refresh user history
      void fetchHistory();
    } catch {
      toast.error("A network or server error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrPayloadData = method.qrPayload || method.accountNumberOrAddress;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrPayloadData
  )}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-10 px-4">
      <div className="w-full max-w-[580px] space-y-4">
        {/* Navigation & Balance Bar */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Wallet Overview</span>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
            <Wallet className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-black text-slate-900 tabular-nums">
              {dualBalance.usd}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
              ({dualBalance.pkr})
            </span>
          </div>
        </div>

        {/* View Switcher: Submit Form vs My History */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("submit")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
              activeTab === "submit"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <UploadCloud className="h-3.5 w-3.5 text-blue-600" />
            <span>Deposit &amp; Verify</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              void fetchHistory();
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer",
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Top-up History</span>
            {historyItems.some((h) => h.status === "PENDING") && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
            {historyItems.length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                {historyItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Success Confirmation Banner if just submitted */}
        {submittedRequestNumber && activeTab === "submit" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm animate-in fade-in duration-200 relative">
            <button
              type="button"
              onClick={() => setSubmittedRequestNumber(null)}
              className="absolute top-3 right-3 text-emerald-600 hover:text-emerald-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-emerald-950">
                  Payment Submitted for Review!
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your top-up request has been generated with Tracking ID:{" "}
                  <span className="font-mono font-black text-emerald-950 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                    {submittedRequestNumber}
                  </span>
                  . The admin has been notified with your proof and will verify your transaction shortly.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("history")}
                    className="h-7 text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  >
                    View Status in History &rarr;
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Submit Top-up Request */}
        {activeTab === "submit" && (
          <Card className="border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Header */}
              <div className="text-center space-y-0.5 pb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Manual Top-up Verification
                </h1>
                <p className="text-xs text-slate-500">
                  Transfer funds to admin receiving details, then submit your TXID and screenshot proof.
                </p>
              </div>

              {/* Step 1: Rich Payment Method Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    1. Select Payment Method
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {methods.length} methods available
                  </span>
                </div>

                <PaymentMethodDropdown
                  methods={methods}
                  selectedId={selectedId}
                  onSelect={handleSelectMethod}
                />
              </div>

              {/* Step 2: Account Details Box with Original Brand Logo */}
              <div className="space-y-3 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    2. Admin Receiving Details
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-white border border-blue-200 px-2 py-0.8 rounded-lg shadow-2xs"
                    >
                      <QrCode className="h-3 w-3" />
                      <span>{showQr ? "Hide QR" : "Show QR Code"}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code toggle */}
                {showQr && (
                  <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-2 animate-in fade-in duration-200">
                    <img
                      src={qrImageUrl}
                      alt={`${method.title} QR`}
                      className="h-40 w-40 rounded-lg border border-slate-200 p-1.5"
                    />
                    <p className="text-[10px] text-slate-500 font-semibold text-center">
                      Scan with {method.currency === "USD" ? "Binance / Crypto App" : "Any Banking App / Raast"}
                    </p>
                  </div>
                )}

                {/* Main Account Number / Wallet Address Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">
                      {method.category === "crypto"
                        ? "Deposit Address / Pay ID"
                        : method.category === "bank"
                        ? "IBAN / Raast Account"
                        : "Account / Mobile Number"}
                    </span>
                    {method.networkOrBank && (
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                        {method.networkOrBank}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                      <PaymentMethodIcon
                        iconKey={method.iconKey}
                        code={method.code}
                        size={22}
                      />
                    </div>
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900 break-all select-all flex-1 px-1">
                      {method.accountNumberOrAddress}
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyNumber}
                      className="h-8 shrink-0 gap-1 font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-2xs rounded-lg px-2.5 cursor-pointer"
                    >
                      {copiedNumber ? (
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
                </div>

                {/* Verified Account Name / Memo */}
                {method.accountTitleOrMemo && (
                  <div className="flex items-center justify-between text-xs bg-white/90 border border-blue-100 rounded-xl px-3 py-2 shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Account / Recipient Title
                      </span>
                      <span className="font-black text-slate-900 text-xs">
                        {method.accountTitleOrMemo}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyTitle}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md"
                    >
                      {copiedTitle ? (
                        <>
                          <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-2.5 w-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Step-by-Step Instructions */}
                {method.instructions && method.instructions.length > 0 && (
                  <div className="rounded-xl bg-blue-100/50 p-2.5 text-[11px] text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-blue-800">
                      <HelpCircle className="h-3 w-3" />
                      Quick Transfer Instructions
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 pl-0.5 leading-relaxed font-medium">
                      {method.instructions.map((inst, idx) => (
                        <li key={idx}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Form: Amount, TXID, Sender Details, Screenshot */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  3. Submit Verification Proof
                </span>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Deposit Amount</span>
                    <span className="text-[10px] text-blue-600 font-extrabold">
                      {method.currency === "USD"
                        ? `≈ Rs ${computedPkr.toLocaleString()} PKR (Rate: $1 ≈ Rs ${exchangeRate})`
                        : `Min: Rs ${minRequiredAmount}`}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                      {method.currency === "PKR" ? "Rs" : "$"}
                    </span>
                    <input
                      type="number"
                      min={minRequiredAmount}
                      step={method.currency === "USD" ? "any" : "1"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder={`Enter amount (Min: ${minRequiredAmount})`}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Transaction ID / TXID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Transaction ID / Hash (TxID) <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">From receipt, SMS or blockchain</span>
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    placeholder={
                      method.currency === "USD"
                        ? "Paste blockchain TxID or Binance Order ID..."
                        : "Paste 11-digit TID / Bank Reference ID..."
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Optional Sender Details */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Sender Name or Sender Phone / Account <span className="text-slate-400 font-normal">(Optional)</span></span>
                  </label>
                  <input
                    type="text"
                    value={senderDetails}
                    onChange={(e) => setSenderDetails(e.target.value)}
                    placeholder="e.g. Sent from Ali Khan / 03001234567"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Payment Screenshot File Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Payment Proof Screenshot <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-400">Max 3 MB (JPG, PNG, WEBP)</span>
                  </label>

                  {!screenshotPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-600 text-slate-400 shadow-2xs transition-colors">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-slate-600 font-semibold">
                        <span className="text-blue-600 underline">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Screenshot showing successful transfer and TxID
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-3 shadow-2xs">
                      <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {screenshotFile?.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {screenshotFile && (screenshotFile.size / 1024).toFixed(1)} KB • Image attached
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" /> Ready to upload
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-xs sm:text-sm font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Uploading Proof &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      <span>Submit Payment Proof for Verification</span>
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Verified automatically by admin within 5-15 minutes. Duplicate TxIDs are strictly rejected.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: User Top-up History */}
        {activeTab === "history" && (
          <Card className="border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900">Your Top-up Requests</h2>
                  <p className="text-xs text-slate-500">Track verification status of your payment proofs.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchHistory()}
                  disabled={historyLoading}
                  className="h-8 gap-1 text-xs font-bold rounded-xl"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", historyLoading && "animate-spin")} />
                  <span>Refresh</span>
                </Button>
              </div>

              {historyLoading && historyItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Loading top-up history...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-bold text-slate-700">No top-up requests yet</p>
                  <p className="text-[11px] max-w-xs mx-auto text-slate-400">
                    When you submit a payment proof, its live status will appear here.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveTab("submit")}
                    className="mt-2 text-xs font-bold bg-blue-600 text-white rounded-xl"
                  >
                    Submit First Deposit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => {
                    const isPending = item.status === "PENDING";
                    const isApproved = item.status === "APPROVED";
                    const isRejected = item.status === "REJECTED";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs space-y-3.5 bg-white border-l-4",
                          isPending && "border-amber-200 border-l-amber-500 bg-amber-50/20",
                          isApproved && "border-emerald-200 border-l-emerald-500 bg-emerald-50/15",
                          isRejected && "border-rose-200 border-l-rose-500 bg-rose-50/15"
                        )}
                      >
                        {/* Header: Request ID, Date, Status Badge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-xl shadow-2xs font-mono font-black text-xs text-slate-900">
                              <span>{item.requestNumber}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(item.requestNumber);
                                  toast.success("Tracking number copied!");
                                }}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                                title="Copy Tracking Number"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(item.createdAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div>
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-black text-amber-800 shadow-2xs">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                                <span>Under Verification</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800 shadow-2xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Approved &amp; Credited</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-300 px-3 py-1 text-xs font-black text-rose-800 shadow-2xs">
                                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3-Hour Countdown & Live Verification Guarantee for Pending requests */}
                        {isPending && (
                          <VerificationTimer createdAt={item.createdAt} />
                        )}

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50/80 border border-slate-100 rounded-2xl p-3">
                          {/* Method with HD Brand Logo */}
                          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                            <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                              <PaymentMethodIcon iconKey={item.paymentMethod} code={item.paymentMethod} size={24} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Method</span>
                              <span className="font-extrabold text-slate-900 text-xs capitalize truncate block">
                                {item.paymentMethod.replace(/[-_]+/g, " ")}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount</span>
                            <div className="font-black text-emerald-600 text-sm">
                              Rs {item.amount.toLocaleString()} PKR
                              {item.amountUsd && (
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  (${item.amountUsd} USD)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Transaction ID */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs flex flex-col justify-center min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">TxID</span>
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(item.transactionId);
                                  toast.success("Transaction ID copied!");
                                }}
                                className="text-slate-400 hover:text-slate-700 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-slate-900 truncate select-all">
                              {item.transactionId}
                            </span>
                          </div>
                        </div>

                        {/* Rejection Note */}
                        {isRejected && item.rejectionReason && (
                          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 flex items-start gap-2 shadow-2xs">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-black block text-[11px] uppercase tracking-wider text-rose-800">
                                Rejection Reason:
                              </span>
                              <p className="text-xs text-rose-800 font-medium leading-relaxed">{item.rejectionReason}</p>
                            </div>
                          </div>
                        )}

                        {/* Screenshot thumbnail / preview button */}
                        {item.screenshotUrl && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Payment Receipt Proof:
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewModalUrl(item.screenshotUrl)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Receipt Proof</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lightbox / Modal for Screenshot Proof */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 text-white">
              <span className="text-xs font-bold text-slate-300">Payment Proof Receipt</span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-auto">
              <img
                src={previewModalUrl}
                alt="Payment proof receipt"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-md"
              />
            </div>
            <div className="p-2 text-center">
              <a
                href={previewModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Open in Full Window &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
