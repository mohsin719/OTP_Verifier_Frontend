"use client";

import Link from "next/link";
import { Phone, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { UsageSummarySection } from "@/components/dashboard/usage-summary-section";
import { AdminOverviewSection } from "@/components/dashboard/admin-overview-section";

export default function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const { balancePkr, isLoading, ownerUserId } = useWalletStore();

  const pkrBalanceFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight wrap-break-word sm:text-3xl">
          Dashboard Overview
        </h1>
        <p className="mt-1 wrap-break-word text-muted-foreground">
          {isAdmin
            ? "Admin control panel — monitor users, numbers, and platform health."
            : (
              <>
                Welcome back. You are authenticated securely as{" "}
                <span className="font-medium text-foreground">{user?.publicId}</span>
              </>
            )}
        </p>
      </div>
      
      <div className="grid w-full min-w-0 gap-6 sm:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {balancePkr === null || isLoading || ownerUserId !== user?.id ? (
              <Skeleton className="h-10 w-40 mt-1" />
            ) : (
              <div className="flex items-baseline space-x-2">
                <p className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
                  {pkrBalanceFormatter.format(balancePkr)}
                </p>
                <span className="text-sm font-medium text-muted-foreground uppercase">
                  PKR
                </span>
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 wrap-break-word text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              Funds are secure and ready for immediate deployment
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-linear-to-br from-primary/10 to-transparent shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 opacity-10 pointer-events-none">
            <Phone className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Phone className="h-5 w-5 text-primary" />
              Provision Virtual Line
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm leading-relaxed wrap-break-word text-muted-foreground">
              Select a target service platform to securely allocate a dedicated, temporary virtual number for one-time password (OTP) verification.
            </p>
            <Button asChild className="w-full sm:w-auto shadow-md transition-all hover:shadow-lg">
              <Link href="/platforms">View Supported Platforms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {isAdmin ? <AdminOverviewSection /> : <UsageSummarySection />}

      <div className="grid w-full min-w-0 gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-amber-500" />
              {isAdmin ? "Admin checklist" : "Quick Start Guide"}
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Day-to-day operations for the platform"
                : "How to use the platform effectively"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside marker:text-primary marker:font-medium">
                <li className="leading-relaxed">
                  Check <strong>Platform status</strong> before users report delivery issues.
                </li>
                <li className="leading-relaxed">
                  Review <strong>OTP logs</strong> and <strong>Failure logs</strong> for stuck or failed requests.
                </li>
                <li className="leading-relaxed">
                  Use <strong>Transactions</strong> to verify top-ups, charges, and refunds.
                </li>
                <li className="leading-relaxed">
                  Manage user balances from <strong>Users</strong> when support requests come in.
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside marker:text-primary marker:font-medium">
                <li className="leading-relaxed">Add balance to your wallet via support or admin top-up.</li>
                <li className="leading-relaxed">Navigate to <strong>Get number</strong> to lease a dedicated line.</li>
                <li className="leading-relaxed">Enter the provided number into your chosen platform signup.</li>
                <li className="leading-relaxed">Monitor <strong>OTP history</strong> for all attempts and refunds.</li>
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
