"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Copy,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type PlatformStatusRow = {
  id: string;
  numberId: string;
  e164: string;
  numberStatus: string;
  platform: string;
  status: "AVAILABLE" | "COOLDOWN" | "BLOCKED" | "HIGH_RISK";
  effectiveStatus: "READY" | "COOLDOWN" | "BLOCKED" | "HIGH_RISK" | "POOL_BUSY";
  assignable: boolean;
  failureCount: number;
  successCount: number;
  healthScore: number;
  lastError: string | null;
  cooldownUntil: string | null;
  updatedAt: string;
};

type PlatformStatusResponse = {
  items: PlatformStatusRow[];
  total: number;
  summary: {
    totalRows: number;
    ready: number;
    cooldown: number;
    blocked: number;
    highRisk: number;
    poolBusy: number;
    withErrors: number;
  };
};

type PlatformFilter = "ALL" | "Facebook" | "Amazon" | "WhatsApp" | "Others";
type StatusFilter = "ALL" | "READY" | "COOLDOWN" | "BLOCKED" | "POOL_BUSY";

const PLATFORM_FILTERS: { value: PlatformFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "Facebook", label: "Facebook" },
  { value: "Amazon", label: "Amazon" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Others", label: "Others" },
];

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
  shortLabel: string;
}[] = [
  { value: "ALL", label: "All", shortLabel: "All" },
  { value: "READY", label: "Ready", shortLabel: "Ready" },
  { value: "COOLDOWN", label: "Cooldown", shortLabel: "Cooldown" },
  { value: "BLOCKED", label: "Blocked", shortLabel: "Blocked" },
  { value: "POOL_BUSY", label: "In use", shortLabel: "In use" },
];

const PLATFORM_STYLES: Record<string, string> = {
  Facebook: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Amazon: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  WhatsApp: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Others: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const EFFECTIVE_STATUS_STYLES: Record<string, string> = {
  READY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  AVAILABLE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  COOLDOWN: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  BLOCKED: "bg-red-500/15 text-red-400 border-red-500/30",
  HIGH_RISK: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  POOL_BUSY: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const POOL_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Free",
  ASSIGNED: "With user",
  REUSABLE: "Cooling",
  EXPIRED: "Expired",
  MAINTENANCE: "Maintenance",
  LEASED: "Leased",
};

function formatCooldownLabel(iso: string | null): string {
  if (!iso) return "—";
  const end = new Date(iso).getTime();
  const diffMs = end - Date.now();
  if (diffMs <= 0) return "Ready now";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function cooldownProgressPercent(iso: string | null, updatedAt: string): number {
  if (!iso) return 0;
  const end = new Date(iso).getTime();
  const start = new Date(updatedAt).getTime();
  const now = Date.now();
  if (end <= now) return 100;
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), total);
  return Math.round((elapsed / total) * 100);
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

function truncateText(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function healthTone(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

function poolLabel(status: string): string {
  return POOL_STATUS_LABELS[status] ?? status;
}

export default function AdminPlatformStatusPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("COOLDOWN");
  const [sort, setSort] = useState<"updated" | "cooldown_asc">("cooldown_asc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(platformFilter !== "ALL" && { platform: platformFilter }),
      ...(statusFilter !== "ALL" && { status: statusFilter }),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(sort === "cooldown_asc" && { sort: "cooldown_asc" }),
    });
    return params.toString();
  }, [page, limit, platformFilter, statusFilter, debouncedSearch, sort]);

  const { data, isLoading, mutate } = useApi<PlatformStatusResponse>(
    `/api/manage/number-platform-status?${queryString}`,
    { cacheTtlMs: 30_000 },
  );

  const items = data?.items ?? null;
  const total = data?.total ?? 0;
  const summary = data?.summary;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void mutate();
  }, [tick, mutate]);

  const hasActiveFilters =
    platformFilter !== "ALL" ||
    statusFilter !== "COOLDOWN" ||
    debouncedSearch.length > 0 ||
    sort !== "cooldown_asc";

  const clearFilters = () => {
    setPlatformFilter("ALL");
    setStatusFilter("COOLDOWN");
    setSearch("");
    setDebouncedSearch("");
    setSort("cooldown_asc");
    setPage(1);
  };

  const applyQuickFilter = (platform: PlatformFilter, status: StatusFilter) => {
    setPlatformFilter(platform);
    setStatusFilter(status);
    setPage(1);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const refreshRows = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    const fresh = await apiFetch<PlatformStatusResponse>(
      `/api/manage/number-platform-status?${queryString}&refresh=true`,
      { accessToken: token, disableDedupe: true, cacheTtlMs: 0 },
    );
    setIsRefreshing(false);

    if (!fresh.success) {
      toast.error(fresh.error);
      return;
    }

    mutate(fresh.data, { revalidate: false });
    toast.success("Refreshed");
  }, [token, queryString, mutate]);

  const utilizationPct = useMemo(() => {
    if (!summary?.totalRows) return 0;
    return Math.round((summary.ready / summary.totalRows) * 100);
  }, [summary]);

  const activeFilterTags = useMemo(() => {
    const tags: { key: string; label: string; onClear: () => void }[] = [];
    if (platformFilter !== "ALL") {
      tags.push({
        key: "platform",
        label: platformFilter,
        onClear: () => {
          setPlatformFilter("ALL");
          setPage(1);
        },
      });
    }
    if (statusFilter !== "ALL") {
      const statusLabel =
        STATUS_FILTERS.find((s) => s.value === statusFilter)?.label ?? statusFilter;
      tags.push({
        key: "status",
        label: statusLabel,
        onClear: () => {
          setStatusFilter("ALL");
          setPage(1);
        },
      });
    }
    if (debouncedSearch) {
      tags.push({
        key: "search",
        label: `"${debouncedSearch}"`,
        onClear: () => {
          setSearch("");
          setDebouncedSearch("");
          setPage(1);
        },
      });
    }
    if (sort !== "cooldown_asc") {
      tags.push({
        key: "sort",
        label: "Recently updated",
        onClear: () => setSort("cooldown_asc"),
      });
    }
    return tags;
  }, [platformFilter, statusFilter, debouncedSearch, sort]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Platform Status</h1>
          <p className="text-sm text-muted-foreground">
            Number health per platform — cooldowns, blocks, and assignability.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshRows()}
          disabled={isRefreshing}
          className="shrink-0 gap-2 self-start"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => applyQuickFilter("ALL", "READY")}
          className="rounded-xl border border-border/50 bg-secondary/10 p-4 text-left transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/15 p-2">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ready to assign</p>
              <p className="text-xl font-semibold tabular-nums">{summary?.ready ?? "—"}</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter("ALL", "COOLDOWN")}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors hover:border-amber-500/30 hover:bg-amber-500/5",
            statusFilter === "COOLDOWN" && platformFilter === "ALL"
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-border/50 bg-secondary/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/15 p-2">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">On cooldown</p>
              <p className="text-xl font-semibold tabular-nums">{summary?.cooldown ?? "—"}</p>
            </div>
          </div>
        </button>
        <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/15 p-2">
              <Sparkles className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pool utilization</p>
              <p className="text-xl font-semibold tabular-nums">
                {summary ? `${utilizationPct}%` : "—"}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => applyQuickFilter("ALL", "BLOCKED")}
          className="rounded-xl border border-border/50 bg-secondary/10 p-4 text-left transition-colors hover:border-red-500/30 hover:bg-red-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/15 p-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blocked / risk</p>
              <p className="text-xl font-semibold tabular-nums">
                {(summary?.blocked ?? 0) + (summary?.highRisk ?? 0)}
              </p>
            </div>
          </div>
        </button>
        <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/15 p-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">With last error</p>
              <p className="text-xl font-semibold tabular-nums">{summary?.withErrors ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <CardDescription className="sm:text-right">
              {total} of {summary?.totalRows ?? 0} rows
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-platform-status-search"
                name="admin-platform-status-search"
                className="pl-9"
                placeholder="Search phone number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant={sort === "cooldown_asc" ? "secondary" : "outline"}
              className="gap-2 shrink-0"
              onClick={() =>
                setSort((s) => (s === "cooldown_asc" ? "updated" : "cooldown_asc"))
              }
            >
              <ArrowUpDown className="h-4 w-4" />
              {sort === "cooldown_asc" ? "Ending soonest" : "Recently updated"}
            </Button>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="gap-1 shrink-0 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Active:</span>
              {activeFilterTags.map((tag) => (
                <Badge
                  key={tag.key}
                  variant="secondary"
                  className="gap-1 pr-1 font-normal"
                >
                  {tag.label}
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-background/60"
                    onClick={tag.onClear}
                    aria-label={`Remove ${tag.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Platform</p>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_FILTERS.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={platformFilter === value ? "default" : "outline"}
                    className="h-8 rounded-full px-3"
                    onClick={() => {
                      setPlatformFilter(value);
                      setPage(1);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={statusFilter === value ? "default" : "outline"}
                    className="h-8 rounded-full px-3"
                    onClick={() => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              Number × Platform
              <span className="ml-2 font-normal text-muted-foreground">({total})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !items?.length ? (
            <div className="rounded-lg border border-dashed border-border/60 py-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="font-medium">No rows match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try &quot;Ready&quot; or reset filters.
              </p>
              {hasActiveFilters && (
                <Button size="sm" variant="outline" className="mt-4" onClick={clearFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Number</th>
                      <th className="pb-3 pr-4 font-medium">Platform</th>
                      <th className="pb-3 pr-4 font-medium">Assign</th>
                      <th className="pb-3 pr-4 font-medium">Health</th>
                      <th className="pb-3 pr-4 font-medium">Fails</th>
                      <th className="pb-3 pr-4 font-medium">Success</th>
                      <th className="pb-3 pr-4 font-medium">Cooldown</th>
                      <th className="pb-3 font-medium">Last error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      const progress = cooldownProgressPercent(
                        row.cooldownUntil,
                        row.updatedAt,
                      );
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border/40 transition-colors hover:bg-secondary/20"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-medium">{row.e164}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={() => void copyText(row.e164, "Number")}
                                title="Copy number"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <Badge variant="outline" className="mt-1 text-[10px] font-normal">
                              Pool: {poolLabel(row.numberStatus)}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                                PLATFORM_STYLES[row.platform] ??
                                  "border-border/50 bg-secondary/30 text-foreground",
                              )}
                            >
                              {row.platform}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                EFFECTIVE_STATUS_STYLES[row.effectiveStatus] ??
                                  "bg-zinc-500/10 text-zinc-400",
                              )}
                            >
                              {row.effectiveStatus.replace("_", " ")}
                            </span>
                          </td>
                          <td
                            className={cn(
                              "py-3 pr-4 font-semibold tabular-nums",
                              healthTone(row.healthScore),
                            )}
                          >
                            {row.healthScore}
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-red-400/90">
                            {row.failureCount}
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-emerald-400/90">
                            {row.successCount}
                          </td>
                          <td className="min-w-[140px] py-3 pr-4">
                            {row.cooldownUntil ? (
                              <div className="space-y-1.5">
                                <p
                                  className={cn(
                                    "text-xs font-medium",
                                    row.assignable
                                      ? "text-emerald-400/90"
                                      : "text-amber-400/90",
                                  )}
                                >
                                  {formatCooldownLabel(row.cooldownUntil)}
                                </p>
                                {!row.assignable && row.effectiveStatus === "COOLDOWN" && (
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                      className="h-full rounded-full bg-amber-500/80 transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                )}
                                <p
                                  className="text-[10px] text-muted-foreground"
                                  title={row.cooldownUntil}
                                >
                                  until {formatDateTime(row.cooldownUntil)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-400/80">No cooldown</span>
                            )}
                          </td>
                          <td className="max-w-[240px] py-3">
                            {row.lastError ? (
                              <button
                                type="button"
                                className="text-left text-xs leading-relaxed text-muted-foreground hover:text-foreground"
                                title={row.lastError}
                                onClick={() => void copyText(row.lastError!, "Error")}
                              >
                                {truncateText(row.lastError)}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {items.map((row) => (
                  <div
                    key={row.id}
                    className="space-y-3 rounded-xl border border-border/50 bg-secondary/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm font-semibold">{row.e164}</p>
                        <p className="text-xs text-muted-foreground">
                          Pool: {poolLabel(row.numberStatus)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          EFFECTIVE_STATUS_STYLES[row.effectiveStatus],
                        )}
                      >
                        {row.effectiveStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs",
                          PLATFORM_STYLES[row.platform],
                        )}
                      >
                        {row.platform}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Health {row.healthScore}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        F {row.failureCount} / S {row.successCount}
                      </Badge>
                    </div>
                    {row.cooldownUntil && (
                      <p
                        className={cn(
                          "text-xs",
                          row.assignable ? "text-emerald-400/90" : "text-amber-400/90",
                        )}
                      >
                        Cooldown: {formatCooldownLabel(row.cooldownUntil)}
                      </p>
                    )}
                    {row.lastError && (
                      <button
                        type="button"
                        className="text-left text-xs text-muted-foreground"
                        onClick={() => void copyText(row.lastError!, "Error")}
                      >
                        {truncateText(row.lastError, 120)}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
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
