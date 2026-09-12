"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Coins,
  Building2,
  Globe2,
  Power,
  ShieldCheck,
  Loader2,
  HelpCircle,
  Copy,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { PaymentMethodIcon } from "@/components/payment/payment-icons";
import {
  getCachedPaymentMethods,
  DEFAULT_DYNAMIC_PAYMENT_METHODS,
  PaymentMethodConfig,
} from "@/lib/payment-methods";

export interface AdminPaymentMethod {
  id: string;
  code: string;
  name: string;
  category: "local" | "crypto" | "bank" | "global";
  currency: "PKR" | "USD";
  accountNumber: string;
  accountTitle?: string | null;
  networkOrBank?: string | null;
  minAmountPkr: number;
  minAmountUsd: number;
  badge?: string | null;
  iconKey: string;
  customIconUrl?: string | null;
  qrCodeUrl?: string | null;
  instructions: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_ICONS = [
  { key: "jazzcash", label: "JazzCash" },
  { key: "easypaisa", label: "EasyPaisa" },
  { key: "nayapay", label: "NayaPay" },
  { key: "sadapay", label: "SadaPay" },
  { key: "bank", label: "Bank / Raast" },
  { key: "binance", label: "Binance" },
  { key: "usdt", label: "USDT / Tether" },
  { key: "payoneer", label: "Payoneer" },
  { key: "generic", label: "Standard Card" },
];

function mapConfigToAdmin(c: PaymentMethodConfig, idx: number): AdminPaymentMethod {
  return {
    id: c.id || c.code || `method-${idx}`,
    code: c.code || c.id,
    name: c.title,
    category: (c.category as any) || "local",
    currency: c.currency,
    accountNumber: c.accountNumberOrAddress,
    accountTitle: c.accountTitleOrMemo || null,
    networkOrBank: c.networkOrBank || null,
    minAmountPkr: c.minAmountPkr || 500,
    minAmountUsd: c.minAmountUsd || 2,
    badge: c.badge || null,
    iconKey: c.iconKey || c.code,
    customIconUrl: c.customIconUrl || null,
    qrCodeUrl: c.qrPayload || null,
    instructions: c.instructions || [],
    isActive: c.isActive !== false,
    displayOrder: c.displayOrder || idx + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function AdminPaymentMethodsPage() {
  const token = useAuthStore((s) => s.token);

  // Initialize with cached defaults so page renders IMMEDIATELY with zero blank/loading delay
  const [methods, setMethods] = useState<AdminPaymentMethod[]>(() => {
    const initial = getCachedPaymentMethods();
    return initial.map(mapConfigToAdmin);
  });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<AdminPaymentMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "local" as "local" | "crypto" | "bank" | "global",
    currency: "PKR" as "PKR" | "USD",
    accountNumber: "",
    accountTitle: "",
    networkOrBank: "",
    minAmountPkr: 500,
    minAmountUsd: 2,
    badge: "",
    iconKey: "jazzcash",
    instructions: "",
    isActive: true,
    displayOrder: 0,
  });

  const fetchMethods = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // 1. Try fetching from Admin endpoint
      const adminRes = await apiFetch<any>(
        "/api/manage/payment-methods",
        token ? { accessToken: token } : {}
      );
      if (adminRes.success && Array.isArray(adminRes.data) && adminRes.data.length > 0) {
        setMethods(adminRes.data);
        return;
      }

      // 2. Fallback to public endpoint if admin token is still hydrating
      const pubRes = await apiFetch<any>("/api/payment-methods");
      if (pubRes.success && Array.isArray(pubRes.data) && pubRes.data.length > 0) {
        setMethods(pubRes.data);
      }
    } catch {
      // Gracefully preserve current state
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMethods(true);
  }, [token]);

  const filteredMethods = useMemo(() => {
    return methods.filter((m) => {
      if (activeCategory !== "all" && m.category !== activeCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.accountNumber.toLowerCase().includes(q) ||
        (m.accountTitle && m.accountTitle.toLowerCase().includes(q)) ||
        (m.networkOrBank && m.networkOrBank.toLowerCase().includes(q))
      );
    });
  }, [methods, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = methods.length;
    const active = methods.filter((m) => m.isActive).length;
    const local = methods.filter((m) => m.category === "local" || m.category === "bank").length;
    const crypto = methods.filter((m) => m.category === "crypto").length;
    return { total, active, disabled: total - active, local, crypto };
  }, [methods]);

  function handleOpenCreate() {
    setEditingMethod(null);
    setFormData({
      code: "",
      name: "",
      category: "local",
      currency: "PKR",
      accountNumber: "",
      accountTitle: "",
      networkOrBank: "",
      minAmountPkr: 500,
      minAmountUsd: 2,
      badge: "Instant",
      iconKey: "jazzcash",
      instructions: "Transfer to the account details above and attach screenshot proof.",
      isActive: true,
      displayOrder: methods.length + 1,
    });
    setIsCreateOpen(true);
  }

  function handleOpenEdit(m: AdminPaymentMethod) {
    setEditingMethod(m);
    setFormData({
      code: m.code,
      name: m.name,
      category: m.category,
      currency: m.currency,
      accountNumber: m.accountNumber,
      accountTitle: m.accountTitle || "",
      networkOrBank: m.networkOrBank || "",
      minAmountPkr: m.minAmountPkr,
      minAmountUsd: m.minAmountUsd,
      badge: m.badge || "",
      iconKey: m.iconKey || "generic",
      instructions: Array.isArray(m.instructions) ? m.instructions.join("\n") : "",
      isActive: m.isActive,
      displayOrder: m.displayOrder || 0,
    });
    setIsCreateOpen(true);
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    // Optimistic UI update
    setMethods((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isActive: !currentStatus } : item))
    );

    try {
      const res = await apiFetch<any>(`/api/manage/payment-methods/${id}/toggle`, {
        method: "PATCH",
        accessToken: token ?? undefined,
      });
      if (res.success) {
        toast.success(
          `Payment method ${!currentStatus ? "activated" : "deactivated"} successfully.`
        );
      } else {
        // Revert on failure
        void fetchMethods(true);
      }
    } catch {
      void fetchMethods(true);
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete payment method '${name}'?`)) {
      return;
    }

    // Optimistic UI update
    setMethods((prev) => prev.filter((item) => item.id !== id));

    try {
      const res = await apiFetch<any>(`/api/manage/payment-methods/${id}`, {
        method: "DELETE",
        accessToken: token ?? undefined,
      });
      if (res.success) {
        toast.success(`'${name}' deleted successfully.`);
      } else {
        void fetchMethods(true);
        toast.error(res.error || "Could not delete.");
      }
    } catch {
      void fetchMethods(true);
      toast.error("Failed to delete payment method.");
    }
  }

  async function handleSaveForm(e: FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim() || !formData.accountNumber.trim()) {
      toast.error("Please fill in all required fields (Name, Code, Account Number).");
      return;
    }

    setIsSaving(true);
    const instArray = formData.instructions
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      code: formData.code.toLowerCase().trim(),
      name: formData.name.trim(),
      category: formData.category,
      currency: formData.currency,
      accountNumber: formData.accountNumber.trim(),
      accountTitle: formData.accountTitle.trim() || null,
      networkOrBank: formData.networkOrBank.trim() || null,
      minAmountPkr: Number(formData.minAmountPkr) || 500,
      minAmountUsd: Number(formData.minAmountUsd) || 2,
      badge: formData.badge.trim() || null,
      iconKey: formData.iconKey,
      instructions: instArray,
      isActive: formData.isActive,
      displayOrder: Number(formData.displayOrder) || 0,
    };

    try {
      if (editingMethod) {
        const res = await apiFetch<any>(
          `/api/manage/payment-methods/${editingMethod.id}`,
          {
            method: "PATCH",
            accessToken: token ?? undefined,
            body: JSON.stringify(payload),
          }
        );
        if (res.success) {
          toast.success(`'${payload.name}' updated successfully!`);
          setIsCreateOpen(false);
          void fetchMethods(true);
        } else {
          toast.error(res.error || "Failed to update payment method.");
        }
      } else {
        const res = await apiFetch<any>("/api/manage/payment-methods", {
          method: "POST",
          accessToken: token ?? undefined,
          body: JSON.stringify(payload),
        });
        if (res.success) {
          toast.success(`New payment method '${payload.name}' created!`);
          setIsCreateOpen(false);
          void fetchMethods(true);
        } else {
          toast.error(res.error || "Failed to create method. Please verify code uniqueness.");
        }
      }
    } catch {
      toast.error("Failed to save payment method.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Payment Methods Management
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure dynamic payment methods, receiving bank accounts, wallets, and logos visible on the Deposit page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <a href="/deposit" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Preview Deposit Page</span>
            </a>
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Payment Method</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Methods</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</p>
          <span className="text-[10px] text-slate-500 font-medium">Configured in system</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Active Methods</span>
          <p className="text-2xl font-black text-emerald-900 mt-0.5">{stats.active}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Visible to users</span>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-700">Pakistani Wallets</span>
          <p className="text-2xl font-black text-red-900 mt-0.5">{stats.local}</p>
          <span className="text-[10px] text-red-600 font-medium">JazzCash, EasyPaisa, Banks</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Crypto &amp; Global</span>
          <p className="text-2xl font-black text-amber-900 mt-0.5">{stats.crypto}</p>
          <span className="text-[10px] text-amber-600 font-medium">Binance Pay, USDT</span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search method name, code, account number..."
            className="pl-8.5 h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "local", label: "Pakistani Wallets" },
            { id: "crypto", label: "Crypto" },
            { id: "bank", label: "Bank / Raast" },
            { id: "global", label: "Global" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0",
                activeCategory === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void fetchMethods(false)}
            disabled={isRefreshing}
            className="h-7.5 px-2 text-slate-500 hover:text-slate-900"
            title="Refresh payment methods"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Methods Cards Grid */}
      {filteredMethods.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200 p-6">
          <CreditCard className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
          <p className="text-sm font-bold text-slate-700">No payment methods found</p>
          <p className="text-xs text-slate-400">
            {searchQuery ? "Try clearing your search query" : "Click 'Add Payment Method' above to create one"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMethods.map((m) => {
            return (
              <div
                key={m.id || m.code}
                className={cn(
                  "rounded-2xl border p-4 bg-white transition-all shadow-2xs space-y-3 relative group",
                  m.isActive ? "border-slate-200/90" : "border-slate-200 bg-slate-50/70 opacity-75"
                )}
              >
                {/* Card Top: Brand Logo + Titles + Active Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-2xs">
                      <PaymentMethodIcon iconKey={m.iconKey} code={m.code} size={28} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-sm text-slate-900 truncate">{m.name}</h3>
                        {m.badge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold block truncate">
                        code: {m.code}
                      </span>
                    </div>
                  </div>

                  {/* Active Toggle Switch Badge */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(m.id, m.isActive)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1 px-2 py-0.8 rounded-full text-[10px] font-extrabold transition-colors cursor-pointer border",
                      m.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                    )}
                    title="Click to toggle active status"
                  >
                    <Power className="h-2.5 w-2.5" />
                    <span>{m.isActive ? "Active" : "Disabled"}</span>
                  </button>
                </div>

                {/* Account Details Box */}
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-2.5 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Account / Wallet Address
                    </span>
                    <span className="font-mono font-black text-slate-900 break-all select-all text-[11px]">
                      {m.accountNumber}
                    </span>
                  </div>

                  {m.accountTitle && (
                    <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-100">
                      <span className="text-slate-400 font-medium">Title:</span>
                      <span className="font-bold text-slate-800 truncate">{m.accountTitle}</span>
                    </div>
                  )}

                  {m.networkOrBank && (
                    <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-100">
                      <span className="text-slate-400 font-medium">Network / Bank:</span>
                      <span className="font-bold text-blue-700 truncate">{m.networkOrBank}</span>
                    </div>
                  )}
                </div>

                {/* Limits & Currency */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-500 font-medium">Min Deposit:</span>
                  <span className="font-black text-slate-900">
                    {m.currency === "USD" ? `$${m.minAmountUsd} USD` : `Rs ${m.minAmountPkr} PKR`}
                  </span>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold capitalize">
                    Category: {m.category}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(m)}
                      className="h-7.5 px-2.5 text-xs font-bold gap-1 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(m.id, m.name)}
                      className="h-7.5 px-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg cursor-pointer"
                      title="Delete payment method"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PAYMENT METHOD MODAL */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingMethod ? `Edit: ${editingMethod.name}` : "Add New Payment Method"}
                </h2>
                <p className="text-xs text-slate-500">
                  This method will instantly appear in the user top-up dropdown.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Method Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        name: e.target.value,
                        code: !editingMethod ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") : p.code,
                      }));
                    }}
                    placeholder="e.g. Meezan Bank, JazzCash"
                    required
                    className="h-8.5 text-xs"
                  />
                </div>

                {/* Unique Code */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Unique Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "") }))}
                    placeholder="e.g. meezan-bank"
                    required
                    disabled={!!editingMethod}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Category & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as any }))}
                    className="w-full h-8.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="local">Pakistani Wallet (PKR)</option>
                    <option value="crypto">Crypto (USD)</option>
                    <option value="bank">Bank / Raast (IBFT)</option>
                    <option value="global">Global Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Currency</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value as any }))}
                    className="w-full h-8.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (United States Dollar)</option>
                  </select>
                </div>
              </div>

              {/* Account Number / Wallet Address */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Account Number / Wallet Address / IBAN <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, accountNumber: e.target.value }))}
                  placeholder="03233371766 or PK12MEZN... or TXbBq78p..."
                  required
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              {/* Account Title & Bank/Network */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Account / Recipient Title</Label>
                  <Input
                    value={formData.accountTitle}
                    onChange={(e) => setFormData((p) => ({ ...p, accountTitle: e.target.value }))}
                    placeholder="Muhammad Sami"
                    className="h-8.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Network / Bank Name</Label>
                  <Input
                    value={formData.networkOrBank}
                    onChange={(e) => setFormData((p) => ({ ...p, networkOrBank: e.target.value }))}
                    placeholder="e.g. Meezan Bank, TRON TRC-20"
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              {/* Minimum Limits & Badge */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Min PKR</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.minAmountPkr}
                    onChange={(e) => setFormData((p) => ({ ...p, minAmountPkr: Number(e.target.value) || 500 }))}
                    className="h-8.5 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Min USD</Label>
                  <Input
                    type="number"
                    step="any"
                    min={0.1}
                    value={formData.minAmountUsd}
                    onChange={(e) => setFormData((p) => ({ ...p, minAmountUsd: Number(e.target.value) || 2 }))}
                    className="h-8.5 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Badge</Label>
                  <Input
                    value={formData.badge}
                    onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                    placeholder="Instant, 0% Fee"
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              {/* Brand Logo / Icon Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Select Official Brand Logo</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((ico) => {
                    const isSelected = formData.iconKey === ico.key;
                    return (
                      <button
                        key={ico.key}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, iconKey: ico.key }))}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer gap-1.5",
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <PaymentMethodIcon iconKey={ico.key} size={26} />
                        <span className="text-[10px] font-bold text-slate-800 truncate max-w-full">
                          {ico.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Step-by-Step Instructions (1 per line)
                </Label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                  placeholder="Open your app..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Switch & Modal Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Active (Visible to users)</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                    className="h-9 px-3 text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    size="sm"
                    className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment Method"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
