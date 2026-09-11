"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  Smartphone,
  Wallet,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { useCurrencyStore, formatDualBalance, formatDualPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

type TxRow = {
  id: string;
  type: string;
  amountPkr: number;
  direction: "in" | "out";
  description: string;
  adminNote: string | null;
  reference: string | null;
  createdAt: string;
};

type TxSummary = {
  totalInPkr: number;
  totalOutPkr: number;
  netPkr: number;
  count: number;
  adminTopupsPkr: number;
  numberSpendPkr: number;
  refundsPkr: number;
};

type TxResponse = {
  items: TxRow[];
  total: number;
  summary: TxSummary;
};

function ApiErrorPanel({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}): React.ReactElement {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
      <WifiOff className="mx-auto mb-3 h-8 w-8 text-amber-500" />
      <p className="font-bold text-slate-800">{message}</p>
      {isLocal ? (
        <p className="mt-2 text-xs text-slate-500">
          Local backend check: make sure backend is running on port 4000.
        </p>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        className="mt-4 gap-2 border-slate-200 font-semibold"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
        {isRetrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TX_TYPE_VISUAL: Record<
  string,
  { label: string; icon: LucideIcon; iconWrap: string; iconColor: string; chip: string }
> = {
  DEBIT: {
    label: "Number Lease",
    icon: Smartphone,
    iconWrap: "bg-amber-50 border border-amber-200",
    iconColor: "text-amber-600",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REFUND: {
    label: "Auto-Refund",
    icon: RotateCcw,
    iconWrap: "bg-emerald-50 border border-emerald-200",
    iconColor: "text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
  },
  ADMIN_ADJUSTMENT: {
    label: "Balance Top-Up",
    icon: ShieldCheck,
    iconWrap: "bg-blue-50 border border-blue-200",
    iconColor: "text-blue-600",
    chip: "bg-blue-50 text-blue-700 border-blue-200 font-bold",
  },
  CREDIT: {
    label: "Deposit",
    icon: ArrowDownLeft,
    iconWrap: "bg-emerald-50 border border-emerald-200",
    iconColor: "text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

function getTxTypeVisual(type: string) {
  return (
    TX_TYPE_VISUAL[type] ?? {
      label: type.replace(/_/g, " "),
      icon: Banknote,
      iconWrap: "bg-slate-100 border border-slate-200",
      iconColor: "text-slate-600",
      chip: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
}

function TxDescriptionCell({
  description,
  type,
}: {
  description: string;
  type: string;
}): React.ReactElement {
  const visual = getTxTypeVisual(type);
  const Icon = visual.icon;

  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          visual.iconWrap,
        )}
      >
        <Icon className={cn("h-4 w-4", visual.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-xs sm:text-sm text-slate-800 leading-snug">{description}</p>
        <span
          className={cn(
            "mt-0.5 inline-flex shrink-0 rounded-md border px-1.5 py-0.2 text-[10px] font-semibold tracking-wide",
            visual.chip,
          )}
        >
          {visual.label}
        </span>
      </div>
    </div>
  );
}

export default function WalletPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { balancePkr, isLoading, setBalance, ownerUserId } = useWalletStore();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return params.toString();
  }, [page, limit]);

  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
    isValidating: txValidating,
    mutate: refreshTx,
  } = useApi<TxResponse>(`/api/transactions?${queryString}`, {
    keepPreviousData: true,
  });

  const {
    data: walletData,
    error: walletError,
    isValidating: walletValidating,
    mutate: refreshWallet,
  } = useApi<{ balancePkr: number }>("/api/wallet");

  const items = txData?.items ?? [];
  const total = txData?.total ?? 0;
  const summary = txData?.summary;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const { exchangeRate, fetchExchangeRate } = useCurrencyStore();

  useEffect(() => {
    void fetchExchangeRate();
  }, [fetchExchangeRate]);

  const dualBalance = formatDualBalance(balancePkr, exchangeRate);

  useEffect(() => {
    if (walletData && user?.id) {
      setBalance(walletData.balancePkr, user.id);
    }
  }, [walletData, setBalance, user?.id]);

  const pkrAmountFormatter = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const retryAll = () => {
    void refreshWallet();
    void refreshTx();
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 pb-4 pt-2 sm:pt-4">
      {/* ─── Top Header with Balance & Action CTA ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Wallet className="h-4 w-4" />
            <span>Financial Overview &amp; Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Wallet &amp; Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your balance, add funds, and inspect automated carrier charges and refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm hover:shadow-md transition-all gap-1.5 rounded-xl h-9.5 px-4 cursor-pointer"
          >
            <Link href="/deposit">
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Deposit Funds</span>
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-slate-200 font-semibold text-slate-700 rounded-xl h-9.5 hover:bg-slate-50"
            onClick={retryAll}
            disabled={txValidating || walletValidating}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", (txValidating || walletValidating) && "animate-spin")}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {walletError ? (
        <ApiErrorPanel
          message={walletError.message}
          onRetry={retryAll}
          isRetrying={walletValidating}
        />
      ) : null}

      {/* ─── Main Metrics Grid ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Available Balance */}
        <Card className="border-slate-200 bg-white shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <CardContent className="p-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Available Balance
              </span>
              <Link
                href="/deposit"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                + Add
              </Link>
            </div>
            {balancePkr === null || isLoading || ownerUserId !== user?.id ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-slate-900 leading-none">
                  {dualBalance.usd}
                </p>
                <p className="text-xs font-bold text-slate-500 tabular-nums mt-1">
                  ≈ {dualBalance.pkr}
                </p>
              </div>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Auto-refunded if no SMS arrives</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Top-ups (Money In) */}
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-2xs relative overflow-hidden">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="p-4 pt-4 flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total Inflow
              </p>
              <p className="text-xl font-black tabular-nums text-emerald-700 mt-0.5 leading-tight">
                {summary ? `+${formatDualPrice(summary.totalInPkr, exchangeRate).usd}` : "—"}
              </p>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                {summary ? `(${formatDualPrice(summary.totalInPkr, exchangeRate).pkr})` : "Deposits & refunds"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Spent (Money Out) */}
        <Card className="border-slate-200 bg-white shadow-2xs relative overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-rose-500" />
          <CardContent className="p-4 pt-4 flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Spent
              </p>
              <p className="text-xl font-black tabular-nums text-slate-900 mt-0.5 leading-tight">
                {summary ? formatDualPrice(summary.totalOutPkr, exchangeRate).usd : "—"}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {summary ? `(${formatDualPrice(summary.totalOutPkr, exchangeRate).pkr})` : "Successful leases only"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Transactions count */}
        <Card className="border-slate-200 bg-white shadow-2xs relative overflow-hidden">
          <div className="h-1 w-full bg-blue-500" />
          <CardContent className="p-4 pt-4 flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ledger Entries
              </p>
              <p className="text-xl font-black tabular-nums text-slate-900 mt-0.5">
                {summary?.count ?? "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Audited transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Breakdown Strip ─── */}
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Wallet Recharges &amp; Top-Ups</span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-slate-900">
              Rs {pkrAmountFormatter.format(summary.adminTopupsPkr)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Credited to your balance</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Smartphone className="h-4 w-4 text-amber-600" />
              <span>Dedicated Number Spend</span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-slate-900">
              Rs {pkrAmountFormatter.format(summary.numberSpendPkr)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Paid only when OTP was delivered</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <RotateCcw className="h-4 w-4 text-emerald-600" />
              <span>Automatic Refunds Restored</span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-emerald-700">
              Rs {pkrAmountFormatter.format(summary.refundsPkr)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">100% money back on timed-out lines</p>
          </div>
        </div>
      ) : null}

      {/* ─── Transaction History Table ─── */}
      <Card className="border-slate-200 bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                <span>Transaction History</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Complete timeline of top-ups, line deductions, and automatic balance restorations.
              </CardDescription>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold text-slate-400">
              {total} Total Transactions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {txError ? (
            <ApiErrorPanel
              message={txError.message}
              onRetry={() => void refreshTx()}
              isRetrying={txValidating}
            />
          ) : txLoading && !txData ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase font-bold tracking-wider text-slate-400">
                      <th className="pb-3 pr-4">Date &amp; Time</th>
                      <th className="pb-3 pr-4">Activity &amp; Type</th>
                      <th className="pb-3 pr-4 text-emerald-700">In (+PKR)</th>
                      <th className="pb-3 pr-4 text-slate-700">Out (-PKR)</th>
                      <th className="pb-3">Admin Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 pr-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <TxDescriptionCell
                            description={row.description}
                            type={row.type}
                          />
                        </td>
                        <td className="py-3.5 pr-4 tabular-nums font-mono">
                          {row.direction === "in" ? (() => {
                            const dual = formatDualPrice(row.amountPkr, exchangeRate);
                            return (
                              <div className="inline-flex flex-col">
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-bold">
                                  +{dual.usd}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 pl-0.5 mt-0.5">
                                  ({dual.pkr})
                                </span>
                              </div>
                            );
                          })() : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 tabular-nums font-mono">
                          {row.direction === "out" ? (() => {
                            const dual = formatDualPrice(Math.abs(row.amountPkr), exchangeRate);
                            return (
                              <div className="inline-flex flex-col">
                                <span className="text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-xs font-bold">
                                  -{dual.usd}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 pl-0.5 mt-0.5">
                                  ({dual.pkr})
                                </span>
                              </div>
                            );
                          })() : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 text-xs text-slate-600 max-w-[200px]">
                          {row.adminNote ? (
                            <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md truncate font-medium">
                              {row.adminNote}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="space-y-3 md:hidden">
                {items.map((row) => {
                  const visual = getTxTypeVisual(row.type);
                  const Icon = visual.icon;
                  const dual = formatDualPrice(Math.abs(row.amountPkr), exchangeRate);
                  return (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              visual.iconWrap,
                            )}
                          >
                            <Icon className={cn("h-4 w-4", visual.iconColor)} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-snug">{row.description}</p>
                            <span
                              className={cn(
                                "mt-0.5 inline-flex rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase",
                                visual.chip,
                              )}
                            >
                              {visual.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span
                            className={cn(
                              "font-mono text-xs sm:text-sm font-black tabular-nums px-2 py-0.5 rounded-md",
                              row.direction === "in"
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                : "text-slate-900 bg-slate-100 border border-slate-200",
                            )}
                          >
                            {row.direction === "in" ? "+" : "−"}{dual.usd}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5 tabular-nums">
                            ({dual.pkr})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{formatDateTime(row.createdAt)}</span>
                        {row.adminNote ? (
                          <span className="font-semibold text-blue-600 truncate max-w-[160px]">
                            {row.adminNote}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {items.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40">
                  <p className="font-bold text-slate-700">No transactions recorded yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add balance or lease a number from the Services tab to see transactions here.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <Link href="/deposit">Add Balance Now</Link>
                  </Button>
                </div>
              ) : null}

              {/* ─── Pagination Controls ─── */}
              {total > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500 order-2 sm:order-1">
                    Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
                    <span className="font-semibold text-slate-800">{Math.min(page * limit, total)}</span> of{" "}
                    <span className="font-semibold text-slate-800">{total}</span> transactions
                  </p>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5 order-1 sm:order-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Prev
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setPage(pageNum)}
                              className={cn(
                                "h-8 min-w-[2rem] px-2 rounded-lg text-xs font-bold transition-colors",
                                page === pageNum
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-slate-100",
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
