"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Shield,
  Zap,
  Plus,
  ArrowRight,
  Smartphone,
  Wallet,
  History,
  Sparkles,
  CheckCircle2,
  Clock,
  Globe,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { UsageSummarySection } from "@/components/dashboard/usage-summary-section";
import { RechargePopup } from "@/components/dialogs/recharge-popup";
import { ServiceBrandIcon } from "@/components/services/service-brand-icon";
import { useCurrencyStore, formatDualBalance, formatDualPrice } from "@/lib/currency";
import {
  FaWhatsapp,
  FaTelegram,
  FaGoogle,
  FaTiktok,
  FaInstagram,
  FaDiscord,
  FaFacebook,
  FaXTwitter,
  FaApple,
  FaSnapchat,
  FaAmazon,
  FaSpotify,
  FaSteam,
  FaPaypal,
  FaGithub,
  FaLinkedin,
  FaReddit,
  FaUber,
  FaViber,
  FaMicrosoft,
} from "react-icons/fa6";
import { RiOpenaiFill } from "react-icons/ri";
import { SiBinance, SiNetflix, SiCoinbase, SiTinder } from "react-icons/si";
import { cn } from "@/lib/utils";

const TRENDING_APPS = [
  { code: "wa", name: "WhatsApp", price: 45 },
  { code: "tg", name: "Telegram", price: 40 },
  { code: "dr", name: "ChatGPT", price: 60 },
  { code: "go", name: "Google", price: 50 },
  { code: "tt", name: "TikTok", price: 35 },
  { code: "ig", name: "Instagram", price: 35 },
];

export default function DashboardPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { balancePkr, isLoading, ownerUserId } = useWalletStore();
  const { exchangeRate, fetchExchangeRate } = useCurrencyStore();
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  React.useEffect(() => {
    void fetchExchangeRate();
  }, [fetchExchangeRate]);

  const dualBalance = formatDualBalance(balancePkr, exchangeRate);
  const hasBalance = balancePkr !== null && !isLoading && ownerUserId === user?.id;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-8 pb-4 pt-2 sm:pt-4">
      {/* ─── Hero Banner with Modern Royal Blue Aesthetic ─── */}
      <div className="relative overflow-hidden rounded-[26px] border border-blue-600/30 bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#1e3a8a] p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* ─── Seamless Decorative Background App Logos Mosaic (Zero Center Line, Rich Logo Cloud) ─── */}
        <div
          className="pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, transparent 28%, rgba(0,0,0,0.2) 48%, rgba(0,0,0,0.7) 68%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, transparent 28%, rgba(0,0,0,0.2) 48%, rgba(0,0,0,0.7) 68%, black 100%)",
          }}
          aria-hidden="true"
        >
          <div className="absolute -right-8 -top-10 -bottom-10 w-[540px] sm:w-[620px] lg:w-[660px] grid grid-cols-5 sm:grid-cols-6 gap-2.5 sm:gap-3 p-3 -rotate-3 opacity-[0.15] mix-blend-plus-lighter">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaWhatsapp className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <FaTelegram className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-3">
              <RiOpenaiFill className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-12 translate-y-1">
              <FaGoogle className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaTiktok className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <FaInstagram className="h-6 w-6 text-white" />
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-3 translate-y-1">
              <FaXTwitter className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaDiscord className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-12 translate-y-2">
              <SiBinance className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-3">
              <FaFacebook className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-1">
              <FaApple className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-12">
              <FaSnapchat className="h-6 w-6 text-white" />
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaAmazon className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <SiNetflix className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-3">
              <FaSpotify className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-12 translate-y-1">
              <FaSteam className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaPaypal className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <FaGithub className="h-6 w-6 text-white" />
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-3 translate-y-1">
              <FaLinkedin className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaReddit className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <FaUber className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-3">
              <FaViber className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-1">
              <FaMicrosoft className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-12">
              <SiCoinbase className="h-6 w-6 text-white" />
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <SiTinder className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaWhatsapp className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-12 translate-y-1">
              <FaTelegram className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-3">
              <RiOpenaiFill className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs rotate-6 translate-y-2">
              <FaGoogle className="h-6 w-6 text-white" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 backdrop-blur-xs -rotate-6">
              <FaTiktok className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-blue-100 backdrop-blur-md border border-white/10 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Real-Time SMS & Automated Refund Engine</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
              Virtual Verification Hub
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Welcome back, <strong className="text-white font-bold">{user?.username || user?.publicId}</strong>. Lease dedicated virtual numbers for WhatsApp, Telegram, Google, ChatGPT, and 100+ services with instant OTP receipt.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                asChild
                className="bg-white text-blue-900 hover:bg-blue-50 font-extrabold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl h-10 px-4"
              >
                <Link href="/services">
                  <Smartphone className="h-4 w-4 mr-1.5 text-blue-600" />
                  <span>Get Number</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 text-blue-600" />
                </Link>
              </Button>

              <Button
                type="button"
                onClick={() => setShowRechargeModal(true)}
                variant="outline"
                className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all rounded-xl h-10 px-4 cursor-pointer"
              >
                <Wallet className="h-4 w-4 mr-1.5 text-amber-300" />
                <span>Add Balance</span>
                <Plus className="h-3.5 w-3.5 ml-1 stroke-[3]" />
              </Button>
            </div>
          </div>

          {/* Right Trust Stats Capsule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15 shadow-inner-xs min-w-[240px]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">&lt; 8s Average</p>
                <p className="text-[10px] text-blue-200">Real-time OTP arrival</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">100% Refund</p>
                <p className="text-[10px] text-blue-200">0 PKR if no SMS arrives</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400/20 text-sky-300 border border-sky-400/30">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">60+ Countries</p>
                <p className="text-[10px] text-blue-200">Dedicated mobile lines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Key Action Cards Grid (Balance + 1-Click Launch + Carrier Status) ─── */}
      <div className="grid w-full min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Available Balance */}
        <Card className="border-slate-200 bg-white shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-blue-600" />
              <span>Available Balance</span>
            </CardTitle>
            <button
              type="button"
              onClick={() => setShowRechargeModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="h-3 w-3 stroke-[3]" />
              Top Up
            </button>
          </CardHeader>
          <CardContent className="pb-4">
            {!hasBalance ? (
              <Skeleton className="h-10 w-44 mt-1" />
            ) : (
              <div>
                <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-slate-900 leading-none">
                  {dualBalance.usd}
                </p>
                <p className="text-sm font-bold text-slate-500 tabular-nums mt-1">
                  ≈ {dualBalance.pkr}
                </p>
              </div>
            )}
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Auto-refunded to wallet on cancel</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: 1-Click Trending App Launcher */}
        <Card className="border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500" />
          <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Quick Launch Apps</span>
            </CardTitle>
            <Link
              href="/services"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              All 100+ →
            </Link>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-6 gap-2">
              {TRENDING_APPS.map((app) => {
                const appDual = formatDualPrice(app.price, exchangeRate);
                return (
                  <Link
                    key={app.code}
                    href={`/numbers?service=${app.code}`}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                    title={`${app.name} • ${appDual.usd} (${appDual.pkr})`}
                  >
                    <ServiceBrandIcon serviceCode={app.code} name={app.name} size={24} />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 truncate max-w-[40px] group-hover:text-blue-700">
                      {app.name.split(" ")[0]}
                    </span>
                  </Link>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11px] text-slate-500 font-medium text-center">
              Click any app to allocate a dedicated line instantly
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Platform Carrier Health */}
        <Card className="border-slate-200 bg-white shadow-2xs flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-600" />
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>Platform Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">SMS Delivery Success</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                99.4% Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Active Carrier Lines</span>
              <span className="text-xs font-bold text-slate-900">24/7 Auto-Rotated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Avg Ingestion Latency</span>
              <span className="text-xs font-bold text-blue-600">6.8 Seconds</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Usage Summary ─── */}
      <UsageSummarySection />

      {/* ─── How It Works ─── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              How Virtual Verification Works
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">3 simple steps to activate and verify any account in under 60 seconds</p>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            100% Risk-Free Auto Refund
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* Step 1 */}
          <div className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shadow-xs">
                01
              </span>
              <Smartphone className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Select Service &amp; Country</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Choose WhatsApp, Telegram, Google, ChatGPT, or 100+ services across 190+ countries.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shadow-xs">
                02
              </span>
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Copy &amp; Paste Number</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Paste the allocated virtual phone number into your target app signup or verification screen.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-black text-white shadow-xs">
                03
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Instant OTP Delivery</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Receive the SMS code live on screen. If no SMS arrives, your balance is 100% auto-refunded.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Direct Recharge Modal from Dashboard ─── */}
      <RechargePopup
        open={showRechargeModal}
        onOpenChange={setShowRechargeModal}
        showMinimumMessage={true}
        description="A minimum recharge of Rs 500 is required."
      />
    </div>
  );
}

