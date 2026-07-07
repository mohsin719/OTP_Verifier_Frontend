"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Copy,
  History,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type OtpLogRow = {
  id: string;
  userPublicId: string;
  email: string;
  phone: string;
  platform: string;
  serviceType: string | null;
  priceAtRequestPkr: number | null;
  status: string;
  statusLabel: string;
  refunded: boolean;
  parsedOtp: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type OtpLogsSummary = {
  totalAttempts: number;
  waiting: number;
  successful: number;
  expired: number;
  failed: number;
  refunded: number;
  totalChargedPkr: number;
};

type OtpLogsResponse = {
  items: OtpLogRow[];
  total: number;
  summary: OtpLogsSummary;
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Waiting" },
  { value: "EXPIRED", label: "Expired" },
  { value: "FAILED", label: "Failed" },
  { value: "SUCCESS", label: "Success" },
] as const;

const PLATFORM_FILTERS = [
  { value: "ALL", label: "All platforms" },
  { value: "facebook", label: "Facebook" },
  { value: "amazon", label: "Amazon" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "others", label: "Others" },
] as const;

const PLATFORM_CHIP: Record<string, string> = {
  Facebook: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Amazon: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  WhatsApp: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Others: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
      : status === "PENDING"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
        : refunded
          ? "bg-orange-500/15 text-orange-300 border-orange-500/25"
          : status === "FAILED"
            ? "bg-red-500/15 text-red-300 border-red-500/25"
            : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        chip,
      )}
    >
      {statusLabel}
    </span>
  );
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Could not copy");
  }
}

export default function AdminOtpLogsPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(statusFilter !== "ALL" && { status: statusFilter }),
    ...(platformFilter !== "ALL" && { platform: platformFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, mutate } = useApi<OtpLogsResponse>(
    `/api/manage/otp-logs?${query.toString()}`,
    { cacheTtlMs: 30_000, keepPreviousData: true },
  );

  const items = data?.items ?? null;
  const total = data?.total ?? 0;
  const summary = data?.summary;

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
    const fresh = await apiFetch<OtpLogsResponse>(
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
    toast.success("OTP logs refreshed.");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OTP Logs</h1>
          <p className="text-muted-foreground">
            Every OTP attempt across the platform — success, waiting, expired, and refunded.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void refreshLogs()}
          disabled={isRefreshing}
          className="gap-2 self-start"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading && !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Total tries
              </CardDescription>
              <CardTitle className="text-2xl">{summary.totalAttempts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Successful
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-400">{summary.successful}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Waiting
              </CardDescription>
              <CardTitle className="text-2xl text-amber-300">{summary.waiting}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-400" />
                Refunded
              </CardDescription>
              <CardTitle className="text-2xl text-orange-300">{summary.refunded}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              {summary.expired} expired · {summary.failed} failed
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Charges (filtered)</CardDescription>
              <CardTitle className="text-2xl">Rs {summary.totalChargedPkr}</CardTitle>
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
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status.value}
                  size="sm"
                  variant={statusFilter === status.value ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter(status.value);
                    setPage(1);
                  }}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Platform
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_FILTERS.map((platform) => (
                <Button
                  key={platform.value}
                  size="sm"
                  variant={platformFilter === platform.value ? "default" : "outline"}
                  onClick={() => {
                    setPlatformFilter(platform.value);
                    setPage(1);
                  }}
                >
                  {platform.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="admin-otp-logs-search" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="admin-otp-logs-search"
              className="mt-2 max-w-md"
              placeholder="User ID, email, phone number, or OTP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !items ? (
            <Skeleton className="h-64 w-full" />
          ) : !items ? null : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">User</th>
                      <th className="pb-3 pr-4 font-medium">Number</th>
                      <th className="pb-3 pr-4 font-medium">Platform</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Charge</th>
                      <th className="pb-3 pr-4 font-medium">OTP</th>
                      <th className="pb-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-3 pr-4">
                          <p className="font-mono text-xs font-medium">{row.userPublicId}</p>
                          <p className="text-xs text-muted-foreground">{row.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">{row.phone}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => void copyText(row.phone)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              PLATFORM_CHIP[row.platform] ??
                                "border-border/50 bg-secondary/30",
                            )}
                          >
                            {row.platform}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            status={row.status}
                            statusLabel={row.statusLabel}
                            refunded={row.refunded}
                          />
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
                          {row.priceAtRequestPkr != null ? (
                            <span className="text-amber-300">Rs {row.priceAtRequestPkr}</span>
                          ) : (
                            "—"
                          )}
                          {row.refunded && row.priceAtRequestPkr != null ? (
                            <p className="text-[10px] text-emerald-400">Refunded</p>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          {row.parsedOtp ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-semibold text-emerald-400">
                                {row.parsedOtp}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => void copyText(row.parsedOtp!)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : row.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <Clock className="h-3.5 w-3.5" />
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
                          {formatDateTime(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No OTP logs match your filters.
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
