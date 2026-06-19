"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Copy, Phone, RefreshCw, ShieldCheck, Clock, Wifi, X, Info } from "lucide-react";
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
  const [polledOtp, setPolledOtp] = useState<string | null>(null);
  const [optimisticActive, setOptimisticActive] = useState<ActiveNumber | null>(null);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingChangeNumber, setLoadingChangeNumber] = useState(false);
  const [expectedOtpLength] = useState(6);
  const [showPostOtpWarningDialog, setShowPostOtpWarningDialog] = useState(false);
  const [pendingPostOtpAction, setPendingPostOtpAction] = useState<"change" | "cancel" | null>(null);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const [rechargeServicePrice, setRechargeServicePrice] = useState<number | undefined>(undefined);
  const [rechargeDescription, setRechargeDescription] = useState<string | undefined>(undefined);
  const active = optimisticActive ?? fetchedActive ?? null;

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
    if (!active?.leasedUntil) {
      setCountdown(0);
      return;
    }
    setCountdown(secondsUntil(active.leasedUntil));
    const tick = setInterval(() => {
      const remaining = secondsUntil(active.leasedUntil);
      setCountdown(remaining);
      
      // Auto-reset when lease expires
      if (remaining <= 0) {
        setOptimisticActive(null);
        setPolledOtp(null);
        void refresh();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [active?.leasedUntil, refresh]);

  // WebSocket for real-time OTP push
  useEffect(() => {
    if (!token) return;
    const endpoint = wsUrl ? `${wsUrl}/otp` : "/otp";
    const socket: Socket = io(endpoint, {
      auth: { token },
      transports: ["polling", "websocket"],
      upgrade: true,
    });
    socket.on("connect", () => setWsConnected(true));
    socket.on("disconnect", () => setWsConnected(false));
    socket.on("otp:received", () => {
      void refresh();
      setOtpFlash(true);
      setTimeout(() => setOtpFlash(false), 2500);
      toast.success("OTP received!", { duration: 4000 });
    });
    return () => { socket.disconnect(); };
  }, [token, wsUrl, refresh]);

  // Fast-poll fallback: keep polling while pending so first OTP is never missed,
  // even if socket room handoff races with initial webhook emit.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pollStartTime, setPollStartTime] = useState<number | null>(null);
  
  useEffect(() => {
    if (!active?.e164 || active.otpStatus !== "PENDING" || !token) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setPollStartTime(null);
      return;
    }
    const e164 = active.e164;
    if (!pollStartTime) {
      setPollStartTime(Date.now());
    }
    
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setPollStartTime(null);
    };
  }, [active?.e164, active?.otpStatus, token, refresh, pollStartTime]);

  const invalidateWallet = useWalletStore((s) => s.invalidate);

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

  const acquire = useCallback(async () => {
    if (!token) return;

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
    setOptimisticActive({
      e164: res.data.phoneNumber,
      leasedUntil: res.data.leasedUntil,
      parsedOtp: null,
      otpStatus: "PENDING",
      otpRequestId: res.data.otpRequestId ?? res.data.leaseId ?? "pending",
    });
    setPolledOtp(null);
    invalidateWallet(); // Immediately refresh header PKR balance
    
    // Use response data directly - no need for refresh or delay
    // The backend now returns full phone data in the response
  }, [token, invalidateWallet, serviceType, servicePrice, checkBalanceRequirement, openRechargePopup]);

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
      const res = await apiFetch<{ success: boolean; error?: string }>("/api/numbers/release", {
        method: "DELETE",
        accessToken: token,
      });
      
      if (res.success) {
        setOptimisticActive(null);
        setPolledOtp(null);
        toast.success("Number released successfully");
        invalidateWallet();
        void refresh();
      } else {
        toast.error(res.error || "Failed to release number");
      }
    } catch (err) {
      console.error("Release failed:", err);
      toast.error("Failed to release number");
    } finally {
      setLoadingRefresh(false);
    }
  }, [token, refresh, invalidateWallet]);

  const [showChangeNumberDialog, setShowChangeNumberDialog] = useState(false);

  const handleChangeNumber = useCallback(() => {
    const received = active?.otpStatus === "RECEIVED" || Boolean(active?.parsedOtp ?? polledOtp);
    if (received) {
      setPendingPostOtpAction("change");
      setShowPostOtpWarningDialog(true);
      return;
    }
    setShowChangeNumberDialog(true);
  }, [active?.otpStatus, active?.parsedOtp, polledOtp]);

  const handleCancelNumber = useCallback(() => {
    setPendingPostOtpAction("cancel");
    setShowPostOtpWarningDialog(true);
  }, []);

  const confirmChangeNumber = useCallback(async () => {
    if (!token) return;

    // Check balance before making API call
    if (checkBalanceRequirement(servicePrice)) {
      openRechargePopup(servicePrice, "Insufficient funds for this platform.");
      return;
    }

    setShowChangeNumberDialog(false);
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
        setOptimisticActive({
          e164: res.data.phoneNumber,
          leasedUntil: res.data.leasedUntil,
          parsedOtp: null,
          otpStatus: "PENDING",
          otpRequestId: res.data.otpRequestId ?? res.data.leaseId ?? "pending",
        });
        setPolledOtp(null);
        toast.success("Number changed successfully! New number assigned.");
        invalidateWallet();
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
  }, [token, serviceType, invalidateWallet, servicePrice, checkBalanceRequirement, openRechargePopup]);

  const confirmPostOtpAction = useCallback(async () => {
    setShowPostOtpWarningDialog(false);
    if (pendingPostOtpAction === "change") {
      await confirmChangeNumber();
      return;
    }
    if (pendingPostOtpAction === "cancel") {
      await releaseActiveNumber();
    }
  }, [pendingPostOtpAction, confirmChangeNumber, releaseActiveNumber]);

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
  const displayOtp = active?.parsedOtp ?? polledOtp;
  const hasReceivedOtp = active?.otpStatus === "RECEIVED" || Boolean(displayOtp);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Phone className="h-7 w-7 text-primary" />
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Active Number</CardTitle>
            <div className="flex items-center gap-2">
              {/* WebSocket connection indicator */}
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${
                wsConnected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
              }`}>
                <Wifi className="h-3 w-3" />
                {wsConnected ? "Live" : "Connecting"}
              </div>
            </div>
          </div>
          <CardDescription>
            OTP codes appear instantly via WebSocket push + polling fallback.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : active ? (
            <>
              {/* Phone Number Display */}
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">US Number</p>
                    <p className="text-2xl font-bold font-mono tracking-wider text-foreground">
                      {active.e164}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                  <Clock className={`h-4 w-4 ${timerColor}`} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Expires in</span>
                    <span className={`font-mono text-sm font-bold tabular-nums ${timerColor}`}>
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                  {countdown === 0 && (
                    <span className="text-xs text-red-400 ml-auto">Lease expired</span>
                  )}
                </div>
              </div>

              {/* OTP Display */}
              <div className={`rounded-xl border p-5 transition-all duration-500 ${
                otpFlash
                  ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                  : "border-border/60 bg-secondary/10"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    Received OTP
                  </p>
                  {displayOtp && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyOtp}
                      className="h-6 px-2 text-xs gap-1 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  )}
                </div>

                {displayOtp ? (
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-bold font-mono tracking-[0.3em] text-emerald-400">
                      {displayOtp}
                    </p>
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-9 w-7 rounded-md border border-border/50 bg-secondary/30 animate-pulse"
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>
                    {active.otpStatus === "PENDING" && (
                    <div className="text-xs text-muted-foreground ml-2 space-y-1">
                      <p>
                        Awaiting {expectedOtpLength}-digit SMS… ({userPlatform || 'generic'})
                      </p>
                      <p className="text-amber-400/80 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        If you do not receive the OTP within 30–60 seconds, please trigger &apos;Resend OTP&apos; directly from that particular platform.
                      </p>
                    </div>
                  )}
                  </div>
                )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeNumber}
                className="gap-2 w-full border-border/50"
                disabled={loadingChangeNumber}
              >
                {loadingChangeNumber ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {loadingChangeNumber ? "Changing..." : "Refund / Change Number"}
              </Button>

              {hasReceivedOtp && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelNumber}
                    className="gap-2 flex-1 border-border/50"
                    disabled={loadingRefresh}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
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

          {/* Acquire Button */}
          {!active && (
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
                  Reserving number…
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Get US Number (Rs {servicePrice})
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
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Click <strong className="text-foreground">Get US Number</strong> to lease a temporary number</li>
            <li>Use the number on any website that requires SMS verification</li>
            <li>Your OTP code appears automatically within seconds</li>
            <li>The number returns to the pool after the lease expires (30 min)</li>
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

      {/* Change Number Confirmation Dialog */}
      <Dialog open={showChangeNumberDialog} onOpenChange={setShowChangeNumberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund / Change Number</DialogTitle>
            <DialogDescription>
              Do you want to purchase another number?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowChangeNumberDialog(false)}
            >
              No
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmChangeNumber}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPostOtpWarningDialog} onOpenChange={setShowPostOtpWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Important</DialogTitle>
            <DialogDescription>
              Changing this number will cost extra charges and canceling will release the active number.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPostOtpWarningDialog(false)}
            >
              No
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => void confirmPostOtpAction()}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(NumbersPage);
