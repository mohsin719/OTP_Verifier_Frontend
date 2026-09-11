"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, History, Phone, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type UsageSummary = {
  totalLeased: number;
  totalSuccessful: number;
  totalSpentSuccessfulPkr: number;
  byPlatform: { platform: string; count: number }[];
  successful: {
    id: string;
    phoneNumber: string;
    platform: string;
    parsedOtp: string;
    priceAtRequestPkr: number | null;
    usedAt: string;
  }[];
};

const PLATFORM_STYLES: Record<string, string> = {
  Facebook: "border-blue-200 bg-blue-50 text-blue-700",
  Walmart: "border-orange-200 bg-orange-50 text-orange-700",
  Others: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function formatUsedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyText(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

export function UsageSummarySection(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useApi<UsageSummary>("/api/otp/usage-summary?limit=100", {
    cacheTtlMs: 30_000,
  });

  if (isLoading && !data) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const summary = data ?? {
    totalLeased: 0,
    totalSuccessful: 0,
    totalSpentSuccessfulPkr: 0,
    byPlatform: [],
    successful: [],
  };

  const totalItems = summary.successful.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentRows = summary.successful.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <Card className="border-slate-200 bg-white shadow-2xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Your Verification Activity
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm text-slate-500">
              Numbers you leased and where OTP was received successfully.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-2 border-slate-200 font-semibold hover:bg-slate-50">
            <Link href="/otp-history">
              <History className="h-4 w-4 text-blue-600" />
              Full History
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Numbers Leased
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{summary.totalLeased}</p>
            <p className="mt-1 text-[11px] text-slate-500">All time virtual purchases</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Successful OTPs
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-emerald-700">
              {summary.totalSuccessful}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Delivered &amp; used codes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Phone className="h-4 w-4 text-blue-600" />
              Total Spent
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">
              Rs {summary.totalSpentSuccessfulPkr}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Zero charges on failed requests</p>
          </div>
        </div>

        {summary.byPlatform.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Used On Platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.byPlatform.map((row) => (
                <span
                  key={row.platform}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-2xs",
                    PLATFORM_STYLES[row.platform] ??
                      "border-slate-200 bg-slate-50 text-slate-800",
                  )}
                >
                  {row.platform}
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px] font-bold">
                    {row.count}
                  </Badge>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Recent Successful Verifications
          </p>

          {summary.successful.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center bg-slate-50/40">
              <p className="font-bold text-slate-700">No successful OTP yet</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Lease a number from Get Number — delivered OTP codes will appear here in real time.
              </p>
              <Button asChild size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs">
                <Link href="/services">Get a Number Now</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Number</th>
                      <th className="pb-2 pr-4 font-medium">Platform</th>
                      <th className="pb-2 pr-4 font-medium">OTP</th>
                      <th className="pb-2 pr-4 font-medium">Charge</th>
                      <th className="pb-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-800">{row.phoneNumber}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700"
                              onClick={() => void copyText(row.phoneNumber, "Number")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                              PLATFORM_STYLES[row.platform] ??
                                "border-border/50 bg-secondary/30",
                            )}
                          >
                            {row.platform}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {row.parsedOtp}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-emerald-700"
                              onClick={() => void copyText(row.parsedOtp, "OTP")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4 tabular-nums font-medium text-slate-700">
                          {row.priceAtRequestPkr != null ? `Rs ${row.priceAtRequestPkr}` : "—"}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {formatUsedAt(row.usedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {currentRows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-semibold text-slate-900">{row.phoneNumber}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          PLATFORM_STYLES[row.platform],
                        )}
                      >
                        {row.platform}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-lg font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">{row.parsedOtp}</p>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-emerald-700"
                        onClick={() => void copyText(row.parsedOtp, "OTP")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatUsedAt(row.usedAt)}</span>
                      {row.priceAtRequestPkr != null && (
                        <span>· Rs {row.priceAtRequestPkr}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 order-2 sm:order-1">
                  Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, totalItems)}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalItems}</span> verifications
                  {summary.totalSuccessful > totalItems && (
                    <span> (of {summary.totalSuccessful} total)</span>
                  )}
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 order-1 sm:order-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Prev
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "h-8 min-w-[2rem] px-2 rounded-lg text-xs font-bold transition-colors",
                            currentPage === pageNum
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100",
                          )}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
