"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Globe, ShoppingBag, Smartphone, Tag, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authUpdatePreferredPlatform } from "@/lib/api";
import { PLATFORM_CARDS } from "@/lib/platforms";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const platformIcons = {
  Facebook: Tag,
  Amazon: ShoppingBag,
  Walmart: ShoppingBag,
  Others: Globe,
} as const;

const platformStyles = {
  Facebook: { color: "text-blue-500", bgColor: "bg-blue-500/10", border: "border-blue-500/40" },
  Amazon: { color: "text-orange-500", bgColor: "bg-orange-500/10", border: "border-orange-500/40" },
  Walmart: { color: "text-amber-500", bgColor: "bg-amber-500/10", border: "border-amber-500/40" },
  Others: { color: "text-emerald-500", bgColor: "bg-emerald-500/10", border: "border-emerald-500/40" },
} as const;

export default function PlatformsPage(): React.ReactElement {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setPreferredPlatform = useAuthStore((s) => s.setPreferredPlatform);
  const savedPlatform = user?.preferredPlatform || "Facebook";

  const [selected, setSelected] = useState(savedPlatform);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    setSelected(savedPlatform);
  }, [savedPlatform]);

  const selectedCard =
    PLATFORM_CARDS.find((p) => p.value === selected) ?? PLATFORM_CARDS[0];

  async function handleContinue(): Promise<void> {
    if (!token) return;

    setIsContinuing(true);

    if (selected !== savedPlatform) {
      const res = await authUpdatePreferredPlatform(selected, token);
      if (!res.success) {
        toast.error(res.error);
        setIsContinuing(false);
        return;
      }
      setPreferredPlatform(res.data.preferredPlatform);
    }

    setIsContinuing(false);
    router.push(selectedCard.href);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 pb-28">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Choose Platform
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Pick where you need OTP verification. Tap a platform, then continue.
        </p>
      </div>

      <div
        className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90"
        role="alert"
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        <p>
          <strong className="text-amber-50">Important Notice:</strong> OTPs are issued
          only for the selected platform. Please double-check your selection before
          continuing. If the wrong platform is selected, any resulting OTP failure is
          the buyer&apos;s responsibility.
        </p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="OTP platform">
        {PLATFORM_CARDS.map((platform) => {
          const Icon = platformIcons[platform.value];
          const styles = platformStyles[platform.value];
          const isSelected = selected === platform.value;

          return (
            <button
              key={platform.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(platform.value)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all",
                "hover:border-primary/40 hover:bg-secondary/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isSelected
                  ? cn("border-primary bg-primary/5 shadow-sm ring-1 ring-primary/25", styles.border)
                  : "border-border/60 bg-card/40",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    styles.bgColor,
                    styles.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{platform.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {platform.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                  ) : (
                    <span className="block h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <PlatformActionFooter
        selectedCard={selectedCard}
        isContinuing={isContinuing}
        onContinue={() => void handleContinue()}
      />
    </div>
  );
}

function PlatformActionFooter({
  selectedCard,
  isContinuing,
  onContinue,
}: {
  selectedCard: (typeof PLATFORM_CARDS)[number];
  isContinuing: boolean;
  onContinue: () => void;
}): React.ReactElement {
  const Icon = platformIcons[selectedCard.value];
  const styles = platformStyles[selectedCard.value];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 md:static">
      <div className="border-t border-border/60 bg-background/95 backdrop-blur-md md:rounded-2xl md:border md:bg-card/60 md:shadow-sm">
        <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-5">
          <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
            OTP pricing is shown on{" "}
            <strong className="font-medium text-foreground">Get Number</strong>. If you
            change platform while a number is active, use{" "}
            <strong className="font-medium text-foreground">Switch</strong> on Get Number
            to release it and get a new one.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border/50 bg-secondary/25 px-4 py-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  styles.bgColor,
                  styles.color,
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Selected platform
                </p>
                <p className="truncate text-base font-semibold text-foreground">
                  {selectedCard.name}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="h-auto min-h-12 w-full gap-2 px-6 py-3 text-base font-semibold sm:w-auto sm:min-w-[220px]"
              disabled={isContinuing}
              onClick={onContinue}
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {isContinuing ? "Please wait…" : "Continue"}
              </span>
              {!isContinuing ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
