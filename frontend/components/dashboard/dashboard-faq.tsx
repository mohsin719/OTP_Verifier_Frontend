"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles, Zap, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Billing" | "OTP & Numbers";
}

const FAQS: FaqItem[] = [
  {
    id: "delivery-speed",
    category: "OTP & Numbers",
    question: "How fast do SMS verification codes arrive?",
    answer:
      "Verification codes typically arrive in real time within 3 to 15 seconds. Once you request an SMS on your chosen app, our live connection updates immediately on your screen with audio and visual alerts.",
  },
  {
    id: "refund-guarantee",
    category: "Billing",
    question: "What happens if no OTP code is received? Do I get charged?",
    answer:
      "You are 100% protected by our zero-risk money-back guarantee! Balance is charged STRICTLY after a verification code is successfully received. If no code arrives within the active 10-minute window, your balance is never deducted and you can cancel or switch numbers at zero cost.",
  },
  {
    id: "supported-apps",
    category: "General",
    question: "Which platforms and services are supported?",
    answer:
      "We support over 100+ major popular platforms including WhatsApp, Telegram, Google / Gmail, OpenAI / ChatGPT, Facebook, Instagram, TikTok, Twitter / X, Amazon, Discord, Binance, Apple, Microsoft, Steam, Netflix, and many more. If your desired app is not listed, you can select 'Any Other Service' for universal verification.",
  },
  {
    id: "reuse-numbers",
    category: "OTP & Numbers",
    question: "Can I reuse a leased number after the session expires?",
    answer:
      "Temporary virtual lines are allocated exclusively for single verification sessions to guarantee virgin clean numbers and prevent account hijacking. Once the active window closes or the OTP is verified, the line is securely retired.",
  },
  {
    id: "how-to-recharge",
    category: "Billing",
    question: "How do I add balance to my account?",
    answer:
      "You can add balance anytime by clicking the '+ Add' button on the top navbar or visiting the Wallet page. We support multiple payment channels including Binance Pay, USDT/Crypto, and direct manual transfers with instant crediting.",
  },
  {
    id: "bulk-api",
    category: "General",
    question: "Is there an API available for high-volume automated verification?",
    answer:
      "Yes! High-volume teams and developers can automate number leasing and OTP extraction via our high-speed REST and WebSocket APIs. Contact support for API access and volume rate discounts.",
  },
];

export function DashboardFaq(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>("delivery-speed");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "OTP & Numbers", "Billing", "General"];

  const filteredFaqs = FAQS.filter(
    (faq) => activeCategory === "All" || faq.category === activeCategory
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to know about temporary virtual numbers, billing safety, and instant OTP delivery.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto self-start sm:self-center" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions */}
      <div className="mt-6 divide-y divide-slate-100">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div key={faq.id} className="py-3.5">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="flex w-full items-center justify-between gap-4 text-left group focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors",
                      isOpen
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-500 group-hover:border-blue-300 group-hover:text-blue-600"
                    )}
                  >
                    Q
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200",
                    isOpen ? "rotate-180 text-blue-600 bg-blue-50" : "text-slate-400 group-hover:text-slate-600"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="mt-2.5 pl-10 pr-4 text-xs sm:text-sm leading-relaxed text-slate-600 animate-in fade-in-50 duration-200">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need more help banner */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Still have a question or need assistance?</h4>
            <p className="text-xs text-slate-500">Our customer support team is available to assist you 24/7.</p>
          </div>
        </div>
        <a
          href="https://wa.me/923086973686"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Contact Live Support</span>
        </a>
      </div>
    </div>
  );
}
