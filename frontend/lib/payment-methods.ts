export interface PaymentMethodConfig {
  id: "binance-pay" | "usdt-trc20" | "usdt-bep20" | "jazzcash" | "easypaisa" | "bank-transfer";
  category: "crypto" | "local";
  title: string;
  subtitle: string;
  badge?: string;
  accountNumberOrAddress: string;
  accountTitleOrMemo?: string;
  networkOrBank?: string;
  minAmountPkr: number;
  minAmountUsd: number;
  qrPayload?: string;
  instructions: string[];
}

export interface StoredPaymentSettings {
  adminWhatsapp: string;
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
  usdtBep20Address?: string;
  bankIban?: string;
  bankTitle?: string;
  bankName?: string;
}

export const PAYMENT_SETTINGS_STORAGE_KEY = "usnumhub_payment_methods_config";
export const PAYMENT_SETTINGS_UPDATED_EVENT = "usnumhub_payment_config_updated";

export const DEFAULT_PAYMENT_SETTINGS: StoredPaymentSettings = {
  adminWhatsapp: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "+923233371766",
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
  usdtBep20Address: process.env.NEXT_PUBLIC_USDT_BEP20_ADDRESS || "0x71C8A84351a082A81B85D8134F8f5FdB9371766",
  bankIban: process.env.NEXT_PUBLIC_BANK_IBAN || "03233371766",
  bankTitle: process.env.NEXT_PUBLIC_BANK_TITLE || "Muhammad Sami",
  bankName: "Raast ID / Nayapay / Meezan",
};

export function getStoredPaymentSettings(): StoredPaymentSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PAYMENT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
}

export function saveStoredPaymentSettings(settings: Partial<StoredPaymentSettings>): StoredPaymentSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PAYMENT_SETTINGS, ...settings };
  }
  const current = getStoredPaymentSettings();
  const next: StoredPaymentSettings = {
    ...current,
    ...settings,
  };
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

export function getActiveAdminWhatsapp(settings?: StoredPaymentSettings): { raw: string; clean: string } {
  const current = settings || getStoredPaymentSettings();
  const raw = current.adminWhatsapp || DEFAULT_PAYMENT_SETTINGS.adminWhatsapp;
  const clean = raw.replace(/\D/g, "");
  return { raw, clean };
}

export function getActivePaymentMethods(settings?: StoredPaymentSettings): PaymentMethodConfig[] {
  const s = settings || getStoredPaymentSettings();

  return [
    {
      id: "binance-pay",
      category: "crypto",
      title: "Binance Pay ID",
      subtitle: "Instant & Zero Fee Internal Binance Transfer",
      badge: "0% Fee • Instant",
      accountNumberOrAddress: s.binancePayId,
      accountTitleOrMemo: s.binancePayTitle,
      networkOrBank: "Binance Internal",
      minAmountPkr: 500,
      minAmountUsd: s.binanceMinUsd,
      instructions: [
        "Open your Binance App and tap 'Pay' on the top right.",
        "Select 'Send' and choose 'Pay ID'.",
        `Enter our Pay ID: ${s.binancePayId} and input the required amount.`,
        "Take a screenshot and share your Order ID / Proof via WhatsApp below.",
      ],
    },
    {
      id: "usdt-trc20",
      category: "crypto",
      title: "USDT (TRC-20)",
      subtitle: "TRON Network — Fast, Secure & Widely Supported",
      badge: "Most Popular",
      accountNumberOrAddress: s.usdtTrc20Address,
      accountTitleOrMemo: s.usdtTrc20Title,
      networkOrBank: "TRON (TRC-20)",
      minAmountPkr: 1400,
      minAmountUsd: s.usdtMinUsd,
      instructions: [
        "Send USDT only using the TRC-20 (TRON) network.",
        `Ensure minimum transfer is at least $${s.usdtMinUsd} USDT.`,
        "Copy your Transaction Hash (TxID) after transfer.",
        "Submit the TxID and screenshot to Admin on WhatsApp for instant crediting.",
      ],
    },
    {
      id: "usdt-bep20",
      category: "crypto",
      title: "USDT (BEP-20)",
      subtitle: "BNB Smart Chain — Ultra Low Network Fee",
      badge: "Lowest Gas Fee",
      accountNumberOrAddress: s.usdtBep20Address || DEFAULT_PAYMENT_SETTINGS.usdtBep20Address || "",
      accountTitleOrMemo: "USDT BEP20 Wallet",
      networkOrBank: "BNB Smart Chain (BEP-20)",
      minAmountPkr: 1400,
      minAmountUsd: s.usdtMinUsd,
      instructions: [
        "Send USDT strictly using the BEP-20 (BNB Smart Chain) network.",
        "Do NOT send via Ethereum (ERC-20) network to this address.",
        "Copy the Transaction Hash (TxID) and send proof via WhatsApp.",
      ],
    },
    {
      id: "jazzcash",
      category: "local",
      title: "JazzCash",
      subtitle: "Mobile Account & App Transfer",
      badge: "Instant Local PKR",
      accountNumberOrAddress: s.jazzcashNumber,
      accountTitleOrMemo: s.jazzcashTitle,
      networkOrBank: "JazzCash",
      minAmountPkr: s.jazzcashMinPkr,
      minAmountUsd: 2,
      instructions: [
        "Open your JazzCash app or dial *786# on your phone.",
        "Select 'Money Transfer' → 'JazzCash Account'.",
        `Enter account number ${s.jazzcashNumber} and verify title '${s.jazzcashTitle}'.`,
        "Note the 11-digit TID / TRX ID from the 8558/3737 SMS and share below.",
      ],
    },
    {
      id: "easypaisa",
      category: "local",
      title: "EasyPaisa",
      subtitle: "EasyPaisa Wallet & Raast Instant Transfer",
      badge: "Instant Local PKR",
      accountNumberOrAddress: s.easypaisaNumber,
      accountTitleOrMemo: s.easypaisaTitle,
      networkOrBank: "EasyPaisa",
      minAmountPkr: s.easypaisaMinPkr,
      minAmountUsd: 2,
      instructions: [
        "Open your EasyPaisa app.",
        "Select 'Send Money' → 'EasyPaisa Transfer'.",
        `Enter the mobile number ${s.easypaisaNumber} and confirm title matches '${s.easypaisaTitle}'.`,
        "Save receipt or TRX ID and send to Admin on WhatsApp.",
      ],
    },
    {
      id: "bank-transfer",
      category: "local",
      title: "Bank / Raast IBFT",
      subtitle: "Direct Bank Transfer or Raast Instant Pay",
      badge: "Any Pakistani Bank",
      accountNumberOrAddress: s.bankIban || DEFAULT_PAYMENT_SETTINGS.bankIban || "",
      accountTitleOrMemo: s.bankTitle || DEFAULT_PAYMENT_SETTINGS.bankTitle || "",
      networkOrBank: s.bankName || DEFAULT_PAYMENT_SETTINGS.bankName || "Raast / IBFT",
      minAmountPkr: s.jazzcashMinPkr,
      minAmountUsd: 2,
      instructions: [
        "Transfer funds using Raast ID or standard bank IBFT from any mobile banking app.",
        `Enter Account / Raast ID: ${s.bankIban || s.jazzcashNumber}.`,
        "Take a screenshot of the completed transaction slip.",
        "Submit proof on WhatsApp for immediate ledger top-up.",
      ],
    },
  ];
}

export const ADMIN_WHATSAPP_NUMBER = DEFAULT_PAYMENT_SETTINGS.adminWhatsapp;
export const ADMIN_WHATSAPP_CLEAN = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, "");
export const PAYMENT_METHODS = getActivePaymentMethods(DEFAULT_PAYMENT_SETTINGS);

export function buildPaymentWhatsAppUrl(params: {
  userId: string;
  methodTitle: string;
  networkOrBank?: string;
  amountPkr?: string | number;
  amountUsd?: string | number;
  txId?: string;
  adminWhatsappOverride?: string;
}): string {
  const whatsappTarget = params.adminWhatsappOverride
    ? params.adminWhatsappOverride.replace(/\D/g, "")
    : getActiveAdminWhatsapp().clean;

  const parts: string[] = [
    "👋 *Hello Admin, I have submitted a deposit!*",
    "",
    `👤 *User ID:* ${params.userId}`,
    `💳 *Payment Method:* ${params.methodTitle}${params.networkOrBank ? ` (${params.networkOrBank})` : ""}`,
  ];

  if (params.amountPkr || params.amountUsd) {
    const pkrText = params.amountPkr ? `Rs ${params.amountPkr}` : "";
    const usdText = params.amountUsd ? `$${params.amountUsd}` : "";
    const displayAmount = [usdText, pkrText].filter(Boolean).join(" / ");
    parts.push(`💵 *Amount:* ${displayAmount}`);
  }

  if (params.txId && params.txId.trim()) {
    parts.push(`🔖 *Transaction ID / TxID:* ${params.txId.trim()}`);
  }

  parts.push("");
  parts.push("Please verify and credit my wallet balance. Thank you!");

  const text = encodeURIComponent(parts.join("\n"));
  return `https://wa.me/${whatsappTarget}?text=${text}`;
}

