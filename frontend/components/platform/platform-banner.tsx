import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getPlatformVisual,
  type PlatformOption,
} from "@/lib/platforms";
import { cn } from "@/lib/utils";

type PlatformBannerProps = {
  platform: PlatformOption;
  mode: "selected" | "active";
  pricePkr: number;
  className?: string;
};

export function PlatformBanner({
  platform,
  mode,
  pricePkr,
  className,
}: PlatformBannerProps): React.ReactElement {
  const visual = getPlatformVisual(platform);
  const Icon = visual.Icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        visual.border,
        visual.bgColor,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background/40",
            visual.border,
            visual.color,
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {mode === "active" ? "Number leased for" : "Your selected platform"}
          </p>
          <p className={cn("text-xl font-bold tracking-tight", visual.color)}>
            {visual.displayName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "active"
              ? `Use this number only on ${visual.displayName} signup or verification.`
              : `Rs ${pricePkr} per OTP · OTPs are matched to this platform only.`}
          </p>
        </div>
      </div>

      {mode === "selected" ? (
        <Link
          href="/platforms"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Change platform
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
