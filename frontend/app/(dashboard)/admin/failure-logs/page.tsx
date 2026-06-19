"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

type FailureLogRow = {
  id: string;
  numberId: string;
  e164: string;
  platform: string;
  errorType: string;
  errorMessage: string | null;
  timestamp: string;
};

const PLATFORM_FILTERS = ["ALL", "Facebook", "Amazon", "Walmart", "Others"] as const;

export default function AdminFailureLogsPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [platformFilter, setPlatformFilter] = useState<(typeof PLATFORM_FILTERS)[number]>("ALL");
  const [errorTypeFilter, setErrorTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(platformFilter !== "ALL" && { platform: platformFilter }),
    ...(errorTypeFilter !== "ALL" && { errorType: errorTypeFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, mutate } = useApi<{
    items: FailureLogRow[];
    total: number;
  }>(`/api/admin/number-failure-logs?${query.toString()}`, {
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

  const refreshRows = async () => {
    if (!token) return;
    setIsRefreshing(true);
    const fresh = await apiFetch<{ items: FailureLogRow[]; total: number }>(
      `/api/admin/number-failure-logs?${query.toString()}&refresh=true`,
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
    toast.success("Failure logs refreshed from backend.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Failure Logs</h1>
        <p className="text-muted-foreground">
          Platform-specific number failure events captured from OTP processing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_FILTERS.map((platform) => (
              <Button
                key={platform}
                size="sm"
                variant={platformFilter === platform ? "default" : "outline"}
                onClick={() => {
                  setPlatformFilter(platform);
                  setPage(1);
                }}
              >
                {platform}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              id="admin-failure-error-type"
              name="admin-failure-error-type"
              className="max-w-sm"
              placeholder="Filter by error type (e.g. OTP_PARSE_FAILED)"
              value={errorTypeFilter === "ALL" ? "" : errorTypeFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const next = e.target.value.trim();
                setErrorTypeFilter(next.length === 0 ? "ALL" : next);
                setPage(1);
              }}
            />
            <Input
              id="admin-failure-search"
              name="admin-failure-search"
              className="max-w-sm"
              placeholder="Search by number/platform/error..."
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
            <CardTitle>Rows ({total})</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshRows}
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
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Number</th>
                      <th className="pb-2">Platform</th>
                      <th className="pb-2">Error Type</th>
                      <th className="pb-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="py-2 text-muted-foreground">
                          {new Date(row.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 font-mono text-xs">{row.e164}</td>
                        <td className="py-2">{row.platform}</td>
                        <td className="py-2">
                          <span className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-500">
                            {row.errorType}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{row.errorMessage ?? "—"}</td>
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
