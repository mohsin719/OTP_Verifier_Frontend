"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

type Tx = {
  id: string;
  userPublicId: string;
  email: string;
  amountPkr: number;
  type: string;
  reference: string | null;
  createdAt: string;
};

export default function AdminTransactionsPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const pkrFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(debouncedUserSearch && { search: debouncedUserSearch }),
  });

  const { data, isLoading, mutate } = useApi<{
    items: Tx[];
    total: number;
  }>(`/api/manage/transactions?${query.toString()}`, {
    cacheTtlMs: 30_000,
  });

  const items = data?.items ?? null;
  const total = data?.total ?? 0;

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
    const fresh = await apiFetch<{ items: Tx[]; total: number }>(
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
    toast.success("Transactions refreshed from backend.");
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CREDIT: "bg-green-500/10 text-green-500",
      DEBIT: "bg-red-500/10 text-red-500",
      ADMIN_ADJUSTMENT: "bg-purple-500/10 text-purple-500",
      NUMBER_PURCHASE: "bg-blue-500/10 text-blue-500",
      OTP_BILLING: "bg-yellow-500/10 text-yellow-500",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs ${
          colors[type] || "bg-gray-500/10 text-gray-500"
        }`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
        <p className="text-muted-foreground">Platform-wide ledger activity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div>
              <label htmlFor="admin-transactions-search" className="text-sm font-medium">Search by User</label>
              <Input
                id="admin-transactions-search"
                name="admin-transactions-search"
                placeholder="Search by public ID or email..."
                value={userSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setUserSearch(e.target.value);
                }}
                className="mt-2 max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Transactions ({total})</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshTransactions}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !items ? null : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2">When</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t.id} className="border-b border-border/60">
                        <td className="py-2 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2">
                          <span className="font-mono text-xs">{t.userPublicId}</span>
                          <br />
                          <span className="text-muted-foreground">{t.email}</span>
                        </td>
                        <td className="py-2 tabular-nums">
                          {pkrFormatter.format(t.amountPkr)}
                        </td>
                        <td className="py-2">{getTypeBadge(t.type)}</td>
                        <td className="py-2 text-muted-foreground">
                          {t.reference ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
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
