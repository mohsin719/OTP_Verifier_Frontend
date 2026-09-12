"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PaymentMethodIcon } from "@/components/payment/payment-icons";
import { useTopupNotificationStore } from "@/stores/topup-notification-store";

type AdminTopupRow = {
  id: string;
  requestNumber: string;
  userId: string;
  usernameSnapshot: string;
  emailSnapshot: string;
  paymentMethod: string;
  amount: number;
  amountUsd?: number | null;
  currency: string;
  transactionId: string;
  senderDetails?: string | null;
  screenshotUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: {
    publicId?: string;
    username?: string;
    email?: string;
  } | null;
  reviewer?: {
    publicId: string;
    username: string;
  } | null;
};

type AdminTopupResponse = {
  items: AdminTopupRow[];
  total: number;
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  page: number;
  limit: number;
};

const STATUS_FILTERS = [
  { id: "ALL", label: "All Requests" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
] as const;

const QUICK_REJECTION_REASONS = [
  "Transaction ID not found in bank/wallet records",
  "Funds not received in official receiving account",
  "Payment proof screenshot is blurry or unreadable",
  "Duplicate submission / already credited",
  "Incorrect amount submitted",
];

export default function AdminTopupsPage() {
  const token = useAuthStore((s) => s.token);
  const setNotificationCounts = useTopupNotificationStore((s) => s.setCounts);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState<AdminTopupResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [approvingItem, setApprovingItem] = useState<AdminTopupRow | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<AdminTopupRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Read URL search parameter (e.g. from Resend email link: ?search=TR-...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  const loadRequests = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery.trim()) {
        queryParams.set("search", searchQuery.trim());
      }

      const res = await apiFetch<AdminTopupResponse>(`/api/manage/topups?${queryParams.toString()}`, {
        accessToken: token,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to load top-up requests.");
        return;
      }

      if (res.data) {
        setData(res.data);
        if (res.data.counts) {
          setNotificationCounts(res.data.counts);
        }
      }
    } catch {
      toast.error("Network error while loading top-up requests.");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, page, limit, searchQuery, setNotificationCounts]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleApprove = async () => {
    if (!token || !approvingItem || isApproving) return;
    setIsApproving(true);
    try {
      const res = await apiFetch(`/api/manage/topups/${approvingItem.id}/approve`, {
        method: "POST",
        accessToken: token,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to approve request.");
        return;
      }

      toast.success(
        `Top-up #${approvingItem.requestNumber} approved! Credited Rs ${approvingItem.amount.toLocaleString()} PKR to ${approvingItem.usernameSnapshot}.`
      );
      setApprovingItem(null);
      void loadRequests(true);
    } catch {
      toast.error("Failed to approve top-up request.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectingItem || isRejecting) return;
    setIsRejecting(true);
    try {
      const res = await apiFetch(`/api/manage/topups/${rejectingItem.id}/reject`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() || undefined }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to reject request.");
        return;
      }

      toast.success(`Top-up #${rejectingItem.requestNumber} rejected.`);
      setRejectingItem(null);
      setRejectionReason("");
      void loadRequests(true);
    } catch {
      toast.error("Failed to reject top-up request.");
    } finally {
      setIsRejecting(false);
    }
  };

  const counts = data?.counts || { all: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/70">
              <ArrowDownToLine className="h-3.5 w-3.5 text-blue-600" />
              <span>Financial Operations &amp; Verification</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Top-up Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verify manual customer deposits across Binance Pay, USDT, JazzCash, and EasyPaisa with real-time atomic ledger crediting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="gap-2 h-9 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Security Warning Banner */}
      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 text-xs flex items-start gap-3 shadow-2xs">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100/90 text-amber-700 border border-amber-300/60 mt-0.5">
          <ShieldAlert className="h-4.5 w-4.5 text-amber-700" />
        </div>
        <div className="space-y-0.5">
          <strong className="font-extrabold text-amber-900 block text-xs">
            Important Admin Security Rule:
          </strong>
          <p className="text-amber-800 leading-relaxed font-medium">
            Do not consider a payment screenshot alone as proof of funds. Screenshots can easily be edited or falsified. Always independently verify the incoming funds with the corresponding Transaction ID / TxID in your Binance Merchant or Pakistani Bank account before clicking Approve.
          </p>
        </div>
      </div>

      {/* 4 Stat / Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Inquiries */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Total Inquiries
          </span>
          <p className="mt-1 text-3xl font-black text-slate-900 tabular-nums">
            {counts.all}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Lifetime deposit requests</span>
        </div>

        {/* Pending Review */}
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-2xs transition-all",
            counts.pending > 0
              ? "border-amber-300 bg-amber-50/80 ring-2 ring-amber-400/20"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Pending Review
            </span>
            {counts.pending > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}
          </div>
          <p className="mt-1 text-3xl font-black text-amber-900 tabular-nums">
            {counts.pending}
          </p>
          <span className="text-[10px] text-amber-700/80 font-bold">
            {counts.pending === 1 ? "1 request awaiting review" : `${counts.pending} requests awaiting review`}
          </span>
        </div>

        {/* Approved & Credited */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
            Approved &amp; Credited
          </span>
          <p className="mt-1 text-3xl font-black text-emerald-900 tabular-nums">
            {counts.approved}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Successfully processed</span>
        </div>

        {/* Rejected */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
            Rejected
          </span>
          <p className="mt-1 text-3xl font-black text-rose-900 tabular-nums">
            {counts.rejected}
          </p>
          <span className="text-[10px] text-rose-600 font-medium">Declined / invalid proof</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((tab) => {
            const isSelected = statusFilter === tab.id;
            const count =
              tab.id === "ALL"
                ? counts.all
                : tab.id === "PENDING"
                ? counts.pending
                : tab.id === "APPROVED"
                ? counts.approved
                : counts.rejected;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  isSelected
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : tab.id === "PENDING" && count > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200/80 text-slate-700"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user, request #, or TXID..."
            className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:bg-white focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Requests Table / Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Request # &amp; Date</th>
                <th className="py-3.5 px-4">Customer Info</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Transaction ID / TXID</th>
                <th className="py-3.5 px-4 text-center">Screenshot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (!data || data.items.length === 0) ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600 mx-auto mb-2.5" />
                    <p className="font-bold text-slate-700 text-xs">Loading top-up requests…</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <FileText className="h-9 w-9 text-slate-300 mx-auto mb-2 stroke-1" />
                    <p className="font-bold text-slate-700 text-sm">No top-up requests found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery ? "Try a different search query or clear filters." : "Incoming customer top-ups will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Request # & Date */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                        <span>#{row.requestNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(row.requestNumber, "Request Number")}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                          title="Copy Request Number"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-sans font-medium">
                        {new Date(row.createdAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>

                    {/* 2. Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{row.usernameSnapshot}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px] font-medium">
                        {row.emailSnapshot}
                      </div>
                      <div className="font-mono text-[10px] text-blue-700 font-semibold mt-0.5">
                        <span className="bg-blue-50 border border-blue-100 px-1 py-0.2 rounded">
                          ID: {row.user?.publicId || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* 3. Method with HD Brand Logo */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                        <PaymentMethodIcon iconKey={row.paymentMethod} code={row.paymentMethod} size={22} />
                        <span className="font-extrabold text-slate-800 text-xs capitalize whitespace-nowrap">
                          {row.paymentMethod.replace(/[-_]+/g, " ")}
                        </span>
                      </div>
                    </td>

                    {/* 4. Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-emerald-600 text-sm">
                        Rs {row.amount.toLocaleString()} PKR
                      </div>
                      {row.currency === "USD" && row.amountUsd && (
                        <div className="text-[10px] font-bold text-slate-500">
                          (${row.amountUsd} USD)
                        </div>
                      )}
                    </td>

                    {/* 5. TXID & Sender */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg truncate select-all">
                          {row.transactionId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(row.transactionId, "Transaction ID")}
                          className="text-slate-400 hover:text-slate-800 shrink-0 p-1 cursor-pointer"
                          title="Copy Transaction ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {row.senderDetails && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                          Sender: <strong className="text-slate-700 font-bold">{row.senderDetails}</strong>
                        </div>
                      )}
                    </td>

                    {/* 6. Screenshot Preview */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setPreviewScreenshotUrl(row.screenshotUrl)}
                        className="group relative h-11 w-11 mx-auto rounded-xl overflow-hidden border border-slate-200 bg-slate-100 block cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 shadow-2xs transition-all"
                        title="Click to view payment proof"
                      >
                        <img
                          src={row.screenshotUrl}
                          alt="Proof"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                          <Eye className="h-4 w-4 drop-shadow" />
                        </div>
                      </button>
                    </td>

                    {/* 7. Status */}
                    <td className="py-3.5 px-4">
                      {row.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 font-black text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          Pending Review
                        </span>
                      )}
                      {row.status === "APPROVED" && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 font-black text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Approved
                          </span>
                          {row.reviewer && (
                            <p className="text-[9px] text-slate-500 font-medium">by {row.reviewer.username}</p>
                          )}
                        </div>
                      )}
                      {row.status === "REJECTED" && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 font-black text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            Rejected
                          </span>
                          {row.rejectionReason && (
                            <p className="text-[10px] text-rose-700 max-w-[140px] truncate font-medium" title={row.rejectionReason}>
                              {row.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {row.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => setApprovingItem(row)}
                            className="h-7.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectingItem(row);
                              setRejectionReason("");
                            }}
                            className="h-7.5 px-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl cursor-pointer"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.total > limit && (
          <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span className="font-medium">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} requests
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7.5 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Previous
              </Button>
              <span className="font-black text-slate-800 px-2 text-xs">Page {page}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= data.total}
                className="h-7.5 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Screenshot Lightbox Modal */}
      {previewScreenshotUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewScreenshotUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Customer Payment Proof Screenshot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-900/5 flex items-center justify-center">
              <img
                src={previewScreenshotUrl}
                alt="Payment Proof"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <p className="text-slate-500 font-medium">
                Verify that all TXID characters match the bank receipt.
              </p>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <a href={previewScreenshotUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Resolution</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Approve Confirmation */}
      {approvingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isApproving && setApprovingItem(null)}
        >
          <div
            className="relative max-w-md w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Approve Top-up Request?</h3>
                <p className="text-xs text-slate-500 font-mono">Request #{approvingItem.requestNumber}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">
                  {approvingItem.usernameSnapshot} {approvingItem.user?.publicId ? `(${approvingItem.user.publicId})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Channel:</span>
                <span className="font-extrabold text-blue-700 capitalize">
                  {approvingItem.paymentMethod.replace(/[-_]+/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Amount to Credit:</span>
                <span className="font-black text-emerald-600 text-sm">
                  Rs {approvingItem.amount.toLocaleString()} PKR
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-2">
                <span className="text-slate-500 font-medium">Transaction ID / TxID:</span>
                <span className="font-mono font-bold text-slate-900 select-all">
                  {approvingItem.transactionId}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 space-y-1">
              <strong className="font-bold block text-amber-900">Atomic Ledger Guarantee:</strong>
              <p>
                Approving will immediately and atomically credit <strong>Rs {approvingItem.amount.toLocaleString()} PKR</strong> into the user&apos;s wallet balance and send an official confirmation email.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setApprovingItem(null)}
                disabled={isApproving}
                className="h-9 px-3 text-xs font-bold border-slate-200 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crediting Balance…
                  </>
                ) : (
                  "Confirm & Credit Balance"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Modal with Quick Presets */}
      {rejectingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isRejecting && setRejectingItem(null)}
        >
          <div
            className="relative max-w-md w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reject Top-up Request</h3>
                <p className="text-xs text-slate-500 font-mono">Request #{rejectingItem.requestNumber}</p>
              </div>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">
                Quick Rejection Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECTION_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer",
                      rejectionReason === preset
                        ? "bg-rose-50 border-rose-300 text-rose-800 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Custom Rejection Reason (Visible to Customer):
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for rejection..."
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              The user&apos;s wallet balance will not be modified. An automated notification email will be dispatched.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setRejectingItem(null)}
                disabled={isRejecting}
                className="h-9 px-3 text-xs font-bold border-slate-200 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting}
                className="h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting…
                  </>
                ) : (
                  "Reject Request"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
