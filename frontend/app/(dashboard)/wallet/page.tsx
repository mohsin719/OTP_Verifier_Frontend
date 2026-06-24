"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  RefreshCw,
  RotateCcw,
  Shield,
  Smartphone,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
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
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
      <WifiOff className="mx-auto mb-3 h-8 w-8 text-amber-400" />
      <p className="font-medium">{message}</p>
      {isLocal ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Local dev: start backend with{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">npm run dev</code> in{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">OTP_Verifier</code>.
        </p>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        className="mt-4 gap-2"
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
    label: "Charge",
    icon: Smartphone,
    iconWrap: "bg-amber-500/15",
    iconColor: "text-amber-400",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  },
  REFUND: {
    label: "Refund",
    icon: RotateCcw,
    iconWrap: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
  ADMIN_ADJUSTMENT: {
    label: "Admin",
    icon: Shield,
    iconWrap: "bg-violet-500/15",
    iconColor: "text-violet-400",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  },
  CREDIT: {
    label: "Credit",
    icon: ArrowDownLeft,
    iconWrap: "bg-sky-500/15",
    iconColor: "text-sky-400",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  },
};

function getTxTypeVisual(type: string) {
  return (
    TX_TYPE_VISUAL[type] ?? {
      label: type.replace(/_/g, " "),
      icon: Banknote,
      iconWrap: "bg-secondary",
      iconColor: "text-muted-foreground",
      chip: "bg-secondary text-muted-foreground border-border/50",
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
    <div className="flex items-center gap-3 min-w-[200px]">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          visual.iconWrap,
        )}
      >
        <Icon className={cn("h-4 w-4", visual.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-medium leading-snug text-foreground">{description}</p>
          <span
            className={cn(
              "inline-flex shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              visual.chip,
            )}
          >
            {visual.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { balancePkr, isLoading, setBalance, ownerUserId } = useWalletStore();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

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

  useEffect(() => {
    if (walletData && user?.id) {
      setBalance(walletData.balancePkr, user.id);
    }
  }, [walletData, setBalance, user?.id]);

  const pkrBalanceFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });
  const pkrAmountFormatter = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const retryAll = () => {
    void refreshWallet();
    void refreshTx();
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">
            Balance, money in/out summary, and full transaction history.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 self-start"
          onClick={retryAll}
          disabled={txValidating || walletValidating}
        >
          <RefreshCw
            className={cn("h-4 w-4", (txValidating || walletValidating) && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {walletError ? (
        <ApiErrorPanel
          message={walletError.message}
          onRetry={retryAll}
          isRetrying={walletValidating}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current balance
            </p>
            {balancePkr === null || isLoading || ownerUserId !== user?.id ? (
              <Skeleton className="mt-2 h-9 w-32" />
            ) : (
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {pkrBalanceFormatter.format(balancePkr)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-500/15 p-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total received</p>
              <p className="text-xl font-semibold tabular-nums text-emerald-400">
                {summary ? `Rs ${pkrAmountFormatter.format(summary.totalInPkr)}` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-500/15 p-2">
              <ArrowUpRight className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total spent</p>
              <p className="text-xl font-semibold tabular-nums text-red-400">
                {summary ? `Rs ${pkrAmountFormatter.format(summary.totalOutPkr)}` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-secondary/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-sky-500/15 p-2">
              <Banknote className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-xl font-semibold tabular-nums">{summary?.count ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-violet-400" />
              Admin top-ups
            </div>
            <p className="mt-1 font-semibold tabular-nums text-violet-300">
              Rs {pkrAmountFormatter.format(summary.adminTopupsPkr)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
              Number charges
            </div>
            <p className="mt-1 font-semibold tabular-nums">
              Rs {pkrAmountFormatter.format(summary.numberSpendPkr)}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-emerald-400" />
              Refunds received
            </div>
            <p className="mt-1 font-semibold tabular-nums text-emerald-400">
              Rs {pkrAmountFormatter.format(summary.refundsPkr)}
            </p>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>
            When money came in, when it went out, and admin notes on balance changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {txError ? (
            <ApiErrorPanel
              message={txError.message}
              onRetry={() => void refreshTx()}
              isRetrying={txValidating}
            />
          ) : txLoading && !txData ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Description</th>
                      <th className="pb-3 pr-4 font-medium">In</th>
                      <th className="pb-3 pr-4 font-medium">Out</th>
                      <th className="pb-3 font-medium">Admin note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-border/40">
                        <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <TxDescriptionCell
                            description={row.description}
                            type={row.type}
                          />
                        </td>
                        <td className="py-3 pr-4 tabular-nums font-medium text-emerald-400">
                          {row.direction === "in"
                            ? `+Rs ${pkrAmountFormatter.format(row.amountPkr)}`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 tabular-nums font-medium text-red-400">
                          {row.direction === "out"
                            ? `Rs ${pkrAmountFormatter.format(Math.abs(row.amountPkr))}`
                            : "—"}
                        </td>
                        <td className="max-w-[220px] py-3 text-sm text-muted-foreground">
                          {row.adminNote ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {items.map((row) => {
                  const visual = getTxTypeVisual(row.type);
                  const Icon = visual.icon;
                  return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          visual.iconWrap,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", visual.iconColor)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">{row.description}</p>
                            <span
                              className={cn(
                                "mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                visual.chip,
                              )}
                            >
                              {visual.label}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-sm font-bold tabular-nums",
                              row.direction === "in" ? "text-emerald-400" : "text-red-400",
                            )}
                          >
                            {row.direction === "in" ? "+" : "−"}Rs{" "}
                            {pkrAmountFormatter.format(Math.abs(row.amountPkr))}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(row.createdAt)}
                        </p>
                      </div>
                    </div>
                    {row.adminNote ? (
                      <p className="rounded-lg bg-violet-500/10 px-2 py-1.5 text-xs text-violet-200">
                        <span className="font-medium">Admin: </span>
                        {row.adminNote}
                      </p>
                    ) : null}
                  </div>
                  );
                })}
              </div>

              {items.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No transactions yet.</p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
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
