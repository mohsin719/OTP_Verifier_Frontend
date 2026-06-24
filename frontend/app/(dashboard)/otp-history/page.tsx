"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  Smartphone,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  status: string;
  statusLabel: string;
  parsedOtp: string | null;
  phoneNumber: string;
  platform: string;
  serviceType: string | null;
  priceAtRequestPkr: number | null;
  refunded: boolean;
  refundAmountPkr: number | null;
  createdAt: string;
  expiresAt: string | null;
};

type Summary = {
  totalAttempts: number;
  successful: number;
  pending: number;
  expired: number;
  failed: number;
  totalChargedPkr: number;
  totalRefundedPkr: number;
};

type HistoryResponse = {
  items: Row[];
  total: number;
  summary: Summary;
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All tries" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Waiting" },
  { value: "EXPIRED", label: "Expired" },
  { value: "FAILED", label: "Failed" },
] as const;

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

function formatPkr(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `Rs ${amount}`;
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
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        chip,
      )}
    >
      {statusLabel}
    </span>
  );
}

export default function OtpHistoryPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(statusFilter !== "ALL" && { status: statusFilter }),
  });

  const { data, isLoading } = useApi<HistoryResponse>(
    `/api/otp/history?${query.toString()}`,
    { keepPreviousData: true },
  );

  const rows = data?.items ?? null;
  const total = data?.total ?? 0;
  const summary = data?.summary;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OTP history</h1>
        <p className="text-muted-foreground">
          Every number you tried — success, waiting, expired, and failed attempts with charges and refunds.
        </p>
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
              <CardDescription className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Total tries
              </CardDescription>
              <CardTitle className="text-2xl">{summary.totalAttempts}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {summary.successful} successful · {summary.pending} waiting
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Successful
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-400">{summary.successful}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              OTP received and verified
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-amber-400" />
                Total charged
              </CardDescription>
              <CardTitle className="text-2xl">{formatPkr(summary.totalChargedPkr)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Across all number attempts
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-orange-400" />
                Refunded
              </CardDescription>
              <CardTitle className="text-2xl text-orange-300">
                {formatPkr(summary.totalRefundedPkr)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {summary.expired} expired · {summary.failed} failed
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All attempts</CardTitle>
          <CardDescription>Filter by status to find a specific try.</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !rows ? (
            <Skeleton className="h-40 w-full" />
          ) : !rows ? null : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Number</th>
                    <th className="pb-3 pr-4 font-medium">Platform</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Charge</th>
                    <th className="pb-3 pr-4 font-medium">Refund</th>
                    <th className="pb-3 pr-4 font-medium">OTP</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-mono text-xs">{r.phoneNumber}</td>
                      <td className="py-3 pr-4">{r.platform}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={r.status}
                          statusLabel={r.statusLabel}
                          refunded={r.refunded}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        {r.priceAtRequestPkr != null ? (
                          <span className="text-amber-300">{formatPkr(r.priceAtRequestPkr)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {r.refunded && r.refundAmountPkr != null ? (
                          <span className="text-emerald-400">{formatPkr(r.refundAmountPkr)}</span>
                        ) : r.status === "EXPIRED" || r.status === "FAILED" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {r.parsedOtp ? (
                          <span className="font-mono font-semibold text-emerald-400">
                            {r.parsedOtp}
                          </span>
                        ) : r.status === "PENDING" ? (
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
                      <td className="py-3 text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  {statusFilter === "ALL"
                    ? "No OTP attempts yet. Get a number from the dashboard to start."
                    : `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase() ?? "matching"} attempts.`}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
