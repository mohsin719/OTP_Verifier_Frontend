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

type OtpLogRow = {
  id: string;
  userPublicId: string;
  email: string;
  phone: string;
  serviceType: string | null;
  priceAtRequestPkr: number | null;
  status: string;
  refunded?: boolean;
  parsedOtp: string | null;
  createdAt: string;
};

const STATUS_FILTERS = ["ALL", "PENDING", "EXPIRED", "FAILED", "CONFIRM"] as const;

export default function AdminOtpLogsPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(statusFilter !== "ALL" && { status: statusFilter === "CONFIRM" ? "RECEIVED" : statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, mutate } = useApi<{
    items: OtpLogRow[];
    total: number;
  }>(`/api/manage/otp-logs?${query.toString()}`, {
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
    const fresh = await apiFetch<{ items: OtpLogRow[]; total: number }>(
      `/api/manage/otp-logs?${query.toString()}&refresh=true`,
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
    toast.success("OTP logs refreshed from backend.");
  };

  const getStatusBadge = (status: string, refunded?: boolean) => {
    const label =
      status === "EXPIRED" && refunded
        ? "EXPIRE/REFUND"
        : status === "RECEIVED"
          ? "CONFIRM"
          : status;
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-500",
      RECEIVED: "bg-green-500/10 text-green-500",
      FAILED: "bg-red-500/10 text-red-500",
      EXPIRED: "bg-gray-500/10 text-gray-500",
      "EXPIRE/REFUND": "bg-orange-500/10 text-orange-400",
      CONFIRM: "bg-green-500/10 text-green-500",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs ${
          colors[label] || "bg-gray-500/10 text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OTP Logs</h1>
        <p className="text-muted-foreground">View all OTP request logs across the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
              id="admin-otp-logs-search"
              name="admin-otp-logs-search"
              className="max-w-sm"
              placeholder="Search by user, email, number, or OTP..."
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
                      <th className="pb-2">User</th>
                      <th className="pb-2">Phone</th>
                      <th className="pb-2">Service</th>
                      <th className="pb-2">Charge</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">OTP</th>
                      <th className="pb-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="py-2">
                          <span className="font-mono text-xs">{row.userPublicId}</span>
                          <br />
                          <span className="text-muted-foreground">{row.email}</span>
                        </td>
                        <td className="py-2 font-mono text-xs">{row.phone}</td>
                        <td className="py-2 capitalize">{row.serviceType ?? "-"}</td>
                        <td className="py-2">{row.priceAtRequestPkr != null ? `Rs ${row.priceAtRequestPkr}` : "-"}</td>
                        <td className="py-2">{getStatusBadge(row.status, row.refunded)}</td>
                        <td className="py-2 font-mono">
                          {row.parsedOtp ?? "—"}
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
