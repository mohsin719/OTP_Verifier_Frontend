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
  Facebook: 48,
  Amazon: 72,
  Walmart: 72,
  Others: 48,
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
