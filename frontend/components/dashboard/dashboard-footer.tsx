"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Smartphone,
  HelpCircle,
  MessageCircle,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";

export function DashboardFooter(): React.ReactElement {
  return (
    <footer className="w-full border-t border-slate-800/90 bg-[#090d16] text-slate-400">
      {/* ─── Top Brand Gradient Stripe ─── */}
      <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-rose-500 opacity-90" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* ─── Col 1: Brand & Tagline ─── */}
          <div className="space-y-3">
            <Link href="/dashboard" className="flex items-center gap-2 select-none inline-flex" prefetch={false}>
              <Image
                src="/brand/logo.png"
                alt="US Num Hub"
                width={34}
                height={34}
                className="h-7 w-auto object-contain"
              />
              <span className="font-black text-base tracking-tight leading-none text-white">
                <span className="text-blue-500">US</span>
                <span className="text-white ml-1">Num</span>
                <span className="ml-1.5 rounded-md bg-gradient-to-r from-red-500 to-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                  HUB
                </span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Fast, disposable virtual numbers with instant SMS delivery and 100% automated refund guarantee.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>All Systems Operational (99.4%)</span>
            </div>
          </div>

          {/* ─── Col 2: Services (Short & Clean) ─── */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-blue-400" />
              <span>Services</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/services" className="hover:text-white transition-colors flex items-center gap-1 group font-medium">
                  <span>100+ Popular Services</span>
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                </Link>
              </li>
              <li>
                <Link href="/numbers?service=wa" className="hover:text-white transition-colors">
                  WhatsApp Verification
                </Link>
              </li>
              <li>
                <Link href="/numbers?service=tg" className="hover:text-white transition-colors">
                  Telegram Lines
                </Link>
              </li>
              <li>
                <Link href="/numbers?service=dr" className="hover:text-white transition-colors">
                  OpenAI / ChatGPT
                </Link>
              </li>
            </ul>
          </div>

          {/* ─── Col 3: FAQ & Policies (Prominent & Clear) ─── */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Help &amp; Policies</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {/* FAQ Link - Highlighted */}
              <li>
                <Link
                  href="/faq"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Frequently Asked Questions (FAQ)</span>
                </Link>
              </li>

              {/* Policy Link - Highlighted */}
              <li>
                <Link
                  href="/policies"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Privacy &amp; Refund Policy</span>
                </Link>
              </li>

              <li>
                <Link href="/policies#terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>Terms of Service</span>
                </Link>
              </li>

              <li>
                <Link href="/platforms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-slate-500" />
                  <span>Carrier Status &amp; Tariffs</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ─── Col 4: 24/7 WhatsApp Support ─── */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>24/7 Support</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have questions or need custom lines? Our team is available 24/7.
            </p>
            <a
              href="https://wa.me/923230490710?text=Hi%2C%20I%20need%20support%20with%20USNumHub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all w-full text-center"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Support</span>
            </a>
            <p className="text-[11px] text-slate-500 text-center">
              Active 24/7 • Avg response under 5 mins
            </p>
          </div>
        </div>

        {/* ─── Bottom Sub-Bar ─── */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} US Num Hub. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/faq" className="hover:text-slate-300 transition-colors">
              FAQ
            </Link>
            <span>·</span>
            <Link href="/policies" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/policies#refunds" className="hover:text-slate-300 transition-colors">
              Refund Rules
            </Link>
            <span>·</span>
            <Link href="/policies#terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
