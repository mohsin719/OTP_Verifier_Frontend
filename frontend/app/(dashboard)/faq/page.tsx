"use client";

import React from "react";
import Link from "next/link";
import { DashboardFaq } from "@/components/dashboard/dashboard-faq";
import { HelpCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FaqPage(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12 pt-2 sm:pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <HelpCircle className="h-4 w-4" />
            <span>Support &amp; Answers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Everything you need to know about numbers, instant OTP receipt, and our 100% money-back guarantee.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-200 text-xs font-bold gap-1.5">
            <Link href="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
          </Button>

          <a
            href="https://wa.me/923230490710?text=Hi%2C%20I%20have%20a%20question%20about%20USNumHub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Ask Support</span>
          </a>
        </div>
      </div>

      {/* Embedded Interactive Accordion */}
      <DashboardFaq />
    </div>
  );
}
