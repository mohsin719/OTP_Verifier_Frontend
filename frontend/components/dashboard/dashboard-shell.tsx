"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  History,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Phone,
  Settings,
  Shield,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RechargePopup } from "@/components/dialogs/recharge-popup";
import { apiFetch, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";

const WALLET_CACHE_TTL_MS = 30_000; // re-fetch every 30s

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/otp-history", label: "OTP history", icon: History },
  { href: "/platforms", label: "Platforms", icon: Phone },
  { href: "/numbers", label: "Get number", icon: Phone },
  { href: "/settings", label: "Profile", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/numbers", label: "Numbers", icon: Phone },
  { href: "/admin/platform-status", label: "Platform Status", icon: Layers },
  { href: "/admin/failure-logs", label: "Failure Logs", icon: AlertTriangle },
  { href: "/admin/users", label: "Users", icon: Settings },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/otp-logs", label: "OTP Logs", icon: History },
  { href: "/admin/logs", label: "Admin Logs", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
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
  const { token, user, hydrated, setAuth, logout } = useAuthStore();
  const { balancePkr, lastFetchedAt, setBalance, setLoading } = useWalletStore();

  // Pre-fetch wallet balance for instant display across all pages
  useEffect(() => {
    if (!token || !user) return;

    const now = Date.now();
    if (lastFetchedAt && now - lastFetchedAt < WALLET_CACHE_TTL_MS) return;

    // Show cached balance immediately if available and valid
    const cached = localStorage.getItem('wallet_balance_cache');
    if (cached) {
      try {
        const { balance, timestamp } = JSON.parse(cached);
        if (now - timestamp < WALLET_CACHE_TTL_MS) {
          setBalance(balance);
          setLoading(false);
          return;
        }
      } catch {
        // Ignore cache parse errors
      }
    }

    setLoading(true);
    void (async () => {
      try {
        const res = await apiFetch<{ balancePkr: number }>(
          "/api/wallet",
          { accessToken: token, disableDedupe: true },
        );
        if (res.success) {
          setBalance(res.data.balancePkr);
          // Cache in localStorage with timestamp
          localStorage.setItem('wallet_balance_cache', 
            JSON.stringify({ balance: res.data.balancePkr, timestamp: Date.now() }));
        } else {
          console.error("Failed to fetch balance:", res.error);
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user, lastFetchedAt, setBalance, setLoading]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }
    void (async () => {
      try {
        const me = await apiFetch<typeof user>("/api/auth/me", {
          accessToken: token,
          cacheTtlMs: 3000,
        });
        if (!me.success) {
          console.error("Failed to fetch user:", me.error);
          logout();
          router.replace("/login");
          return;
        }
        if (me.data.role !== user.role || me.data.publicId !== user.publicId) {
          setAuth(token, me.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        logout();
        router.replace("/login");
      }
    })();
  }, [token, user, setAuth, logout, router]);

  // Prefetch only the current route for better performance
  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const commonRoutes = [
      "/dashboard",
      "/numbers",
      "/wallet",
      "/otp-history",
      "/platforms",
      "/settings",
    ];

    const adminRoutes = [
      "/admin",
      "/admin/numbers",
      "/admin/platform-status",
      "/admin/failure-logs",
      "/admin/users",
      "/admin/transactions",
      "/admin/otp-logs",
      "/admin/logs",
      "/admin/settings",
    ];

    const routes = user.role === "ADMIN" ? [...commonRoutes, ...adminRoutes] : commonRoutes;

    for (const route of routes) {
      router.prefetch(route);
    }
  }, [token, user, router]);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      router.replace("/login");
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [logout, router]);

  if (!hydrated || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  const showAdmin = user.role === "ADMIN";
  const visibleNav = showAdmin ? [] : nav;

  const pkrFormatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-secondary md:flex">
        <div className="flex h-16 items-center border-b border-border px-6 text-lg font-semibold">
          VerifySMS
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {visibleNav.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
          {showAdmin ? (
            <>
              <div className="my-2 border-t border-border pt-2 text-xs uppercase text-muted-foreground">
                Admin
              </div>
              {adminNav.map((item) => (
                <SidebarLink
                  key={item.href}
                  {...item}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                />
              ))}
            </>
          ) : null}
        </nav>
        <div className="border-t border-border p-3">
          {!showAdmin && (
            <div className="mb-2 space-y-2">
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs">
                <p className="text-muted-foreground">Balance</p>
                {balancePkr === null ? (
                  <div className="mt-1 h-4 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="font-semibold text-foreground tabular-nums">
                    {pkrFormatter.format(balancePkr)} PKR
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full min-w-0 gap-2 px-2 text-xs sm:px-3 sm:text-sm"
                onClick={() => setShowRechargeModal(true)}
              >
                <Wallet className="h-4 w-4 shrink-0" />
                <span className="truncate">Add Balance</span>
              </Button>
            </div>
          )}
          <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
            <p className="font-medium">{user.publicId}</p>
            <p className="truncate text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <span className="font-semibold">VerifySMS</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </header>
        {mobileMenuOpen ? (
          <div className="border-b border-border bg-background px-4 py-3 md:hidden">
            <nav className="grid gap-2">
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    pathname === item.href
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {showAdmin
                ? adminNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))
                : null}
            </nav>
            {!showAdmin && (
              <>
                <div className="my-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs">
                  <p className="text-muted-foreground">Balance</p>
                  {balancePkr === null ? (
                    <div className="mt-1 h-4 w-20 animate-pulse rounded bg-muted" />
                  ) : (
                    <p className="font-semibold text-foreground tabular-nums">
                      {pkrFormatter.format(balancePkr)} PKR
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-w-0 gap-2 px-2 text-xs"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowRechargeModal(true);
                  }}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="truncate">Add Balance</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="mt-3 w-full justify-center gap-2"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        ) : null}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>

      {/* Recharge Modal */}
      <RechargePopup
        open={showRechargeModal}
        onOpenChange={setShowRechargeModal}
        showMinimumMessage={true}
        description="A minimum recharge of Rs 500 is required."
      />
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
}): ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
