"use client";

import type { ReactElement, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  History,
  LayoutDashboard,
  Layers,
  Settings,
  Shield,
  Smartphone,
  Wallet,
} from "lucide-react";
import { RechargePopup } from "@/components/dialogs/recharge-popup";
import {
  MobileDashboardNavbar,
  PremiumSidebarAddBalance,
  PremiumSidebarNavLink,
  PremiumSidebarProfile,
  PremiumSidebarShell,
  PremiumSidebarWallet,
} from "@/components/dashboard/premium-sidebar";
import { apiFetch, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";
import { isNavActive } from "@/lib/nav-utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";

const WALLET_CACHE_TTL_MS = 30_000;

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/otp-history", label: "OTP History", icon: History },
  { href: "/platforms", label: "Platforms", icon: Layers },
  { href: "/numbers", label: "Get Number", icon: Smartphone },
];

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manage", label: "Admin", icon: Shield },
  { href: "/manage/numbers", label: "Numbers", icon: Smartphone },
  { href: "/manage/platform-status", label: "Platform Status", icon: Layers },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, hydrated, setAuth } = useAuthStore();
  const { balancePkr, lastFetchedAt, setBalance, setLoading } = useWalletStore();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      await useAuthStore.getState().restoreSession();
      setSessionReady(true);
    })();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !sessionReady) return;
    if (!useAuthStore.getState().token) {
      router.replace("/login");
    }
  }, [hydrated, sessionReady, router]);

  useEffect(() => {
    if (!sessionReady || !token || !user) return;

    const now = Date.now();
    if (lastFetchedAt && now - lastFetchedAt < WALLET_CACHE_TTL_MS) return;

    const cached = localStorage.getItem("wallet_balance_cache");
    if (cached && lastFetchedAt !== null) {
      try {
        const { balance, timestamp } = JSON.parse(cached) as {
          balance: number;
          timestamp: number;
        };
        if (now - timestamp < WALLET_CACHE_TTL_MS) {
          setBalance(balance);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    setLoading(true);
    void (async () => {
      try {
        const res = await apiFetch<{ balancePkr: number }>("/api/wallet", {
          accessToken: token,
          disableDedupe: true,
        });
        if (res.success) {
          setBalance(res.data.balancePkr);
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionReady, token, user, lastFetchedAt, setBalance, setLoading]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (mq.matches) setMobileMenuOpen(false);
    };
    closeOnDesktop();
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);

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
      void useAuthStore.getState().restoreSession();
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  if (!hydrated || !sessionReady || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  const showAdmin = user.role === "ADMIN";
  const profileHref = "/settings";
  const isProfileActive = isNavActive(pathname, profileHref);
  const headerHref = showAdmin ? "/manage" : "/dashboard";

  const pkrFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });

  const balanceLabel =
    balancePkr === null
      ? "—"
      : `${pkrFormatter.format(balancePkr)} PKR`;

  const visibleNav = showAdmin ? [] : nav;

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
      <PremiumSidebarShell
        headerHref={headerHref}
        nav={nav}
        adminNav={adminNav}
        showAdmin={showAdmin}
        pathname={pathname}
        showWallet={!showAdmin}
        balanceLabel={balanceLabel}
        balanceLoading={balancePkr === null}
        onAddBalance={() => setShowRechargeModal(true)}
        user={user}
        profileHref={profileHref}
        profileActive={isProfileActive}
      />

      <div className="mobile-dashboard-main flex min-w-0 w-full flex-1 flex-col md:pl-[280px]">
        <MobileDashboardNavbar
          href={headerHref}
          menuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <div
          className={cn(
            "mobile-menu-panel md:hidden",
            mobileMenuOpen ? "mobile-menu-panel--open" : "mobile-menu-panel--closed",
          )}
          id="mobile-dashboard-menu"
          aria-hidden={!mobileMenuOpen}
        >
          <div className="mobile-menu-panel__surface">
            <div className="mobile-menu-panel__inner">
            <nav className="flex flex-col gap-1">
              {visibleNav.map((item) => (
                <PremiumSidebarNavLink
                  key={item.href}
                  {...item}
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              ))}
              {showAdmin
                ? adminNav.map((item) => (
                    <PremiumSidebarNavLink
                      key={item.href}
                      {...item}
                      pathname={pathname}
                      onNavigate={() => setMobileMenuOpen(false)}
                    />
                  ))
                : null}
            </nav>

            {!showAdmin ? (
              <div className="mobile-menu-panel__footer">
                <PremiumSidebarWallet
                  balanceLabel={balanceLabel}
                  loading={balancePkr === null}
                />
                <PremiumSidebarAddBalance
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowRechargeModal(true);
                  }}
                />
              </div>
            ) : null}

            <PremiumSidebarProfile
              user={user}
              href={profileHref}
              active={isProfileActive}
              onNavigate={() => setMobileMenuOpen(false)}
            />
            </div>
          </div>
        </div>

        <main className="min-w-0 w-full max-w-full flex-1 p-4 sm:p-6 md:p-8">{children}</main>
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
