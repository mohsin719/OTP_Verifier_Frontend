"use client";

import type { ComponentType, ReactElement } from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Smartphone,
  History,
  Settings,
  Shield,
  Plus,
  X,
  Menu,
  ChevronDown,
  LogOut,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth-types";
import { isNavActive } from "@/lib/nav-utils";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { useCurrencyStore, formatDualBalance } from "@/lib/currency";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const USER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/services", label: "Get Number", icon: Smartphone },
  { href: "/otp-history", label: "OTP History", icon: History },
];

export function TopNavbar({
  user,
  balanceLabel,
  balancePkr,
  balanceLoading,
  onAddBalance,
}: {
  user: AuthUser | null;
  balanceLabel?: string;
  balancePkr?: number | null;
  balanceLoading: boolean;
  onAddBalance: () => void;
}): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!drawerOpen && !profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, profileOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleLogout(): Promise<void> {
    setProfileOpen(false);
    setDrawerOpen(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort
    }
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  const profileHref = "/settings";

  const navItems: NavItem[] = [...USER_NAV];

  const { exchangeRate } = useCurrencyStore();
  const dualBalance = formatDualBalance(balancePkr, exchangeRate);
  const displayUsd =
    balancePkr !== undefined && balancePkr !== null
      ? dualBalance.usd
      : (balanceLabel ?? "$0.00");
  const displayPkr =
    balancePkr !== undefined && balancePkr !== null ? dualBalance.pkr : "";

  return (
    <>
      <nav className="top-nav" aria-label="Main navigation">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-decoration-none group select-none shrink-0"
          prefetch={false}
        >
          <Image
            src="/brand/logo.png"
            alt="US Num Hub"
            width={36}
            height={36}
            priority
            className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
          />
          <span className="flex items-center gap-1 font-extrabold text-base tracking-tight leading-none">
            <span className="text-blue-600 font-black">US</span>
            <span className="text-slate-900">Num</span>
            <span className="ml-0.5 rounded-md bg-gradient-to-r from-red-500 to-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-2xs">
              HUB
            </span>
          </span>
        </Link>

        {/* Center Floating Segmented Nav Capsule */}
        <div
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none z-10"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center p-1 rounded-full bg-slate-100/90 border border-slate-200/80 backdrop-blur-md shadow-2xs gap-0.5 pointer-events-auto">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-180 select-none whitespace-nowrap",
                    active
                      ? "bg-white text-blue-600 shadow-xs border border-slate-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/60",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      active
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="top-nav__actions">
          {/* Compact, Sleek Balance Button with Dual Currency ($ USD & Rs PKR) */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                toast.info("Please sign in to view and recharge your wallet balance.");
                router.push("/login?redirect=/deposit");
                return;
              }
              router.push("/deposit");
            }}
            className="flex items-center gap-2 h-8.5 rounded-full border border-slate-200/90 bg-white hover:border-blue-400 hover:bg-blue-50/40 pl-2.5 pr-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-97 select-none"
            aria-label={`Current Balance: ${displayUsd} ${displayPkr}. Click to add funds.`}
            title={user ? "Click to recharge balance" : "Sign in to recharge balance"}
            id="top-nav-balance-btn"
          >
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 group-hover:bg-blue-100 transition-colors">
                <Wallet className="h-3 w-3" />
              </span>
              {balanceLoading && user ? (
                <span className="h-3.5 w-16 animate-pulse rounded bg-slate-200 inline-block" />
              ) : (
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-xs font-black text-slate-900 tracking-tight tabular-nums group-hover:text-blue-600 transition-colors">
                    {displayUsd}
                  </span>
                  {displayPkr && (
                    <span className="text-[10px] font-semibold text-slate-400 tabular-nums hidden sm:inline">
                      ({displayPkr})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Clean "+" Icon with No Color Fill */}
            <span
              className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 bg-transparent group-hover:border-blue-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all ml-0.5"
              aria-hidden="true"
            >
              <Plus className="h-2.5 w-2.5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            </span>
          </button>

          {/* Profile Dropdown Trigger & Popover if user is logged in, else direct Sign In button */}
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 h-8 pl-1 pr-2.5 rounded-full border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all select-none group shadow-2xs cursor-pointer",
                  profileOpen && "border-blue-500 ring-2 ring-blue-100 bg-blue-50/20",
                )}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                id="top-nav-avatar-btn"
              >
                <div className="relative">
                  <UserAvatar
                    userId={user.id}
                    username={user.username ?? "User"}
                    publicId={user.publicId ?? "USER"}
                    className="h-6 w-6 ring-1 ring-slate-200"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-1.5 ring-white bg-emerald-500" />
                </div>
                <span className="hidden lg:inline text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {user.username ?? user.publicId}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200",
                    profileOpen && "rotate-180 text-blue-600",
                  )}
                />
              </button>

              {/* Profile Floating Dropdown Menu */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/60 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* User Info Header */}
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.username || "User"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate font-mono">
                      {user.email || user.publicId}
                    </p>
                    {user.role === "ADMIN" && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/70 text-[9px] font-black uppercase tracking-wider">
                        Administrator
                      </span>
                    )}
                  </div>

                  {/* Settings Link Button */}
                  <Link
                    href="/settings"
                    prefetch={false}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-colors cursor-pointer select-none"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    <span>Settings</span>
                  </Link>

                  {/* Logout Action Button */}
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50/70 rounded-xl transition-colors cursor-pointer select-none text-left mt-0.5"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              prefetch={false}
              className="inline-flex items-center justify-center h-8.5 px-4 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs hover:shadow-xs active:scale-97 transition-all cursor-pointer select-none"
              id="top-nav-signin-btn"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            className={cn(
              "top-nav__hamburger",
              drawerOpen && "top-nav__hamburger--open",
            )}
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls="top-nav-drawer"
            id="top-nav-hamburger"
          >
            {drawerOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        id="top-nav-drawer"
        className={cn("top-nav__drawer", drawerOpen && "top-nav__drawer--open")}
        aria-hidden={!drawerOpen}
      >
        <div
          className="top-nav__drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />

        <div
          className="top-nav__drawer-sheet"
          role="dialog"
          aria-label="Navigation menu"
        >
          <div className="top-nav__drawer-handle" aria-hidden />

          <nav aria-label="Mobile navigation">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "top-nav__drawer-link",
                    active && "top-nav__drawer-link--active",
                  )}
                  onClick={() => setDrawerOpen(false)}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="top-nav__drawer-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Settings & Logout if logged in */}
            {user ? (
              <>
                <Link
                  href={profileHref}
                  prefetch={false}
                  className={cn(
                    "top-nav__drawer-link",
                    isNavActive(pathname, profileHref) &&
                      "top-nav__drawer-link--active",
                  )}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="top-nav__drawer-icon">
                    <Settings className="h-4 w-4" />
                  </span>
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="top-nav__drawer-link text-red-600 hover:bg-red-50/50 w-full text-left cursor-pointer"
                >
                  <span className="top-nav__drawer-icon text-red-500">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Logout
                </button>
              </>
            ) : null}
          </nav>

          <div className="top-nav__drawer-wallet">
            {!user ? (
              <div className="p-1">
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={() => setDrawerOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              /* Clickable Mobile Wallet Card with Clean Outline + */
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  if (!user) {
                    toast.info("Please sign in to view and recharge your wallet balance.");
                    router.push("/login?redirect=/deposit");
                    return;
                  }
                  router.push("/deposit");
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all shadow-2xs group cursor-pointer text-left"
                title="Click to recharge wallet"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                      Wallet Balance
                    </span>
                    {balanceLoading ? (
                      <span className="mt-0.5 h-4 w-20 animate-pulse rounded bg-slate-200 inline-block" />
                    ) : (
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-sm font-black text-slate-900 tabular-nums group-hover:text-blue-700 transition-colors">
                          {displayUsd}
                        </span>
                        {displayPkr && (
                          <span className="text-xs font-semibold text-slate-400 tabular-nums">
                            ({displayPkr})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean non-filled outline + icon */}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300 text-blue-600 bg-transparent group-hover:bg-blue-50 group-hover:border-blue-500 transition-all shrink-0">
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
