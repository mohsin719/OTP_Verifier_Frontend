"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  X,
  Check,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  type ServiceCatalogItem,
  FALLBACK_SERVICES,
  SERVICE_CATEGORIES,
  type ServiceCategory,
  getServiceHref,
  isApprovedPopularService,
} from "@/lib/services";
import {
  HEROSMS_COUNTRIES,
  type CountryItem,
  DEFAULT_COUNTRY,
} from "@/lib/countries";
import { cn } from "@/lib/utils";
import { ServiceBrandIcon } from "@/components/services/service-brand-icon";
import { CountryFlag } from "@/components/ui/country-flag";
import { useCurrencyStore, formatDualPrice } from "@/lib/currency";
import { getServices } from "@/lib/api";

// ─── Popular Apps Priority Weight ───
// Guarantees top popular apps (WhatsApp, Telegram, Google, Facebook, Instagram, TikTok, OpenAI, Twitter) appear on Page 1
const POPULAR_WEIGHTS: Record<string, number> = {
  wa: 1,  // WhatsApp
  tg: 2,  // Telegram
  go: 3,  // Google
  fb: 4,  // Facebook
  ig: 5,  // Instagram
  lf: 6,  // TikTok
  tt: 6,
  dr: 7,  // OpenAI
  tw: 8,  // Twitter / X
  wx: 9,  // Apple
  mm: 10, // Microsoft
  mt: 11, // Steam
  sn: 12, // OLX
  ds: 13, // Discord
  ts: 14, // PayPal
  am: 15, // Amazon
  wr: 16, // Walmart
  vi: 17, // Viber
  nf: 18, // Netflix
  alj: 19, // Spotify
  sp: 19,
  ub: 20, // Uber
  tn: 21, // LinkedIn
  rd: 22, // Reddit
  oi: 23, // Tinder
};

function getPaginationItems(current: number, total: number): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function ServicesCatalogPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceCatalogItem[]>(FALLBACK_SERVICES);
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price_asc" | "price_desc" | "name">("popular");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("All");
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(DEFAULT_COUNTRY);
  const [countryTab, setCountryTab] = useState<"all" | "popular">("all");
  const [isLoading, setIsLoading] = useState(false);
  const { exchangeRate, fetchExchangeRate } = useCurrencyStore();

  useEffect(() => {
    void fetchExchangeRate();
  }, [fetchExchangeRate]);

  useEffect(() => {
    let cancelled = false;
    async function loadServices() {
      try {
        setIsLoading(true);
        const countryId = selectedCountry?.id || "187";
        const res = await getServices(countryId);
        if (!cancelled && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const approved = res.data.filter((s) => isApprovedPopularService(s.serviceCode, s.name));
          setServices(approved.length > 0 ? approved : FALLBACK_SERVICES);
          setSelectedService((prev) => {
            if (!prev) return null;
            return approved.find((s) => s.serviceCode === prev.serviceCode) || prev;
          });
        }
      } catch {
        // Fallback already preloaded
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void loadServices();
    return () => {
      cancelled = true;
    };
  }, [selectedCountry?.id]);

  const quickServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      // Prioritize top popular apps first, then verified Logo.dev brands, placing monograms at the bottom
      return [...services].sort((a, b) => {
        const codeA = a.serviceCode.toLowerCase();
        const codeB = b.serviceCode.toLowerCase();
        const weightA = POPULAR_WEIGHTS[codeA] ?? (a.isPopular ? 50 : 999);
        const weightB = POPULAR_WEIGHTS[codeB] ?? (b.isPopular ? 50 : 999);
        if (weightA !== weightB) return weightA - weightB;

        // Verified Logo.dev brands before missing domain monograms
        const hasDomainA = Boolean(a.websiteDomain);
        const hasDomainB = Boolean(b.websiteDomain);
        if (hasDomainA !== hasDomainB) return hasDomainA ? -1 : 1;

        if ((b.count ?? 0) !== (a.count ?? 0)) return (b.count ?? 0) - (a.count ?? 0);
        return a.name.localeCompare(b.name);
      });
    }

    const matches = services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.serviceCode.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );

    return matches.sort((a, b) => {
      const codeA = a.serviceCode.toLowerCase();
      const codeB = b.serviceCode.toLowerCase();
      const weightA = POPULAR_WEIGHTS[codeA] ?? (a.isPopular ? 50 : 999);
      const weightB = POPULAR_WEIGHTS[codeB] ?? (b.isPopular ? 50 : 999);
      if (weightA !== weightB) return weightA - weightB;

      const hasDomainA = Boolean(a.websiteDomain);
      const hasDomainB = Boolean(b.websiteDomain);
      if (hasDomainA !== hasDomainB) return hasDomainA ? -1 : 1;

      return a.name.localeCompare(b.name);
    });
  }, [services, search]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.serviceCode.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "All"
          ? true
          : selectedCategory === "Popular"
          ? s.isPopular
          : s.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesQuery && matchesCat;
    });
  }, [services, search, selectedCategory]);

  const filteredCatalogServices = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    let list = services.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.serviceCode.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "All"
          ? true
          : selectedCategory === "Popular"
          ? s.isPopular
          : s.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesQuery && matchesCat;
    });

    if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => a.pricePkr - b.pricePkr);
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => b.pricePkr - a.pricePkr);
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => {
        const codeA = a.serviceCode.toLowerCase();
        const codeB = b.serviceCode.toLowerCase();
        const weightA = POPULAR_WEIGHTS[codeA] ?? (a.isPopular ? 50 : 999);
        const weightB = POPULAR_WEIGHTS[codeB] ?? (b.isPopular ? 50 : 999);

        if (weightA !== weightB) return weightA - weightB;
        if ((b.count ?? 0) !== (a.count ?? 0)) return (b.count ?? 0) - (a.count ?? 0);
        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [services, catalogSearch, selectedCategory, sortBy]);

  // ─── Asymmetrical Pagination: 8 items on Page 1, 15 items on Page 2+ ───
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [catalogSearch, selectedCategory, sortBy]);

  const totalCatalogItems = filteredCatalogServices.length;

  const totalCatalogPages = useMemo(() => {
    if (totalCatalogItems <= 8) return 1;
    return 1 + Math.ceil((totalCatalogItems - 8) / 15);
  }, [totalCatalogItems]);

  const paginatedCatalogServices = useMemo(() => {
    if (currentPage === 1) {
      return filteredCatalogServices.slice(0, 8);
    }
    const startIndex = 8 + (currentPage - 2) * 15;
    const endIndex = startIndex + 15;
    return filteredCatalogServices.slice(startIndex, endIndex);
  }, [filteredCatalogServices, currentPage]);

  const catalogRange = useMemo(() => {
    if (totalCatalogItems === 0) return { start: 0, end: 0 };
    if (currentPage === 1) {
      return { start: 1, end: Math.min(8, totalCatalogItems) };
    }
    const start = 8 + (currentPage - 2) * 15 + 1;
    const end = Math.min(start + 15 - 1, totalCatalogItems);
    return { start, end };
  }, [currentPage, totalCatalogItems]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalCatalogPages) return;
    setCurrentPage(newPage);
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return HEROSMS_COUNTRIES.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.id.includes(q);
      const matchesTab = countryTab === "all" || (countryTab === "popular" && c.isPopular);
      return matchesSearch && matchesTab;
    });
  }, [countrySearch, countryTab]);

  const handleProceedToGetNumber = () => {
    if (!selectedService || !selectedCountry) return;
    router.push(`/numbers?service=${encodeURIComponent(selectedService.serviceCode)}&country=${encodeURIComponent(selectedCountry.id)}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-4">
      {/* ─── Page Header / Mini Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Dedicated Multi-Country OTP Lines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Select Your Verification Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            First choose an app logo, then select your country to generate a dedicated virtual number.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{services.length}+ Services · 190+ Countries</span>
          </div>
        </div>
      </div>

      {/* ─── Confirmation & Get Number Action Bar (Moved to Top) ─── */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/90 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {selectedService && selectedCountry
                  ? "Ready to Allocate Dedicated Virtual Number"
                  : "Step-by-Step Verification Selection"}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 flex-wrap">
              {selectedService ? (
                <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                  {selectedService.name}
                </span>
              ) : (
                <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  ① Select an app logo below
                </span>
              )}

              <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

              {selectedCountry ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  <CountryFlag code={selectedCountry.code} name={selectedCountry.name} fallbackEmoji={selectedCountry.flag} size="xs" />
                  <span>{selectedCountry.name}</span>
                </span>
              ) : (
                <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  ② Select a country below
                </span>
              )}

              {selectedService && (() => {
                const dual = formatDualPrice(selectedService.pricePkr, exchangeRate, selectedService.costUsd);
                return (
                  <span className="font-extrabold text-slate-900 bg-white border border-slate-200/80 shadow-2xs px-2.5 py-1 rounded-lg ml-auto sm:ml-2 inline-flex items-baseline gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rate:</span>
                    <span className="text-sm font-black text-blue-700 tabular-nums">{dual.usd}</span>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">({dual.pkr})</span>
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              disabled={!selectedService || !selectedCountry}
              onClick={handleProceedToGetNumber}
              className={cn(
                "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold shadow-sm transition-all duration-150",
                selectedService && selectedCountry
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:shadow-md hover:shadow-amber-500/20 active:scale-95 cursor-pointer ring-1 ring-amber-400"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
              )}
            >
              <span>
                {selectedService && selectedCountry
                  ? `Get Number (${selectedService.name.split("/")[0].trim()} · ${selectedCountry.flag})`
                  : "Select Service & Country to Proceed"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Dual Step Selector (Step 1: Service + Step 2: Country) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ─── BOX 1 (Left): Step 1 — Select Service (Borderless Squircles) ─── */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-blue-600/30 bg-gradient-to-b from-[#1d4ed8] via-[#1e40af] to-[#1e3a8a] p-5 sm:p-6 text-white shadow-xl shadow-blue-950/20">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="relative z-10 space-y-3.5">
            {/* Header: Step 1 Badge + Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-700 font-black text-xs sm:text-sm shadow-sm">
                  1
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                    Select service
                  </h2>
                  <p className="text-[11px] text-blue-200/80">
                    {selectedService ? `Selected: ${selectedService.name}` : "Tap any brand icon below"}
                  </p>
                </div>
              </div>

              {selectedService ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
                  <Check className="h-3 w-3" />
                  <span>{selectedService.name.split("/")[0].trim()}</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-blue-200 bg-blue-950/40 border border-blue-400/25 px-2 py-0.5 rounded-full">
                  Step 1 of 2
                </span>
              )}
            </div>

            {/* Integrated Search Input inside Box 1 */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search app logo..."
                className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Clear service search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Clean Logo Grid: No Outlines / Borders by Default */}
            <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-2 pt-1 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-400/30 scrollbar-track-transparent">
              {quickServices.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-blue-200">
                  <p>No app found for &quot;{search}&quot;</p>
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 inline-block rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/30"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                quickServices.map((item) => {
                  const isSelected = selectedService?.serviceCode === item.serviceCode;
                  const itemDual = formatDualPrice(item.pricePkr, exchangeRate, item.costUsd);

                  return (
                    <button
                      key={`quick-${item.serviceCode}`}
                      onClick={() => setSelectedService(item)}
                      title={`${item.name} • ${itemDual.usd} (${itemDual.pkr})`}
                      className={cn(
                        "group relative flex items-center justify-center p-1 rounded-2xl transition-all duration-150 active:scale-90 focus:outline-none border-0 bg-transparent cursor-pointer",
                        isSelected
                          ? "scale-110"
                          : "hover:scale-115 opacity-90 hover:opacity-100"
                      )}
                    >
                      <ServiceBrandIcon
                        serviceCode={item.serviceCode}
                        name={item.name}
                        size={38}
                        websiteDomain={item.websiteDomain}
                        className={cn(
                          "transition-transform duration-150 drop-shadow-md",
                          isSelected && "ring-3 ring-amber-400 shadow-lg shadow-amber-400/50 scale-105"
                        )}
                      />
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-md">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Support Link */}
            <div className="pt-2 text-center border-t border-white/10">
              <p className="text-[11px] font-medium text-blue-100/90">
                Didn&apos;t find your app?{" "}
                <a
                  href="https://wa.me/923230490710?text=Hi%2C%20I%20need%20a%20verification%20service%20not%20listed%20on%20USNumHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 transition-colors"
                >
                  Write to support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ─── BOX 2 (Right): Step 2 — Select Country ─── */}
        <div id="step-2-country-box" className="relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-blue-600/30 bg-gradient-to-b from-[#1d4ed8] via-[#1e40af] to-[#1e3a8a] p-5 sm:p-6 text-white shadow-xl shadow-blue-950/20">
          <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="relative z-10 space-y-3.5">
            {/* Header: Step 2 Badge + Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-700 font-black text-xs sm:text-sm shadow-sm">
                  2
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                    Select country
                  </h2>
                  <p className="text-[11px] text-blue-200/80">
                    {selectedCountry ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                        <span>Selected:</span>
                        <CountryFlag code={selectedCountry.code} name={selectedCountry.name} fallbackEmoji={selectedCountry.flag} size="xs" />
                        <span>{selectedCountry.name}</span>
                      </span>
                    ) : (
                      "Pick country line for OTP"
                    )}
                  </p>
                </div>
              </div>

              {selectedCountry ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
                  <CountryFlag code={selectedCountry.code} name={selectedCountry.name} fallbackEmoji={selectedCountry.flag} size="xs" />
                  <span>{selectedCountry.code}</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-blue-200 bg-blue-950/40 border border-blue-400/25 px-2 py-0.5 rounded-full">
                  Step 2 of 2
                </span>
              )}
            </div>

            {/* Integrated Search Input inside Box 2 */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country (USA, UK, Canada, Netherlands)..."
                className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {countrySearch && (
                <button
                  onClick={() => setCountrySearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Clear country search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Quick Country Category Pills & Top Flag Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setCountryTab("popular")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-semibold transition-all text-xs border-0",
                    countryTab === "popular"
                      ? "bg-white text-blue-900 shadow-xs"
                      : "bg-white/10 text-blue-100 hover:bg-white/20"
                  )}
                >
                  ⭐ Popular Countries
                </button>
                <button
                  onClick={() => setCountryTab("all")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-semibold transition-all text-xs border-0",
                    countryTab === "all"
                      ? "bg-white text-blue-900 shadow-xs"
                      : "bg-white/10 text-blue-100 hover:bg-white/20"
                  )}
                >
                  🌐 All ({HEROSMS_COUNTRIES.length}+)
                </button>
              </div>

              {/* Quick 1-Tap Top Flag Shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {[
                  { id: "187", code: "US", label: "USA" },
                  { id: "16", code: "GB", label: "UK" },
                  { id: "36", code: "CA", label: "Canada" },
                  { id: "48", code: "NL", label: "Netherlands" },
                  { id: "43", code: "DE", label: "Germany" },
                  { id: "66", code: "PK", label: "Pakistan" },
                  { id: "22", code: "IN", label: "India" },
                  { id: "62", code: "TR", label: "Turkey" },
                ].map((top) => {
                  const isSelected = selectedCountry?.id === top.id;
                  return (
                    <button
                      key={`quick-${top.id}`}
                      onClick={() => {
                        const found = HEROSMS_COUNTRIES.find((c) => c.id === top.id);
                        if (found) setSelectedCountry(found);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all border-0 shrink-0",
                        isSelected
                          ? "bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-300"
                          : "bg-white/15 text-white hover:bg-white/25"
                      )}
                      title={`Select ${top.label}`}
                    >
                      <CountryFlag code={top.code} size="xs" />
                      <span>{top.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Country List: 2 Columns for Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-400/30 scrollbar-track-transparent">
              {filteredCountries.map((c) => {
                const isSelected = selectedCountry?.id === c.id;
                return (
                  <button
                    key={`country-${c.id}`}
                    onClick={() => setSelectedCountry(c)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all border-0 active:scale-98 focus:outline-none",
                      isSelected
                        ? "bg-white/35 ring-2 ring-amber-400 text-white font-bold shadow-md shadow-amber-400/20"
                        : "bg-white/10 hover:bg-white/20 text-blue-50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CountryFlag
                        code={c.code}
                        name={c.name}
                        fallbackEmoji={c.flag}
                        size="md"
                        className="shrink-0 rounded-[2px]"
                      />
                      <span className="truncate text-xs font-medium">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className="text-[10px] opacity-70 font-mono">#{c.id}</span>
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                          isSelected
                            ? "border-amber-400 bg-amber-400 text-slate-950"
                            : "border-white/30 bg-transparent"
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Country Footer Info */}
            <div className="pt-2 text-center border-t border-white/10">
              <p className="text-[11px] font-medium text-blue-100/90">
                Auto-assigned dedicated mobile lines with instant SMS ingestion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Full Service Catalog & Pricing Section with Dedicated Search & Sort ─── */}
      <div id="catalog-section" className="space-y-4 pt-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              All Available Verification Services
            </h3>
            <p className="text-xs text-slate-500">
              Transparent PKR pricing with live carrier API routing across 190+ countries
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0 flex-wrap">
            <span>Showing:</span>
            <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-bold text-blue-700">
              {totalCatalogItems === 0
                ? "0 Services"
                : `${catalogRange.start}–${catalogRange.end} of ${totalCatalogItems} Services`}
            </span>
            {totalCatalogPages > 1 && (
              <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                Page {currentPage}/{totalCatalogPages}
              </span>
            )}
          </div>
        </div>

        {/* Dedicated Catalog Search Bar & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search services by name or code (e.g. WhatsApp, Telegram, OpenAI, Google)..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {catalogSearch && (
              <button
                onClick={() => setCatalogSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
                aria-label="Clear catalog search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              <option value="popular">🔥 Popular First</option>
              <option value="price_asc">💰 Price: Low to High</option>
              <option value="price_desc">🏷️ Price: High to Low</option>
              <option value="name">🔤 Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Modern Compact Services Grid (Country-Connected) ─── */}
      {filteredCatalogServices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No matching services</h3>
          <p className="mt-1 text-sm text-slate-500">
            No platform found for &quot;{catalogSearch || search}&quot;. You can use &quot;Any Other Service&quot; for generic verification.
          </p>
          <button
            onClick={() => {
              setCatalogSearch("");
              setSearch("");
              setSelectedCategory("All");
            }}
            className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Reset Search &amp; Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedCatalogServices.map((service) => {
            const isSelected = selectedService?.serviceCode === service.serviceCode;

            return (
              <div
                key={service.serviceCode}
                onClick={() => {
                  setSelectedService(service);
                  if (selectedCountry) {
                    router.push(
                      `/numbers?service=${encodeURIComponent(service.serviceCode)}&country=${encodeURIComponent(selectedCountry.id)}`
                    );
                  } else {
                    const countryBox = document.getElementById("step-2-country-box");
                    if (countryBox) {
                      countryBox.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }
                }}
                className={cn(
                  "group relative flex cursor-pointer flex-col justify-between rounded-xl border bg-white p-3.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.99]",
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20"
                    : "border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10"
                )}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center group-hover:scale-105 transition-transform">
                      <ServiceBrandIcon
                        serviceCode={service.serviceCode}
                        name={service.name}
                        size={36}
                        websiteDomain={service.websiteDomain}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h4>
                        {service.isPopular && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-600 border border-rose-200">
                            <Zap className="h-2.5 w-2.5 fill-rose-600 text-rose-600" />
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-[11px] text-slate-500">{service.category}</p>
                        {typeof service.count === "number" && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                            {service.count.toLocaleString()} lines
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const dual = formatDualPrice(service.pricePkr, exchangeRate, service.costUsd);
                    return (
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-blue-700 tabular-nums leading-tight">
                          {dual.usd}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 tabular-nums leading-tight">
                          {dual.pkr}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5">per OTP</div>
                      </div>
                    );
                  })()}
                </div>

                {/* Country Routing Status & Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {selectedCountry ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md truncate">
                      <CountryFlag code={selectedCountry.code} name={selectedCountry.name} fallbackEmoji={selectedCountry.flag} size="xs" />
                      <span className="truncate">{selectedCountry.name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span>190+ Countries</span>
                    </span>
                  )}

                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors shrink-0">
                    <span>{selectedCountry ? "Get Number" : "Select"}</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modern Responsive Pagination Controls (8 on Page 1, 15 on Page 2+) ─── */}
      {totalCatalogPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 text-center sm:text-left">
            Showing <span className="font-extrabold text-slate-900">{catalogRange.start}</span>–
            <span className="font-extrabold text-slate-900">{catalogRange.end}</span> of{" "}
            <span className="font-extrabold text-slate-900">{totalCatalogItems}</span> services
            <span className="mx-1.5 text-slate-300">|</span>
            Page <span className="font-extrabold text-blue-600">{currentPage}</span> of{" "}
            <span className="font-extrabold text-slate-900">{totalCatalogPages}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous Page Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed bg-slate-50 border border-slate-100"
                  : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs cursor-pointer active:scale-95"
              )}
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>

            {/* Page Numbers with Smart Ellipsis */}
            {getPaginationItems(currentPage, totalCatalogPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-6 items-center justify-center text-xs font-bold text-slate-400 select-none"
                  >
                    …
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    "h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 border border-blue-600"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs active:scale-95"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalCatalogPages}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                currentPage === totalCatalogPages
                  ? "text-slate-300 cursor-not-allowed bg-slate-50 border border-slate-100"
                  : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs cursor-pointer active:scale-95"
              )}
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
