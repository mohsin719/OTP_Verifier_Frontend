"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CountryFlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  code: string;
  name?: string;
  fallbackEmoji?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_STYLES: Record<string, string> = {
  xs: "w-4 h-2.5",
  sm: "w-5 h-3.5",
  md: "w-6 h-4",
  lg: "w-8 h-5",
  xl: "w-10 h-7",
};

export function CountryFlag({
  code,
  name,
  fallbackEmoji,
  size = "md",
  className,
  ...props
}: CountryFlagProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedCode = (code || "").trim().toLowerCase();

  // If code is empty or image failed, render fallback
  if (!normalizedCode || hasError) {
    return (
      <span
        aria-label={name || code}
        title={name || code}
        className={cn(
          "inline-flex items-center justify-center font-normal select-none leading-none",
          className
        )}
      >
        {fallbackEmoji || normalizedCode.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${normalizedCode}.png`}
      srcSet={`https://flagcdn.com/w80/${normalizedCode}.png 2x`}
      alt={name ? `${name} flag` : `${code.toUpperCase()} flag`}
      title={name || code.toUpperCase()}
      loading="lazy"
      onError={() => setHasError(true)}
      className={cn(
        "inline-block object-cover rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/10 shrink-0",
        SIZE_STYLES[size] || SIZE_STYLES.md,
        className
      )}
      {...props}
    />
  );
}
