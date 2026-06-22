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
  priceLabel: string;
  href: string;
};

export const PLATFORM_CARDS: PlatformCard[] = [
  {
    name: "Facebook",
    value: "Facebook",
    description: "Get a number for Facebook account verification",
    priceLabel: "Rs 30 per OTP",
    href: "/platforms/facebook",
  },
  {
    name: "Amazon",
    value: "Amazon",
    description: "Get a number for Amazon account verification",
    priceLabel: "Rs 60 per OTP",
    href: "/platforms/amazon",
  },
  {
    name: "Walmart",
    value: "Walmart",
    description: "Get a number for Walmart account verification",
    priceLabel: "Rs 60 per OTP",
    href: "/platforms/walmart",
  },
  {
    name: "Global US Numbers",
    value: "Others",
    description: "Get a US number for any service",
    priceLabel: "Rs 60 per OTP",
    href: "/numbers",
  },
];
