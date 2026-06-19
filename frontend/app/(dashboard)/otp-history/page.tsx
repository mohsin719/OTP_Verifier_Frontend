"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";

type Row = {
  id: string;
  status: string;
  parsedOtp: string | null;
  phoneNumber: string;
  serviceType: string | null;
  priceAtRequestPkr: number | null;
  createdAt: string;
  expiresAt: string | null;
};

export default function OtpHistoryPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const { data, isLoading } = useApi<{
    items: Row[];
    total: number;
  }>(`/api/otp/history?${query.toString()}`, { keepPreviousData: true });

  const rows = data?.items ?? null;
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OTP history</h1>
        <p className="text-muted-foreground">
          Parsed codes and statuses for your leased numbers.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !rows ? (
            <Skeleton className="h-40 w-full" />
          ) : !rows ? null : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2">Number</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Service</th>
                    <th className="pb-2">Charge</th>
                    <th className="pb-2">OTP</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2 font-mono text-xs">{r.phoneNumber}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2 capitalize">{r.serviceType ?? "-"}</td>
                      <td className="py-2">{r.priceAtRequestPkr != null ? `Rs ${r.priceAtRequestPkr}` : "-"}</td>
                      <td className="py-2 font-mono">
                        {r.parsedOtp ?? "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No OTP requests yet.
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
