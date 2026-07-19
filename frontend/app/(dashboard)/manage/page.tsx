"use client";

import * as React from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { ShieldAlert, Users, Activity, DollarSign, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";

type AdminStats = {
  totalUsers: number;
  activeUsersLast30Days: number;
  revenuePkrApprox: number;
  pendingOtpRequests: number;
};

export default function AdminDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const pkrFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { data: stats, error, isLoading, mutate } = useApi<AdminStats>("/api/manage/stats", {
  cacheTtlMs: 30_000,
});

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await apiFetch<AdminStats>("/api/manage/stats?refresh=true", {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      });
      if (!res.success) {
        throw new Error(res.error);
      }
      await mutate();
      toast.success("Dashboard data refreshed directly from database");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }

  const [chartReady, setChartReady] = React.useState(false);

  React.useEffect(() => {
    setChartReady(true);
  }, []);

  React.useEffect(() => {
    if (!error) {
      return;
    }
    toast.error(error.message || "Failed to load stats");
  }, [error]);

  const chartData =
    stats
      ? [
        { name: "Users", value: stats.totalUsers },
        { name: "Active 30d", value: stats.activeUsersLast30Days },
        { name: "Pending OTP", value: stats.pendingOtpRequests },
      ]
      : [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Executive Operations
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive system analytics, revenue metrics, and high-level operational health monitoring.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Force Refresh Live Data'}
        </Button>
      </div>

      {isLoading && !stats ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : stats ? (
        <div className="grid w-full min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric
            title="Total Registered Users"
            value={stats.totalUsers}
            icon={<Users className="h-4 w-4 text-blue-500" />}
          />
          <Metric
            title="Active Users (30d)"
            value={stats.activeUsersLast30Days}
            icon={<Activity className="h-4 w-4 text-emerald-500" />}
          />
          <Metric
            title="Gross Revenue (Debits)"
            value={pkrFormatter.format(stats.revenuePkrApprox)}
            icon={<DollarSign className="h-4 w-4 text-amber-500" />}
          />
          <Metric
            title="Active Verification Sessions"
            value={stats.pendingOtpRequests}
            icon={<KeyRound className="h-4 w-4 text-purple-500" />}
          />
        </div>
      ) : null}

      <div className="grid w-full min-w-0 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>System Analytics Overview</CardTitle>
            <CardDescription>Aggregate metrics for user acquisition and system load</CardDescription>
          </CardHeader>
          <CardContent>
            {chartReady && stats && chartData.length > 0 ? (
            <div className="mt-4 h-[320px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(1 0 0 / 0.1)" />
                  <XAxis dataKey="name" stroke="oklch(0.65 0.03 260)" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="oklch(0.65 0.03 260)" tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    cursor={{ fill: 'oklch(1 0 0 / 0.05)' }}
                    contentStyle={{
                      background: "oklch(0.17 0.03 260)",
                      border: "1px solid oklch(1 0 0 / 0.08)",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
                    }}
                    itemStyle={{ color: 'white', fontWeight: 500 }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <div className="h-80 min-h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                {isLoading ? "Loading chart…" : "No chart data yet"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-secondary/20">
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
            <CardDescription>Quick links for system management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/manage/users'}>
                <div className="font-medium text-foreground">User Management</div>
                <div className="text-xs text-muted-foreground mt-1">Suspend accounts, adjust balances, and audit user activity logs.</div>
              </div>
              <div className="p-3 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/manage/numbers'}>
                <div className="font-medium text-foreground">Virtual Inventory</div>
                <div className="text-xs text-muted-foreground mt-1">Add or remove leased lines, and monitor routing connectivity and status.</div>
              </div>
              <div className="p-3 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/manage/transactions'}>
                <div className="font-medium text-foreground">Financial Ledger</div>
                <div className="text-xs text-muted-foreground mt-1">Review all system debits, credits, and manual administrative transfers.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="p-2 bg-secondary/50 rounded-md">{icon}</div>}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
