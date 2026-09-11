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

export const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "+923233371766";
export const ADMIN_WHATSAPP_CLEAN = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, "");

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "binance-pay",
    category: "crypto",
    title: "Binance Pay ID",
    subtitle: "Instant & Zero Fee Internal Binance Transfer",
    badge: "0% Fee • Instant",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_BINANCE_PAY_ID || "834910283",
    accountTitleOrMemo: "USNumHub Merchant",
    networkOrBank: "Binance Internal",
    minAmountPkr: 500,
    minAmountUsd: 2,
    instructions: [
      "Open your Binance App and tap 'Pay' on the top right.",
      "Select 'Send' and choose 'Pay ID'.",
      "Enter our Pay ID and input the required amount.",
      "Take a screenshot and share your Order ID / Proof via WhatsApp below.",
    ],
  },
  {
    id: "usdt-trc20",
    category: "crypto",
    title: "USDT (TRC-20)",
    subtitle: "TRON Network — Fast, Secure & Widely Supported",
    badge: "Most Popular",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || "TXbBq78pUQ9w8mKq18hZb1Ew8qZf3jPXYZ",
    accountTitleOrMemo: "USDT TRC20 Wallet",
    networkOrBank: "TRON (TRC-20)",
    minAmountPkr: 1400,
    minAmountUsd: 5,
    instructions: [
      "Send USDT only using the TRC-20 (TRON) network.",
      "Ensure minimum transfer is at least $5 USDT.",
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
    accountNumberOrAddress: process.env.NEXT_PUBLIC_USDT_BEP20_ADDRESS || "0x71C8A84351a082A81B85D8134F8f5FdB9371766",
    accountTitleOrMemo: "USDT BEP20 Wallet",
    networkOrBank: "BNB Smart Chain (BEP-20)",
    minAmountPkr: 1400,
    minAmountUsd: 5,
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
    accountNumberOrAddress: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || "03233371766",
    accountTitleOrMemo: process.env.NEXT_PUBLIC_JAZZCASH_TITLE || "Muhammad Sami",
    networkOrBank: "JazzCash",
    minAmountPkr: 500,
    minAmountUsd: 2,
    instructions: [
      "Open your JazzCash app or dial *786# on your phone.",
      "Select 'Money Transfer' → 'JazzCash Account'.",
      "Enter the account number and verify the title 'Muhammad Sami'.",
      "Note the 11-digit TID / TRX ID from the 8558/3737 SMS and share below.",
    ],
  },
  {
    id: "easypaisa",
    category: "local",
    title: "EasyPaisa",
    subtitle: "EasyPaisa Wallet & Raast Instant Transfer",
    badge: "Instant Local PKR",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "03233371766",
    accountTitleOrMemo: process.env.NEXT_PUBLIC_EASYPAISA_TITLE || "Muhammad Sami",
    networkOrBank: "EasyPaisa",
    minAmountPkr: 500,
    minAmountUsd: 2,
    instructions: [
      "Open your EasyPaisa app.",
      "Select 'Send Money' → 'EasyPaisa Transfer'.",
      "Enter the mobile number and confirm the title matches.",
      "Save receipt or TRX ID and send to Admin on WhatsApp.",
    ],
  },
  {
    id: "bank-transfer",
    category: "local",
    title: "Bank / Raast IBFT",
    subtitle: "Direct Bank Transfer or Raast Instant Pay",
    badge: "Any Pakistani Bank",
    accountNumberOrAddress: process.env.NEXT_PUBLIC_BANK_IBAN || "03233371766",
    accountTitleOrMemo: process.env.NEXT_PUBLIC_BANK_TITLE || "Muhammad Sami",
    networkOrBank: "Raast ID / Nayapay / Meezan",
    minAmountPkr: 500,
    minAmountUsd: 2,
    instructions: [
      "Transfer funds using Raast ID or standard bank IBFT from any mobile banking app.",
      "Enter Account / Raast ID: 03233371766.",
      "Take a screenshot of the completed transaction slip.",
      "Submit proof on WhatsApp for immediate ledger top-up.",
    ],
  },
];

export function buildPaymentWhatsAppUrl(params: {
  userId: string;
  methodTitle: string;
  networkOrBank?: string;
  amountPkr?: string | number;
  amountUsd?: string | number;
  txId?: string;
}): string {
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
  return `https://wa.me/${ADMIN_WHATSAPP_CLEAN}?text=${text}`;
}
