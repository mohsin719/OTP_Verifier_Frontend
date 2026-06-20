"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { useWalletStore } from "@/stores/wallet-store";

type TxRow = {
  id: string;
  amountPkr: number;
  type: string;
  reference: string | null;
  createdAt: string;
};

export default function WalletPage(): React.ReactElement {
  const { balancePkr, isLoading, setBalance } = useWalletStore();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const { data: txData, isLoading: txLoading } = useApi<{ items: TxRow[]; total: number }>(`/api/transactions?${query.toString()}`, { keepPreviousData: true });
  const { data: walletData } = useApi<{ balancePkr: number }>("/api/wallet");

  const items = txData?.items ?? [];
  const total = txData?.total ?? 0;

  useEffect(() => {
    if (walletData) {
      setBalance(walletData.balancePkr);
    }
  }, [walletData, setBalance]);

  const pkrBalanceFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  });
  const pkrAmountFormatter = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">Balance and transaction history.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current balance</CardTitle>
        </CardHeader>
        <CardContent>
          {balancePkr === null || isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <p className="text-3xl font-semibold tabular-nums">
              {pkrBalanceFormatter.format(balancePkr)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                PKR
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 tabular-nums">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{row.type}</td>
                      <td className="py-2 pr-4">
                        {pkrAmountFormatter.format(row.amountPkr)}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {row.reference ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No transactions yet.
                </p>
              ) : null}

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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
