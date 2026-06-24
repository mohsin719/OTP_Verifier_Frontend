"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircleDollarSign,
  Clock,
  FileText,
  Server,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

type AdminStats = {
  totalUsers: number;
  activeUsersLast30Days: number;
  revenuePkrApprox: number;
  pendingOtpRequests: number;
};

const QUICK_LINKS = [
  { href: "/manage/otp-logs", label: "OTP logs", icon: FileText },
  { href: "/manage/platform-status", label: "Platform status", icon: Server },
  { href: "/manage/transactions", label: "Transactions", icon: CircleDollarSign },
  { href: "/manage/users", label: "Users", icon: Users },
] as const;

export function AdminOverviewSection(): React.ReactElement {
  const { data, isLoading } = useApi<AdminStats>("/api/manage/stats", {
    cacheTtlMs: 30_000,
  });

  if (isLoading && !data) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data ?? {
    totalUsers: 0,
    activeUsersLast30Days: 0,
    revenuePkrApprox: 0,
    pendingOtpRequests: 0,
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Platform overview
        </CardTitle>
        <CardDescription>
          Live stats across all users — not your personal number history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-4 w-4 text-blue-400" />
              Total users
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-4 w-4 text-violet-400" />
              New users (30 days)
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {stats.activeUsersLast30Days}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDollarSign className="h-4 w-4 text-emerald-400" />
              Number spend (all users)
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-400">
              Rs {stats.revenuePkrApprox}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-amber-400" />
              Waiting for OTP
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-amber-300">
              {stats.pendingOtpRequests}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Pending requests now</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Admin shortcuts
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant="outline"
                  className="h-auto justify-between px-4 py-3"
                >
                  <Link href={link.href}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {link.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
