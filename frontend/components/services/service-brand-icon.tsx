"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

import { CompanyLogo } from "./company-logo";

export interface ServiceBrandIconProps {
  serviceCode: string;
  name?: string;
  className?: string;
  size?: number;
  websiteDomain?: string | null;
}

export { CompanyLogo };

// ─── Service Code to Official Company Domain Registry ───
// Directly routes to the company's real domain for instant high-res vector/PNG logo retrieval
const CODE_TO_DOMAIN: Record<string, string> = {
  // Top Popular
  wa: "whatsapp.com",
  tg: "telegram.org",
  go: "google.com",
  fb: "facebook.com",
  ig: "instagram.com",
  lf: "tiktok.com",
  tt: "pinterest.com",
  dr: "openai.com",
  tw: "x.com",
  wx: "apple.com",
  mm: "microsoft.com",
  mt: "steampowered.com",
  sn: "olx.com",
  fu: "snapchat.com",
  ds: "discord.com",
  ts: "paypal.com",
  am: "amazon.com",
  wr: "walmart.com",
  vi: "viber.com",
  nf: "netflix.com",
  sp: "spotify.com",
  alj: "soundcloud.com",
  ub: "uber.com",
  tn: "linkedin.com",
  rd: "reddit.com",
  oi: "tinder.com",
  ba: "binance.com",
  re: "revolut.com",
  cb: "coinbase.com",
  ws: "wise.com",

  // Social, Dating & Messaging
  uk: "airbnb.com",
  hb: "twitch.tv",
  mo: "bumble.com",
  qv: "badoo.com",
  vz: "hinge.co",
  vm: "okcupid.com",
  yw: "grindr.com",
  wg: "skout.com",
  ama: "wooplus.com",
  axr: "match.com",
  pf: "pof.com",
  me: "line.me",
  wb: "wechat.com",
  rc: "skype.com",
  kt: "kakaocorp.com",
  im: "imo.im",
  et: "clubhouse.com",
  bl: "bigo.tv",
  vk: "vk.com",
  kf: "weibo.com",
  ok: "ok.ru",
  fd: "mamba.ru",
  qq: "qq.com",
  ef: "nextdoor.com",

  // Tech, AI & Communication
  acz: "anthropic.com",
  gf: "voice.google.com",
  git: "github.com",
  dp: "proton.me",
  mb: "yahoo.com",
  ya: "yandex.com",
  li: "baidu.com",
  ma: "mail.ru",
  tc: "rambler.ru",
  pm: "aol.com",
  ayz: "moonshot.cn",
  aiz: "brevo.com",
  gs: "samsung.com",
  zoom: "zoom.us",
  slack: "slack.com",

  // Shopping & Retail
  dh: "ebay.com",
  ali: "aliexpress.com",
  hx: "shein.com",
  ep: "temu.com",
  ka: "shopee.com",
  kc: "vinted.com",
  oz: "poshmark.com",
  dg: "mercari.com",
  zm: "offerup.com",
  wc: "craigslist.org",
  bex: "whatnot.com",
  ew: "nike.com",
  target: "target.com",
  ikea: "ikea.com",
  zara: "zara.com",
  etsy: "etsy.com",
  shopify: "shopify.com",
  sg: "ozon.ru",
  uu: "wildberries.ru",

  // Food, Delivery, Rides & Travel
  tu: "lyft.com",
  ac: "doordash.com",
  nz: "foodpanda.com",
  deliveroo: "deliveroo.com",
  tx: "bolt.eu",
  jg: "grab.com",
  rr: "wolt.com",
  ul: "getir.com",
  aba: "rappi.com",
  abe: "foodora.com",
  yi: "yemeksepeti.com",
  ry: "mcdonalds.com",
  kfc: "kfc.com",
  starbucks: "starbucks.com",
  burgerking: "burgerking.com",
  ua: "blablacar.com",
  booking: "booking.com",
  tripadvisor: "tripadvisor.com",
  expedia: "expedia.com",

  // Finance, Crypto & Banking
  revolut: "revolut.com",
  bybit: "bybit.com",
  stripe: "stripe.com",
  klarna: "klarna.com",
  zr: "papara.com",
  bp: "gofundme.com",
  bd: "x5.ru",

  // Gaming & Entertainment
  bz: "blizzard.com",
  ahb: "ubisoft.com",
  playstation: "playstation.com",
  epicgames: "epicgames.com",
  riotgames: "riotgames.com",
  ea: "ea.com",
  oe: "codashop.com",
  vp: "kwai.com",
  alg: "ankama.com",
  yl: "yalla.live",
  zy: "nttgame.com",

  // Work, Education & Others
  cn: "fiverr.com",
  gq: "freelancer.com",
  upwork: "upwork.com",
  coursera: "coursera.org",
  udemy: "udemy.com",
  duolingo: "duolingo.com",
  medium: "medium.com",
  app: "classpass.com",
  qf: "xiaohongshu.com",
  fs: "sikayetvar.com",
};

/**
 * Cleanly resolves any service name or code to its verified web domain
 */
function resolveServiceDomain(serviceCode: string, name: string): string {
  const code = (serviceCode || "").toLowerCase().trim();
  if (CODE_TO_DOMAIN[code]) {
    return CODE_TO_DOMAIN[code];
  }

  const raw = (name || "").toLowerCase().trim();

  // If name already contains a full domain (e.g. "vk.com", "ok.ru", "imo.im", "pof.com")
  const domainMatch = raw.match(/([a-z0-9-]+\.[a-z]{2,})/i);
  if (domainMatch && domainMatch[1]) {
    return domainMatch[1];
  }

  // Only return verified corporate domains; do not guess for unknown/workless services
  return "";
}

/**
 * Deterministic color palette generator for initials fallback
 */
function getMonogramPalette(text: string): { bg: string; text: string } {
  const palettes = [
    { bg: "from-blue-600 to-indigo-700", text: "text-white" },
    { bg: "from-violet-600 to-purple-800", text: "text-white" },
    { bg: "from-emerald-500 to-teal-700", text: "text-white" },
    { bg: "from-rose-500 to-pink-700", text: "text-white" },
    { bg: "from-amber-500 to-orange-600", text: "text-white" },
    { bg: "from-sky-500 to-cyan-700", text: "text-white" },
    { bg: "from-fuchsia-600 to-pink-800", text: "text-white" },
    { bg: "from-indigo-600 to-blue-800", text: "text-white" },
    { bg: "from-teal-600 to-emerald-800", text: "text-white" },
    { bg: "from-slate-700 to-slate-900", text: "text-white" },
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

function getMonogram(name: string, code: string): string {
  const cleaned = (name || code || "S").trim();
  const parts = cleaned.split(/[\s/+\-_]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2).toUpperCase();
  }
  return cleaned.charAt(0).toUpperCase();
}

/**
 * High-Performance Company Logo Renderer
 * - Powered 100% by Logo.dev CDN (500k monthly requests community plan)
 * - Uses verified catalog website_domain or falls back to registered company domain
 * - If domain is missing, immediately renders colorful monogram initials avatar
 * - Seamlessly falls back to initials on any network error (zero broken images)
 */
export function ServiceBrandIcon({
  serviceCode,
  name = "",
  className = "",
  size = 28,
  websiteDomain,
}: ServiceBrandIconProps): React.ReactElement {
  const domain =
    websiteDomain !== undefined
      ? websiteDomain
      : resolveServiceDomain(serviceCode, name);

  return (
    <CompanyLogo
      domain={domain}
      name={name}
      serviceCode={serviceCode}
      size={size}
      className={className}
    />
  );
}
