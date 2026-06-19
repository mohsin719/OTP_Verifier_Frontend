"use client";

import Link from "next/link";
import { Phone, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";

export default function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { balancePkr, isLoading } = useWalletStore();

  const pkrBalanceFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. You are authenticated securely as{" "}
          <span className="font-medium text-foreground">{user?.publicId}</span>
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {balancePkr === null || isLoading ? (
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
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select a target service platform to securely allocate a dedicated, temporary virtual number for one-time password (OTP) verification.
            </p>
            <Button asChild className="w-full sm:w-auto shadow-md transition-all hover:shadow-lg">
              <Link href="/platforms">View Supported Platforms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>How to use the platform effectively</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside marker:text-primary marker:font-medium">
              <li className="leading-relaxed">Ensure your wallet has sufficient funds via the Admin or support.</li>
              <li className="leading-relaxed">Navigate to <strong>Get number</strong> to lease a dedicated line.</li>
              <li className="leading-relaxed">Enter the provided number into the target service (e.g., WhatsApp).</li>
              <li className="leading-relaxed">Monitor the <strong>OTP history</strong> tab for the incoming verification code.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
