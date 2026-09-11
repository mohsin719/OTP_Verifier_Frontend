"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface CompanyLogoProps {
  /** The verified website domain (e.g. "google.com", "whatsapp.com") */
  domain?: string | null;
  /** Company or service name */
  name?: string;
  /** Optional service code identifier */
  serviceCode?: string;
  /** Size in pixels (square), default 32 */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Custom alt text */
  alt?: string;
}

const MONOGRAM_PALETTES = [
  { bg: "from-blue-600 to-indigo-700", text: "text-white" },
  { bg: "from-emerald-500 to-teal-700", text: "text-white" },
  { bg: "from-violet-600 to-purple-800", text: "text-white" },
  { bg: "from-amber-500 to-orange-600", text: "text-white" },
  { bg: "from-rose-500 to-pink-700", text: "text-white" },
  { bg: "from-cyan-500 to-blue-600", text: "text-white" },
  { bg: "from-fuchsia-600 to-pink-600", text: "text-white" },
  { bg: "from-indigo-500 to-sky-600", text: "text-white" },
];

function getMonogramPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return MONOGRAM_PALETTES[Math.abs(hash) % MONOGRAM_PALETTES.length];
}

function getInitials(name?: string, serviceCode?: string): string {
  const target = (name || serviceCode || "?").trim();
  const cleaned = target.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (!cleaned) return target.slice(0, 2).toUpperCase();

  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/**
 * Clean & normalize a domain string for Logo.dev CDN
 */
function cleanDomain(raw?: string | null): string | null {
  if (!raw) return null;
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, "");
  d = d.replace(/^www\./i, "");
  d = d.split("/")[0];
  d = d.split("?")[0];
  d = d.split("#")[0];
  d = d.replace(/:\d+$/, "");
  return d || null;
}

/**
 * Production-ready Company Logo Component powered exclusively by Logo.dev
 *
 * Rules:
 * 1. If domain is NULL or empty -> immediately render monogram avatar. Zero network requests!
 * 2. If domain is present -> load directly from Logo.dev CDN.
 * 3. If image fails to load -> seamlessly fallback to monogram initials avatar without showing broken icon.
 * 4. Lazy-loaded and cached by browser/CDN to stay well within 500k monthly requests.
 */
export function CompanyLogo({
  domain,
  name = "",
  serviceCode = "",
  size = 32,
  className = "",
  alt,
}: CompanyLogoProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);

  const normalizedDomain = cleanDomain(domain);
  const displayName = name || serviceCode || "Company";
  const initials = getInitials(name, serviceCode);
  const palette = getMonogramPalette(displayName);

  // Logo.dev Community publishable token
  const token =
    process.env.NEXT_PUBLIC_LOGODEV_PUBLIC_KEY || "pk_aPzxP0cSSiWJtGFrfhCjIg";

  // If domain is missing OR Logo.dev CDN request failed, render elegant monogram avatar
  if (!normalizedDomain || hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold shadow-xs select-none transition-transform duration-150",
          palette.bg,
          palette.text,
          className
        )}
        aria-label={displayName}
        title={displayName}
      >
        <span
          style={{
            fontSize: Math.max(9, Math.floor(size * 0.38)),
            letterSpacing: "-0.02em",
          }}
        >
          {initials}
        </span>
      </div>
    );
  }

  // Request optimal image resolution based on display size (retina 2x, max 128)
  const reqSize = size <= 32 ? 64 : 128;
  const logoUrl = `https://img.logo.dev/${encodeURIComponent(
    normalizedDomain
  )}?token=${token}&format=png&size=${reqSize}`;

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl bg-white/95 p-1 shadow-2xs overflow-hidden transition-transform duration-150 border border-slate-200/80 hover:scale-105",
        className
      )}
      title={`${displayName} (${normalizedDomain})`}
    >
      <img
        src={logoUrl}
        alt={alt || displayName}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain transition-opacity duration-200"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
