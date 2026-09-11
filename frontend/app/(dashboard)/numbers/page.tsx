"use client";

import { useEffect, useRef, useState, useCallback, useMemo, startTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Copy, Phone, RefreshCw, ShieldCheck, Clock, Wifi, Info, Sparkles, Check, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
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
import { useCurrencyStore, formatDualPrice } from "@/lib/currency";
import { PlatformBanner } from "@/components/platform/platform-banner";
import { ServiceBrandIcon } from "@/components/services/service-brand-icon";
import { CountryFlag } from "@/components/ui/country-flag";
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
import { findFallbackService, type ServiceCatalogItem } from "@/lib/services";
import { findCountry } from "@/lib/countries";

type ActiveNumber = {
  e164: string;
  leasedUntil: string;
  parsedOtp: string | null;
  otpStatus: "PENDING" | "RECEIVED" | "EXPIRED" | "FAILED";
  otpRequestId: string;
  serviceType?: string | null;
  chargedAmountPkr?: number | null;
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
/** Silent background sync while waiting for OTP — fast 2s interval for instant arrival. */
const BACKGROUND_SYNC_INTERVAL_MS = 2_000;
const LEASE_EXPIRED_TOAST_ID = "lease-expired-toast";
const SWAP_ISSUE_OPTIONS: SwapIssueOption[] = [
  {
    id: "otp-not-received",
    label: "OTP not received",
    reason: "otp not received",
    suggestion:
      "Wait 30-60 seconds and trigger resend once before switching.",
    postAssignSuggestion:
      "Use this number immediately, request OTP once, and avoid multiple resend taps.",
  },
  {
    id: "number-already-in-use",
    label: "Number already registered or in use",
    reason: "number already in use",
    suggestion:
      "This number is already associated with another account. Switch to a new number.",
    postAssignSuggestion:
      "Try the new number. It should be fresh and ready for registration.",
  },
  {
    id: "number-blocked-invalid",
    label: "Number is blocked or invalid",
    reason: "number blocked or invalid",
    suggestion:
      "The service rejected this number type or it has been flagged. Switch to a new number.",
    postAssignSuggestion:
      "Use the new number. If the issue persists, try changing your IP or device.",
  },
  {
    id: "otp-invalid",
    label: "OTP received but rejected by service",
    reason: "otp invalid",
    suggestion:
      "Use only the latest OTP. Old code or delayed SMS can fail verification.",
    postAssignSuggestion:
      "Request fresh OTP once and submit immediately. If still rejected, switch number.",
  },
  {
    id: "other",
    label: "Other issue",
    reason: "number not working other issue",
    suggestion: "Report submitted. A new number will be assigned now.",
    postAssignSuggestion:
      "Try once with the new number. If issue repeats, please try again later.",
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
const formatTime = formatCountdown;

/** Derive seconds remaining from ISO timestamp */
function secondsUntil(isoStr: string): number {
  return Math.max(0, Math.floor((new Date(isoStr).getTime() - Date.now()) / 1000));
}

function NumbersPageContent() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { balancePkr, ownerUserId } = useWalletStore();
  const searchParams = useSearchParams();
  const urlService = searchParams.get("service");
  const catalogService = urlService ? findFallbackService(urlService) : null;
  const urlCountryId = searchParams.get("country");
  const currentCountry = findCountry(urlCountryId) || findCountry("187");
  const rawUrlPlatform = searchParams.get("platform");
  const urlPlatform = rawUrlPlatform
    ? platformFromQueryParam(rawUrlPlatform)
    : urlService
      ? serviceTypeToPlatform(urlService)
      : null;
  const preferredPlatform = serviceTypeToPlatform(user?.preferredPlatform || "Facebook");

  const effectiveCountryId = urlCountryId || "187";
  const { data: liveServices } = useApi<ServiceCatalogItem[]>(
    `/api/services?country=${effectiveCountryId}`,
    {
      cacheTtlMs: 30000,
      disableDedupe: false,
      allowAnonymous: true,
    }
  );

  const liveService = useMemo(() => {
    if (!liveServices || !urlService) return null;
    const code = urlService.toLowerCase().trim();
    return (
      liveServices.find(
        (s) => s.serviceCode.toLowerCase() === code || s.name.toLowerCase() === code
      ) || null
    );
  }, [liveServices, urlService]);

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
    mutate: refreshTariffs,
  } = useApi<{
    facebook: number;
    walmart: number;
    others: number;
  }>("/api/numbers/tariffs", {
    cacheTtlMs: 0,
    disableDedupe: true,
    revalidateOnMount: true,
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
  const lastStableFetchedActiveRef = useRef<ActiveNumber | null>(null);
  useEffect(() => {
    if (fetchedActive !== undefined) {
      lastStableFetchedActiveRef.current = fetchedActive ?? null;
    }
  }, [fetchedActive]);
  const stableFetchedActive =
    fetchedActive === undefined && isValidating
      ? lastStableFetchedActiveRef.current
      : (fetchedActive ?? null);
  const rawActive = optimisticActive ?? stableFetchedActive ?? null;
  const hasLoadedActiveOnceRef = useRef(false);
  if (!hasLoadedActiveOnceRef.current && fetchedActive !== undefined) {
    hasLoadedActiveOnceRef.current = true;
  }
  const awaitingActiveRevalidation =
    Boolean(token) &&
    isValidating &&
    fetchedActive === undefined &&
    optimisticActive === null;
  const showInitialSkeleton =
    Boolean(token)
      ? (!hasLoadedActiveOnceRef.current && ((isLoading && !rawActive) || awaitingActiveRevalidation))
      : Boolean(tariffLoading && !tariffPayload && !catalogService && !liveService);
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

  // HeroSMS minimum activation hold period: 120 seconds (2 minutes)
  const elapsedSec = rawActive?.leasedUntil
    ? Math.max(0, LEASE_TTL_MINUTES * 60 - countdown)
    : 120;
  const cancelLockRemaining = rawActive?.leasedUntil
    ? Math.max(0, 120 - elapsedSec)
    : 0;
  const isCancelLocked = cancelLockRemaining > 0;

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
  const cancelRefundAmount =
    typeof active?.chargedAmountPkr === "number" && active.chargedAmountPkr > 0
      ? active.chargedAmountPkr
      : activeSessionPrice;
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
  const serviceType = urlService
    ? urlService.toLowerCase().trim()
    : normalizeServiceType(selectedPlatform);
  const exactServiceUsd = liveService?.costUsd ?? catalogService?.costUsd;
  const baseServicePrice = getPlatformPricePkr(selectedPlatform, platformTariffs);
  const servicePrice = liveService?.pricePkr ?? catalogService?.pricePkr ?? baseServicePrice;
  const pricingUnavailable = Boolean(token) && Boolean(tariffError) && !catalogService && !liveService;

  const exchangeRate = useCurrencyStore((s) => s.exchangeRate);
  const dualPrice = formatDualPrice(servicePrice, exchangeRate, exactServiceUsd);

  // Selected service name and code
  const selectedServiceName =
    liveService?.name ||
    catalogService?.name ||
    (urlService
      ? (urlService === "fb" ? "Facebook" : urlService === "wr" ? "Walmart" : urlService.charAt(0).toUpperCase() + urlService.slice(1))
      : selectedPlatformVisual.displayName);

  const selectedServiceCode =
    liveService?.serviceCode ||
    catalogService?.serviceCode ||
    urlService ||
    (selectedPlatform === "Facebook" ? "fb" : selectedPlatform === "Walmart" ? "wr" : "others");

  const platformMismatch =
    Boolean(active) &&
    activeServiceType !== null &&
    activeServiceType !== serviceType;

  const lastStableDisplaySessionRef = useRef<ActiveNumber | null>(null);
  useEffect(() => {
    if (active && !platformMismatch) {
      lastStableDisplaySessionRef.current = active;
      return;
    }
    if (!loadingChangeNumber) {
      lastStableDisplaySessionRef.current = null;
    }
  }, [active, platformMismatch, loadingChangeNumber]);

  /** Hide the previous platform session when user picks a different platform. */
  const displayActiveSession: ActiveNumber | null =
    active && !platformMismatch
      ? active
      : loadingChangeNumber
        ? lastStableDisplaySessionRef.current
        : null;

  const displayPlatform = displayActiveSession ? activePlatform : selectedPlatform;
  const displayPlatformVisual = getPlatformVisual(displayPlatform);

  // Active leased session service name and code
  const activeServiceCode = displayActiveSession?.serviceType?.toLowerCase() || selectedServiceCode;
  const activeCatalogItem = activeServiceCode ? findFallbackService(activeServiceCode) : null;
  const activeServiceName =
    activeCatalogItem?.name ||
    (activeServiceCode === "fb" ? "Facebook" : activeServiceCode === "wr" ? "Walmart" : activeServiceCode ? (activeServiceCode.charAt(0).toUpperCase() + activeServiceCode.slice(1)) : activePlatformVisual.displayName);

  const displayServiceName = displayActiveSession ? activeServiceName : selectedServiceName;
  const displayServiceCode = displayActiveSession ? activeServiceCode : selectedServiceCode;

  const isWaitingForOtp =
    Boolean(displayActiveSession) &&
    isLiveLease &&
    !hasReceivedOtp &&
    leaseRemainingSec > 0;

  const clearActiveState = useCallback(
    async (revalidate = true) => {
      setOptimisticActive(null);
      setPolledOtp(null);
      lastStableFetchedActiveRef.current = null;
      currentDisplayE164Ref.current = null;
      currentDisplayOtpRequestIdRef.current = null;
      otpAnnouncedRef.current = null;
      setHideCompletedSession(false);
      await refresh(null, { revalidate });
      void refreshTariffs(undefined, { revalidate: true });
    },
    [refresh, refreshTariffs],
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
    toast.info(`Insufficient balance (${requiredPrice ? `Rs ${requiredPrice} required` : "Please top up"}). Redirecting to Add Balance page...`);
    router.push(`/deposit?required=${requiredPrice}`);
  }, [router]);

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
      const incomingOtp = payload?.otp;
      if (!currentE164 || !incomingOtp || !payload?.phoneNumber) {
        return;
      }
      const currentDigits = currentE164.replace(/\D/g, "");
      const incomingDigits = payload.phoneNumber.replace(/\D/g, "");
      if (!currentDigits || currentDigits !== incomingDigits) {
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
          const currentDigits = currentDisplayE164Ref.current?.replace(/\D/g, "");
          const pollDigits = e164.replace(/\D/g, "");
          if (!currentDigits || currentDigits !== pollDigits) {
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
      chargedAmountPkr?: number;
    }) => {
      expireHandledRef.current = null;
      setOptimisticActive({
        e164: data.phoneNumber,
        leasedUntil: data.leasedUntil,
        parsedOtp: null,
        otpStatus: "PENDING",
        otpRequestId: data.otpRequestId ?? data.leaseId ?? "pending",
        serviceType,
        chargedAmountPkr:
          typeof data.chargedAmountPkr === "number" ? data.chargedAmountPkr : null,
        isLiveLease: true,
      });
      setPolledOtp(null);
      void syncWalletBalance();
      revalidateActive();
    },
    [syncWalletBalance, revalidateActive, serviceType],
  );

  const acquire = useCallback(async () => {
    if (!token) {
      toast.info("Please sign in or register to get a virtual number.");
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/numbers";
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_redirect", currentUrl);
      }
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (pricingUnavailable || (!liveService && !catalogService && (tariffLoading || !tariffPayload))) {
      toast.error("Pricing is temporarily unavailable. Please try again shortly.");
      return;
    }

    if (rawActive && !hasReceivedOtp) {
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
      chargedAmountPkr?: number;
      chargeNotice?: string;
    }>("/api/numbers/acquire", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        serviceType,
        country: urlCountryId || undefined,
      }),
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
    if (res.data.chargeNotice) {
      toast.success(res.data.chargeNotice);
    } else if (typeof res.data.chargedAmountPkr === "number" && res.data.chargedAmountPkr > 0) {
      toast.success(`Virtual number assigned! PKR ${res.data.chargedAmountPkr} deducted.`);
    } else {
      toast.success("Virtual number assigned!");
    }
    setPageSuggestion(null);
    assignActiveNumber(res.data);
    void refreshTariffs(undefined, { revalidate: true });
    
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
    refreshTariffs,
    pricingUnavailable,
    tariffLoading,
    tariffPayload,
    liveService,
    catalogService,
    urlCountryId,
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
    if (pricingUnavailable || (!liveService && !catalogService && (tariffLoading || !tariffPayload))) {
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
        chargedAmountPkr?: number;
        chargeNotice?: string;
      }>("/api/numbers/change", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          serviceType,
          country: urlCountryId || undefined,
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
        if (res.data.chargeNotice) {
          toast.success(`${res.data.chargeNotice} ${LEASE_TTL_MINUTES}-minute timer reset.`);
        } else if (
          typeof res.data.chargedAmountPkr === "number" &&
          res.data.chargedAmountPkr > 0
        ) {
          toast.success(
            `New number assigned! PKR ${res.data.chargedAmountPkr} deducted. ${LEASE_TTL_MINUTES}-minute timer reset.`,
          );
        } else {
          toast.success(`New number assigned! ${LEASE_TTL_MINUTES}-minute timer reset.`);
        }
        setPageSuggestion(issue?.postAssignSuggestion ?? null);
        void refreshTariffs(undefined, { revalidate: true });
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
    refreshTariffs,
    pricingUnavailable,
    tariffLoading,
    tariffPayload,
    liveService,
    catalogService,
    urlCountryId,
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
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            <span>Dedicated Virtual Line · 10-Minute Active Lease</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {currentCountry?.name ? `Virtual ${currentCountry.name} Number` : "Virtual Phone Number"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Lease a temporary {currentCountry?.name || "virtual"} number for{" "}
            <strong className="text-slate-900 font-bold">{displayServiceName}</strong>{" "}
            verification and receive OTP codes in real time.
          </p>
        </div>

        <PlatformBanner
          platform={displayPlatform}
          mode={displayActiveSession ? "active" : "selected"}
          pricePkr={servicePrice}
          customServiceName={displayServiceName}
          customEmoji={liveService?.emoji || catalogService?.emoji}
          serviceCode={displayServiceCode}
          costUsd={exactServiceUsd}
          countryName={currentCountry?.name}
          countryFlag={currentCountry?.flag}
          countryCode={currentCountry?.code}
        />
        {pricingUnavailable ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-200">
            Pricing is temporarily unavailable. Number actions are paused until pricing sync recovers.
          </div>
        ) : null}
      </div>

      {/* ─── Two-Column Activation & Guide Hub (Responsive: Side-by-Side on Desktop, Stacked on Mobile) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ─── LEFT COLUMN (Desktop): Complete 'How It Works' Guide ─── */}
        <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col">
          <Card className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col justify-between h-full">
            <div>
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500" />
              <CardHeader className="pb-2.5 border-b border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700 font-bold shadow-2xs">
                      <Info className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900">How It Works</CardTitle>
                      <CardDescription className="text-[10px] text-slate-500">Fast 4-step verification flow</CardDescription>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>Quick Guide</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3.5 sm:p-4 space-y-2.5">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[10px] shadow-xs mt-0.5">
                      1
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Get Dedicated Line</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Tap &apos;Get {displayServiceName} Number&apos; to reserve a private dedicated line.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[10px] shadow-xs mt-0.5">
                      2
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Copy & Paste</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Copy the virtual number and paste it directly on {displayServiceName}&apos;s verification screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[10px] shadow-xs mt-0.5">
                      3
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Real-Time SMS Arrival</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        OTP code appears automatically via live WebSocket push within &lt; 8 seconds.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[10px] shadow-xs mt-0.5">
                      4
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-slate-900">100% Refund Guarantee</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        If no SMS arrives within {LEASE_TTL_MINUTES} minutes, your payment is refunded automatically to your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Bottom Quick Tips Box */}
            <div className="p-2.5 sm:p-3 mx-3.5 mb-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200/80 text-[11px] text-blue-900 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-800 text-[11px]">
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Quick Verification Tips</span>
              </div>
              <ul className="text-blue-950/80 space-y-0.5 text-[10px] sm:text-[11px] list-disc list-inside">
                <li>If code is delayed 30–60s, trigger &apos;Resend OTP&apos; on {displayServiceName}.</li>
                <li>Cancel anytime before OTP arrives for an instant refund.</li>
                <li>Free number replacement available via &apos;Change Number&apos;.</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN (Desktop): Virtual Number Line / Action Card ─── */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col">
          <Card className="border border-slate-200/90 shadow-md rounded-2xl overflow-hidden bg-white flex flex-col justify-between h-full">
            <div>
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
              <CardHeader className="pb-2.5 border-b border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                      {displayActiveSession ? "Active Leased Line" : "Virtual Number Line"}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                      {displayActiveSession
                        ? "Live dedicated line awaiting incoming SMS"
                        : "Dedicated line allocated instantly with auto-refund guarantee"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {displayActiveSession &&
                    displayActiveSession.otpStatus !== "EXPIRED" &&
                    displayActiveSession.otpStatus !== "FAILED" &&
                    !displayActiveSession.parsedOtp &&
                    !polledOtp ? (
                      <div
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          wsConnected
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-2xs"
                            : wsUnavailable
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : "border-slate-300 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span className={cn("h-2 w-2 rounded-full", wsConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                        {wsConnected ? "Live Socket Active" : wsUnavailable ? "Offline" : "Connecting..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <span>Instant Delivery</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-4 space-y-3">
                {pageSuggestion && displayActiveSession ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800">
                    <strong className="font-bold text-sky-900">Tip:</strong> {pageSuggestion}
                  </div>
                ) : null}
                {platformMismatch && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                    You switched to{" "}
                    <strong className="text-amber-950 font-bold">{selectedServiceName}</strong>.
                    {hasReceivedOtp ? (
                      <>
                        {" "}
                        Your {activeServiceName} OTP session is complete. Tap{" "}
                        <strong className="text-amber-950 font-bold">
                          Get {selectedServiceName} Number
                        </strong>{" "}
                        below to lease a new number.
                      </>
                    ) : (
                      <>
                        {" "}
                        Your current number was leased for a different service ({activeServiceName}). Tap{" "}
                        <strong className="text-amber-950 font-bold">
                          Switch to {selectedServiceName}
                        </strong>{" "}
                        below to cancel it, get your refund, and receive a new number.
                      </>
                    )}
                  </div>
                )}
                {showInitialSkeleton ? (
                  <div className="py-8 sm:py-10 flex flex-col items-center justify-center text-center space-y-3.5">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50/90 border border-blue-100 shadow-sm">
                      <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping opacity-25" />
                      <Loader2 className="h-7 w-7 text-blue-600 animate-spin relative z-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-slate-900">Checking Virtual Line Pool…</p>
                      <p className="text-xs text-slate-500 max-w-xs">
                        Syncing real-time line availability and verification servers
                      </p>
                    </div>
                    <div className="w-44 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
                    </div>
                  </div>
                ) : displayActiveSession ? (
                  <>
                    {sessionComplete && (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
                        {activeServiceName} OTP received successfully. This session
                        is complete — get a new {activeServiceName} number below.
                      </div>
                    )}
                    {/* Phone Number Display */}
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 sm:p-3.5 space-y-2.5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                              <ServiceBrandIcon serviceCode={displayServiceCode} name={displayServiceName} size={15} />
                              <span>{displayServiceName}</span>
                            </span>
                            {currentCountry && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
                                <CountryFlag code={currentCountry.code} name={currentCountry.name} fallbackEmoji={currentCountry.flag} size="xs" />
                                <span>{currentCountry.name}</span>
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Dedicated Virtual Number
                            </p>
                            <p className="text-lg sm:text-xl font-black font-mono tracking-wide text-slate-900 break-all">
                              {displayActiveSession.e164}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                          <Badge
                            className={`text-xs font-bold border px-2 py-0.5 rounded-md ${
                              statusColor[displayActiveSession.otpStatus] ?? statusColor.PENDING
                            }`}
                          >
                            {displayActiveSession.otpStatus}
                          </Badge>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={copyNumber}
                            className="h-9 w-9 sm:h-8 sm:w-8 rounded-xl border-slate-200 bg-white hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Copy number"
                          >
                            <Copy className="h-3.5 w-3.5 text-slate-700" />
                          </Button>
                        </div>
                      </div>

                      {/* Countdown Timer */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/80 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3.5 w-3.5 shrink-0 ${timerColor}`} />
                          <span className="text-[11px] font-medium text-slate-500">Expires in</span>
                          <span className={`font-mono text-xs sm:text-sm font-black tabular-nums ${timerColor}`}>
                            {formatCountdown(countdown)}
                          </span>
                        </div>
                        {countdown === 0 && !hasReceivedOtp && (
                          <span className="text-[11px] font-bold text-red-500 sm:ml-auto">
                            Time expired — refunding to wallet…
                          </span>
                        )}
                      </div>
                    </div>

                    {/* OTP Display */}
                    <div className={`rounded-xl border p-3 sm:p-3.5 transition-all duration-500 ${
                      otpFlash
                        ? "border-emerald-500 bg-emerald-50/80 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
                        : "border-slate-200 bg-white"
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Received OTP Code
                          </p>
                        </div>
                        {displayOtp && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyOtp}
                            className="h-7 sm:h-6 shrink-0 px-2.5 sm:px-2 rounded-lg text-[11px] font-bold gap-1 text-emerald-700 hover:bg-emerald-100/70 cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            Copy OTP
                          </Button>
                        )}
                      </div>

                      {displayOtp ? (
                        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start sm:gap-3 py-0.5">
                          <p className="text-2xl sm:text-3xl font-black font-mono tracking-[0.2em] sm:tracking-[0.25em] text-emerald-600 break-all text-center sm:text-left">
                            {displayOtp}
                          </p>
                          <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-center gap-1 sm:justify-start sm:gap-1.5">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="h-8 w-6 sm:h-8.5 sm:w-7 rounded-lg border border-slate-200 bg-slate-100/80 animate-pulse flex items-center justify-center text-slate-300 font-mono text-sm"
                                style={{ animationDelay: `${i * 120}ms` }}
                              >
                                -
                              </div>
                            ))}
                          </div>
                          {displayActiveSession.otpStatus === "PENDING" && (
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-500 pt-0.5">
                              <span>Awaiting {expectedOtpLength}-digit code for <strong className="text-blue-600 font-bold">{displayServiceName}</strong></span>
                              <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                                <Info className="h-3 w-3 text-amber-600 shrink-0" />
                                Delayed? Tap &apos;Resend OTP&apos; in app
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {isWaitingForOtp && (
                      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => !isCancelLocked && setShowCancelDialog(true)}
                          className={cn(
                            "min-h-[42px] sm:min-h-[38px] flex-1 px-2 sm:px-3 rounded-xl border font-bold transition-all text-xs flex items-center justify-center gap-1.5 min-w-0 cursor-pointer",
                            isCancelLocked
                              ? "border-amber-200/90 bg-amber-50/60 text-amber-800/80 cursor-not-allowed hover:bg-amber-50/60 hover:text-amber-800/80"
                              : "border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          )}
                          disabled={loadingRefresh || loadingChangeNumber || isCancelLocked}
                          title={
                            isCancelLocked
                              ? `Cancellation available in ${formatTime(cancelLockRemaining)}`
                              : "Cancel number and refund balance"
                          }
                        >
                          {isCancelLocked ? (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0 animate-pulse" />
                              <span className="truncate">Cancel in {formatTime(cancelLockRemaining)}</span>
                            </>
                          ) : (
                            <span className="truncate">Cancel (Refund)</span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSwapConfirmDialog(true)}
                          className="min-h-[42px] sm:min-h-[38px] flex-1 px-2 sm:px-3 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors text-xs flex items-center justify-center gap-1.5 min-w-0 cursor-pointer"
                          disabled={
                            loadingChangeNumber ||
                            pricingUnavailable ||
                            tariffLoading ||
                            !tariffPayload
                          }
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", loadingChangeNumber && "animate-spin")} />
                          <span className="truncate">{loadingChangeNumber ? "Changing…" : "Change Number"}</span>
                        </Button>
                      </div>
                    )}

                    {hasReceivedOtp && isLiveLease && !sessionComplete && (
                      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHideCompletedSession(true)}
                          className="min-h-[42px] sm:min-h-[38px] flex-1 px-3 rounded-xl border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 min-w-0 cursor-pointer"
                          disabled={
                            loadingChangeNumber ||
                            pricingUnavailable ||
                            tariffLoading ||
                            !tariffPayload
                          }
                        >
                          <span className="truncate">Back</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPostOtpChangeDialog(true)}
                          className="min-h-[42px] sm:min-h-[38px] flex-1 px-3 rounded-xl border-blue-200 bg-blue-50/50 hover:bg-blue-100 font-bold text-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 min-w-0 cursor-pointer"
                          disabled={
                            loadingChangeNumber ||
                            pricingUnavailable ||
                            tariffLoading ||
                            !tariffPayload
                          }
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", loadingChangeNumber && "animate-spin")} />
                          <span className="truncate">{loadingChangeNumber ? "Changing…" : "Change Number"}</span>
                        </Button>
                      </div>
                    )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshStatus}
                      className="min-h-[42px] sm:min-h-[38px] gap-2 w-full rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 shadow-2xs text-xs sm:text-sm flex items-center justify-center cursor-pointer"
                      disabled={loadingRefresh}
                    >
                      <RefreshCw
                        className={cn("h-3.5 w-3.5 shrink-0", loadingRefresh && "animate-spin")}
                      />
                      <span>{loadingRefresh ? "Refreshing..." : "Refresh Status"}</span>
                    </Button>

                  </>
                ) : (
                  <div className="py-6 sm:py-7 text-center space-y-3.5">
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white shadow-md p-2.5">
                      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-blue-400/15 blur-lg" />
                      <ServiceBrandIcon
                        serviceCode={displayServiceCode}
                        name={displayServiceName}
                        size={40}
                        className="relative z-10 drop-shadow-sm"
                      />
                    </div>

                    <div className="space-y-1 max-w-sm mx-auto">
                      <p className="text-base font-extrabold text-slate-900">
                        Ready to Lease Virtual Line
                      </p>
                      <p className="text-xs text-slate-500">
                        Get a dedicated {currentCountry?.name || "US"} number for{" "}
                        <strong className="text-slate-900 font-bold">
                          {displayServiceName}
                        </strong>{" "}
                        verification.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        ⚡ Under 8s Arrival
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        🛡️ 100% Refund
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        ⏱️ {LEASE_TTL_MINUTES}-Min Window
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            {/* Acquire Button pinned at bottom of card */}
            {showInitialSkeleton ? (
              <div className="p-4 sm:p-5 pt-0">
                <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span>Loading line options…</span>
                </div>
              </div>
            ) : !isWaitingForOtp && (!displayActiveSession || sessionComplete || platformMismatch) ? (
              <div className="p-4 sm:p-5 pt-0">
                <Button
                  onClick={() => void acquire()}
                  disabled={
                    pending ||
                    (Boolean(token) && pricingUnavailable) ||
                    (Boolean(token) && !liveService && !catalogService && (tariffLoading || !tariffPayload))
                  }
                  className="w-full gap-2 font-black text-sm py-5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all relative overflow-hidden group cursor-pointer"
                  size="lg"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {pending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{platformMismatch ? "Switching service…" : "Allocating virtual number…"}</span>
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>
                        {platformMismatch
                          ? hasReceivedOtp
                            ? `Get ${selectedServiceName} Number • ${dualPrice.usd} (${dualPrice.pkr})`
                            : `Switch to ${selectedServiceName}`
                          : sessionComplete
                            ? `Get New ${activeServiceName} Number • ${dualPrice.usd} (${dualPrice.pkr})`
                            : !token
                              ? `Sign in to Get ${displayServiceName} Number • ${dualPrice.usd} (${dualPrice.pkr})`
                              : `Get ${displayServiceName} Number • ${dualPrice.usd} (${dualPrice.pkr})`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

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
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shadow-2xs">
                <AlertCircle className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">Cancel Number & Refund?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              No OTP received yet. Cancelling will release this virtual line and refund{" "}
              <strong className="text-slate-900 font-bold">
                {formatDualPrice(cancelRefundAmount, exchangeRate, exactServiceUsd).usd} ({formatDualPrice(cancelRefundAmount, exchangeRate, exactServiceUsd).pkr})
              </strong>{" "}
              directly to your wallet immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 h-10 font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Number
            </Button>
            <Button
              className="flex-1 h-10 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
              onClick={() => void handleRefundOnly()}
              disabled={loadingRefresh || isCancelLocked}
            >
              {isCancelLocked
                ? `Cancel in ${formatTime(cancelLockRemaining)}`
                : loadingRefresh
                ? "Processing…"
                : "Confirm & Refund"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap confirm — old style keep/get */}
      <Dialog open={showSwapConfirmDialog} onOpenChange={setShowSwapConfirmDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                <RefreshCw className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">Change Number?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              You will get a new <strong className="text-slate-900 font-bold">{currentCountry?.name || "US"} number</strong> for {displayServiceName}.
              The {LEASE_TTL_MINUTES}-minute timer resets. Free replacement since no OTP has arrived yet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 h-10 font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm"
              onClick={() => setShowSwapConfirmDialog(false)}
            >
              Keep Number
            </Button>
            <Button
              className="flex-1 h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs sm:text-sm cursor-pointer"
              onClick={() => {
                setShowSwapConfirmDialog(false);
                setSelectedSwapIssueId(null);
                setShowSwapDialog(true);
              }}
            >
              Get New Number
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap issue report — step 2 */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                <RotateCcw className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">Report Issue</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Select the issue you faced with the old number to get a fresh replacement immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 pt-2">
            <div className="grid gap-2">
              {SWAP_ISSUE_OPTIONS.map((option) => {
                const selected = option.id === selectedSwapIssue?.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedSwapIssueId(option.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm transition-all cursor-pointer",
                      selected
                        ? "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-600/30"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/80 font-medium"
                    )}
                  >
                    <span>{option.label}</span>
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all",
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {selected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedSwapIssue ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-900 shadow-2xs">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{selectedSwapIssue.suggestion}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-1 py-1 text-xs text-slate-400 italic">
                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Select one issue above to continue.</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 h-10 font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm"
              onClick={() => {
                setShowSwapDialog(false);
                setShowSwapConfirmDialog(true);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1 h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
              onClick={() => selectedSwapIssue && void confirmSwapNumber(selectedSwapIssue)}
              disabled={
                !selectedSwapIssue ||
                loadingChangeNumber ||
                pricingUnavailable ||
                tariffLoading ||
                !tariffPayload
              }
            >
              {loadingChangeNumber ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Assigning…
                </>
              ) : (
                "Submit Report & Get New Number"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post-OTP: change only (no refund) */}
      <Dialog open={showPostOtpChangeDialog} onOpenChange={setShowPostOtpChangeDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                <RefreshCw className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">Change Number</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              OTP has already been received, so a refund is not available. Getting a new number
              will charge Rs {servicePrice}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2.5 pt-3">
            <Button
              variant="outline"
              className="flex-1 h-10 font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm"
              onClick={() => setShowPostOtpChangeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs sm:text-sm cursor-pointer"
              onClick={() => void confirmPostOtpChange()}
              disabled={
                loadingChangeNumber ||
                pricingUnavailable ||
                tariffLoading ||
                !tariffPayload
              }
            >
              {loadingChangeNumber ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Changing…
                </>
              ) : (
                "Change Number"
              )}
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
