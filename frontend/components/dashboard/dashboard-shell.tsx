"use client";

import type { ReactElement, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Smartphone,
  X,
} from "lucide-react";
import { RechargePopup } from "@/components/dialogs/recharge-popup";
import { PremiumSidebarShell } from "@/components/dashboard/premium-sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { apiFetch, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { useCurrencyStore, formatDualBalance } from "@/lib/currency";

const WALLET_CACHE_TTL_MS = 30_000;

const adminNav = [
  { href: "/manage", label: "Admin Overview", icon: LayoutDashboard },
  { href: "/manage/services", label: "Services & Pricing", icon: Smartphone },
  { href: "/manage/numbers", label: "Numbers", icon: Smartphone },
  { href: "/manage/platform-status", label: "Platform Status", icon: Activity },
  { href: "/manage/failure-logs", label: "Failure Logs", icon: AlertTriangle },
  { href: "/manage/users", label: "Users", icon: Settings },
  { href: "/manage/transactions", label: "Transactions", icon: CreditCard },
  { href: "/manage/otp-logs", label: "OTP Logs", icon: History },
  { href: "/manage/logs", label: "Admin Logs", icon: Shield },
  { href: "/manage/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [adminMobileOpen, setAdminMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, hydrated, setAuth } = useAuthStore();
  const { balancePkr, ownerUserId, lastFetchedAt, fetchBalance, invalidate, setLoading } =
    useWalletStore();
  const { exchangeRate, fetchExchangeRate } = useCurrencyStore();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    void fetchExchangeRate();
  }, [fetchExchangeRate]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      await useAuthStore.getState().restoreFromCookie();
      setSessionReady(true);
    })();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !sessionReady) return;
    if (!useAuthStore.getState().token) {
      router.replace("/login");
      return;
    }

    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    // Strict boundary: Admin can ONLY access /manage routes
    if (currentUser.role === "ADMIN" && !pathname.startsWith("/manage")) {
      router.replace("/manage");
      return;
    }

    // Strict boundary: Regular users can NEVER access /manage routes
    if (currentUser.role !== "ADMIN" && pathname.startsWith("/manage")) {
      router.replace("/dashboard");
      return;
    }
  }, [hydrated, sessionReady, pathname, router]);

  useEffect(() => {
    if (!sessionReady || !token || !user) return;

    if (ownerUserId && ownerUserId !== user.id) {
      invalidate();
    }

    const now = Date.now();
    const wallet = useWalletStore.getState();
    if (
      wallet.ownerUserId === user.id &&
      wallet.lastFetchedAt &&
      now - wallet.lastFetchedAt < WALLET_CACHE_TTL_MS
    ) {
      return;
    }

    setLoading(true);
    void fetchBalance(token, user.id);
  }, [
    sessionReady,
    token,
    user,
    ownerUserId,
    lastFetchedAt,
    fetchBalance,
    invalidate,
    setLoading,
  ]);

  useEffect(() => {
    if (!sessionReady || !token || !user) return;
    void (async () => {
      try {
        const me = await apiFetch<typeof user>("/api/auth/me", {
          accessToken: token,
          cacheTtlMs: 3000,
        });
        if (!me.success) {
          await useAuthStore.getState().refreshToken();
          return;
        }
        if (me.data.role !== user.role || me.data.publicId !== user.publicId) {
          setAuth(token, me.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    })();
  }, [sessionReady, token, user, setAuth]);

  useEffect(() => {
    const onUnauthorized = () => {
      void useAuthStore.getState().restoreFromCookie();
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  if (!hydrated || !sessionReady || !token || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground text-center">
          Loading your account...
        </p>
      </div>
    );
  }

  const isAdminRoute = pathname.startsWith("/manage");
  const isAdminUser = user.role === "ADMIN";

  // Prevent flash of unauthorized UI while redirecting
  if (isAdminUser && !isAdminRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground text-center">
          Redirecting to Admin Panel...
        </p>
      </div>
    );
  }

  if (!isAdminUser && isAdminRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground text-center">
          Redirecting to Dashboard...
        </p>
      </div>
    );
  }

  const dualBalance = formatDualBalance(balancePkr, exchangeRate);

  const balanceLabel =
    balancePkr === null || ownerUserId !== user?.id
      ? "-"
      : `${dualBalance.usd} (${dualBalance.pkr})`;

  const balanceLoading = balancePkr === null || ownerUserId !== user.id;

  /* Admin layout: dedicated sidebar + mobile header, strictly for ADMIN accounts */
  if (isAdminUser) {
    return (
      <div className="flex min-h-screen w-full max-w-[100vw] flex-col md:flex-row overflow-x-hidden">
        <PremiumSidebarShell
          headerHref="/manage"
          nav={[]}
          adminNav={adminNav}
          showAdmin={true}
          pathname={pathname}
          showWallet={false}
          balanceLabel={balanceLabel}
          balanceLoading={balanceLoading}
          onAddBalance={() => setShowRechargeModal(true)}
          user={user}
          profileHref="/manage/settings"
          profileActive={pathname.startsWith("/manage/settings")}
        >
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={async () => {
                await useAuthStore.getState().logout();
                router.push("/login");
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </PremiumSidebarShell>

        {/* Mobile Header for Admin */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 text-white">
          <Link href="/manage" className="flex items-center gap-2 font-extrabold text-sm tracking-tight text-white">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Admin Portal</span>
          </Link>
          <button
            type="button"
            onClick={() => setAdminMobileOpen(!adminMobileOpen)}
            className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-200 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {adminMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Drawer for Admin */}
        {adminMobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-[49px] bottom-0 z-40 bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/manage"
                  ? pathname === "/manage"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAdminMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  setAdminMobileOpen(false);
                  await useAuthStore.getState().logout();
                  router.push("/login");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex min-w-0 w-full flex-1 flex-col md:pl-[280px]">
          <main className={cn("min-w-0 w-full max-w-full flex-1 p-4 sm:p-6 md:p-8")}>
            {children}
          </main>
        </div>
        <RechargePopup
          open={showRechargeModal}
          onOpenChange={setShowRechargeModal}
          showMinimumMessage={true}
          description="A minimum recharge of Rs 500 is required."
        />
      </div>
    );
  }

  const normalizedPath = (pathname || "").replace(/\/+$/, "") || "/";
  const isDashboard = normalizedPath === "/dashboard";

  /* User layout: top navbar */
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
      <TopNavbar
        user={user}
        balanceLabel={balanceLabel}
        balancePkr={balancePkr}
        balanceLoading={balanceLoading}
        onAddBalance={() => setShowRechargeModal(true)}
      />
      <main className="top-nav-layout min-w-0 w-full max-w-full flex-1 px-4 sm:px-6 md:px-8 pb-10 sm:pb-16">
        {children}
      </main>
      {isDashboard && <DashboardFooter />}
      <RechargePopup
        open={showRechargeModal}
        onOpenChange={setShowRechargeModal}
        showMinimumMessage={true}
        description="A minimum recharge of Rs 500 is required."
      />
    </div>
  );
}
