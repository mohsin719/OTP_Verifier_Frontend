import { Globe, ShoppingBag, Tag, type LucideIcon } from "lucide-react";

export const PLATFORM_OPTIONS = [
  "Facebook",
  "Amazon",
  "Walmart",
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

/** Matches backend `platform_rules.base_cooldown_hours` defaults after successful OTP use. */
export const PLATFORM_COOLDOWN_HOURS: Record<PlatformOption, number> = {
  Facebook: 36,
  Amazon: 48,
  Walmart: 48,
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
    name: "Walmart",
    value: "Walmart",
    description: "Get a number for Walmart account verification",
    cooldownHours: PLATFORM_COOLDOWN_HOURS.Walmart,
    href: "/platforms/walmart",
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
  Walmart: {
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
  if (value === "walmart") return "Walmart";
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

export function getPlatformPricePkr(platform: PlatformOption): number {
  return platform === "Facebook" ? 30 : 60;
}
