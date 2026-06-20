"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

type NumberRow = {
  id: string;
  e164: string;
  status: "AVAILABLE" | "ASSIGNED" | "EXPIRED" | "REUSABLE";
  userPublicId: string | null;
  leasedUntil: string | null;
  telnyxSid: string | null;
  createdAt: string;
  updatedAt: string;
};

type SyncResult = {
  fetched: number;
  created: number;
  updated: number;
  removed: number;
};

const STATUS_FILTERS = ["ALL", "AVAILABLE", "ASSIGNED", "REUSABLE", "EXPIRED"] as const;

export default function AdminNumbersPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusColors = useMemo(
    () => ({
      AVAILABLE: "bg-emerald-500/10 text-emerald-500",
      ASSIGNED: "bg-amber-500/10 text-amber-500",
      REUSABLE: "bg-blue-500/10 text-blue-500",
      EXPIRED: "bg-zinc-500/10 text-zinc-500",
    }),
    [],
  );

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(statusFilter !== "ALL" && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, mutate } = useApi<{
    items: NumberRow[];
    total: number;
  }>(`/api/manage/numbers?${query.toString()}`, {
    cacheTtlMs: 30_000,
  });

  const items = data?.items ?? null;
  const total = data?.total ?? 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const syncFromTelnyx = async () => {
    if (!token) return;
    setSyncing(true);
    const res = await apiFetch<SyncResult>("/api/manage/numbers/sync", {
      method: "POST",
      accessToken: token,
    });
    setSyncing(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    const r = res.data;
    toast.success(
      `Sync complete — Fetched: ${r.fetched}, New: ${r.created}, Updated: ${r.updated}, Removed: ${r.removed}`,
    );

    const fresh = await apiFetch<{ items: NumberRow[]; total: number }>(
      `/api/manage/numbers?${query.toString()}&refresh=true`,
      {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      },
    );

    if (fresh.success) {
      mutate(fresh.data, { revalidate: false });
    } else {
      mutate();
    }
  };

  const refreshNumbers = async () => {
    if (!token) return;
    setIsRefreshing(true);
    const fresh = await apiFetch<{ items: NumberRow[]; total: number }>(
      `/api/manage/numbers?${query.toString()}&refresh=true`,
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
    toast.success("Numbers refreshed from backend.");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Numbers</h1>
          <p className="text-muted-foreground">
            Phone numbers are synced automatically from your Telnyx account every 10 minutes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshNumbers} disabled={isRefreshing} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={syncFromTelnyx} disabled={syncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync from Telnyx"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory ({total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {status}
              </Button>
            ))}
            <Input
              id="admin-numbers-search"
              name="admin-numbers-search"
              className="max-w-sm"
              placeholder="Search by number..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
              }}
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !items ? null : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2">Number</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Assigned User</th>
                      <th className="pb-2">Lease / Cooldown Ends</th>
                      <th className="pb-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((n) => (
                      <tr key={n.id} className="border-b border-border/60">
                        <td className="py-2 font-mono">{n.e164}</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs ${
                              statusColors[n.status] ?? "bg-zinc-500/10 text-zinc-500"
                            }`}
                          >
                            {n.status}
                          </span>
                        </td>
                        <td className="py-2">{n.userPublicId ?? "—"}</td>
                        <td className="py-2 text-muted-foreground">
                          {n.leasedUntil ? new Date(n.leasedUntil).toLocaleString() : "—"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(n.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
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
