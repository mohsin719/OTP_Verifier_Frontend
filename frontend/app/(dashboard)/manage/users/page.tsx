"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { Ban, RefreshCw, UserCheck, Users, UserX } from "lucide-react";

type UserRow = {
  id: string;
  publicId: string;
  email: string;
  username: string;
  role: string;
  isBanned: boolean;
  preferredPlatform: string;
  balancePkr: number;
  walmartAttemptCount: number;
  createdAt: string;
};

function getVisiblePages(current: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  const pages = new Set<number>([1, totalPages, current]);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
}

const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

function formatBalancePkr(amount: number): string {
  return pkrFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export default function AdminUsersPage(): React.ReactElement {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Ban modal state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  // Balance modal state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceUserId, setBalanceUserId] = useState<string | null>(null);
  const [balanceUserLabel, setBalanceUserLabel] = useState("");
  const [balanceUserCurrentPkr, setBalanceUserCurrentPkr] = useState(0);
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [selfTopupAmount, setSelfTopupAmount] = useState("");
  const [selfTopupReason, setSelfTopupReason] = useState("");
  const [isSelfTopupPending, setIsSelfTopupPending] = useState(false);

  const [transferPublicId, setTransferPublicId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [isTransferPending, setIsTransferPending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toPkr = (amountPkr: string): number => {
    const parsed = Number(amountPkr);
    if (!Number.isFinite(parsed)) {
      return NaN;
    }
    return parsed;
  };

  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, mutate } = useApi<{
    items: UserRow[];
    total: number;
    activeCount: number;
    bannedCount: number;
    page: number;
    limit: number;
  }>(`/api/manage/users?${query.toString()}`, {
    cacheTtlMs: 30_000,
  });

  const items = data?.items ?? null;
  const total = data?.total ?? 0;
  const activeCount = data?.activeCount ?? 0;
  const bannedCount = data?.bannedCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visiblePages = getVisiblePages(page, totalPages);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // Reset page on new search
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleBan = async (userId: string, banned: boolean, reason?: string) => {
    if (!token) return;
    setIsBanning(true);
    const endpoint = banned ? `/api/manage/users/${userId}/ban` : `/api/manage/users/${userId}/unban`;
    const res = await apiFetch<{ success: true }>(endpoint, {
      method: "PATCH",
      accessToken: token,
      body: banned ? JSON.stringify({ reason }) : undefined,
    });
    setIsBanning(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(banned ? "User banned" : "User unbanned");
    setBanModalOpen(false);
    setBanReason("");
    mutate();
  };

  const handleAdjustBalance = async () => {
    if (!token || !balanceUserId) return;
    const rawAmount = toPkr(balanceAmount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }
    if (!balanceReason.trim()) {
      toast.error("Please enter a reason for this adjustment.");
      return;
    }

    const amountPkr = adjustMode === "remove" ? -rawAmount : rawAmount;
    if (adjustMode === "remove" && balanceUserCurrentPkr + amountPkr < 0) {
      toast.error(
        `Cannot remove more than the current balance (${formatBalancePkr(balanceUserCurrentPkr)}).`,
      );
      return;
    }

    setIsAdjusting(true);
    const res = await apiFetch<{ balancePkr: number }>(
      `/api/manage/users/${balanceUserId}/balance`,
      {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          amountPkr,
          reason: balanceReason.trim(),
        }),
      },
    );
    setIsAdjusting(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(
      adjustMode === "add"
        ? `Added ${formatBalancePkr(rawAmount)}. New balance: ${formatBalancePkr(res.data.balancePkr)}`
        : `Removed ${formatBalancePkr(rawAmount)}. New balance: ${formatBalancePkr(res.data.balancePkr)}`,
    );
    setBalanceModalOpen(false);
    setBalanceAmount("");
    setBalanceReason("");
    setAdjustMode("add");
    mutate();
  };

  const handleSelfTopup = async () => {
    if (!token || !user) return;
    const amountPkr = toPkr(selfTopupAmount);
    if (!Number.isFinite(amountPkr) || amountPkr <= 0) {
      toast.error("Please enter a valid positive number amount.");
      return;
    }
    if (!selfTopupReason.trim()) {
      toast.error("Reason is required.");
      return;
    }

    setIsSelfTopupPending(true);
    const res = await apiFetch<{ balancePkr: number }>(`/api/manage/users/${user.id}/balance`, {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({ amountPkr, reason: selfTopupReason.trim() }),
    });
    setIsSelfTopupPending(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success("Your admin balance was updated.");
    setSelfTopupAmount("");
    setSelfTopupReason("");
    mutate();
  };

  const handleTransferByPublicId = async () => {
    if (!token) return;
    const amountPkr = toPkr(transferAmount);
    if (!transferPublicId.trim()) {
      toast.error("Target Public ID is required.");
      return;
    }
    if (!Number.isFinite(amountPkr) || amountPkr <= 0) {
      toast.error("Please enter a valid positive number amount.");
      return;
    }
    if (!transferReason.trim()) {
      toast.error("Reason is required.");
      return;
    }

    setIsTransferPending(true);
    const res = await apiFetch<{
      adminBalancePkr: number;
      targetBalancePkr: number;
      targetPublicId: string;
    }>("/api/manage/balance/transfer", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        targetPublicId: transferPublicId.trim(),
        amountPkr,
        reason: transferReason.trim(),
      }),
    });
    setIsTransferPending(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(`Transferred to ${res.data.targetPublicId}.`);
    setTransferAmount("");
    setTransferPublicId("");
    setTransferReason("");
    mutate();
  };

  const openBanModal = (userId: string) => {
    setBanUserId(userId);
    setBanModalOpen(true);
  };

  const openAdjustModal = (user: UserRow) => {
    setBalanceUserId(user.id);
    setBalanceUserLabel(user.username || user.email);
    setBalanceUserCurrentPkr(user.balancePkr);
    setAdjustMode("add");
    setBalanceAmount("");
    setBalanceReason("");
    setBalanceModalOpen(true);
  };

  const adjustPreviewPkr = (() => {
    const raw = toPkr(balanceAmount);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const signed = adjustMode === "remove" ? -raw : raw;
    const next = balanceUserCurrentPkr + signed;
    if (next < 0) return null;
    return next;
  })();

  const refreshUsers = async () => {
    if (!token) return;
    setIsRefreshing(true);
    const fresh = await apiFetch<{
      items: UserRow[];
      total: number;
      activeCount: number;
      bannedCount: number;
      page: number;
      limit: number;
    }>(
      `/api/manage/users?${query.toString()}&refresh=true`,
      {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      },
    );
    setIsRefreshing(false);

    if (!fresh.success) {
      toast.error(fresh.error);
      return;
    }

    mutate(fresh.data, { revalidate: false });
    toast.success("Users refreshed from backend.");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and balances.</p>
      </div>

      <div className="grid w-full min-w-0 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-2xl font-bold tabular-nums">
              <Users className="h-5 w-5 text-blue-500" />
              {isLoading ? "—" : total}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-2xl font-bold tabular-nums text-green-500">
              <UserCheck className="h-5 w-5" />
              {isLoading ? "—" : activeCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Banned Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-2xl font-bold tabular-nums text-red-500">
              <UserX className="h-5 w-5" />
              {isLoading ? "—" : bannedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Wallet Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full min-w-0 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border/70 p-4">
              <h3 className="font-medium">Increase my balance</h3>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount in PKR"
                value={selfTopupAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelfTopupAmount(e.target.value)}
              />
              <Input
                placeholder="Reason"
                value={selfTopupReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelfTopupReason(e.target.value)}
              />
              <Button onClick={handleSelfTopup} disabled={isSelfTopupPending}>
                {isSelfTopupPending ? "Updating..." : "Top up my wallet"}
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 p-4">
              <h3 className="font-medium">Send money to user by ID</h3>
              <Input
                placeholder="Target Public ID (e.g. USR-12345)"
                value={transferPublicId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferPublicId(e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount in PKR"
                value={transferAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferAmount(e.target.value)}
              />
              <Input
                placeholder="Reason"
                value={transferReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferReason(e.target.value)}
              />
              <Button onClick={handleTransferByPublicId} disabled={isTransferPending}>
                {isTransferPending ? "Sending..." : "Send balance"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by email, username, or public ID..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
            }}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Users ({total})</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Newest users first · {limit} per page
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshUsers}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !items ? null : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2 pr-3 w-12">#</th>
                      <th className="pb-2 pr-4">Username</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Platform</th>
                      <th className="pb-2 pr-4">Walmart Attempts</th>
                      <th className="pb-2 pr-4">Balance</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((u, index) => (
                      <tr key={u.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-muted-foreground tabular-nums">
                          {(page - 1) * limit + index + 1}
                        </td>
                        <td className="py-2 pr-4 font-medium">{u.username}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                        <td className="py-2 pr-4">{u.preferredPlatform || "—"}</td>
                        <td className="py-2 pr-4 tabular-nums">{u.walmartAttemptCount ?? 0}</td>
                        <td className="py-2 pr-4 font-medium tabular-nums whitespace-nowrap">
                          {formatBalancePkr(u.balancePkr ?? 0)}
                        </td>
                        <td className="py-2 pr-4">
                          {u.isBanned ? (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <Ban className="h-3 w-3" /> Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-500">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openBanModal(u.id)}
                            >
                              {u.isBanned ? "Unban" : "Ban"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjustModal(u)}
                            >
                              Adjust
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {total > limit ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} users
                    {" · "}
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {visiblePages.map((pageNum, idx) => {
                      const prev = visiblePages[idx - 1];
                      const showEllipsis = prev !== undefined && pageNum - prev > 1;
                      return (
                        <span key={pageNum} className="flex items-center gap-1">
                          {showEllipsis ? (
                            <span className="px-1 text-muted-foreground">…</span>
                          ) : null}
                          <Button
                            size="sm"
                            variant={pageNum === page ? "default" : "outline"}
                            onClick={() => setPage(pageNum)}
                            className="min-w-9 tabular-nums"
                          >
                            {pageNum}
                          </Button>
                        </span>
                      );
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Showing all {total} user{total === 1 ? "" : "s"}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ban/Unban Modal */}
      <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to perform this action?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={banReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBanReason(e.target.value)}
                className="min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => banUserId && handleBan(banUserId, true, banReason)}
              disabled={isBanning}
            >
              {isBanning ? "Processing..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Modal */}
      <Dialog
        open={balanceModalOpen}
        onOpenChange={(open) => {
          setBalanceModalOpen(open);
          if (!open) {
            setAdjustMode("add");
            setBalanceAmount("");
            setBalanceReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>
              Update wallet for <strong>{balanceUserLabel}</strong>. Current balance:{" "}
              <strong>{formatBalancePkr(balanceUserCurrentPkr)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={adjustMode === "add" ? "default" : "outline"}
                onClick={() => setAdjustMode("add")}
              >
                Add funds
              </Button>
              <Button
                type="button"
                variant={adjustMode === "remove" ? "default" : "outline"}
                onClick={() => setAdjustMode("remove")}
              >
                Remove funds
              </Button>
            </div>
            <div>
              <Label htmlFor="amount">
                {adjustMode === "add" ? "Amount to add (PKR)" : "Amount to remove (PKR)"}
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder={adjustMode === "add" ? "e.g. 500" : "e.g. 100"}
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
              {adjustPreviewPkr !== null ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  New balance after adjustment:{" "}
                  <span className="font-medium text-foreground">
                    {formatBalancePkr(adjustPreviewPkr)}
                  </span>
                </p>
              ) : balanceAmount && adjustMode === "remove" ? (
                <p className="mt-1 text-xs text-red-400">
                  Amount exceeds current balance.
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="balance-reason">Reason</Label>
              <textarea
                id="balance-reason"
                placeholder="e.g. Manual correction, promo credit, refund fix…"
                value={balanceReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBalanceReason(e.target.value)
                }
                className="min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={isAdjusting || adjustPreviewPkr === null || !balanceReason.trim()}
              variant={adjustMode === "remove" ? "destructive" : "default"}
            >
              {isAdjusting
                ? "Saving…"
                : adjustMode === "add"
                  ? "Add funds"
                  : "Remove funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
