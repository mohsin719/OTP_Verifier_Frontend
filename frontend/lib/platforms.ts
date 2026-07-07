import { Globe, ShoppingBag, Tag, type LucideIcon } from "lucide-react";

export const PLATFORM_OPTIONS = [
  "Facebook",
  "Amazon",
  "WhatsApp",
  "Others",
] as const;

export type PlatformOption = (typeof PLATFORM_OPTIONS)[number];

export type PlatformCard = {
  name: string;
  value: PlatformOption;
  description: string;
  cooldownHours: number;
  href: string;
};

export type PlatformTariffs = Record<PlatformOption, number>;

/** Matches backend `platform_rules.base_cooldown_hours` defaults after successful OTP use. */
export const PLATFORM_COOLDOWN_HOURS: Record<PlatformOption, number> = {
  Facebook: 36,
  Amazon: 48,
  WhatsApp: 48,
  Others: 24,
};

export function formatCooldownDuration(hours: number): string {
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "1 day" : `${days} days`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export const PLATFORM_CARDS: PlatformCard[] = [
  {
    name: "Facebook",
    value: "Facebook",
    description: "Get a number for Facebook account verification",
    cooldownHours: PLATFORM_COOLDOWN_HOURS.Facebook,
    href: "/platforms/facebook",
  },
  {
    name: "Amazon",
    value: "Amazon",
    description: "Get a number for Amazon account verification",
    cooldownHours: PLATFORM_COOLDOWN_HOURS.Amazon,
    href: "/platforms/amazon",
  },
  {
    name: "WhatsApp",
    value: "WhatsApp",
    description: "Get a number for WhatsApp account verification",
    cooldownHours: PLATFORM_COOLDOWN_HOURS.WhatsApp,
    href: "/platforms/whatsapp",
  },
  {
    name: "Global US Numbers",
    value: "Others",
    description: "Get a US number for any service",
    cooldownHours: PLATFORM_COOLDOWN_HOURS.Others,
    href: "/numbers",
  },
];

export type PlatformVisual = {
  label: PlatformOption;
  displayName: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  border: string;
};

export const PLATFORM_VISUALS: Record<
  PlatformOption,
  Omit<PlatformVisual, "label" | "displayName">
> = {
  Facebook: {
    Icon: Tag,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    border: "border-blue-500/35",
  },
  Amazon: {
    Icon: ShoppingBag,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    border: "border-orange-500/35",
  },
  WhatsApp: {
    Icon: ShoppingBag,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    border: "border-amber-500/35",
  },
  Others: {
    Icon: Globe,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    border: "border-emerald-500/35",
  },
};

export function serviceTypeToPlatform(raw: string | null | undefined): PlatformOption {
  const value = raw?.trim().toLowerCase() ?? "";
  if (value === "facebook") return "Facebook";
  if (value === "amazon") return "Amazon";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "walmart") return "WhatsApp";
  if (value === "others" || value === "other" || value === "generic") return "Others";
  return "Others";
}

/** Parse `?platform=` query on Get Number page. */
export function platformFromQueryParam(
  raw: string | null | undefined,
): PlatformOption | null {
  if (!raw?.trim()) {
    return null;
  }
  return serviceTypeToPlatform(raw.trim());
}

/** Direct link from Platforms → Get Number (avoids redirect race). */
export function numbersPageHref(platform: PlatformOption): string {
  if (platform === "Others") {
    return "/numbers";
  }
  return `/numbers?platform=${platform.toLowerCase()}`;
}

export function getPlatformVisual(platform: PlatformOption): PlatformVisual {
  const card = PLATFORM_CARDS.find((p) => p.value === platform) ?? PLATFORM_CARDS[0];
  const styles = PLATFORM_VISUALS[platform];
  return {
    label: platform,
    displayName: card.name,
    ...styles,
  };
}

export const DEFAULT_PLATFORM_TARIFFS: PlatformTariffs = {
  Facebook: 30,
  Amazon: 60,
  WhatsApp: 60,
  Others: 60,
};

export function normalizePlatformTariffs(
  raw?: Partial<{
    facebook: number;
    amazon: number;
    whatsapp: number;
    others: number;
  }> | null,
): PlatformTariffs {
  return {
    Facebook: Number(raw?.facebook ?? DEFAULT_PLATFORM_TARIFFS.Facebook),
    Amazon: Number(raw?.amazon ?? DEFAULT_PLATFORM_TARIFFS.Amazon),
    WhatsApp: Number(raw?.whatsapp ?? DEFAULT_PLATFORM_TARIFFS.WhatsApp),
    Others: Number(raw?.others ?? DEFAULT_PLATFORM_TARIFFS.Others),
  };
}

export function getPlatformPricePkr(
  platform: PlatformOption,
  tariffs?: PlatformTariffs,
): number {
  const source = tariffs ?? DEFAULT_PLATFORM_TARIFFS;
  return source[platform];
}
