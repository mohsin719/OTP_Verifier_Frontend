"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Save,
  Trash2,
  Plus,
  RefreshCw,
  Zap,
  Power,
  DollarSign,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Globe,
  Percent,
  SlidersHorizontal,
  Calculator,
  TrendingUp,
  Sparkles,
  Filter,
  Check,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  type ServiceCatalogItem,
  FALLBACK_SERVICES,
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/lib/services";
import {
  useCurrencyStore,
  pkrToUsd,
  usdToPkr,
} from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ServiceBrandIcon } from "@/components/services/service-brand-icon";

export interface AdminServiceItem extends ServiceCatalogItem {
  heroCostUsd?: number;
  heroCostPkr?: number;
  marginPkr?: number;
  marginPercent?: number;
  priceUsd?: number;
  editedPricePkr?: string;
  editedDomain?: string;
  isSaving?: boolean;
  isDeleting?: boolean;
  isDirty?: boolean;
}

export type MarginRule = {
  marginType: "PERCENT" | "FIXED_PKR" | "FIXED_USD";
  marginValue: number;
};

export default function AdminServicesPage() {
  const { token } = useAuthStore();
  const { exchangeRate, setExchangeRate, fetchExchangeRate } = useCurrencyStore();

  const [services, setServices] = useState<AdminServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory>("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"popular" | "name" | "priceAsc" | "priceDesc" | "marginDesc">("popular");

  // Margin Rule state
  const [marginRule, setMarginRule] = useState<MarginRule>({
    marginType: "PERCENT",
    marginValue: 20,
  });
  const [marginScope, setMarginScope] = useState<string>("All");
  const [applyingMargin, setApplyingMargin] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Exchange Rate State
  const [editingRate, setEditingRate] = useState<string>(String(exchangeRate));
  const [savingRate, setSavingRate] = useState(false);

  // Add New Service Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newCategory, setNewCategory] = useState("Popular");
  const [newPricePkr, setNewPricePkr] = useState("50");
  const [newPriceUsd, setNewPriceUsd] = useState(pkrToUsd(50, exchangeRate).toFixed(2));
  const [newIsPopular, setNewIsPopular] = useState(false);
  const [newIsActive, setNewIsActive] = useState(true);

  // Sync editingRate when store rate updates
  useEffect(() => {
    setEditingRate(String(exchangeRate));
  }, [exchangeRate]);

  // Fetch Services & Live HeroSMS prices from backend
  const fetchServices = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        services: AdminServiceItem[];
        marginRule?: MarginRule;
        exchangeRate?: number;
      }>("/api/manage/services", {
        accessToken: token,
        disableDedupe: true,
        cacheTtlMs: 0,
      });

      if (res.success && res.data) {
        let rawList: AdminServiceItem[] = [];
        let rule: MarginRule | undefined = undefined;
        let rate: number | undefined = undefined;

        if (Array.isArray(res.data)) {
          rawList = res.data;
          rule = (res as any).marginRule;
          rate = (res as any).exchangeRate;
        } else if (typeof res.data === "object" && res.data !== null) {
          const payload = res.data as {
            services?: AdminServiceItem[];
            marginRule?: MarginRule;
            exchangeRate?: number;
          };
          rawList = Array.isArray(payload.services) ? payload.services : [];
          rule = payload.marginRule ?? (res as any).marginRule;
          rate = payload.exchangeRate ?? (res as any).exchangeRate;
        }

        if (rule) {
          setMarginRule(rule);
        }
        if (rate && rate > 0) {
          setExchangeRate(rate);
          setEditingRate(String(rate));
        }

        const currentRate = rate || exchangeRate || 280;

        setServices(
          rawList.map((s) => {
            const heroUsd = s.heroCostUsd ?? 0.072;
            const heroPkr = s.heroCostPkr ?? Math.max(1, Math.round(heroUsd * currentRate));
            const pricePkr = s.pricePkr ?? Math.max(1, Math.round(heroPkr * 1.2));
            const marginPkr = pricePkr - heroPkr;
            const marginPercent =
              heroPkr > 0 ? Number((((pricePkr - heroPkr) / heroPkr) * 100).toFixed(1)) : 0;
            const priceUsd = Number((pricePkr / currentRate).toFixed(3));

            return {
              ...s,
              heroCostUsd: heroUsd,
              heroCostPkr: heroPkr,
              marginPkr,
              marginPercent,
              priceUsd,
              editedPricePkr: String(pricePkr),
              editedDomain: s.websiteDomain ?? undefined,
              isDirty: false,
            };
          })
        );
      } else {
        // Fallback
        setServices(
          FALLBACK_SERVICES.map((s) => {
            const heroUsd = 0.072;
            const heroPkr = Math.round(heroUsd * exchangeRate);
            const marginPkr = s.pricePkr - heroPkr;
            const marginPercent =
              heroPkr > 0 ? Number((((s.pricePkr - heroPkr) / heroPkr) * 100).toFixed(1)) : 0;
            return {
              ...s,
              heroCostUsd: heroUsd,
              heroCostPkr: heroPkr,
              marginPkr,
              marginPercent,
              priceUsd: Number((s.pricePkr / exchangeRate).toFixed(3)),
              editedPricePkr: String(s.pricePkr),
              isDirty: false,
            };
          })
        );
      }
    } catch {
      toast.error("Failed to load live services & pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchServices();
  }, [token]);

  // Save Exchange Rate
  const handleSaveExchangeRate = async () => {
    if (!token) return;
    const rateNum = parseFloat(editingRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Please enter a valid positive exchange rate (PKR per USD)");
      return;
    }

    setSavingRate(true);
    try {
      const res = await apiFetch<{ exchangeRate: number }>(
        "/api/manage/pricing/exchange-rate",
        {
          method: "PUT",
          accessToken: token,
          body: JSON.stringify({ exchangeRate: rateNum }),
        }
      );

      if (!res.success) {
        toast.error(res.error || "Failed to save exchange rate");
        return;
      }

      setExchangeRate(res.data.exchangeRate);
      setEditingRate(String(res.data.exchangeRate));

      setServices((prev) =>
        prev.map((s) => {
          const heroPkr = Math.max(1, Math.round((s.heroCostUsd ?? 0.072) * res.data.exchangeRate));
          const currentPkr = parseInt(s.editedPricePkr ?? String(s.pricePkr), 10) || s.pricePkr;
          const usd = currentPkr / res.data.exchangeRate;
          const marginPkr = currentPkr - heroPkr;
          const marginPercent =
            heroPkr > 0 ? Number((((currentPkr - heroPkr) / heroPkr) * 100).toFixed(1)) : 0;

          return {
            ...s,
            heroCostPkr: heroPkr,
            marginPkr,
            marginPercent,
            priceUsd: Number(usd.toFixed(3)),
          };
        })
      );
      toast.success(`Exchange rate updated! 1 USD = ${res.data.exchangeRate} PKR`);
    } catch {
      toast.error("Error updating exchange rate");
    } finally {
      setSavingRate(false);
    }
  };

  // Handle single row price change with live margin recalculation
  const handlePricePkrChange = (code: string, pkrStr: string) => {
    const pkrNum = parseFloat(pkrStr);
    const validPkr = !isNaN(pkrNum) && pkrNum > 0 ? Math.round(pkrNum) : 0;

    setServices((prev) =>
      prev.map((s) => {
        if (s.serviceCode !== code) return s;
        const heroPkr = s.heroCostPkr || Math.round((s.heroCostUsd || 0.072) * exchangeRate);
        const marginPkr = validPkr > 0 ? validPkr - heroPkr : 0;
        const marginPercent =
          heroPkr > 0 && validPkr > 0
            ? Number((((validPkr - heroPkr) / heroPkr) * 100).toFixed(1))
            : 0;
        const priceUsd = validPkr > 0 ? Number((validPkr / exchangeRate).toFixed(3)) : 0;

        return {
          ...s,
          editedPricePkr: pkrStr,
          pricePkr: validPkr > 0 ? validPkr : s.pricePkr,
          priceUsd,
          marginPkr,
          marginPercent,
          isDirty: true,
        };
      })
    );
  };

  // Quick Margin Preset for a single row
  const applyQuickMarginPreset = (code: string, percent: number) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.serviceCode !== code) return s;
        const heroPkr = s.heroCostPkr || Math.round((s.heroCostUsd || 0.072) * exchangeRate);
        const newPkr = Math.max(1, Math.round(heroPkr * (1 + percent / 100)));
        const marginPkr = newPkr - heroPkr;
        const priceUsd = Number((newPkr / exchangeRate).toFixed(3));

        return {
          ...s,
          pricePkr: newPkr,
          editedPricePkr: String(newPkr),
          priceUsd,
          marginPkr,
          marginPercent: percent,
          isDirty: true,
        };
      })
    );
  };

  // Preview Margin Formula in Table
  const handlePreviewFormula = () => {
    const val = marginRule.marginValue;
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative margin number");
      return;
    }

    setServices((prev) =>
      prev.map((s) => {
        if (marginScope !== "All" && s.category.toLowerCase() !== marginScope.toLowerCase()) {
          return s;
        }

        const heroUsd = s.heroCostUsd ?? 0.072;
        const heroPkr = s.heroCostPkr ?? Math.max(1, Math.round(heroUsd * exchangeRate));

        let newPkr: number;
        if (marginRule.marginType === "PERCENT") {
          newPkr = Math.max(1, Math.round(heroPkr * (1 + val / 100)));
        } else if (marginRule.marginType === "FIXED_PKR") {
          newPkr = Math.max(1, heroPkr + Math.round(val));
        } else {
          newPkr = Math.max(1, Math.round((heroUsd + val) * exchangeRate));
        }

        const marginPkr = newPkr - heroPkr;
        const marginPercent =
          heroPkr > 0 ? Number((((newPkr - heroPkr) / heroPkr) * 100).toFixed(1)) : 0;
        const priceUsd = Number((newPkr / exchangeRate).toFixed(3));

        return {
          ...s,
          pricePkr: newPkr,
          editedPricePkr: String(newPkr),
          priceUsd,
          marginPkr,
          marginPercent,
          isDirty: true,
        };
      })
    );

    toast.info("Formula preview calculated! Click 'Save All Changes' to apply to database.");
  };

  // Apply Margin Formula and Save to Server
  const handleApplyAndSaveMargin = async () => {
    if (!token) return;
    const val = marginRule.marginValue;
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid margin value");
      return;
    }

    setApplyingMargin(true);
    try {
      const res = await apiFetch<{
        services: AdminServiceItem[];
        marginRule?: MarginRule;
        exchangeRate?: number;
      }>("/api/manage/pricing/apply-margin", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          marginType: marginRule.marginType,
          marginValue: val,
          category: marginScope,
        }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to apply margin formula");
        return;
      }

      toast.success(
        `Applied margin formula (${marginRule.marginType === "PERCENT" ? `+${val}%` : `+${val}`}) across ${
          marginScope === "All" ? "all services" : `${marginScope} services`
        }!`
      );
      void fetchServices();
    } catch {
      toast.error("Network error applying margin");
    } finally {
      setApplyingMargin(false);
    }
  };

  // Save single row
  const handleSaveRow = async (service: AdminServiceItem) => {
    if (!token) return;
    const priceNum = parseInt(service.editedPricePkr ?? String(service.pricePkr), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid positive price in PKR");
      return;
    }

    setServices((prev) =>
      prev.map((s) =>
        s.serviceCode === service.serviceCode ? { ...s, isSaving: true } : s
      )
    );

    try {
      const res = await apiFetch(`/api/manage/services/${service.serviceCode}`, {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({
          pricePkr: priceNum,
          websiteDomain: service.editedDomain,
        }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save service");
        setServices((prev) =>
          prev.map((s) =>
            s.serviceCode === service.serviceCode ? { ...s, isSaving: false } : s
          )
        );
        return;
      }

      toast.success(
        `Saved ${service.name}: Rs ${priceNum} ($${(priceNum / exchangeRate).toFixed(2)})`
      );
      setServices((prev) =>
        prev.map((s) =>
          s.serviceCode === service.serviceCode
            ? {
                ...s,
                pricePkr: priceNum,
                editedPricePkr: String(priceNum),
                isSaving: false,
                isDirty: false,
              }
            : s
        )
      );
    } catch {
      toast.error("Error saving service");
      setServices((prev) =>
        prev.map((s) =>
          s.serviceCode === service.serviceCode ? { ...s, isSaving: false } : s
        )
      );
    }
  };

  // Save all modified rows in bulk
  const handleSaveAllDirty = async () => {
    if (!token) return;
    const dirtyRows = services.filter((s) => s.isDirty);
    if (dirtyRows.length === 0) return;

    setBulkSaving(true);
    try {
      const payload = dirtyRows.map((s) => ({
        serviceCode: s.serviceCode,
        pricePkr: parseInt(s.editedPricePkr ?? String(s.pricePkr), 10) || s.pricePkr,
        isActive: s.isActive,
        websiteDomain: s.editedDomain ?? s.websiteDomain,
      }));

      const res = await apiFetch("/api/manage/pricing/bulk-update", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ services: payload }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to bulk save services");
        return;
      }

      toast.success(`Saved all changes for ${dirtyRows.length} services!`);
      void fetchServices();
    } catch {
      toast.error("Network error during bulk save");
    } finally {
      setBulkSaving(false);
    }
  };

  // Toggle active
  const handleToggleActive = async (service: AdminServiceItem) => {
    if (!token) return;
    const newActive = !service.isActive;

    setServices((prev) =>
      prev.map((s) =>
        s.serviceCode === service.serviceCode ? { ...s, isActive: newActive } : s
      )
    );

    try {
      const res = await apiFetch(`/api/manage/services/${service.serviceCode}`, {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.success) {
        toast.error(res.error || "Failed to update status");
        setServices((prev) =>
          prev.map((s) =>
            s.serviceCode === service.serviceCode ? { ...s, isActive: !newActive } : s
          )
        );
      } else {
        toast.success(`${service.name} is now ${newActive ? "Active" : "Disabled"}`);
      }
    } catch {
      toast.error("Network error updating status");
    }
  };

  // Add Custom Service modal submission
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const trimmedCode = newCode.trim().toLowerCase();
    const trimmedName = newName.trim();
    const pkrNum = parseInt(newPricePkr, 10);

    if (!trimmedCode) {
      toast.error("Please enter a service code (e.g. wa, tg)");
      return;
    }
    if (!trimmedName) {
      toast.error("Please enter a display name");
      return;
    }
    if (isNaN(pkrNum) || pkrNum <= 0) {
      toast.error("Please enter a valid price in PKR");
      return;
    }

    setAddingService(true);
    try {
      const res = await apiFetch<ServiceCatalogItem>("/api/manage/services", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          serviceCode: trimmedCode,
          name: trimmedName,
          category: newCategory,
          pricePkr: pkrNum,
          isPopular: newIsPopular,
          isActive: newIsActive,
          websiteDomain: newDomain.trim() || undefined,
        }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create service");
        return;
      }

      toast.success(`Service "${trimmedName}" created successfully!`);
      setShowAddModal(false);
      setNewCode("");
      setNewName("");
      setNewDomain("");
      setNewPricePkr("50");
      setNewPriceUsd(pkrToUsd(50, exchangeRate).toFixed(2));
      setNewIsPopular(false);
      setNewIsActive(true);

      void fetchServices();
    } catch {
      toast.error("Network error creating service");
    } finally {
      setAddingService(false);
    }
  };

  // Filter & Sort Logic
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        if (categoryFilter !== "All" && s.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
        if (statusFilter === "active" && !s.isActive) return false;
        if (statusFilter === "inactive" && s.isActive) return false;

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchCode = s.serviceCode.toLowerCase().includes(q);
          const matchDomain = (s.websiteDomain || "").toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchDomain) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "popular") {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "priceAsc") return a.pricePkr - b.pricePkr;
        if (sortBy === "priceDesc") return b.pricePkr - a.pricePkr;
        if (sortBy === "marginDesc") return (b.marginPercent ?? 0) - (a.marginPercent ?? 0);
        return 0;
      });
  }, [services, categoryFilter, statusFilter, search, sortBy]);

  const dirtyCount = useMemo(() => services.filter((s) => s.isDirty).length, [services]);
  const activeCount = useMemo(() => services.filter((s) => s.isActive).length, [services]);

  return (
    <div className="space-y-6 pb-24">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Services &amp; Pricing Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Live Carrier Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Oversee carrier wholesale costs, formulate profit margins, and update live customer prices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchServices()}
            disabled={loading}
            className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs h-10 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin text-blue-600")} />
            Sync Rates
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Custom Service
          </Button>
        </div>
      </div>

      {/* ─── Clean 3 Summary Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Services</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{services.length}</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activeCount} Active Services
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Profit Margin</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                +{marginRule.marginValue}{marginRule.marginType === "PERCENT" ? "%" : " Rs"}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Added on carrier wholesale cost
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">USD Exchange Rate</p>
            <span className="text-[10px] font-bold text-slate-400 font-mono">1 USD = PKR</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                type="number"
                value={editingRate}
                onChange={(e) => setEditingRate(e.target.value)}
                className="h-9 text-sm font-bold bg-slate-50 rounded-xl"
                placeholder="280"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSaveExchangeRate()}
              disabled={savingRate || editingRate === String(exchangeRate)}
              className="h-9 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
            >
              {savingRate ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── PROFIT MARGIN FORMULATION ENGINE (High Contrast & Clear) ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-1">
              <Calculator className="h-3 w-3" />
              Automated Pricing Formula
            </div>
            <h2 className="text-lg font-black text-white">
              Formula: Carrier Base Cost + Profit Margin = Selling Price
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Aap jo bhi margin yahan set karenge, wo carrier base rate me add ho kar tamam services ki new price ban jayegi. User ke wallet se wahi selling price cut hogi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-1">
          {/* 1. Margin Type */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-200">Margin Type</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMarginRule({ ...marginRule, marginType: "PERCENT" })}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer",
                  marginRule.marginType === "PERCENT"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                )}
              >
                % Percentage
              </button>
              <button
                type="button"
                onClick={() => setMarginRule({ ...marginRule, marginType: "FIXED_PKR" })}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer",
                  marginRule.marginType === "FIXED_PKR"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                )}
              >
                Fixed Rs
              </button>
            </div>
          </div>

          {/* 2. Margin Value */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-200">
              Profit Value {marginRule.marginType === "PERCENT" ? "(e.g. 20%)" : "(e.g. Rs 10)"}
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                value={marginRule.marginValue}
                onChange={(e) =>
                  setMarginRule({
                    ...marginRule,
                    marginValue: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-10 text-sm font-bold bg-slate-800 border-slate-700 text-white placeholder-slate-400 rounded-xl focus:border-blue-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">
                {marginRule.marginType === "PERCENT" ? "%" : "PKR"}
              </span>
            </div>
          </div>

          {/* 3. Scope */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-200">Apply To</label>
            <select
              value={marginScope}
              onChange={(e) => setMarginScope(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Services (Entire Catalog)</option>
              <option value="Popular">Popular Apps Only</option>
              <option value="Social">Social &amp; Messaging</option>
              <option value="Tech">Tech &amp; AI</option>
              <option value="Finance">Finance</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {/* 4. Action Button */}
          <div className="md:col-span-3">
            <Button
              type="button"
              onClick={() => void handleApplyAndSaveMargin()}
              disabled={applyingMargin}
              className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              {applyingMargin ? (
                "Applying to all..."
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Apply Margin to Services
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Example Formula Note */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded text-[11px]">
              Example
            </span>
            <span>
              Agar carrier rate <strong className="text-white font-mono">Rs 20</strong> hai aur margin{" "}
              <strong className="text-white font-mono">
                {marginRule.marginType === "PERCENT" ? `+${marginRule.marginValue}%` : `+Rs ${marginRule.marginValue}`}
              </strong>{" "}
              hai, toh Customer Price hogi:{" "}
              <strong className="text-emerald-400 font-mono text-sm">
                Rs{" "}
                {marginRule.marginType === "PERCENT"
                  ? Math.round(20 * (1 + marginRule.marginValue / 100))
                  : 20 + Math.round(marginRule.marginValue)}
              </strong>{" "}
              (Aapka profit:{" "}
              <strong className="text-emerald-300 font-mono">
                Rs{" "}
                {marginRule.marginType === "PERCENT"
                  ? Math.round(20 * (marginRule.marginValue / 100))
                  : Math.round(marginRule.marginValue)}
              </strong>
              )
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Directly deducted from user balance
          </span>
        </div>
      </div>

      {/* ─── Search, Filter & Sort Controls ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by app name, code (e.g. wa, tg, lf), or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-slate-200 bg-white shadow-2xs text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Disabled Only</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Sort: Popular &amp; Top Apps</option>
              <option value="name">Sort: App Name (A-Z)</option>
              <option value="priceAsc">Sort: Price (Lowest First)</option>
              <option value="priceDesc">Sort: Price (Highest First)</option>
              <option value="marginDesc">Sort: Highest Margin %</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SERVICE_CATEGORIES.map((cat) => {
            const count = services.filter((s) => cat === "All" || s.category.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span>{cat}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SERVICES & PRICING TABLE ─── */}
      <Card className="border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Service &amp; App</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-4 text-right">Carrier Cost</th>
                <th className="py-3.5 px-4 text-center">Your Profit</th>
                <th className="py-3.5 px-4 text-right">Selling Price (User Pays)</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold text-xs">Fetching live carrier prices &amp; catalog...</p>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm text-slate-700">No services found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filters.</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => {
                  const heroUsd = svc.heroCostUsd ?? 0.072;
                  const heroPkr = svc.heroCostPkr ?? Math.round(heroUsd * exchangeRate);
                  const currentSellingPkr = parseInt(svc.editedPricePkr ?? String(svc.pricePkr), 10) || svc.pricePkr;
                  const marginPkr = currentSellingPkr - heroPkr;
                  const marginPercent =
                    heroPkr > 0 ? Number((((currentSellingPkr - heroPkr) / heroPkr) * 100).toFixed(1)) : 0;
                  const isProfitable = marginPkr >= 0;

                  return (
                    <tr
                      key={svc.serviceCode}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors",
                        svc.isDirty && "bg-amber-50/30"
                      )}
                    >
                      {/* 1. App Info & Logo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ServiceBrandIcon
                            serviceCode={svc.serviceCode}
                            websiteDomain={svc.websiteDomain}
                            size={34}
                            className="shrink-0 rounded-xl shadow-2xs"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm truncate">
                                {svc.name}
                              </span>
                              {svc.isPopular && (
                                <span className="rounded bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 uppercase">
                                  Top
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span className="font-black text-blue-600 uppercase bg-blue-50 px-1 rounded">
                                {svc.serviceCode}
                              </span>
                              {svc.websiteDomain && (
                                <span className="truncate text-slate-500">
                                  {svc.websiteDomain}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {svc.category}
                        </span>
                      </td>

                      {/* 3. HeroSMS Base Cost */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono">
                          <div className="font-extrabold text-slate-900 text-xs">
                            Rs {heroPkr}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400">
                            ${heroUsd.toFixed(3)} USD
                          </div>
                        </div>
                      </td>

                      {/* 4. Margin / Profit */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono border",
                            isProfitable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}
                        >
                          {marginPkr >= 0 ? `+Rs ${marginPkr}` : `-Rs ${Math.abs(marginPkr)}`}
                          <span className="text-[10px] font-semibold text-slate-500">
                            ({marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`})
                          </span>
                        </span>
                      </td>

                      {/* 5. Selling Price (Customer Pays) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <div className="relative flex items-center w-28">
                            <span className="pointer-events-none absolute left-2 text-xs font-bold text-slate-400">
                              Rs
                            </span>
                            <Input
                              type="number"
                              min="1"
                              value={svc.editedPricePkr ?? String(svc.pricePkr)}
                              onChange={(e) => handlePricePkrChange(svc.serviceCode, e.target.value)}
                              className={cn(
                                "h-8 pl-7 pr-2 text-right text-xs font-black rounded-lg border-slate-200 shadow-2xs",
                                svc.isDirty
                                  ? "border-amber-400 bg-amber-50/70 focus:border-amber-600"
                                  : "bg-white hover:border-slate-300 focus:border-blue-600"
                              )}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 6. Active Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(svc)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                            svc.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          <Power className="h-3 w-3" />
                          <span>{svc.isActive ? "Active" : "Off"}</span>
                        </button>
                      </td>

                      {/* 7. Save Action */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={svc.isDirty ? "default" : "outline"}
                          onClick={() => void handleSaveRow(svc)}
                          disabled={svc.isSaving}
                          className={cn(
                            "h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            svc.isDirty
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                              : "border-slate-200 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {svc.isSaving ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : svc.isDirty ? (
                            <>
                              <Save className="h-3.5 w-3.5 mr-1" />
                              Save
                            </>
                          ) : (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Floating Bar for Batch Price Changes ─── */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-xl z-50 px-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-bold truncate">
                  {dirtyCount} service{dirtyCount > 1 ? "s" : ""} modified
                </p>
                <p className="text-[11px] text-slate-400">
                  Click save to persist updated selling prices to the database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void fetchServices()}
                className="text-slate-400 hover:text-white text-xs font-semibold h-9 cursor-pointer"
              >
                Discard
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveAllDirty()}
                disabled={bulkSaving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer"
              >
                {bulkSaving ? "Saving…" : "Save All Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Custom Service Dialog ─── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Add Custom Service
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a new verification platform with customized pricing and domain.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Service Code (Carrier ID)</label>
              <Input
                placeholder="e.g. wa, tg, fb"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Display Name</label>
              <Input
                placeholder="e.g. WhatsApp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Website Domain (for Logo)</label>
              <Input
                placeholder="e.g. whatsapp.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
                >
                  {SERVICE_CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Selling Price (PKR)</label>
                <Input
                  type="number"
                  min="1"
                  value={newPricePkr}
                  onChange={(e) => {
                    setNewPricePkr(e.target.value);
                    const p = parseFloat(e.target.value);
                    setNewPriceUsd(p > 0 ? (p / exchangeRate).toFixed(2) : "0.00");
                  }}
                  required
                  className="rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addingService}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                {addingService ? "Creating…" : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
