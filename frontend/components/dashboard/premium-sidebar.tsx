"use client";

import type { ComponentType, ReactElement, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import type { AuthUser } from "@/lib/auth-types";
import { isNavActive } from "@/lib/nav-utils";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/dashboard/user-avatar";

export function PremiumSidebarHeader({
  href = "/dashboard",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}): ReactElement {
  return (
    <div
      className={cn(
        "premium-sidebar__header",
        compact && "border-0 bg-transparent p-0",
      )}
    >
      <Link href={href} prefetch={false} className={cn("premium-sidebar__brand", compact && "premium-sidebar__brand--compact")}>
        <div className="premium-sidebar__logo-wrap">
          {!compact ? (
            <div className="premium-sidebar__logo-orbit" aria-hidden />
          ) : null}
          <div
            className={cn(
              "premium-sidebar__logo-ring",
              compact && "premium-sidebar__logo-ring--compact",
            )}
          >
            <div className="premium-sidebar__logo-ring-inner">
              <Image
                src="/favicon-32x32.png"
                alt="US Num Hub"
                width={32}
                height={32}
                priority
                className={cn("object-contain", compact ? "h-5 w-5" : "h-7 w-7")}
              />
            </div>
          </div>
        </div>
        <div className="premium-sidebar__brand-text">
          <p
            className={cn(
              "premium-sidebar__brand-name",
              compact && "premium-sidebar__brand-name--compact",
            )}
          >
            <span className="premium-sidebar__brand-us">US</span>
            <span className="premium-sidebar__brand-num">Num</span>
            <span className="premium-sidebar__brand-hub">Hub</span>
          </p>
        </div>
      </Link>
    </div>
  );
}

export function MobileDashboardNavbar({
  href,
  menuOpen,
  onToggleMenu,
}: {
  href: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
}): ReactElement {
  return (
    <header className="mobile-nav sticky top-0 z-30 flex md:hidden">
      <Link href={href} prefetch={false} className="mobile-nav__brand">
        <span className="mobile-nav__logo">
          <Image
            src="/favicon-32x32.png"
            alt="US Num Hub"
            width={28}
            height={28}
            priority
            className="h-7 w-7 object-contain"
          />
        </span>
        <span className="mobile-nav__title">
          <span className="mobile-nav__us">US</span>
          <span className="mobile-nav__rest"> Num Hub</span>
        </span>
      </Link>
      <button
        type="button"
        className={cn(
          "mobile-nav__menu-btn",
          menuOpen && "mobile-nav__menu-btn--open",
        )}
        onClick={(event) => {
          event.stopPropagation();
          onToggleMenu();
        }}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-dashboard-menu"
      >
        <span className="mobile-nav__burger" aria-hidden>
          <span className="mobile-nav__burger-line" />
          <span className="mobile-nav__burger-line" />
          <span className="mobile-nav__burger-line" />
        </span>
      </button>
    </header>
  );
}

export function PremiumSidebarNavLink({
  href,
  label,
  icon: Icon,
  active,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  pathname?: string;
  onNavigate?: () => void;
}): ReactElement {
  const isActive = active ?? (pathname ? isNavActive(pathname, href) : false);
  const itemClass = isActive
    ? "premium-sidebar__nav-item premium-sidebar__nav-item--active"
    : "premium-sidebar__nav-item";

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      className={itemClass}
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="premium-sidebar__nav-glow" aria-hidden />
      <span className="premium-sidebar__icon-box">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function PremiumSidebarWallet({
  balanceLabel,
  loading,
}: {
  balanceLabel: string;
  loading: boolean;
}): ReactElement {
  return (
    <div className="premium-sidebar__wallet">
      <div className="premium-sidebar__wallet-body">
        <span className="premium-sidebar__wallet-icon-sphere">
          <Wallet className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="premium-sidebar__wallet-top">
          <span className="premium-sidebar__wallet-label">Balance</span>
          {loading ? (
            <div className="premium-sidebar__wallet-amount h-5 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="premium-sidebar__wallet-amount">{balanceLabel}</p>
          )}
        </div>
      </div>
      <svg
        className="premium-sidebar__wallet-deco"
        viewBox="0 0 90 50"
        aria-hidden
        fill="none"
      >
        <defs>
          <linearGradient id="walletWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path
          d="M4 38 C28 8, 52 42, 78 18"
          stroke="url(#walletWaveGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="78" cy="18" r="3.5" fill="#c084fc" opacity="0.95" />
        <circle cx="78" cy="18" r="6" fill="#a855f7" opacity="0.25" />
      </svg>
    </div>
  );
}

export function PremiumSidebarAddBalance({
  onClick,
}: {
  onClick: () => void;
}): ReactElement {
  return (
    <button type="button" className="premium-sidebar__cta" onClick={onClick}>
      <span className="premium-sidebar__cta-left">
        <span className="premium-sidebar__cta-icon">
          <Wallet className="h-3 w-3" />
        </span>
        Add Balance
      </span>
      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
    </button>
  );
}

export function PremiumSidebarProfile({
  user,
  href,
  active,
  onNavigate,
}: {
  user: AuthUser;
  href: string;
  active?: boolean;
  onNavigate?: () => void;
}): ReactElement {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        "premium-sidebar__profile",
        active && "premium-sidebar__profile--active",
      )}
    >
      <div className="premium-sidebar__avatar-wrap">
        <UserAvatar
          userId={user.id}
          username={user.username}
          publicId={user.publicId}
          className="h-10 w-10 ring-2 ring-white/10"
        />
        <span className="premium-sidebar__online" aria-label="Online" />
      </div>
      <div className="premium-sidebar__profile-info">
        <p className="premium-sidebar__profile-name">
          {user.username || user.publicId}
        </p>
        <p className="premium-sidebar__profile-email">{user.email}</p>
      </div>
      <ChevronRight className="premium-sidebar__profile-arrow h-4 w-4" />
    </Link>
  );
}

export function PremiumSidebarShell({
  children,
  headerHref,
  nav,
  adminNav,
  showAdmin,
  pathname,
  showWallet,
  balanceLabel,
  balanceLoading,
  onAddBalance,
  user,
  profileHref,
  profileActive,
}: {
  children?: ReactNode;
  headerHref: string;
  nav: Array<{
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;
  adminNav: Array<{
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;
  showAdmin: boolean;
  pathname: string;
  showWallet: boolean;
  balanceLabel: string;
  balanceLoading: boolean;
  onAddBalance: () => void;
  user: AuthUser;
  profileHref: string;
  profileActive: boolean;
}): ReactElement {
  const visibleNav = showAdmin ? [] : nav;

  return (
    <aside className="premium-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col md:flex">
      <div className="premium-sidebar__particles" aria-hidden />
      <div className="premium-sidebar__blobs" aria-hidden>
        <span className="premium-sidebar__blob premium-sidebar__blob--1" />
        <span className="premium-sidebar__blob premium-sidebar__blob--2" />
        <span className="premium-sidebar__blob premium-sidebar__blob--3" />
      </div>

      <PremiumSidebarHeader href={headerHref} />

      <nav className="premium-sidebar__nav">
        {visibleNav.map((item) => (
          <PremiumSidebarNavLink
            key={item.href}
            {...item}
            pathname={pathname}
          />
        ))}
        {showAdmin ? (
          <>
            <div className="premium-sidebar__nav-label">Admin</div>
            {adminNav.map((item) => (
              <PremiumSidebarNavLink
                key={item.href}
                {...item}
                pathname={pathname}
              />
            ))}
          </>
        ) : null}
        {children}
      </nav>

      <div className="premium-sidebar__footer">
        {showWallet ? (
          <>
            <PremiumSidebarWallet
              balanceLabel={balanceLabel}
              loading={balanceLoading}
            />
            <PremiumSidebarAddBalance onClick={onAddBalance} />
          </>
        ) : null}
        <PremiumSidebarProfile
          user={user}
          href={profileHref}
          active={profileActive}
        />
      </div>
    </aside>
  );
}
