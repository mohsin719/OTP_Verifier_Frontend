import { apiFetch } from "./api";

export interface PaymentMethodConfig {
  id: string;
  code: string;
  category: "crypto" | "local" | "bank" | "global";
  title: string;
  subtitle: string;
  badge?: string;
  currency: "PKR" | "USD";
  accountNumberOrAddress: string;
  accountTitleOrMemo?: string;
  networkOrBank?: string;
  minAmountPkr: number;
  minAmountUsd: number;
  iconKey: string;
  customIconUrl?: string;
  qrPayload?: string;
  instructions: string[];
  isActive: boolean;
  displayOrder: number;
}

export const DEFAULT_DYNAMIC_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "jazzcash",
    code: "jazzcash",
    category: "local",
    currency: "PKR",
    title: "JazzCash",
    subtitle: "Mobile Account & App Transfer",
    badge: "Instant Local PKR",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || "03233371766",
    accountTitleOrMemo: process.env.NEXT_PUBLIC_JAZZCASH_TITLE || "Muhammad Sami",
    networkOrBank: "JazzCash Mobile Account",
    minAmountPkr: 500,
    minAmountUsd: 2,
    iconKey: "jazzcash",
    isActive: true,
    displayOrder: 1,
    instructions: [
      "Open your JazzCash app or dial *786# on your phone.",
      "Select 'Money Transfer' → 'JazzCash Account'.",
      `Enter mobile number ${process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || "03233371766"} and verify title matches '${process.env.NEXT_PUBLIC_JAZZCASH_TITLE || "Muhammad Sami"}'.`,
      "Enter the 11-digit TID / TRX ID from the 8558 SMS and attach screenshot proof below.",
    ],
  },
  {
    id: "easypaisa",
    code: "easypaisa",
    category: "local",
    currency: "PKR",
    title: "EasyPaisa",
    subtitle: "EasyPaisa Wallet & Raast Instant Transfer",
    badge: "Instant Local PKR",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "03233371766",
    accountTitleOrMemo: process.env.NEXT_PUBLIC_EASYPAISA_TITLE || "Muhammad Sami",
    networkOrBank: "EasyPaisa Wallet / Telenor Microfinance",
    minAmountPkr: 500,
    minAmountUsd: 2,
    iconKey: "easypaisa",
    isActive: true,
    displayOrder: 2,
    instructions: [
      "Open your EasyPaisa app.",
      "Select 'Send Money' → 'EasyPaisa Transfer'.",
      `Enter mobile number ${process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "03233371766"} and confirm title '${process.env.NEXT_PUBLIC_EASYPAISA_TITLE || "Muhammad Sami"}'.`,
      "Enter the 11-digit TRX ID and upload screenshot below for instant review.",
    ],
  },
  {
    id: "nayapay",
    code: "nayapay",
    category: "local",
    currency: "PKR",
    title: "NayaPay",
    subtitle: "Instant Digital Wallet Transfer",
    badge: "Fast & Free",
    accountNumberOrAddress: "03233371766",
    accountTitleOrMemo: "Muhammad Sami",
    networkOrBank: "NayaPay Wallet / Visa",
    minAmountPkr: 500,
    minAmountUsd: 2,
    iconKey: "nayapay",
    isActive: true,
    displayOrder: 3,
    instructions: [
      "Open your NayaPay App.",
      "Tap 'Send Money' → 'NayaPay User / Mobile Number'.",
      "Input mobile number 03233371766 and verify recipient name.",
      "Submit transaction ID & screenshot after successful transfer.",
    ],
  },
  {
    id: "sadapay",
    code: "sadapay",
    category: "local",
    currency: "PKR",
    title: "SadaPay",
    subtitle: "Zero-fee Instant SadaPay Transfer",
    badge: "Zero Fee",
    accountNumberOrAddress: "03233371766",
    accountTitleOrMemo: "Muhammad Sami",
    networkOrBank: "SadaPay Wallet / Mastercard",
    minAmountPkr: 500,
    minAmountUsd: 2,
    iconKey: "sadapay",
    isActive: true,
    displayOrder: 4,
    instructions: [
      "Open your SadaPay App.",
      "Tap 'Send Money' → 'Send to SadaPay'.",
      "Enter phone number 03233371766 and confirm account details.",
      "Attach payment proof & transaction reference ID below.",
    ],
  },
  {
    id: "bank-raast",
    code: "bank-raast",
    category: "bank",
    currency: "PKR",
    title: "Bank Transfer / Raast (IBFT)",
    subtitle: "Direct Bank Transfer via 1-Link / Raast ID",
    badge: "All Pakistani Banks",
    accountNumberOrAddress: "PK12MEZN0001234567890123",
    accountTitleOrMemo: "Muhammad Sami",
    networkOrBank: "Meezan Bank / Raast ID: 03233371766",
    minAmountPkr: 1000,
    minAmountUsd: 4,
    iconKey: "bank",
    isActive: true,
    displayOrder: 5,
    instructions: [
      "Open your banking app (HBL, Meezan, UBL, Alfalah, Bank Alfalah, Allied Bank, etc.).",
      "Choose 'Transfer to Other Bank' or 'Send via Raast ID'.",
      "Enter IBAN PK12MEZN0001234567890123 or Raast ID 03233371766.",
      "Verify beneficiary title 'Muhammad Sami' before confirming.",
      "Copy the Bank Reference / Transaction ID and upload transfer receipt.",
    ],
  },
  {
    id: "binance-pay",
    code: "binance-pay",
    category: "crypto",
    currency: "USD",
    title: "Binance Pay ID",
    subtitle: "Instant & Zero Fee Internal Binance Transfer",
    badge: "0% Fee • Instant",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_BINANCE_PAY_ID || "834910283",
    accountTitleOrMemo: "USNumHub Merchant",
    networkOrBank: "Binance Internal Pay ID",
    minAmountPkr: 500,
    minAmountUsd: 2,
    iconKey: "binance",
    isActive: true,
    displayOrder: 6,
    instructions: [
      "Open your Binance App and tap 'Pay' on the top right.",
      "Select 'Send' and choose 'Pay ID'.",
      `Enter our Pay ID: ${process.env.NEXT_PUBLIC_BINANCE_PAY_ID || "834910283"} and specify amount.`,
      "Copy your Binance Order ID / TxID and upload your payment screenshot below.",
    ],
  },
  {
    id: "usdt-trc20",
    code: "usdt-trc20",
    category: "crypto",
    currency: "USD",
    title: "USDT (TRC-20)",
    subtitle: "TRON Network — Fast, Secure & Widely Supported",
    badge: "Most Popular Crypto",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "TXbBq78pUQ9w8mKq18hZb1Ew8qZf3jPXYZ",
    accountTitleOrMemo: "USDT TRC20 Wallet",
    networkOrBank: "TRON (TRC-20)",
    minAmountPkr: 1400,
    minAmountUsd: 5,
    iconKey: "usdt",
    isActive: true,
    displayOrder: 7,
    instructions: [
      "Send USDT only using the TRC-20 (TRON) network.",
      "Ensure minimum transfer is at least $5 USDT.",
      "Copy your Transaction Hash (TxID) after transfer.",
      "Submit your TxID and screenshot below for admin verification.",
    ],
  },
  {
    id: "usdt-bep20",
    code: "usdt-bep20",
    category: "crypto",
    currency: "USD",
    title: "USDT (BEP-20)",
    subtitle: "BNB Smart Chain — Ultra Low Gas Fee",
    badge: "Low Gas Fee",
    accountNumberOrAddress: "0x71C8366420A092679302B0F40954b9d0B29bAb57",
    accountTitleOrMemo: "USDT BSC Wallet",
    networkOrBank: "BNB Smart Chain (BEP-20)",
    minAmountPkr: 1400,
    minAmountUsd: 5,
    iconKey: "usdt",
    isActive: true,
    displayOrder: 8,
    instructions: [
      "Send USDT using BNB Smart Chain (BEP-20).",
      "Make sure you select BSC network (not ERC-20).",
      "Copy the BSC Transaction Hash and upload proof screenshot.",
    ],
  },
  {
    id: "payoneer",
    code: "payoneer",
    category: "global",
    currency: "USD",
    title: "Payoneer",
    subtitle: "Global USD / EUR In-Network Transfer",
    badge: "Global Transfer",
    accountNumberOrAddress: "payments@usnumhub.com",
    accountTitleOrMemo: "USNumHub Global Services",
    networkOrBank: "Payoneer Account Email",
    minAmountPkr: 2800,
    minAmountUsd: 10,
    iconKey: "payoneer",
    isActive: true,
    displayOrder: 9,
    instructions: [
      "Log into your Payoneer account.",
      "Go to Pay → Make a Payment → To recipient's Payoneer account.",
      "Enter our Payoneer email: payments@usnumhub.com",
      "Enter amount (min $10) and submit transaction reference & screenshot below.",
    ],
  },
];

export const PAYMENT_METHODS_STORAGE_KEY = "usnumhub_active_payment_methods_cache";
export const PAYMENT_SETTINGS_UPDATED_EVENT = "usnumhub_payment_methods_updated";

/**
 * Normalizes backend response or storage item into PaymentMethodConfig
 */
export function normalizeMethodConfig(item: any): PaymentMethodConfig {
  return {
    id: item.id || item.code,
    code: item.code || item.id,
    category: item.category || "local",
    currency: item.currency === "USD" ? "USD" : "PKR",
    title: item.name || item.title || item.code,
    subtitle: item.networkOrBank || item.subtitle || "Payment Method",
    badge: item.badge || undefined,
    accountNumberOrAddress: item.accountNumber || item.accountNumberOrAddress || "",
    accountTitleOrMemo: item.accountTitle || item.accountTitleOrMemo || undefined,
    networkOrBank: item.networkOrBank || undefined,
    minAmountPkr: Number(item.minAmountPkr) || 500,
    minAmountUsd: Number(item.minAmountUsd) || 2,
    iconKey: item.iconKey || item.code || "generic",
    customIconUrl: item.customIconUrl || undefined,
    qrPayload: item.qrCodeUrl || item.qrPayload || undefined,
    instructions: Array.isArray(item.instructions)
      ? item.instructions
      : ["Transfer amount to the account details above and attach screenshot proof."],
    isActive: item.isActive !== false,
    displayOrder: item.displayOrder || 0,
  };
}

/**
 * Synchronously retrieves cached active methods (or default list)
 */
export function getCachedPaymentMethods(): PaymentMethodConfig[] {
  if (typeof window === "undefined") {
    return DEFAULT_DYNAMIC_PAYMENT_METHODS;
  }
  try {
    const raw = localStorage.getItem(PAYMENT_METHODS_STORAGE_KEY);
    if (!raw) return DEFAULT_DYNAMIC_PAYMENT_METHODS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeMethodConfig);
    }
    return DEFAULT_DYNAMIC_PAYMENT_METHODS;
  } catch {
    return DEFAULT_DYNAMIC_PAYMENT_METHODS;
  }
}

/**
 * Asynchronously fetches live active payment methods from backend API
 */
export async function fetchActivePaymentMethods(): Promise<PaymentMethodConfig[]> {
  try {
    const res = await apiFetch<{ success: boolean; data: any[] }>("/payment-methods");
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      const normalized = res.data.map(normalizeMethodConfig);
      if (typeof window !== "undefined") {
        localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
    }
  } catch {
    // Graceful offline / network fallback to cached or defaults
  }
  return getCachedPaymentMethods();
}

/**
 * Legacy support for components importing PAYMENT_METHODS & StoredPaymentSettings
 */
export const PAYMENT_METHODS = DEFAULT_DYNAMIC_PAYMENT_METHODS;

export interface StoredPaymentSettings {
  jazzcashNumber: string;
  jazzcashTitle: string;
  jazzcashMinPkr: number;
  easypaisaNumber: string;
  easypaisaTitle: string;
  easypaisaMinPkr: number;
  binancePayId: string;
  binancePayTitle: string;
  binanceMinUsd: number;
  usdtTrc20Address: string;
  usdtTrc20Title: string;
  usdtMinUsd: number;
}

export const PAYMENT_SETTINGS_STORAGE_KEY = "usnumhub_payment_methods_config";

export const DEFAULT_PAYMENT_SETTINGS: StoredPaymentSettings = {
  jazzcashNumber: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || "03233371766",
  jazzcashTitle: process.env.NEXT_PUBLIC_JAZZCASH_TITLE || "Muhammad Sami",
  jazzcashMinPkr: 500,
  easypaisaNumber: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "03233371766",
  easypaisaTitle: process.env.NEXT_PUBLIC_EASYPAISA_TITLE || "Muhammad Sami",
  easypaisaMinPkr: 500,
  binancePayId: process.env.NEXT_PUBLIC_BINANCE_PAY_ID || "834910283",
  binancePayTitle: "USNumHub Merchant",
  binanceMinUsd: 2,
  usdtTrc20Address: process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "TXbBq78pUQ9w8mKq18hZb1Ew8qZf3jPXYZ",
  usdtTrc20Title: "USDT TRC20 Wallet",
  usdtMinUsd: 5,
};

export function getStoredPaymentSettings(): StoredPaymentSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PAYMENT_SETTINGS };
    return { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
}

export function saveStoredPaymentSettings(settings: Partial<StoredPaymentSettings>): StoredPaymentSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PAYMENT_SETTINGS, ...settings };
  }
  const current = getStoredPaymentSettings();
  const next = { ...current, ...settings };
  localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(PAYMENT_SETTINGS_UPDATED_EVENT, { detail: next }));
  return next;
}

export function resetStoredPaymentSettings(): StoredPaymentSettings {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PAYMENT_SETTINGS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(PAYMENT_SETTINGS_UPDATED_EVENT, { detail: DEFAULT_PAYMENT_SETTINGS }));
  }
  return { ...DEFAULT_PAYMENT_SETTINGS };
}
