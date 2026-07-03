"use client";

import { useEffect, useRef, useState, useCallback, useMemo, startTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { PlatformBanner } from "@/components/platform/platform-banner";
import {
  getPlatformPricePkr,
  getPlatformVisual,
  normalizePlatformTariffs,
  platformFromQueryParam,
  serviceTypeToPlatform,
  type PlatformTariffs,
  type PlatformOption,
} from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { getNumberFlowErrorMessage } from "@/lib/number-errors";

type ActiveNumber = {
  e164: string;
  leasedUntil: string;
  parsedOtp: string | null;
  otpStatus: "PENDING" | "RECEIVED" | "EXPIRED" | "FAILED";
  otpRequestId: string;
  serviceType?: string | null;
  isLiveLease?: boolean;
};

type SwapIssueOption = {
  id: string;
  label: string;
  reason: string;
  suggestion: string;
  postAssignSuggestion?: string;
};

const LEASE_TTL_MINUTES = 10;
/** Silent background sync while waiting for OTP — does not affect Refresh Status button. */
const BACKGROUND_SYNC_INTERVAL_MS = 10_000;
const LEASE_EXPIRED_TOAST_ID = "lease-expired-toast";
const SWAP_ISSUE_OPTIONS: SwapIssueOption[] = [
  {
    id: "already-used",
    label: "Platform says number is already used",
    reason: "already in use on platform",
    suggestion: "This option enables protected replacement logic. If OTP was not received, no extra charge is applied.",
    postAssignSuggestion: "Use the new number immediately. If platform still shows already-used, switch once more and avoid reusing this number.",
  },
  {
    id: "unfortunately-error",
    label: "Platform shows 'Unfortunately, we can't create your account'",
    reason: "account blocked / unfortunate error",
    suggestion: "Use a clean browser profile + stable US residential VPN + fresh account details before retrying.",
    postAssignSuggestion: "Switch to Incognito (no extensions), use stable US VPN, clear Walmart cookies, then retry once.",
  },
  {
    id: "walmart-csp-block",
    label: "Walmart shows CSP / script blocked / security error",
    reason: "walmart browser security csp blocked",
    suggestion: "This is usually browser environment blocking, not number failure. Use clean browser context first.",
    postAssignSuggestion:
      "Close extensions, use Incognito/new Chrome profile, keep only 1 tab, and retry on Walmart with stable US VPN.",
  },
  {
    id: "no-otp",
    label: "No OTP received",
    reason: "no otp received",
    suggestion: "Trigger 'Resend OTP' on the platform first. If still no SMS, switch number.",
    postAssignSuggestion: "Trigger resend once on the platform. If no OTP within 30-60 seconds, switch number again.",
  },
  {
    id: "invalid-otp",
    label: "OTP received but platform rejected it",
    reason: "otp invalid on platform",
    suggestion: "Make sure latest OTP is entered. If rejected repeatedly, switch number and try once.",
    postAssignSuggestion: "Paste only the latest OTP. If platform still rejects it, retry with a fresh number and new resend.",
  },
  {
    id: "slow-delivery",
    label: "OTP delivery is too slow / expired",
    reason: "slow otp delivery",
    suggestion: "Switch early when countdown is low to avoid expiry and refund-delay cycles.",
    postAssignSuggestion: "Use the new number immediately and request OTP quickly to avoid timer expiry.",
  },
  {
    id: "other",
    label: "Other issue",
    reason: "number not working / other issue",
    suggestion: "Report submitted. A new number will be assigned now.",
    postAssignSuggestion: "Try once with the new number. If issue repeats, report exact platform message in next swap.",
  },
];

function normalizeServiceType(rawPlatform: string | null): string {
  if (!rawPlatform) {
    return "generic";
  }
  return rawPlatform.trim().toLowerCase();
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

function NumbersPageContent() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { balancePkr, ownerUserId } = useWalletStore();
  const searchParams = useSearchParams();
  const urlPlatform = platformFromQueryParam(searchParams.get("platform"));
  const preferredPlatform = serviceTypeToPlatform(user?.preferredPlatform || "Facebook");

  const {
    data: fetchedActive,
    isLoading,
    isValidating,
    mutate: refresh,
  } = useApi<ActiveNumber | null>("/api/numbers/active", {
    disableDedupe: true,
    cacheTtlMs: 0,
    keepPreviousData: false,
    revalidateOnMount: true,
  });
  const {
    data: tariffPayload,
    error: tariffError,
    isLoading: tariffLoading,
  } = useApi<{
    facebook: number;
    amazon: number;
    walmart: number;
    others: number;
  }>("/api/numbers/tariffs", {
    cacheTtlMs: 15_000,
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
  const [hideCompletedSession, setHideCompletedSession] = useState(false);
  const [expectedOtpLength] = useState(6);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSwapConfirmDialog, setShowSwapConfirmDialog] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showPostOtpChangeDialog, setShowPostOtpChangeDialog] = useState(false);
  const [selectedSwapIssueId, setSelectedSwapIssueId] = useState<string | null>(
    null,
  );
  const [pageSuggestion, setPageSuggestion] = useState<string | null>(null);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const [rechargeServicePrice, setRechargeServicePrice] = useState<number | undefined>(undefined);
  const [rechargeDescription, setRechargeDescription] = useState<string | undefined>(undefined);
  const rawActive = optimisticActive ?? fetchedActive ?? null;
  const awaitingActiveRevalidation =
    Boolean(token) &&
    isValidating &&
    fetchedActive === undefined &&
    optimisticActive === null;
  const showInitialSkeleton = (isLoading && !rawActive) || awaitingActiveRevalidation;
  const fetchWalletBalance = useWalletStore((s) => s.fetchBalance);

  const syncWalletAfterRefund = useCallback(async () => {
    // Always trust server balance — never optimistic add (prevents double-count in UI).
    if (token && user?.id) {
      await fetchWalletBalance(token, user.id);
    }
  }, [fetchWalletBalance, token, user?.id]);

  const syncWalletBalance = useCallback(async () => {
    if (token && user?.id) {
      await fetchWalletBalance(token, user.id);
    }
  }, [fetchWalletBalance, token, user?.id]);
  const expireHandledRef = useRef<string | null>(null);
  const otpAnnouncedRef = useRef<string | null>(null);

  const displayOtp = rawActive?.parsedOtp ?? polledOtp;
  const hasReceivedOtp = Boolean(displayOtp);

  const leaseRemainingSec = rawActive?.leasedUntil
    ? secondsUntil(rawActive.leasedUntil)
    : 0;
  const isLiveLease =
    rawActive?.isLiveLease === true ||
    (rawActive?.isLiveLease !== false && leaseRemainingSec > 0);
  const sessionComplete = hasReceivedOtp && !isLiveLease;

  /** Hide expired leases without OTP immediately when timer hits zero */
  const active = useMemo(() => {
    if (!rawActive) {
      return null;
    }
    if (hideCompletedSession && hasReceivedOtp) {
      return null;
    }
    const remaining = rawActive.leasedUntil
      ? secondsUntil(rawActive.leasedUntil)
      : 0;
    if (remaining <= 0 && !hasReceivedOtp) {
      return null;
    }
    return rawActive;
  }, [rawActive, hasReceivedOtp, hideCompletedSession]);

  const activeServiceType = rawActive?.serviceType
    ? normalizeServiceType(rawActive.serviceType)
    : null;

  const activePlatform: PlatformOption = active?.serviceType
    ? serviceTypeToPlatform(active.serviceType)
    : activeServiceType
      ? serviceTypeToPlatform(activeServiceType)
      : preferredPlatform;
  const platformTariffs: PlatformTariffs = useMemo(
    () => normalizePlatformTariffs(tariffPayload),
    [tariffPayload],
  );
  const activePlatformVisual = getPlatformVisual(activePlatform);
  const activeSessionPrice = getPlatformPricePkr(activePlatform, platformTariffs);
  const selectedSwapIssue =
    SWAP_ISSUE_OPTIONS.find((option) => option.id === selectedSwapIssueId) ??
    null;

  /** User explicitly picked another platform on the Platforms page. */
  const intentionalPlatformSwitch =
    urlPlatform !== null &&
    active !== null &&
    activeServiceType !== null &&
    urlPlatform !== activePlatform;

  const selectedPlatform: PlatformOption =
    active && activeServiceType && !intentionalPlatformSwitch
      ? activePlatform
      : (urlPlatform ?? preferredPlatform);
  const selectedPlatformVisual = getPlatformVisual(selectedPlatform);
  const walmartMaintenanceMode = selectedPlatform === "Walmart";
  const serviceType = normalizeServiceType(selectedPlatform);
  const servicePrice = getPlatformPricePkr(selectedPlatform, platformTariffs);
  const pricingUnavailable = Boolean(token) && Boolean(tariffError);

  const platformMismatch =
    Boolean(active) &&
    activeServiceType !== null &&
    activeServiceType !== serviceType;

  /** Hide the previous platform session when user picks a different platform. */
  const displayActiveSession: ActiveNumber | null =
    active && !platformMismatch ? active : null;

  const displayPlatform = displayActiveSession ? activePlatform : selectedPlatform;
  const displayPlatformVisual = getPlatformVisual(displayPlatform);

  const isWaitingForOtp =
    Boolean(displayActiveSession) &&
    isLiveLease &&
    !hasReceivedOtp &&
    leaseRemainingSec > 0;

  const clearActiveState = useCallback(
    async (revalidate = true) => {
      setOptimisticActive(null);
      setPolledOtp(null);
      currentDisplayE164Ref.current = null;
      currentDisplayOtpRequestIdRef.current = null;
      otpAnnouncedRef.current = null;
      setHideCompletedSession(false);
      await refresh(null, { revalidate });
    },
    [refresh],
  );

  const revalidateActive = useCallback(() => {
    void refresh(undefined, { revalidate: true });
  }, [refresh]);

  const handleLeaseExpired = useCallback(async () => {
    if (!token || !rawActive || hasReceivedOtp) {
      return;
    }

    const remaining = rawActive.leasedUntil
      ? secondsUntil(rawActive.leasedUntil)
      : 0;
    if (remaining > 0) {
      return;
    }

    const leaseKey = rawActive.otpRequestId || rawActive.e164;
    if (expireHandledRef.current === leaseKey) {
      return;
    }
    expireHandledRef.current = leaseKey;

    // Final sync before release — catches OTP that landed at the last second
    try {
      const pollRes = await apiFetch<{ status: string; otp?: string }>(
        `/api/otp/poll?number=${encodeURIComponent(rawActive.e164)}`,
        { accessToken: token, disableDedupe: true, cacheTtlMs: 0 },
      );
      if (pollRes.success && pollRes.data?.status === "received" && pollRes.data.otp) {
        if (
          currentDisplayE164Ref.current !== rawActive.e164 ||
          currentDisplayOtpRequestIdRef.current !== rawActive.otpRequestId
        ) {
          return;
        }
        expireHandledRef.current = null;
        setPolledOtp(pollRes.data.otp);
        await refresh();
        return;
      }
      if (rawActive.otpRequestId) {
        const statusRes = await apiFetch<{
          status: string;
          otpCode: string | null;
        }>(`/api/otp/status/${rawActive.otpRequestId}`, {
          accessToken: token,
          disableDedupe: true,
          cacheTtlMs: 0,
        });
        if (
          statusRes.success &&
          statusRes.data?.otpCode &&
          statusRes.data.status === "RECEIVED"
        ) {
          if (
            currentDisplayE164Ref.current !== rawActive.e164 ||
            currentDisplayOtpRequestIdRef.current !== rawActive.otpRequestId
          ) {
            return;
          }
          expireHandledRef.current = null;
          setPolledOtp(statusRes.data.otpCode);
          await refresh();
          return;
        }
      }
    } catch {
      /* proceed with expire cleanup */
    }

    setShowCancelDialog(false);
    await clearActiveState(false);

    try {
      // Reconcile expiry + refund on server (idempotent) — do not call release again.
      const activeRes = await apiFetch<ActiveNumber | null>("/api/numbers/active", {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      });

      await syncWalletBalance();
      setOptimisticActive(null);
      setPolledOtp(null);
      await refresh();

      if (activeRes.success && activeRes.data === null) {
        toast.success(
          `Lease expired. If OTP did not arrive, your Rs ${servicePrice} refund is in your wallet.`,
          { id: LEASE_EXPIRED_TOAST_ID },
        );
      } else {
        toast.info("Lease ended. You can get a new number.", {
          id: LEASE_EXPIRED_TOAST_ID,
        });
      }
    } catch (err) {
      console.error("Lease expiry cleanup failed:", err);
      expireHandledRef.current = null;
      await syncWalletBalance();
      await refresh();
    }
  }, [token, rawActive, hasReceivedOtp, clearActiveState, syncWalletBalance, refresh, servicePrice]);

  const checkBalanceRequirement = useCallback((requiredPrice: number): boolean => {
    if (balancePkr === null || ownerUserId !== user?.id) {
      return false;
    }
    return balancePkr < requiredPrice;
  }, [balancePkr, ownerUserId, user?.id]);

  const openRechargePopup = useCallback((requiredPrice: number, description: string) => {
    setRechargeServicePrice(requiredPrice);
    setRechargeDescription(description);
    setShowRechargePopup(true);
  }, []);

  useEffect(() => {
    if (!fetchedActive && rawActive && !hasReceivedOtp) {
      const remaining = rawActive.leasedUntil
        ? secondsUntil(rawActive.leasedUntil)
        : 0;
      if (remaining <= 0 && !hasReceivedOtp) {
        setOptimisticActive(null);
        setPolledOtp(null);
      }
    }
  }, [fetchedActive, rawActive, hasReceivedOtp]);

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
      setCountdown((prev) => (prev === remaining ? prev : remaining));

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
      displayActiveSession?.otpStatus !== "EXPIRED" &&
      displayActiveSession?.otpStatus !== "FAILED" &&
      !displayOtp &&
      Boolean(displayActiveSession?.e164);

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
    const onOtpReceived = (
      payload?: { otp?: string; phoneNumber?: string; otpRequestId?: string },
    ) => {
      const currentE164 = currentDisplayE164Ref.current;
      const currentOtpRequestId = currentDisplayOtpRequestIdRef.current;
      const incomingOtp = payload?.otp;
      if (!currentE164 || !currentOtpRequestId) {
        return;
      }
      if (!incomingOtp || !payload?.phoneNumber || !payload.otpRequestId) {
        return;
      }
      if (payload.phoneNumber !== currentE164) {
        return;
      }
      if (payload.otpRequestId !== currentOtpRequestId) {
        return;
      }
      const incomingOtpSafe: string = incomingOtp;
      startTransition(() => {
        setPolledOtp(incomingOtpSafe);
        setOtpFlash(true);
      });
      revalidateActive();
      window.setTimeout(() => setOtpFlash(false), 2500);
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
    revalidateActive,
    displayActiveSession?.e164,
    displayActiveSession?.otpStatus,
    displayOtp,
  ]);

  // Silent background sync — fixed 10s interval, no Refresh Status button disruption.
  useEffect(() => {
    if (!token || !isWaitingForOtp) {
      return;
    }
    const intervalId = window.setInterval(() => {
      revalidateActive();
    }, BACKGROUND_SYNC_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [token, isWaitingForOtp, revalidateActive]);

  // Fast-poll fallback: keep polling while pending so first OTP is never missed,
  // even if socket room handoff races with initial webhook emit.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentDisplayE164Ref = useRef<string | null>(null);
  const currentDisplayOtpRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentDisplayE164Ref.current = displayActiveSession?.e164 ?? null;
    currentDisplayOtpRequestIdRef.current =
      displayActiveSession?.otpRequestId ?? null;
  }, [displayActiveSession?.e164, displayActiveSession?.otpRequestId]);

  useEffect(() => {
    const awaitingOtp =
      displayActiveSession?.otpStatus !== "EXPIRED" &&
      displayActiveSession?.otpStatus !== "FAILED" &&
      !displayOtp;

    if (!displayActiveSession?.e164 || !token || !awaitingOtp) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }
    const e164 = displayActiveSession.e164;
    const otpRequestId = displayActiveSession.otpRequestId;

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
          if (
            currentDisplayE164Ref.current !== e164 ||
            currentDisplayOtpRequestIdRef.current !== otpRequestId
          ) {
            return;
          }
          if (otpAnnouncedRef.current === e164) {
            return;
          }
          otpAnnouncedRef.current = e164;
          if (res.data.otp) {
            setPolledOtp(res.data.otp);
          }
          revalidateActive();
          setOtpFlash(true);
          setTimeout(() => setOtpFlash(false), 2500);
          toast.success("OTP received via poll!", { id: `otp-received-${e164}` });
        }
      } catch { /* silent */ } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    };
    void doPoll();
    pollRef.current = setInterval(() => void doPoll(), 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [
    displayActiveSession?.e164,
    displayActiveSession?.otpRequestId,
    displayActiveSession?.otpStatus,
    displayOtp,
    token,
    revalidateActive,
  ]);

  const previousE164Ref = useRef<string | null>(null);
  useEffect(() => {
    const e164 = active?.e164 ?? null;
    if (
      e164 &&
      previousE164Ref.current &&
      e164 !== previousE164Ref.current
    ) {
      setPolledOtp(null);
      otpAnnouncedRef.current = null;
    }
    if (e164) {
      previousE164Ref.current = e164;
    }
  }, [active?.e164]);

  useEffect(() => {
    if (!rawActive?.e164) {
      setHideCompletedSession(false);
      return;
    }
    if (rawActive.e164 !== previousE164Ref.current) {
      setHideCompletedSession(false);
    }
  }, [rawActive?.e164]);

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
        isLiveLease: true,
      });
      setPolledOtp(null);
      void syncWalletBalance();
      revalidateActive();
    },
    [syncWalletBalance, revalidateActive, serviceType],
  );

  const acquire = useCallback(async () => {
    if (!token) return;
    if (walmartMaintenanceMode) {
      toast.error("Walmart OTP is temporarily unavailable due to maintenance.");
      return;
    }
    if (pricingUnavailable || tariffLoading || !tariffPayload) {
      toast.error("Pricing is temporarily unavailable. Please try again shortly.");
      return;
    }

    if (rawActive && (platformMismatch || !hasReceivedOtp)) {
      setShowSwapConfirmDialog(true);
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
      const mappedError = getNumberFlowErrorMessage(res.error);
      if (mappedError) {
        toast.error(mappedError);
        return;
      }
      toast.error(res.error);
      return;
    }
    toast.success("Virtual number assigned!");
    setPageSuggestion(null);
    assignActiveNumber(res.data);
    
    // Use response data directly - no need for refresh or delay
    // The backend now returns full phone data in the response
  }, [
    token,
    rawActive,
    hasReceivedOtp,
    platformMismatch,
    serviceType,
    servicePrice,
    checkBalanceRequirement,
    openRechargePopup,
    assignActiveNumber,
    pricingUnavailable,
    tariffLoading,
    tariffPayload,
    walmartMaintenanceMode,
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
        if (
          currentDisplayE164Ref.current !== active.e164 ||
          currentDisplayOtpRequestIdRef.current !== active.otpRequestId
        ) {
          return;
        }
        setPolledOtp(res.data.otpCode);
        revalidateActive();
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
        if (
          currentDisplayE164Ref.current !== active.e164 ||
          currentDisplayOtpRequestIdRef.current !== active.otpRequestId
        ) {
          return;
        }
        setPolledOtp(pollRes.data.otp);
        revalidateActive();
        setOtpFlash(true);
        setTimeout(() => setOtpFlash(false), 2500);
        toast.success("OTP recovered from latest webhook event!");
      } else if (!pollRes.success && pollRes.error === "OTP_POLL_TEMPORARILY_UNAVAILABLE") {
        toast.error("OTP status is temporarily unavailable. Please retry in a moment.");
      } else if (isWaitingForOtp || leaseRemainingSec > 0) {
        toast.info(
          `Please wait up to ${LEASE_TTL_MINUTES} minutes for the OTP. ${formatCountdown(leaseRemainingSec)} remaining on this number.`,
        );
      } else {
        toast.info(
          "No OTP was received for this number. If the lease ended, your wallet was refunded automatically.",
        );
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      toast.error("Failed to refresh status");
    } finally {
      setLoadingRefresh(false);
    }
  }, [
    active?.otpRequestId,
    active?.e164,
    token,
    revalidateActive,
    isWaitingForOtp,
    leaseRemainingSec,
  ]);

  const releaseActiveNumber = useCallback(async (reason?: string) => {
    if (!token) return;
    
    // Block stale websocket/poll responses from showing OTP flash after cancel.
    currentDisplayE164Ref.current = null;
    currentDisplayOtpRequestIdRef.current = null;
    otpAnnouncedRef.current = null;
    setPolledOtp(null);
    setLoadingRefresh(true);
    try {
      const res = await apiFetch<{
        refunded?: boolean;
        refundAmountPkr?: number | null;
      }>("/api/numbers/release", {
        method: "POST",
        accessToken: token,
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
      
      if (res.success) {
        setShowCancelDialog(false);
        expireHandledRef.current = null;
        await clearActiveState(true);
        if (res.data?.refunded && res.data.refundAmountPkr) {
          await syncWalletAfterRefund();
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
    setShowCancelDialog(false);
    await releaseActiveNumber("no otp received");
  }, [releaseActiveNumber]);

  const confirmSwapNumber = useCallback(async (issue?: SwapIssueOption) => {
    if (!token) return;
    if (walmartMaintenanceMode) {
      toast.error("Walmart OTP is temporarily unavailable due to maintenance.");
      return;
    }
    if (pricingUnavailable || tariffLoading || !tariffPayload) {
      toast.error("Pricing is temporarily unavailable. Please try again shortly.");
      return;
    }

    if (checkBalanceRequirement(servicePrice)) {
      openRechargePopup(servicePrice, "Insufficient funds for this platform.");
      return;
    }

    setShowSwapDialog(false);
    setLoadingChangeNumber(true);
    toast.info("Assigning new number…");

    try {
      const res = await apiFetch<{
        phoneNumber: string;
        leasedUntil: string;
        otpRequestId: string;
        leaseId?: string;
      }>("/api/numbers/change", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          serviceType,
          ...(issue?.reason ? { reason: issue.reason } : {}),
        }),
      });

      if (res.success) {
        expireHandledRef.current = null;
        assignActiveNumber({
          phoneNumber: res.data.phoneNumber,
          leasedUntil: res.data.leasedUntil,
          otpRequestId: res.data.otpRequestId,
          leaseId: res.data.leaseId,
        });
        toast.success(`New number assigned! ${LEASE_TTL_MINUTES}-minute timer reset.`);
        setPageSuggestion(issue?.postAssignSuggestion ?? null);
      } else {
        if (res.error === "INSUFFICIENT_BALANCE") {
          openRechargePopup(servicePrice, "Insufficient funds for this platform.");
          return;
        }
        const mappedError = getNumberFlowErrorMessage(res.error);
        if (mappedError) {
          toast.error(mappedError);
          return;
        }
        toast.error(res.error || "Failed to change number");
      }
    } catch (err) {
      console.error("Swap number failed:", err);
      toast.error("Failed to change number. Please try again.");
    } finally {
      setLoadingChangeNumber(false);
    }
  }, [
    token,
    serviceType,
    servicePrice,
    checkBalanceRequirement,
    openRechargePopup,
    assignActiveNumber,
    pricingUnavailable,
    tariffLoading,
    tariffPayload,
    walmartMaintenanceMode,
  ]);

  const confirmPostOtpChange = useCallback(async () => {
    setShowPostOtpChangeDialog(false);
    await confirmSwapNumber();
  }, [confirmSwapNumber]);

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

  const DisplayPlatformIcon = displayPlatformVisual.Icon;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="flex flex-wrap items-center gap-2 font-bold tracking-tight sm:gap-3">
            <Phone className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
            Virtual US Number
          </h1>
          <p className="text-muted-foreground">
            Lease a temporary US number for{" "}
            <strong className="text-foreground">{displayPlatformVisual.displayName}</strong>{" "}
            verification and receive OTP codes in real time.
          </p>
        </div>

        <PlatformBanner
          platform={displayPlatform}
          mode={displayActiveSession ? "active" : "selected"}
          pricePkr={servicePrice}
        />
        {pricingUnavailable ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Pricing is temporarily unavailable. Number actions are paused until pricing sync recovers.
          </div>
        ) : null}
        {walmartMaintenanceMode ? (
          <div className="rounded-md border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Walmart OTP service is temporarily under maintenance. Please use Facebook, Amazon, or Others for now.
          </div>
        ) : null}
      </div>

      {/* Active Number Card */}
      <Card className="border-border/50 shadow-lg overflow-hidden">
        <div className="h-1 w-full bg-linear-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Active Number</CardTitle>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {displayActiveSession &&
              displayActiveSession.otpStatus !== "EXPIRED" &&
              displayActiveSession.otpStatus !== "FAILED" &&
              !displayActiveSession.parsedOtp &&
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
          {pageSuggestion && displayActiveSession ? (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              <strong className="text-sky-200">Tip:</strong> {pageSuggestion}
            </div>
          ) : null}
          {platformMismatch && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              You switched to{" "}
              <strong className="text-amber-100">{selectedPlatformVisual.displayName}</strong>.
              {hasReceivedOtp ? (
                <>
                  {" "}
                  Your {activePlatformVisual.displayName} OTP session is complete. Tap{" "}
                  <strong className="text-amber-100">
                    Get {selectedPlatformVisual.displayName} Number
                  </strong>{" "}
                  below to lease a new number (Rs {servicePrice}).
                </>
              ) : (
                <>
                  {" "}
                  Your current number was leased for a different platform. Tap{" "}
                  <strong className="text-amber-100">
                    Switch to {selectedPlatformVisual.displayName}
                  </strong>{" "}
                  below to cancel it, get your refund, and receive a new number.
                </>
              )}
            </div>
          )}
          {showInitialSkeleton ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : displayActiveSession ? (
            <>
              {sessionComplete && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {activePlatformVisual.displayName} OTP received successfully. This session
                  is complete — get a new {activePlatformVisual.displayName} number below
                  (Rs {activeSessionPrice}).
                </div>
              )}
              {/* Phone Number Display */}
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 sm:p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                          displayPlatformVisual.border,
                          displayPlatformVisual.bgColor,
                          displayPlatformVisual.color,
                        )}
                      >
                        <DisplayPlatformIcon className="h-3.5 w-3.5" />
                        {displayPlatformVisual.displayName}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Platform
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                        US Number
                      </p>
                      <p className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-foreground break-all">
                        {displayActiveSession.e164}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                    <Badge
                      className={`text-xs font-semibold border ${
                        statusColor[displayActiveSession.otpStatus] ?? statusColor.PENDING
                      }`}
                    >
                      {displayActiveSession.otpStatus}
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
                  {countdown === 0 && !hasReceivedOtp && (
                    <span className="text-xs text-red-400 sm:ml-auto">
                      Time expired — refunding…
                    </span>
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
                    {displayActiveSession.otpStatus === "PENDING" && (
                      <div className="min-w-0 space-y-1.5 text-center text-xs text-muted-foreground sm:text-left">
                        <p>
                          Awaiting {expectedOtpLength}-digit SMS from{" "}
                          <strong className={displayPlatformVisual.color}>
                            {displayPlatformVisual.displayName}
                          </strong>
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

              {isWaitingForOtp && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    className="flex-1 gap-2 border-border/50"
                    disabled={loadingRefresh || loadingChangeNumber}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSwapConfirmDialog(true)}
                    className="flex-1 gap-2 border-border/50"
                    disabled={
                      loadingChangeNumber ||
                      walmartMaintenanceMode ||
                      pricingUnavailable ||
                      tariffLoading ||
                      !tariffPayload
                    }
                  >
                    {loadingChangeNumber ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {loadingChangeNumber ? "Changing…" : "Change Number"}
                  </Button>
                </div>
              )}

              {hasReceivedOtp && isLiveLease && !sessionComplete && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHideCompletedSession(true)}
                    className="flex-1 gap-2 border-border/50"
                    disabled={
                      loadingChangeNumber ||
                      walmartMaintenanceMode ||
                      pricingUnavailable ||
                      tariffLoading ||
                      !tariffPayload
                    }
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPostOtpChangeDialog(true)}
                    className="flex-1 gap-2 border-border/50"
                    disabled={
                      loadingChangeNumber ||
                      walmartMaintenanceMode ||
                      pricingUnavailable ||
                      tariffLoading ||
                      !tariffPayload
                    }
                  >
                    {loadingChangeNumber ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {loadingChangeNumber ? "Changing…" : "Change Number"}
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
                <RefreshCw
                  className={`h-4 w-4 ${loadingRefresh ? "animate-spin" : ""}`}
                />
                {loadingRefresh ? "Refreshing..." : "Refresh Status"}
              </Button>

            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div
                className={cn(
                  "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border",
                  displayPlatformVisual.border,
                  displayPlatformVisual.bgColor,
                  displayPlatformVisual.color,
                )}
              >
                <DisplayPlatformIcon className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">No active number</p>
                <p className="text-sm text-muted-foreground">
                  Get a US number for{" "}
                  <strong className="text-foreground">
                    {displayPlatformVisual.displayName}
                  </strong>{" "}
                  verification.
                </p>
              </div>
            </div>
          )}

          {/* Acquire — only when no live lease or session complete */}
          {(!showInitialSkeleton &&
            !isWaitingForOtp &&
            (!displayActiveSession || sessionComplete || platformMismatch)) && (
            <Button
              onClick={() => void acquire()}
              disabled={
                pending ||
                walmartMaintenanceMode ||
                pricingUnavailable ||
                tariffLoading ||
                !tariffPayload
              }
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
                    ? hasReceivedOtp
                      ? `Get ${selectedPlatformVisual.displayName} Number (Rs ${servicePrice})`
                      : `Switch to ${selectedPlatformVisual.displayName} (Rs ${servicePrice})`
                    : sessionComplete
                      ? `Get New ${activePlatformVisual.displayName} Number (Rs ${activeSessionPrice})`
                      : `Get ${displayPlatformVisual.displayName} Number (Rs ${servicePrice})`}
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
            Service Charge: Rs {servicePrice} per OTP on {displayPlatformVisual.displayName}
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside pl-0.5">
            <li>
              Click{" "}
              <strong className="text-foreground">
                Get {displayPlatformVisual.displayName} Number
              </strong>{" "}
              to lease a temporary number
            </li>
            <li>
              Copy the number and paste it on{" "}
              <strong className="text-foreground">{displayPlatformVisual.displayName}</strong>{" "}
              signup or verification page
            </li>
            <li>OTP automatically appears here when SMS arrives — no typing needed</li>
            <li>Click <strong className="text-foreground">Copy</strong> and paste the code on {displayPlatformVisual.displayName}</li>
            <li>Number lease lasts {LEASE_TTL_MINUTES} minutes — OTP must arrive within this window</li>
            <li>If no OTP arrives in time, your Rs {servicePrice} is automatically refunded</li>
            <li>Use <strong className="text-foreground">Cancel</strong> anytime before OTP to get an instant refund</li>
            <li>Use <strong className="text-foreground">Change Number</strong> to swap to a new number (same price, timer resets)</li>
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

      {/* Cancel — refund if no OTP yet */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel number?</DialogTitle>
            <DialogDescription>
              No OTP received yet. Cancelling will refund <strong>Rs {servicePrice}</strong> to
              your wallet immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep number
            </Button>
            <Button
              className="flex-1"
              onClick={() => void handleRefundOnly()}
              disabled={loadingRefresh}
            >
              {loadingRefresh ? "Processing…" : `Cancel & refund Rs ${servicePrice}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap confirm — old style keep/get */}
      <Dialog open={showSwapConfirmDialog} onOpenChange={setShowSwapConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change number?</DialogTitle>
            <DialogDescription>
              You will get a <strong>new US number</strong> at the same price (Rs {servicePrice}).
              The {LEASE_TTL_MINUTES}-minute timer resets. No extra charge if OTP has not arrived yet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSwapConfirmDialog(false)}
            >
              Keep number
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setShowSwapConfirmDialog(false);
                setSelectedSwapIssueId(null);
                setShowSwapDialog(true);
              }}
            >
              Get new number
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap issue report — step 2 */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report issue</DialogTitle>
            <DialogDescription>
              Select the issue you faced with the old number. We will submit the report
              and assign a new number immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid gap-2">
              {SWAP_ISSUE_OPTIONS.map((option) => {
                const selected = option.id === selectedSwapIssue?.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedSwapIssueId(option.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                      selected
                        ? "border-primary/70 bg-primary/15 text-foreground shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
                        : "border-border/60 bg-secondary/20 text-muted-foreground hover:border-primary/40 hover:bg-secondary/35",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {selectedSwapIssue ? (
              <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {selectedSwapIssue.suggestion}
              </p>
            ) : (
              <p className="rounded-md border border-zinc-500/20 bg-zinc-500/10 px-3 py-2 text-xs text-zinc-300">
                Select one issue to continue.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSwapDialog(false);
                setShowSwapConfirmDialog(true);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => selectedSwapIssue && void confirmSwapNumber(selectedSwapIssue)}
              disabled={
                !selectedSwapIssue ||
                loadingChangeNumber ||
                walmartMaintenanceMode ||
                pricingUnavailable ||
                tariffLoading ||
                !tariffPayload
              }
            >
              Submit Report & Get New Number
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
            <Button
              className="flex-1"
              onClick={() => void confirmPostOtpChange()}
              disabled={
                loadingChangeNumber ||
                walmartMaintenanceMode ||
                pricingUnavailable ||
                tariffLoading ||
                !tariffPayload
              }
            >
              Change Number
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NumbersPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <NumbersPageContent />
    </Suspense>
  );
}
