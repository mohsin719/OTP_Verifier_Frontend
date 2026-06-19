"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

type AdminLogRow = {
  id: string;
  action: string;
  adminEmail: string;
  adminPublicId: string;
  targetPublicId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_FILTERS = ["ALL", "balance_adjust", "balance_transfer"];

export default function AdminLogsPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(actionFilter !== "ALL" && { action: actionFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, mutate } = useApi<{
    items: AdminLogRow[];
    total: number;
  }>(`/api/admin/logs?${query.toString()}`, {
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

  const refreshLogs = async () => {
    if (!token) return;
    setIsRefreshing(true);
    const fresh = await apiFetch<{ items: AdminLogRow[]; total: number }>(
      `/api/admin/logs?${query.toString()}&refresh=true`,
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
    toast.success("Admin logs refreshed from backend.");
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      ban: "bg-red-500/10 text-red-500",
      unban: "bg-green-500/10 text-green-500",
      balance_adjust: "bg-blue-500/10 text-blue-500",
      otp_actions: "bg-purple-500/10 text-purple-500",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs ${
          colors[action] || "bg-gray-500/10 text-gray-500"
        }`}
      >
        {action}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Logs</h1>
        <p className="text-muted-foreground">Audit trail of all admin actions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ACTION_FILTERS.map((action) => (
              <Button
                key={action}
                size="sm"
                variant={actionFilter === action ? "default" : "outline"}
                onClick={() => {
                  setActionFilter(action);
                  setPage(1);
                }}
              >
                {action}
              </Button>
            ))}
            <Input
              id="admin-logs-search"
              name="admin-logs-search"
              className="max-w-sm"
              placeholder="Search by action, admin, or user ID..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Logs ({total})</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshLogs}
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
                      <th className="pb-2">Admin</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Target User</th>
                      <th className="pb-2">Metadata</th>
                      <th className="pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="py-2">
                          <span className="font-mono text-xs">{row.adminPublicId}</span>
                          <br />
                          <span className="text-muted-foreground">{row.adminEmail}</span>
                        </td>
                        <td className="py-2">{getActionBadge(row.action)}</td>
                        <td className="py-2 font-mono text-xs">
                          {row.targetPublicId ?? "—"}
                        </td>
                        <td className="py-2">
                          {row.metadata ? (
                            <pre className="max-w-xs overflow-x-auto text-xs text-muted-foreground">
                              {JSON.stringify(row.metadata, null, 2)}
                            </pre>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(row.createdAt).toLocaleString()}
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
