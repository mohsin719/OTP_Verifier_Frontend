"use client";

import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import { Copy, Phone, RefreshCw, ShieldCheck, Clock, Wifi, Info } from "lucide-react";
import { toast } from "sonner";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { RechargePopup } from "@/components/dialogs/recharge-popup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "../../../components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { getPublicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";

type ActiveNumber = {
  e164: string;
  leasedUntil: string;
  parsedOtp: string | null;
  otpStatus: "PENDING" | "RECEIVED" | "EXPIRED" | "FAILED";
  otpRequestId: string;
  serviceType?: string | null;
};

const DEFAULT_FACEBOOK_PRICE_PKR = 30;
const OTHER_SERVICE_PRICE_PKR = 60;

function normalizeServiceType(rawPlatform: string | null): string {
  if (!rawPlatform) {
    return "generic";
  }
  return rawPlatform.trim().toLowerCase();
}

function getServicePricePkr(serviceType: string): number {
  return serviceType === "facebook" ? DEFAULT_FACEBOOK_PRICE_PKR : OTHER_SERVICE_PRICE_PKR;
}

/** Format seconds as MM:SS countdown string */
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Derive seconds remaining from ISO timestamp */
function secondsUntil(isoStr: string): number {
  return Math.max(0, Math.floor((new Date(isoStr).getTime() - Date.now()) / 1000));
}

function NumbersPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { balancePkr } = useWalletStore();

  // Use user's preferred platform from auth store
  const userPlatform = user?.preferredPlatform || "Facebook";
  const serviceType = normalizeServiceType(userPlatform);
  const servicePrice = getServicePricePkr(serviceType);

  const {
    data: fetchedActive,
    isLoading: loading,
    mutate: refresh,
  } = useApi<ActiveNumber | null>("/api/numbers/active", {
    disableDedupe: true,
    cacheTtlMs: 0,
  });
  const { wsUrl } = getPublicEnv();

  const [pending, setPending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpFlash, setOtpFlash] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsUnavailable, setWsUnavailable] = useState(false);
  const [polledOtp, setPolledOtp] = useState<string | null>(null);
  const [optimisticActive, setOptimisticActive] = useState<ActiveNumber | null>(null);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingChangeNumber, setLoadingChangeNumber] = useState(false);
  const [expectedOtpLength] = useState(6);
  const [showChangeNumberDialog, setShowChangeNumberDialog] = useState(false);
  const [showPostOtpChangeDialog, setShowPostOtpChangeDialog] = useState(false);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const [rechargeServicePrice, setRechargeServicePrice] = useState<number | undefined>(undefined);
  const [rechargeDescription, setRechargeDescription] = useState<string | undefined>(undefined);
  const rawActive = optimisticActive ?? fetchedActive ?? null;
  const adjustWallet = useWalletStore((s) => s.adjustBalance);
  const fetchWalletBalance = useWalletStore((s) => s.fetchBalance);

  const syncWalletAfterRefund = useCallback(
    async (refundAmountPkr?: number | null) => {
      if (refundAmountPkr && refundAmountPkr > 0) {
        adjustWallet(refundAmountPkr);
      }
      if (token) {
        await fetchWalletBalance(token);
      }
    },
    [adjustWallet, fetchWalletBalance, token],
  );

  const syncWalletBalance = useCallback(async () => {
    if (token) {
      await fetchWalletBalance(token);
    }
  }, [fetchWalletBalance, token]);
  const expireHandledRef = useRef<string | null>(null);

  const displayOtp = rawActive?.parsedOtp ?? polledOtp;
  const hasReceivedOtp =
    rawActive?.otpStatus === "RECEIVED" || Boolean(displayOtp);

  /** Hide expired leases without OTP even if SWR still has stale data */
  const active = useMemo(() => {
    if (!rawActive) {
      return null;
    }
    const expired =
      Boolean(rawActive.leasedUntil) &&
      secondsUntil(rawActive.leasedUntil) <= 0;
    if (expired && !hasReceivedOtp) {
      return null;
    }
    return rawActive;
  }, [rawActive, hasReceivedOtp]);

  const activeServiceType = rawActive?.serviceType
    ? normalizeServiceType(rawActive.serviceType)
    : null;
  const platformMismatch =
    Boolean(rawActive) &&
    !hasReceivedOtp &&
    activeServiceType !== null &&
    activeServiceType !== serviceType;

  const clearActiveState = useCallback(
    async (revalidate = true) => {
      setOptimisticActive(null);
      setPolledOtp(null);
      await refresh(null, { revalidate });
    },
    [refresh],
  );

  const handleLeaseExpired = useCallback(async () => {
    if (!token || !rawActive || hasReceivedOtp) {
      return;
    }

    const leaseKey = rawActive.otpRequestId || rawActive.e164;
    if (expireHandledRef.current === leaseKey) {
      return;
    }
    expireHandledRef.current = leaseKey;

    setShowChangeNumberDialog(false);
    await clearActiveState(false);

    try {
      const res = await apiFetch<{
        refunded?: boolean;
        refundAmountPkr?: number | null;
      }>("/api/numbers/release", {
        method: "POST",
        accessToken: token,
      });

      if (res.success && res.data?.refunded && res.data.refundAmountPkr) {
        await syncWalletAfterRefund(res.data.refundAmountPkr);
        toast.success(
          `Lease expired. PKR ${res.data.refundAmountPkr} refunded to your wallet.`,
        );
      } else {
        await syncWalletBalance();
      }

      await refresh();
    } catch (err) {
      console.error("Lease expiry cleanup failed:", err);
      await syncWalletBalance();
      await refresh();
    }
  }, [token, rawActive, hasReceivedOtp, clearActiveState, syncWalletAfterRefund, syncWalletBalance, refresh]);

  const checkBalanceRequirement = useCallback((requiredPrice: number): boolean => {
    if (balancePkr === null) {
      return false;
    }
    return balancePkr < requiredPrice;
  }, [balancePkr]);

  const openRechargePopup = useCallback((requiredPrice: number, description: string) => {
    setRechargeServicePrice(requiredPrice);
    setRechargeDescription(description);
    setShowRechargePopup(true);
  }, []);

  useEffect(() => {
    if (!optimisticActive || !fetchedActive) {
      return;
    }
    if (optimisticActive.e164 === fetchedActive.e164) {
      setOptimisticActive(null);
    }
  }, [optimisticActive, fetchedActive]);

  // Countdown timer — ticks every second from leasedUntil
  useEffect(() => {
    if (!rawActive?.leasedUntil) {
      setCountdown(0);
      expireHandledRef.current = null;
      return;
    }
    setCountdown(secondsUntil(rawActive.leasedUntil));
    const tick = setInterval(() => {
      const remaining = secondsUntil(rawActive.leasedUntil);
      setCountdown(remaining);

      if (remaining <= 0 && !hasReceivedOtp) {
        void handleLeaseExpired();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [rawActive?.leasedUntil, hasReceivedOtp, handleLeaseExpired]);

  // WebSocket for real-time OTP push — only while actively waiting for OTP
  useEffect(() => {
    if (!token) {
      setWsConnected(false);
      setWsUnavailable(false);
      return;
    }

    const awaitingOtp =
      active?.otpStatus !== "EXPIRED" &&
      active?.otpStatus !== "FAILED" &&
      !active?.parsedOtp &&
      !polledOtp &&
      Boolean(active?.e164);

    if (!awaitingOtp) {
      setWsConnected(false);
      setWsUnavailable(false);
      return;
    }

    const endpoint = wsUrl ? `${wsUrl}/otp` : "/otp";
    const socket: Socket = io(endpoint, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 4,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
      timeout: 8000,
    });

    const onConnect = () => {
      setWsConnected(true);
      setWsUnavailable(false);
    };
    const onDisconnect = () => setWsConnected(false);
    const onConnectError = () => {
      setWsConnected(false);
    };
    const onReconnectFailed = () => {
      setWsConnected(false);
      setWsUnavailable(true);
    };
    const onOtpReceived = (payload?: { otp?: string }) => {
      if (payload?.otp) {
        setPolledOtp(payload.otp);
      }
      void refresh();
      setOtpFlash(true);
      setTimeout(() => setOtpFlash(false), 2500);
      toast.success("OTP received!", { duration: 4000 });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_failed", onReconnectFailed);
    socket.on("otp:received", onOtpReceived);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.off("otp:received", onOtpReceived);
      socket.disconnect();
      setWsConnected(false);
    };
  }, [
    token,
    wsUrl,
    refresh,
    active?.e164,
    active?.otpStatus,
    active?.parsedOtp,
    polledOtp,
  ]);

  // Fast-poll fallback: keep polling while pending so first OTP is never missed,
  // even if socket room handoff races with initial webhook emit.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const awaitingOtp =
      active?.otpStatus !== "EXPIRED" &&
      active?.otpStatus !== "FAILED" &&
      !active?.parsedOtp &&
      !polledOtp;

    if (!active?.e164 || !token || !awaitingOtp) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }
    const e164 = active.e164;

    const doPoll = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        const res = await apiFetch<{ status: string; otp?: string }>(`/api/otp/poll?number=${encodeURIComponent(e164)}`, {
          accessToken: token,
          disableDedupe: true,
          cacheTtlMs: 0,
        });
        if (!controller.signal.aborted && res.success && res.data?.status === "received") {
          if (res.data.otp) {
            setPolledOtp(res.data.otp);
          }
          void refresh();
          setOtpFlash(true);
          setTimeout(() => setOtpFlash(false), 2500);
          toast.success("OTP received via poll!");
        }
      } catch { /* silent */ } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    };
    void doPoll();
    pollRef.current = setInterval(() => void doPoll(), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [active?.e164, active?.otpStatus, active?.parsedOtp, polledOtp, token, refresh]);

  useEffect(() => {
    setPolledOtp(null);
  }, [active?.e164]);

  const copyToClipboard = useCallback(
    async (value: string, successMessage: string): Promise<boolean> => {
      if (!value) {
        return false;
      }
      try {
        if (!navigator?.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(value);
        toast.success(successMessage);
        return true;
      } catch {
        toast.error("Clipboard permission denied. Please copy manually.");
        return false;
      }
    },
    [],
  );

  const assignActiveNumber = useCallback(
    (data: {
      phoneNumber: string;
      leasedUntil: string;
      otpRequestId: string;
      leaseId?: string;
    }) => {
      expireHandledRef.current = null;
      setOptimisticActive({
        e164: data.phoneNumber,
        leasedUntil: data.leasedUntil,
        parsedOtp: null,
        otpStatus: "PENDING",
        otpRequestId: data.otpRequestId ?? data.leaseId ?? "pending",
        serviceType,
      });
      setPolledOtp(null);
      void syncWalletBalance();
      void refresh();
    },
    [syncWalletBalance, refresh, serviceType],
  );

  const replaceActiveNumber = useCallback(async () => {
    if (!token) return false;

    if (checkBalanceRequirement(servicePrice)) {
      openRechargePopup(servicePrice, "Insufficient funds for this platform.");
      return false;
    }

    setPending(true);
    try {
      const res = await apiFetch<{
        phoneNumber: string;
        leasedUntil: string;
        otpRequestId: string;
        leaseId?: string;
      }>("/api/numbers/change", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ serviceType }),
      });

      if (!res.success) {
        if (res.error === "INSUFFICIENT_BALANCE") {
          openRechargePopup(servicePrice, "Insufficient funds for this platform.");
          return false;
        }
        toast.error(res.error);
        return false;
      }

      assignActiveNumber(res.data);
      toast.success(
        platformMismatch
          ? `Switched to ${userPlatform}. Your previous number was cancelled and refunded.`
          : "Number changed successfully! New number assigned.",
      );
      return true;
    } catch (err) {
      console.error("Replace number failed:", err);
      toast.error("Failed to get a new number. Please try again.");
      return false;
    } finally {
      setPending(false);
    }
  }, [
    token,
    serviceType,
    servicePrice,
    checkBalanceRequirement,
    openRechargePopup,
    assignActiveNumber,
    platformMismatch,
    userPlatform,
  ]);

  const acquire = useCallback(async () => {
    if (!token) return;

    if (rawActive && !hasReceivedOtp) {
      await replaceActiveNumber();
      return;
    }

    // Check balance before making API call
    if (checkBalanceRequirement(servicePrice)) {
      openRechargePopup(servicePrice, "Insufficient funds for this platform.");
      return;
    }
    
    setPending(true);
    const res = await apiFetch<{
      phoneNumber: string;
      leasedUntil: string;
      otpRequestId: string;
      leaseId?: string;
    }>("/api/numbers/acquire", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({ serviceType }),
    });
    setPending(false);
    if (!res.success) {
      if (res.error === "INSUFFICIENT_BALANCE") {
        openRechargePopup(servicePrice, "Insufficient funds for this platform.");
        return;
      }
      toast.error(res.error);
      return;
    }
    toast.success("Virtual number assigned!");
    assignActiveNumber(res.data);
    
    // Use response data directly - no need for refresh or delay
    // The backend now returns full phone data in the response
  }, [
    token,
    rawActive,
    hasReceivedOtp,
    replaceActiveNumber,
    serviceType,
    servicePrice,
    checkBalanceRequirement,
    openRechargePopup,
    assignActiveNumber,
  ]);

  const copyNumber = useCallback(() => {
    if (!active?.e164) return;
    void copyToClipboard(active.e164, "Number copied to clipboard");
  }, [active?.e164, copyToClipboard]);

  const copyOtp = useCallback(() => {
    const otp = active?.parsedOtp ?? polledOtp;
    if (!otp) return;
    void copyToClipboard(otp, "OTP copied to clipboard");
  }, [active?.parsedOtp, polledOtp, copyToClipboard]);

  const handleRefreshStatus = useCallback(async () => {
    if (!active?.otpRequestId || !active?.e164 || !token) return;
    
    setLoadingRefresh(true);
    try {
      const res = await apiFetch<{
        status: "PENDING" | "RECEIVED" | "EXPIRED" | "FAILED";
        otpCode: string | null;
      }>(`/api/otp/status/${active.otpRequestId}`, {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      });

      if (res.success && res.data?.status === "RECEIVED" && res.data.otpCode) {
        setPolledOtp(res.data.otpCode);
        void refresh();
        setOtpFlash(true);
        setTimeout(() => setOtpFlash(false), 2500);
        toast.success("OTP received!");
        return;
      }

      const pollRes = await apiFetch<{ status: string; otp?: string }>(`/api/otp/poll?number=${encodeURIComponent(active.e164)}`, {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      });

      if (pollRes.success && pollRes.data?.status === "received" && pollRes.data.otp) {
        setPolledOtp(pollRes.data.otp);
        void refresh();
        setOtpFlash(true);
        setTimeout(() => setOtpFlash(false), 2500);
        toast.success("OTP recovered from latest webhook event!");
      } else {
        toast.info("No OTP found yet. If needed, trigger resend from the target platform.");
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      toast.error("Failed to refresh status");
    } finally {
      setLoadingRefresh(false);
    }
  }, [active?.otpRequestId, active?.e164, token, refresh]);

  const releaseActiveNumber = useCallback(async () => {
    if (!token) return;
    
    setLoadingRefresh(true);
    try {
      const res = await apiFetch<{
        refunded?: boolean;
        refundAmountPkr?: number | null;
      }>("/api/numbers/release", {
        method: "POST",
        accessToken: token,
      });
      
      if (res.success) {
        setShowChangeNumberDialog(false);
        expireHandledRef.current = null;
        await clearActiveState(true);
        if (res.data?.refunded && res.data.refundAmountPkr) {
          await syncWalletAfterRefund(res.data.refundAmountPkr);
          toast.success(
            `Number cancelled. PKR ${res.data.refundAmountPkr} has been refunded to your wallet.`,
          );
        } else {
          await syncWalletBalance();
          if (hasReceivedOtp) {
            toast.success(
              "Number released. No refund — OTP was already received.",
            );
          } else {
            toast.success("Number cancelled. You can get a new number.");
          }
        }
      } else {
        toast.error(res.error || "Failed to release number");
      }
    } catch (err) {
      console.error("Release failed:", err);
      toast.error("Failed to release number");
    } finally {
      setLoadingRefresh(false);
    }
  }, [token, clearActiveState, syncWalletAfterRefund, syncWalletBalance, hasReceivedOtp]);

  const handleRefundOnly = useCallback(async () => {
    setShowChangeNumberDialog(false);
    await releaseActiveNumber();
  }, [releaseActiveNumber]);

  const handleChangeNumber = useCallback(() => {
    if (hasReceivedOtp) {
      setShowPostOtpChangeDialog(true);
      return;
    }
    setShowChangeNumberDialog(true);
  }, [hasReceivedOtp]);

  const confirmChangeNumber = useCallback(async () => {
    if (!token) return;

    // Check balance before making API call
    if (checkBalanceRequirement(servicePrice)) {
      openRechargePopup(servicePrice, "Insufficient funds for this platform.");
      return;
    }

    setShowChangeNumberDialog(false);
    setShowPostOtpChangeDialog(false);
    setLoadingChangeNumber(true);
    toast.info("Changing number... Please wait 2-3 seconds");
    
    try {
      const res = await apiFetch<{
        phoneNumber: string;
        leasedUntil: string;
        otpRequestId: string;
        leaseId?: string;
      }>("/api/numbers/change", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ serviceType }),
      });
      
      if (res.success) {
        expireHandledRef.current = null;
        assignActiveNumber({
          phoneNumber: res.data.phoneNumber,
          leasedUntil: res.data.leasedUntil,
          otpRequestId: res.data.otpRequestId,
          leaseId: res.data.leaseId,
        });
        toast.success("Number changed successfully! New number assigned.");
      } else {
        if (res.error === "INSUFFICIENT_BALANCE") {
          openRechargePopup(servicePrice, "Insufficient funds for this platform.");
          return;
        }
        toast.error(res.error || "Failed to change number");
      }
    } catch (err) {
      console.error("Change number failed:", err);
      toast.error("Failed to change number. Please try again.");
    } finally {
      setLoadingChangeNumber(false);
    }
  }, [token, serviceType, servicePrice, checkBalanceRequirement, openRechargePopup, assignActiveNumber]);

  const confirmPostOtpChange = useCallback(async () => {
    setShowPostOtpChangeDialog(false);
    await confirmChangeNumber();
  }, [confirmChangeNumber]);

  const statusColor = {
    PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    RECEIVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    EXPIRED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const timerColor =
    countdown > 300 ? "text-emerald-400" :
    countdown > 60  ? "text-amber-400"   :
                      "text-red-400";

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex flex-wrap items-center gap-2 font-bold tracking-tight sm:gap-3">
          <Phone className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
          Virtual US Number
        </h1>
        <p className="text-muted-foreground">
          Lease a temporary US number and receive OTP codes in real time.
        </p>
      </div>

      {/* Active Number Card */}
      <Card className="border-border/50 shadow-lg overflow-hidden">
        <div className="h-1 w-full bg-linear-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Active Number</CardTitle>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {active &&
              active.otpStatus !== "EXPIRED" &&
              active.otpStatus !== "FAILED" &&
              !active.parsedOtp &&
              !polledOtp ? (
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${
                    wsConnected
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : wsUnavailable
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
                  }`}
                >
                  <Wifi className="h-3 w-3" />
                  {wsConnected ? "Live" : wsUnavailable ? "Offline" : "Connecting"}
                </div>
              ) : null}
            </div>
          </div>
          <CardDescription>
            OTP codes appear instantly via WebSocket push + polling fallback.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {platformMismatch && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              You switched to <strong className="text-amber-100">{userPlatform}</strong>.
              Your current number was leased for a different platform. Tap{" "}
              <strong className="text-amber-100">Switch to {userPlatform}</strong>{" "}
              below to cancel it, get your refund, and receive a new number.
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : active ? (
            <>
              {/* Phone Number Display */}
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 sm:p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">US Number</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-foreground break-all">
                      {active.e164}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                    <Badge
                      className={`text-xs font-semibold border ${
                        statusColor[active.otpStatus] ?? statusColor.PENDING
                      }`}
                    >
                      {active.otpStatus}
                    </Badge>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyNumber}
                      className="h-8 w-8 border-border/50 hover:border-primary/50 transition-colors"
                      title="Copy number"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="flex flex-col gap-2 pt-1 border-t border-border/40 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 shrink-0 ${timerColor}`} />
                    <span className="text-xs text-muted-foreground">Expires in</span>
                    <span className={`font-mono text-sm font-bold tabular-nums ${timerColor}`}>
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                  {countdown === 0 && (
                    <span className="text-xs text-red-400 sm:ml-auto">Lease expired</span>
                  )}
                </div>
              </div>

              {/* OTP Display */}
              <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-500 ${
                otpFlash
                  ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                  : "border-border/60 bg-secondary/10"
              }`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    Received OTP
                  </p>
                  {displayOtp && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyOtp}
                      className="h-6 shrink-0 px-2 text-xs gap-1 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  )}
                </div>

                {displayOtp ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
                    <p className="text-2xl sm:text-4xl font-bold font-mono tracking-[0.15em] sm:tracking-[0.3em] text-emerald-400 break-all text-center sm:text-left">
                      {displayOtp}
                    </p>
                    <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-center gap-1.5 sm:justify-start sm:gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-7 sm:h-9 sm:w-8 rounded-md border border-border/50 bg-secondary/30 animate-pulse"
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>
                    {active.otpStatus === "PENDING" && (
                      <div className="min-w-0 space-y-1.5 text-center text-xs text-muted-foreground sm:text-left">
                        <p>
                          Awaiting {expectedOtpLength}-digit SMS… ({userPlatform || "generic"})
                        </p>
                        <p className="text-amber-400/80 flex items-start justify-center gap-1 sm:justify-start">
                          <Info className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>
                            If you do not receive the OTP within 30–60 seconds, please trigger
                            &apos;Resend OTP&apos; directly from that particular platform.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {(active.otpStatus === "PENDING" || hasReceivedOtp) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeNumber}
                className="mt-4 gap-2 w-full border-border/50"
                disabled={loadingChangeNumber}
              >
                {loadingChangeNumber ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {loadingChangeNumber
                  ? "Changing..."
                  : hasReceivedOtp
                    ? "Change Number"
                    : "Cancel"}
              </Button>
              )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
                className="gap-2 w-full border-border/50"
                disabled={loadingRefresh}
              >
                <RefreshCw className={`h-4 w-4 ${loadingRefresh ? 'animate-spin' : ''}`} />
                {loadingRefresh ? 'Refreshing...' : 'Refresh Status'}
              </Button>

            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/30 border border-border/50">
                <Phone className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No active number</p>
                <p className="text-sm text-muted-foreground">
                  Get a temporary US number to receive SMS OTP codes.
                </p>
              </div>
            </div>
          )}

          {/* Acquire / platform switch */}
          {(!active || platformMismatch) && (
            <Button
              onClick={() => void acquire()}
              disabled={pending}
              className="w-full gap-2 font-semibold relative overflow-hidden group"
              size="lg"
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {pending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {platformMismatch ? "Switching platform…" : "Reserving number…"}
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  {platformMismatch
                    ? `Switch to ${userPlatform} (Rs ${servicePrice})`
                    : `Get US Number (Rs ${servicePrice})`}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="border-border/40 bg-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-foreground">
            Service Charge: Rs {servicePrice} per OTP
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside pl-0.5">
            <li>Click <strong className="text-foreground">Get US Number</strong> to lease a temporary number</li>
            <li>Copy the number and paste it on Facebook / your platform&apos;s signup page</li>
            <li>OTP automatically appears here when SMS arrives — no typing needed</li>
            <li>Click <strong className="text-foreground">Copy</strong> and paste the code on the platform</li>
            <li>Number returns to pool after lease expires (~30 min)</li>
          </ol>
        </CardContent>
      </Card>

      {/* Universal Recharge Popup */}
      <RechargePopup
        open={showRechargePopup}
        onOpenChange={setShowRechargePopup}
        servicePrice={rechargeServicePrice}
        showMinimumMessage={true}
        description={rechargeDescription}
      />

      {/* Pre-OTP: refund or change */}
      <Dialog open={showChangeNumberDialog} onOpenChange={setShowChangeNumberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel</DialogTitle>
            <DialogDescription>
              No OTP yet. <strong>Yes</strong> cancels and refunds Rs {servicePrice}.{" "}
              <strong>No</strong> keeps this number.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void handleRefundOnly()}
              disabled={loadingRefresh}
            >
              {loadingRefresh ? "Processing…" : "Yes"}
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowChangeNumberDialog(false)}
            >
              No
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post-OTP: change only (no refund) */}
      <Dialog open={showPostOtpChangeDialog} onOpenChange={setShowPostOtpChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Number</DialogTitle>
            <DialogDescription>
              OTP has already been received, so a refund is not available. Getting a new number
              will charge Rs {servicePrice}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPostOtpChangeDialog(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => void confirmPostOtpChange()}>
              Change Number
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(NumbersPage);
