import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  getPlatformVisual,
  type PlatformOption,
} from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { ServiceBrandIcon } from "@/components/services/service-brand-icon";
import { CountryFlag } from "@/components/ui/country-flag";
import { useCurrencyStore, formatDualPrice } from "@/lib/currency";

type PlatformBannerProps = {
  platform: PlatformOption;
  mode: "selected" | "active";
  pricePkr: number;
  className?: string;
  customServiceName?: string;
  customEmoji?: string | null;
  serviceCode?: string;
  costUsd?: number | null;
  countryName?: string;
  countryFlag?: string;
  countryCode?: string;
};

export function PlatformBanner({
  platform,
  mode,
  pricePkr,
  className,
  customServiceName,
  customEmoji,
  serviceCode,
  costUsd,
  countryName,
  countryFlag,
  countryCode,
}: PlatformBannerProps): React.ReactElement {
  const visual = getPlatformVisual(platform);
  const Icon = visual.Icon;
  const displayName = customServiceName || visual.displayName;
  const exchangeRate = useCurrencyStore((s) => s.exchangeRate);
  const dualPrice = formatDualPrice(pricePkr, exchangeRate, costUsd);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-gradient-to-r from-blue-50/70 via-white to-slate-50/80 p-4 sm:p-5 shadow-sm transition-all",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={cn(
              "flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden p-1.5",
            )}
          >
            {serviceCode ? (
              <ServiceBrandIcon serviceCode={serviceCode} name={displayName} size={36} />
            ) : customEmoji ? (
              <span className="text-2xl">{customEmoji}</span>
            ) : (
              <Icon className={cn("h-7 w-7", visual.color)} aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                {mode === "active" ? "Active Line Leased" : "Selected Target Line"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {displayName}
              </h2>
              {countryName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                  {countryCode ? (
                    <CountryFlag code={countryCode} name={countryName} fallbackEmoji={countryFlag} size="xs" />
                  ) : (
                    <span>{countryFlag || "🌐"}</span>
                  )}
                  <span>{countryName}</span>
                </span>
              )}
            </div>

            {/* Prominent Dual Pricing Display */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <div className="inline-flex items-baseline gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-0.5 text-xs shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate:</span>
                <span className="text-xs sm:text-sm font-black text-blue-700 tabular-nums">{dualPrice.usd}</span>
                <span className="text-[11px] font-bold text-slate-600 tabular-nums">({dualPrice.pkr})</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {mode === "active"
                  ? `Use only on ${displayName} signup or verification.`
                  : "per OTP · 100% refund if SMS not received"}
              </p>
            </div>
          </div>
        </div>

        {mode === "selected" ? (
          <div className="flex items-center self-start sm:self-center shrink-0">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all shadow-2xs hover:text-blue-600 cursor-pointer active:scale-95"
            >
              <span>Change service</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
