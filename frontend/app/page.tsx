"use client";

import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Zap,
  Smartphone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Copy,
  Check,
  ChevronDown,
  RotateCcw,
  BadgeCheck,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { OrbitalBallsSphere } from "@/components/landing/orbital-balls-sphere";
import { useCurrencyStore } from "@/lib/currency";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What happens if no OTP arrives for my number?",
    a: "You are not charged a single cent. Our platform operates with a 100% money-back guarantee. If no SMS arrives within the 10-minute active lease window, the reserved amount is immediately refunded to your wallet balance.",
  },
  {
    q: "How fast do verification codes arrive?",
    a: "Under 8 seconds on average. Through direct Tier-1 carrier integration and automated webhooks, SMS codes stream directly to your screen the instant the service dispatches them.",
  },
  {
    q: "Can I pay with both Dollars ($ USD) and PKR (Rs)?",
    a: "Yes! Our platform features a live dual-currency engine. You can view all platform rates in USD and PKR, and top up your wallet via Dollar methods or local Pakistani payment channels seamlessly.",
  },
  {
    q: "Are the virtual numbers dedicated or shared?",
    a: "Every number allocated is private and dedicated to your verification session for the active 10-minute window. We never reuse active lines between concurrent users.",
  },
];

export default function LandingPage(): ReactElement {
  const { exchangeRate } = useCurrencyStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-slate-50/50">
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        {/* ─── HERO SECTION ─── */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/30 to-white">
          {/* Ambient background glows */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-blue-400/15 via-indigo-300/10 to-transparent blur-3xl" />

          <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-14 relative z-10">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-5 w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 sm:px-3.5 py-1 text-[11px] sm:text-xs font-bold text-blue-700 shadow-2xs max-w-full">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                <span className="truncate">Dedicated Multi-Country Lines · 100+ Popular Apps · 190+ Countries</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
                Virtual Numbers.{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  Instant OTP Delivery.
                </span>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-slate-600 leading-relaxed">
                Protect your personal privacy with dedicated temporary virtual numbers for WhatsApp, Telegram, Google, ChatGPT, TikTok, and 100+ global apps. Instant code arrival in under 8 seconds.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all h-12 px-6 text-sm sm:text-base cursor-pointer"
                >
                  <Link href="/services">
                    <Smartphone className="h-5 w-5 mr-2" />
                    <span>Get Number Now</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl h-12 px-6 text-sm sm:text-base shadow-2xs hover:border-blue-300 cursor-pointer"
                >
                  <Link href="/register">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    <span>Create Free Account</span>
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-4 text-xs font-semibold text-slate-500 border-t border-slate-200/60">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% Refund if no SMS arrives</span>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>&lt; 8s Average Delivery</span>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Lock className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Private disposable line</span>
                </span>
              </div>
            </div>

            {/* Right Hero: 3D Orbital Balls Sphere with Royal Blue Backboard & Center Logo */}
            <div className="w-full lg:max-w-[500px] shrink-0 flex justify-center">
              <OrbitalBallsSphere />
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS (3 SIMPLE STEPS) ─── */}
        <section className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Simple 3-Step Process
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
                How US Num Hub Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                From app selection to SMS arrival in less than 60 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-base border border-blue-100">
                  1
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Select App &amp; Country
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Choose from 100+ popular platforms (WhatsApp, Telegram, OpenAI, Google) and pick your target country line from 190+ destinations.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-base border border-blue-100">
                  2
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Get Dedicated Number
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Click Get Number to generate a private virtual line with an active 10-minute lease. Copy and paste it directly into your app.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-black text-base border border-emerald-100">
                  3
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Receive OTP with 100% Refund
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Your verification code streams live onto your screen. If no SMS is received, your wallet is automatically refunded at 0 cost.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DUAL CURRENCY & SECURITY HIGHLIGHT ─── */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Column: Dual Currency */}
              <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/90 p-6 sm:p-8 space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm">
                  $
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Dual-Currency Engine ($ USD &amp; Rs PKR)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Whether you prefer viewing prices in Pakistani Rupees (PKR) or US Dollars ($ USD), our platform dynamically converts all rates in real-time. Top up with global dollar methods or local payment channels.
                </p>
                <div className="flex items-center gap-3 pt-2 text-xs font-bold text-blue-900">
                  <span className="bg-white border border-blue-200 px-3 py-1 rounded-lg shadow-2xs">
                    Active: 1 USD = {exchangeRate} PKR
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 font-medium">Real-Time Sync</span>
                </div>
              </div>

              {/* Right Column: 100% Guarantee */}
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/90 p-6 sm:p-8 space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg shadow-sm">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Zero-Risk Money-Back Guarantee
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  You only pay when you succeed. If a carrier line fails to deliver an OTP within the 10-minute window, you can cancel or wait for expiration to get an automatic 100% refund.
                </p>
                <div className="flex items-center gap-3 pt-2 text-xs font-bold text-emerald-800">
                  <span className="bg-white border border-emerald-200 px-3 py-1 rounded-lg shadow-2xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>0 PKR Charged If No Code Arrives</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FREQUENTLY ASKED QUESTIONS ─── */}
        <section className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Got Questions?
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2",
                          isOpen && "rotate-180 text-blue-600"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA BANNER ─── */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-[28px] border border-blue-600/30 bg-gradient-to-r from-[#1d4ed8] via-[#1e40af] to-[#1e3a8a] p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-950/20">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  Ready to Verify Your Account in Seconds?
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  Join thousands of users using US Num Hub for instant, private SMS activation on WhatsApp, Telegram, Google, and 100+ popular services.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-900 font-black rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all h-11 px-6 text-sm sm:text-base cursor-pointer"
                  >
                    <Link href="/services">
                      <Smartphone className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Get Virtual Number</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl h-11 px-6 text-sm sm:text-base backdrop-blur-md cursor-pointer"
                  >
                    <Link href="/register">
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
