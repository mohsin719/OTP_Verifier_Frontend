"use client";

import Link from "next/link";
import { CheckCircle2, Copy, History, Phone, ShoppingBag } from "lucide-react";
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
  Facebook: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Amazon: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  WhatsApp: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Others: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
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
  const { data, isLoading } = useApi<UsageSummary>("/api/otp/usage-summary?limit=8", {
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

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Your number usage
            </CardTitle>
            <CardDescription className="mt-1">
              Numbers you leased and where OTP was received successfully.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
            <Link href="/otp-history">
              <History className="h-4 w-4" />
              Full history
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              Numbers leased
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{summary.totalLeased}</p>
            <p className="mt-1 text-xs text-muted-foreground">All time purchases</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Successful OTPs
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-400">
              {summary.totalSuccessful}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">OTP received &amp; used</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-4 w-4" />
              Spent (successful)
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              Rs {summary.totalSpentSuccessfulPkr}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Only charged successful lines</p>
          </div>
        </div>

        {summary.byPlatform.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Used on platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.byPlatform.map((row) => (
                <span
                  key={row.platform}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                    PLATFORM_STYLES[row.platform] ??
                      "border-border/50 bg-secondary/30 text-foreground",
                  )}
                >
                  {row.platform}
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                    {row.count}
                  </Badge>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Successful verifications
          </p>

          {summary.successful.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
              <p className="font-medium text-muted-foreground">No successful OTP yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Lease a number from Get Number — successful uses appear here.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/platforms">Get a number</Link>
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
                    {summary.successful.map((row) => (
                      <tr key={row.id} className="border-b border-border/40">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs">{row.phoneNumber}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
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
                            <span className="font-mono font-semibold text-emerald-400">
                              {row.parsedOtp}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => void copyText(row.parsedOtp, "OTP")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
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
                {summary.successful.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{row.phoneNumber}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          PLATFORM_STYLES[row.platform],
                        )}
                      >
                        {row.platform}
                      </span>
                    </div>
                    <p className="font-mono text-lg font-bold text-emerald-400">{row.parsedOtp}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatUsedAt(row.usedAt)}</span>
                      {row.priceAtRequestPkr != null && (
                        <span>· Rs {row.priceAtRequestPkr}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {summary.totalSuccessful > summary.successful.length && (
                <p className="text-center text-sm text-muted-foreground">
                  Showing latest {summary.successful.length} of {summary.totalSuccessful}.{" "}
                  <Link href="/otp-history" className="text-primary underline underline-offset-4">
                    View all
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
