"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  RefreshCw,
  RotateCcw,
  Shield,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type TxRow = {
  id: string;
  userPublicId: string;
  email: string;
  amountPkr: number;
  direction: "in" | "out";
  type: string;
  description: string;
  adminNote: string | null;
  platform: string | null;
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

const TYPE_FILTERS = ["ALL", "DEBIT", "REFUND", "ADMIN_ADJUSTMENT", "CREDIT"] as const;

const TX_TYPE_VISUAL: Record<
  string,
  { label: string; icon: LucideIcon; chip: string }
> = {
  DEBIT: {
    label: "Charge",
    icon: Smartphone,
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  },
  REFUND: {
    label: "Refund",
    icon: RotateCcw,
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
  ADMIN_ADJUSTMENT: {
    label: "Admin",
    icon: Shield,
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  },
  CREDIT: {
    label: "Credit",
    icon: ArrowDownLeft,
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  },
};

const PLATFORM_CHIP: Record<string, string> = {
  Facebook: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Amazon: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  WhatsApp: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Others: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
};

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

function getTxVisual(type: string) {
  return (
    TX_TYPE_VISUAL[type] ?? {
      label: type.replace(/_/g, " "),
      icon: Banknote,
      chip: "bg-secondary text-muted-foreground border-border/50",
    }
  );
}

export default function AdminTransactionsPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(debouncedUserSearch && { search: debouncedUserSearch }),
    ...(typeFilter !== "ALL" && { type: typeFilter }),
  });

  const { data, isLoading, mutate } = useApi<TxResponse>(
    `/api/manage/transactions?${query.toString()}`,
    { cacheTtlMs: 30_000, keepPreviousData: true },
  );

  const items = data?.items ?? null;
  const total = data?.total ?? 0;
  const summary = data?.summary;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [userSearch]);

  const refreshTransactions = async () => {
    if (!token) return;
    setIsRefreshing(true);
    const fresh = await apiFetch<TxResponse>(
      `/api/manage/transactions?${query.toString()}&refresh=true`,
      {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      },
    );
    setIsRefreshing(false);

    if (!fresh.success) {
      toast.error(fresh.error);
      return;
    }

    mutate(fresh.data, { revalidate: false });
    toast.success("Transactions refreshed.");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
          <p className="text-muted-foreground">
            Platform-wide ledger — charges, refunds, and admin adjustments with platform context.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void refreshTransactions()}
          disabled={isRefreshing}
          className="gap-2 self-start"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading && !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Number spend</CardDescription>
              <CardTitle className="text-2xl text-amber-300">
                Rs {summary.numberSpendPkr}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Refunds</CardDescription>
              <CardTitle className="text-2xl text-emerald-400">
                Rs {summary.refundsPkr}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admin top-ups</CardDescription>
              <CardTitle className="text-2xl">Rs {summary.adminTopupsPkr}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total entries</CardDescription>
              <CardTitle className="text-2xl">{summary.count}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="admin-transactions-search" className="text-sm font-medium">
              Search by user
            </label>
            <Input
              id="admin-transactions-search"
              placeholder="Public ID or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="mt-2 max-w-md"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={typeFilter === type ? "default" : "outline"}
                onClick={() => {
                  setTypeFilter(type);
                  setPage(1);
                }}
              >
                {type === "ALL" ? "All types" : type.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !items ? (
            <Skeleton className="h-64 w-full" />
          ) : !items ? null : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">When</th>
                      <th className="pb-3 pr-4 font-medium">User</th>
                      <th className="pb-3 pr-4 font-medium">Description</th>
                      <th className="pb-3 pr-4 font-medium">Platform</th>
                      <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => {
                      const visual = getTxVisual(t.type);
                      const Icon = visual.icon;
                      const amountAbs = Math.abs(t.amountPkr);

                      return (
                        <tr key={t.id} className="border-b border-border/50">
                          <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                            {formatDateTime(t.createdAt)}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-mono text-xs font-medium">{t.userPublicId}</p>
                            <p className="text-xs text-muted-foreground">{t.email}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-start gap-3 min-w-[220px]">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/40">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-foreground">{t.description}</p>
                                  <span
                                    className={cn(
                                      "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                      visual.chip,
                                    )}
                                  >
                                    {visual.label}
                                  </span>
                                </div>
                                {t.adminNote ? (
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                    Note: {t.adminNote}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {t.platform ? (
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                  PLATFORM_CHIP[t.platform] ??
                                    "border-border/50 bg-secondary/30",
                                )}
                              >
                                {t.platform}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            <span
                              className={cn(
                                "inline-flex items-center justify-end gap-1 font-semibold",
                                t.direction === "in" ? "text-emerald-400" : "text-red-400",
                              )}
                            >
                              {t.direction === "in" ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                              {t.direction === "in" ? "+" : "−"}Rs {amountAbs}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {items.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No transactions match your filters.
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} – {Math.min(page * limit, total)} of {total}
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
