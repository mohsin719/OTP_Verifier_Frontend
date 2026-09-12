"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Check,
  ChevronDown,
  Search,
  X,
  Sparkles,
  Smartphone,
  Coins,
  Building2,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentMethodConfig } from "@/lib/payment-methods";
import { PaymentMethodIcon } from "./payment-icons";

interface PaymentMethodDropdownProps {
  methods: PaymentMethodConfig[];
  selectedId: string;
  onSelect: (method: PaymentMethodConfig) => void;
  className?: string;
  disabled?: boolean;
}

type CategoryTab = "all" | "local" | "crypto" | "bank" | "global";

export function PaymentMethodDropdown({
  methods,
  selectedId,
  onSelect,
  className,
  disabled = false,
}: PaymentMethodDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Currently selected method
  const selectedMethod = useMemo(() => {
    return (
      methods.find((m) => m.id === selectedId || m.code === selectedId) ||
      methods[0]
    );
  }, [methods, selectedId]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filtered methods based on category tab and search query
  const filteredMethods = useMemo(() => {
    return methods.filter((m) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "bank") {
          if (m.category !== "bank" && !m.code.includes("bank") && !m.code.includes("raast")) {
            return false;
          }
        } else if (m.category !== selectedCategory) {
          return false;
        }
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(q)) ||
        (m.networkOrBank && m.networkOrBank.toLowerCase().includes(q)) ||
        (m.accountTitleOrMemo && m.accountTitleOrMemo.toLowerCase().includes(q)) ||
        (m.accountNumberOrAddress && m.accountNumberOrAddress.toLowerCase().includes(q)) ||
        m.currency.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q)
      );
    });
  }, [methods, selectedCategory, searchQuery]);

  function handleSelect(m: PaymentMethodConfig) {
    onSelect(m);
    setIsOpen(false);
    setSearchQuery("");
  }

  return (
    <div ref={dropdownRef} className={cn("relative w-full", className)}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer text-left select-none",
          isOpen
            ? "border-blue-600 bg-white ring-4 ring-blue-500/10 shadow-md"
            : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Authentic Brand Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-2xs overflow-hidden">
            <PaymentMethodIcon
              iconKey={selectedMethod?.iconKey}
              code={selectedMethod?.code}
              size={28}
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 truncate">
                {selectedMethod?.title}
              </span>
              {selectedMethod?.badge && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                  {selectedMethod.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
              <span className="truncate">
                {selectedMethod?.networkOrBank || selectedMethod?.subtitle}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700 shrink-0">
                Min: {selectedMethod?.currency === "USD" ? `$${selectedMethod?.minAmountUsd}` : `Rs ${selectedMethod?.minAmountPkr}`}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Indicator */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-transform duration-200",
            isOpen && "rotate-180 bg-blue-50 text-blue-600"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-400/20 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header & Search Bar */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search JazzCash, Binance, USDT, NayaPay, Bank..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-8.5 pr-8 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                All ({methods.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("local")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                  selectedCategory === "local"
                    ? "bg-red-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                <Smartphone className="h-3 w-3" />
                <span>Pakistani Wallets</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("crypto")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                  selectedCategory === "crypto"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                <Coins className="h-3 w-3" />
                <span>Crypto (USD)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("bank")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer",
                  selectedCategory === "bank"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                <Building2 className="h-3 w-3" />
                <span>Bank / Raast</span>
              </button>
            </div>
          </div>

          {/* Methods List */}
          <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1">
            {filteredMethods.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold">No payment methods found</p>
                <p className="text-[11px]">Try adjusting your search or category filter</p>
              </div>
            ) : (
              filteredMethods.map((m) => {
                const isSelected = m.id === selectedId || m.code === selectedId;
                return (
                  <button
                    key={m.id || m.code}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer group",
                      isSelected
                        ? "bg-blue-50/80 border border-blue-200 text-slate-900"
                        : "hover:bg-slate-50 border border-transparent text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Brand Logo */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                        <PaymentMethodIcon
                          iconKey={m.iconKey}
                          code={m.code}
                          size={24}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {m.title}
                          </span>
                          {m.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.1 rounded bg-slate-100 text-slate-600 border border-slate-200/70">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {m.networkOrBank || m.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                          {m.currency === "USD" ? `$${m.minAmountUsd}` : `Rs ${m.minAmountPkr}`}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full transition-all",
                          isSelected
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "opacity-0 group-hover:opacity-30 text-slate-400"
                        )}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
