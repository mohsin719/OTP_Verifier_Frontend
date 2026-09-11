"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  Wallet,
  History,
  ShieldCheck,
  Settings,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ESSENTIAL_PAGES = [
  {
    href: "/services",
    title: "All Supported Services",
    description: "Browse 100+ platforms with real logos, live PKR tariffs, and instant provisioning.",
    icon: Smartphone,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    badge: "100+ Active",
  },
  {
    href: "/wallet",
    title: "Wallet & Transactions",
    description: "Add funds, check balance, and review detailed credit and debit transaction ledger.",
    icon: Wallet,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "Instant Top-Up",
  },
  {
    href: "/otp-history",
    title: "OTP History & Receipts",
    description: "Search all leased numbers, verify timestamps, and copy delivered SMS verification codes.",
    icon: History,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    badge: "Live Sync",
  },
  {
    href: "/platforms",
    title: "Platform Status & Tariffs",
    description: "Inspect carrier latency, delivery success rates, and service-specific cooldown rules.",
    icon: Activity,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    badge: "99.4% Health",
  },
  {
    href: "/policies",
    title: "Privacy & Refund Policy",
    description: "Read our 100% money-back guarantee, zero-risk terms, and customer data commitments.",
    icon: ShieldCheck,
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-200",
    badge: "Zero Risk",
  },
  {
    href: "/settings",
    title: "Account & Security Settings",
    description: "Manage your username, password, public user ID, and active authentication session.",
    icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-100 border-slate-200",
    badge: "Encrypted",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Select Service Platform",
    description: "Pick your target app from our catalog (WhatsApp, Telegram, OpenAI, Google, etc.).",
    icon: Smartphone,
  },
  {
    step: "02",
    title: "Enter Number in Target App",
    description: "We immediately provision a dedicated mobile line for your selected country. Enter it on the app signup screen.",
    icon: Layers,
  },
  {
    step: "03",
    title: "Instant OTP & Zero Risk",
    description: "Your SMS code appears in real time. If no code arrives, you are charged 0 PKR!",
    icon: CheckCircle2,
  },
];

export function DashboardEssentialHub(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* ─── How It Works Visual Flow ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              <span>Simple 3-Step Process</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mt-1">
              How US Num Hub Works
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xs">
            Fast, secure, and fully automated verification with 100% money-back safety.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:border-blue-300 hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shadow-2xs">
                      {item.step}
                    </span>
                    <Icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Essential Platform Pages & Services Grid ─── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
              Essential Pages &amp; Quick Access
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Navigate quickly to any core area of your US Num Hub account.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ESSENTIAL_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.href}
                href={page.href}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 active:scale-[0.99]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border shadow-2xs", page.bg, page.color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {page.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                      <span>{page.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {page.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Trust & Performance Metrics Strip ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-blue-600 tabular-nums">99.4%</div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">Delivery Success</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">&lt; 8 Sec</div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">Average Code Arrival</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-indigo-600 tabular-nums">0 PKR</div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">Charged on Failed OTP</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-rose-600 tabular-nums">24/7</div>
          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">Automated Lines</div>
        </div>
      </div>
    </div>
  );
}
