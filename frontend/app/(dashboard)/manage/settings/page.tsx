"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
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
  ShieldCheck,
  KeyRound,
  Loader2,
  Copy,
  MessageSquare,
  Send,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { PaymentMethodIcon } from "@/components/payment/payment-icons";
import {
  getCachedPaymentMethods,
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

export default function AdminSettingsPage() {
  const { token, user } = useAuthStore();

  // Active top-level Tab
  const [activeTab, setActiveTab] = useState<"methods" | "security" | "support">("methods");

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // WhatsApp Support Config state
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("usnumhub_support_whatsapp") || "923233371766";
    }
    return "923233371766";
  });
  const [whatsappNote, setWhatsappNote] = useState("Available 24/7 for deposit verification & top-up assistance");

  // Dynamic Payment Methods state
  const [methods, setMethods] = useState<AdminPaymentMethod[]>(() => {
    const initial = getCachedPaymentMethods();
    return initial.map(mapConfigToAdmin);
  });
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Modal states for Create / Edit
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<AdminPaymentMethod | null>(null);
  const [isSavingMethod, setIsSavingMethod] = useState(false);

  // Modal Form State
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
    badge: "Instant",
    iconKey: "jazzcash",
    instructions: "Transfer to the account details above and attach screenshot proof.",
    isActive: true,
    displayOrder: 0,
  });

  const fetchMethods = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const adminRes = await apiFetch<any>(
        "/api/manage/payment-methods",
        token ? { accessToken: token } : {}
      );
      if (adminRes.success && Array.isArray(adminRes.data) && adminRes.data.length > 0) {
        setMethods(adminRes.data);
        return;
      }

      const pubRes = await apiFetch<any>("/api/payment-methods");
      if (pubRes.success && Array.isArray(pubRes.data) && pubRes.data.length > 0) {
        setMethods(pubRes.data);
      }
    } catch {
      // Gracefully preserve local state
    } finally {
      setIsRefreshing(false);
      setLoadingMethods(false);
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

  async function handleSavePaymentMethod(e: FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim() || !formData.accountNumber.trim()) {
      toast.error("Please fill in all required fields (Name, Code, Account Number).");
      return;
    }

    setIsSavingMethod(true);
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
          toast.error(res.error || "Failed to create method. Please check code uniqueness.");
        }
      }
    } catch {
      toast.error("Failed to save payment method.");
    } finally {
      setIsSavingMethod(false);
    }
  }

  function handleSaveWhatsappSupport(e: FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem("usnumhub_support_whatsapp", whatsappNumber.trim());
      toast.success("WhatsApp support contact details saved successfully!");
    } catch {
      toast.error("Failed to save WhatsApp settings.");
    }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!token) return;

    if (!oldPassword) {
      toast.error("Please enter your current (old) password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password cannot be the same as your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch<void>("/api/auth/change-password", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to change password. Please check your old password.");
        return;
      }

      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {
        // Non-blocking
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Admin password changed successfully!");
    } catch {
      toast.error("A network or server error occurred. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Payment &amp; Settings
            </h1>
            <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Admin Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure dynamic deposit receiving accounts, admin security credentials, and support channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <a href="/deposit" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Preview Deposit Page</span>
            </a>
          </Button>

          {activeTab === "methods" && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add Payment Method</span>
            </Button>
          )}
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("methods")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "methods"
              ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          )}
        >
          <CreditCard className="h-4 w-4 shrink-0" />
          <span>Payment Methods</span>
          <span
            className={cn(
              "ml-1 px-2 py-0.2 rounded-full text-[11px] font-black",
              activeTab === "methods"
                ? "bg-blue-100 text-blue-800"
                : "bg-slate-200 text-slate-700"
            )}
          >
            {stats.active} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "security"
              ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          )}
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          <span>Security &amp; Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("support")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "support"
              ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          )}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span>WhatsApp &amp; Support</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DYNAMIC PAYMENT METHODS */}
      {/* ========================================================================= */}
      {activeTab === "methods" && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Configured</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total} Methods</p>
              <span className="text-[11px] text-slate-500 font-medium">Ready in database</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Active On Site</span>
              <p className="text-xl font-black text-emerald-900 mt-0.5">{stats.active} Live</p>
              <span className="text-[11px] text-emerald-600 font-medium">Shown on Deposit page</span>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Pakistani Wallets</span>
              <p className="text-xl font-black text-rose-900 mt-0.5">{stats.local}</p>
              <span className="text-[11px] text-rose-600 font-medium">JazzCash, EasyPaisa, Banks</span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Crypto &amp; USD</span>
              <p className="text-xl font-black text-amber-900 mt-0.5">{stats.crypto}</p>
              <span className="text-[11px] text-amber-600 font-medium">Binance Pay, USDT</span>
            </div>
          </div>

          {/* Search, Filters & Action Controls */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search method name, code, account number..."
                className="pl-8.5 h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
              {[
                { id: "all", label: "All" },
                { id: "local", label: "Pakistani Wallets" },
                { id: "crypto", label: "Crypto (USD)" },
                { id: "bank", label: "Bank / Raast" },
                { id: "global", label: "Global" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0",
                    activeCategory === tab.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => fetchMethods(false)}
                disabled={isRefreshing}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer ml-1"
                title="Refresh payment methods"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Grid of Compact Payment Method Cards */}
          {filteredMethods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No payment methods found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No payment methods match '${searchQuery}'. Try resetting your search.`
                    : "No payment methods configured for this category yet. Click '+ Add Payment Method' above to create one."}
                </p>
              </div>
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                Add First Method
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMethods.map((m) => {
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-2xl border bg-white p-4.5 transition-all shadow-2xs space-y-3.5 relative",
                      m.isActive
                        ? "border-slate-200 hover:border-blue-300 hover:shadow-xs"
                        : "border-slate-200/60 bg-slate-50/60 opacity-75"
                    )}
                  >
                    {/* Top Row: Brand Logo, Name, Badge, Active Switch */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center">
                          <PaymentMethodIcon iconKey={m.iconKey} size={28} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 truncate">
                              {m.name}
                            </h3>
                            {m.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {m.networkOrBank || (m.currency === "USD" ? "Cryptocurrency Gateway" : "Mobile Wallet")}
                          </p>
                        </div>
                      </div>

                      {/* Active Status Badge & Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(m.id, m.isActive)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0",
                          m.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        )}
                        title="Click to toggle active status on Deposit page"
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            m.isActive ? "bg-emerald-600 animate-pulse" : "bg-slate-400"
                          )}
                        />
                        <span>{m.isActive ? "Active" : "Inactive"}</span>
                      </button>
                    </div>

                    {/* Account Details Box */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Account / Address:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span className="truncate max-w-[200px]">{m.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.accountNumber, "Account number")}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                            title="Copy number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {m.accountTitle && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Account Title / Memo:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[200px]">
                            {m.accountTitle}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[11px] text-slate-500 font-medium">Minimum Deposit:</span>
                        <span className="font-black text-slate-900">
                          {m.currency === "USD" ? `$${m.minAmountUsd} USD` : `Rs ${m.minAmountPkr} PKR`}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        code: {m.code}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(m)}
                          className="h-8 px-3 text-xs font-bold gap-1 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit Details</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(m.id, m.name)}
                          className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-lg cursor-pointer"
                          title="Delete payment method"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & ADMIN CREDENTIALS */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Account Profile */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Admin Profile Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Your authenticated session credentials and privileges.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 font-medium">Admin ID</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                    <span>{user?.publicId || user?.id?.slice(0, 8)}</span>
                    {user?.publicId && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(user.publicId, "Admin ID")}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 font-medium">Login Email</span>
                  <span className="font-bold text-slate-900">{user?.email}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 font-medium">Role Privilege</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                    {user?.role || "ADMIN"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3 border border-emerald-100 text-emerald-800">
                  <span className="font-medium">Account Status</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Verified &amp; Active
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 text-xs text-blue-900">
              <h4 className="font-bold flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-600" />
                Password Security Notice
              </h4>
              <p className="text-blue-800/80 leading-relaxed">
                When you update your administrator password, both your backend database password and your Supabase Auth session credentials are automatically synchronized.
              </p>
            </div>
          </div>

          {/* Right Column: Change Password Form */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <KeyRound className="h-5 w-5 text-blue-600" />
                  Change Administrator Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Provide your current old password, then enter and confirm your new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-old-password" className="text-xs font-bold text-slate-700">
                      Old / Current Password <span className="text-rose-500">*</span>
                    </Label>
                    <PasswordInput
                      id="admin-old-password"
                      autoComplete="current-password"
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(ev) => setOldPassword(ev.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-new-password" className="text-xs font-bold text-slate-700">
                      New Password <span className="text-rose-500">*</span>
                    </Label>
                    <PasswordInput
                      id="admin-new-password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(ev) => setNewPassword(ev.target.value)}
                      required
                      minLength={8}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-confirm-password" className="text-xs font-bold text-slate-700">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </Label>
                    <PasswordInput
                      id="admin-confirm-password"
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(ev) => setConfirmPassword(ev.target.value)}
                      required
                      minLength={8}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 cursor-pointer shadow-sm"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating Password…
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Save New Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHATSAPP & SUPPORT CHANNELS */}
      {/* ========================================================================= */}
      {activeTab === "support" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                WhatsApp Support Configuration
              </CardTitle>
              <CardDescription className="text-xs">
                Configure the WhatsApp phone number shown to users for direct manual assistance and proof confirmations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWhatsappSupport} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="support-wa-number" className="text-xs font-bold text-slate-700">
                    WhatsApp Number (International format with country code)
                  </Label>
                  <Input
                    id="support-wa-number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 923233371766 (no leading +)"
                    className="h-9 text-xs font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Format: 923233371766 (starts with country code 92, without spaces or +)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="support-wa-note" className="text-xs font-bold text-slate-700">
                    Support Note / Hours
                  </Label>
                  <Input
                    id="support-wa-note"
                    value={whatsappNote}
                    onChange={(e) => setWhatsappNote(e.target.value)}
                    placeholder="e.g. Available 24/7"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Live Preview Button */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Direct Chat Link:</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      https://wa.me/{whatsappNumber.replace(/[^0-9]/g, "")}
                    </span>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                  >
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Hello%20USNumHub%20Support`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Send className="h-3 w-3" />
                      Test Link
                    </a>
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 cursor-pointer shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  Save WhatsApp Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PAYMENT METHOD */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingMethod ? `Edit: ${editingMethod.name}` : "Add New Payment Method"}
                </h2>
                <p className="text-xs text-slate-500">
                  This payment method will instantly be available for user top-ups.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Method Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        name: e.target.value,
                        code: !editingMethod
                          ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                          : p.code,
                      }));
                    }}
                    placeholder="e.g. JazzCash, Meezan Bank, Binance"
                    required
                    className="h-8.5 text-xs"
                  />
                </div>

                {/* Unique Code */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Unique Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        code: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""),
                      }))
                    }
                    placeholder="e.g. jazzcash, meezan-bank"
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
                    className="w-full h-8.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="local">Pakistani Wallet (PKR)</option>
                    <option value="crypto">Crypto (USD)</option>
                    <option value="bank">Bank / Raast (IBFT)</option>
                    <option value="global">Global Payment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Currency</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value as any }))}
                    className="w-full h-8.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (United States Dollar)</option>
                  </select>
                </div>
              </div>

              {/* Account Number / Wallet Address */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Account Number / Wallet Address / IBAN <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, accountNumber: e.target.value }))}
                  placeholder="e.g. 03233371766 or PK12MEZN... or TXbBq78p..."
                  required
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              {/* Account Title & Bank / Network */}
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
                    placeholder="e.g. JazzCash Account, TRON TRC-20"
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
                  <Label className="text-xs font-bold text-slate-700">Promo Badge</Label>
                  <Input
                    value={formData.badge}
                    onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                    placeholder="Instant, 0% Fee"
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              {/* Official Brand Logo Selector */}
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
                        <PaymentMethodIcon iconKey={ico.key} size={24} />
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
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                  placeholder="Open your app..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Toggle & Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Active (Visible to users)</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                    className="h-8.5 px-3 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingMethod}
                    size="sm"
                    className="h-8.5 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm"
                  >
                    {isSavingMethod ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment Method"}
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
