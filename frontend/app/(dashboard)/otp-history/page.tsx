"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Copy,
  History,
  RotateCcw,
  Smartphone,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  status: string;
  statusLabel: string;
  parsedOtp: string | null;
  phoneNumber: string;
  platform: string;
  serviceType: string | null;
  priceAtRequestPkr: number | null;
  refunded: boolean;
  refundAmountPkr: number | null;
  createdAt: string;
  expiresAt: string | null;
};

type Summary = {
  totalAttempts: number;
  successful: number;
  pending: number;
  expired: number;
  failed: number;
  totalChargedPkr: number;
  totalRefundedPkr: number;
};

type HistoryResponse = {
  items: Row[];
  total: number;
  summary: Summary;
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All tries" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Waiting" },
  { value: "EXPIRED", label: "Expired" },
  { value: "FAILED", label: "Failed" },
] as const;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatPkr(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `Rs ${amount}`;
}

function StatusBadge({
  status,
  statusLabel,
  refunded,
}: {
  status: string;
  statusLabel: string;
  refunded: boolean;
}): React.ReactElement {
  const chip =
    statusLabel === "Success" || status === "RECEIVED"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : status === "PENDING"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : refunded
          ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
          : status === "FAILED"
            ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
            : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold shrink-0",
        chip,
      )}
    >
      {statusLabel}
    </span>
  );
}

export default function OtpHistoryPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(statusFilter !== "ALL" && { status: statusFilter }),
  });

  const { data, isLoading } = useApi<HistoryResponse>(
    `/api/otp/history?${query.toString()}`,
    { keepPreviousData: true },
  );

  const rows = data?.items ?? null;
  const total = data?.total ?? 0;
  const summary = data?.summary;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-5 sm:space-y-8 px-1 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          OTP History
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Every number you tried — success, waiting, expired, and failed attempts with charges and refunds.
        </p>
      </div>

      {isLoading && !summary ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Total tries</span>
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-black">{summary.totalAttempts}</CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0 text-[11px] sm:text-xs text-muted-foreground truncate">
              {summary.successful} success · {summary.pending} waiting
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Successful</span>
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.successful}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0 text-[11px] sm:text-xs text-muted-foreground truncate">
              OTP received & verified
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Total charged</span>
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-black">{formatPkr(summary.totalChargedPkr)}</CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0 text-[11px] sm:text-xs text-muted-foreground truncate">
              Across all numbers
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                <span className="truncate">Refunded</span>
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">
                {formatPkr(summary.totalRefundedPkr)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0 text-[11px] sm:text-xs text-muted-foreground truncate">
              {summary.expired} expired · {summary.failed} failed
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">All attempts</CardTitle>
              <CardDescription className="text-xs">Filter by status to find a specific try.</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? "default" : "outline"}
                className={cn(
                  "h-8 px-2.5 text-xs sm:h-9 sm:px-3.5 sm:text-xs rounded-xl font-bold transition-all cursor-pointer",
                  statusFilter === f.value
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                    : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-6 pt-2">
          {isLoading && !rows ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : !rows ? null : (
            <>
              {/* Mobile Card List View (Visible on < md screens) */}
              <div className="space-y-2.5 md:hidden">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border/80 bg-card/70 p-3 shadow-2xs space-y-2.5 transition-colors"
                  >
                    {/* Top Row: Phone Number + Copy + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono font-bold text-xs sm:text-sm text-foreground truncate">
                          {r.phoneNumber}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                          onClick={() => {
                            void navigator.clipboard.writeText(r.phoneNumber);
                            toast.success("Phone number copied!");
                          }}
                          title="Copy Phone Number"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <StatusBadge
                        status={r.status}
                        statusLabel={r.statusLabel}
                        refunded={r.refunded}
                      />
                    </div>

                    {/* Middle Row: Platform & OTP Box */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Platform
                        </span>
                        <span className="text-xs font-semibold text-foreground capitalize">
                          {r.platform}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          OTP Code
                        </span>
                        {r.parsedOtp ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                              {r.parsedOtp}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer shrink-0"
                              onClick={() => {
                                void navigator.clipboard.writeText(r.parsedOtp!);
                                toast.success("OTP copied!");
                              }}
                              title="Copy OTP"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : r.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            <Clock className="h-3 w-3 animate-pulse" />
                            Waiting
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Cost, Refund, Date */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>
                          Charge: <strong className="text-foreground">{r.priceAtRequestPkr != null ? formatPkr(r.priceAtRequestPkr) : "—"}</strong>
                        </span>
                        {r.refunded && r.refundAmountPkr != null && (
                          <span className="inline-flex items-center rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                            Refunded {formatPkr(r.refundAmountPkr)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Hidden on mobile < md, visible on md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-3 pr-4 font-semibold">Number</th>
                      <th className="pb-3 pr-4 font-semibold">Platform</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 pr-4 font-semibold">Charge</th>
                      <th className="pb-3 pr-4 font-semibold">Refund</th>
                      <th className="pb-3 pr-4 font-semibold">OTP</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-mono text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span>{r.phoneNumber}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => {
                                void navigator.clipboard.writeText(r.phoneNumber);
                                toast.success("Phone number copied!");
                              }}
                              title="Copy Phone Number"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4 capitalize font-medium">{r.platform}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            status={r.status}
                            statusLabel={r.statusLabel}
                            refunded={r.refunded}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          {r.priceAtRequestPkr != null ? (
                            <span className="text-amber-600 dark:text-amber-300 font-semibold">
                              {formatPkr(r.priceAtRequestPkr)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {r.refunded && r.refundAmountPkr != null ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatPkr(r.refundAmountPkr)}
                            </span>
                          ) : r.status === "EXPIRED" || r.status === "FAILED" ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {r.parsedOtp ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {r.parsedOtp}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                                onClick={() => {
                                  void navigator.clipboard.writeText(r.parsedOtp!);
                                  toast.success("OTP copied!");
                                }}
                                title="Copy OTP"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : r.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                              <Clock className="h-3.5 w-3.5 animate-pulse" />
                              Waiting
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="h-3.5 w-3.5" />
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-1">
                  <History className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-medium text-sm">
                    {statusFilter === "ALL"
                      ? "No OTP attempts yet. Get a number from the dashboard to start."
                      : `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase() ?? "matching"} attempts found.`}
                  </p>
                </div>
              ) : null}

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/60">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
