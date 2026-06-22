"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Globe, Info, ShoppingBag, Smartphone, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authUpdatePreferredPlatform } from "@/lib/api";
import { PLATFORM_CARDS, formatCooldownDuration } from "@/lib/platforms";
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
  const selectedCooldown = formatCooldownDuration(selectedCard.cooldownHours);

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

      <div className="flex gap-2.5 rounded-lg border border-border/60 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          OTP pricing is shown on <strong className="text-foreground">Get Number</strong>.
          {" "}If you change platform while a number is still active, use{" "}
          <strong className="text-foreground">Switch</strong> on Get Number to release it
          and get a new one. After a number receives an OTP, it cannot be used again for
          the same platform for{" "}
          <strong className="text-foreground">{selectedCooldown}</strong> (for{" "}
          {selectedCard.name}).
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

      <Card className="fixed bottom-0 left-0 right-0 z-20 rounded-none border-x-0 border-b-0 border-t border-border/80 bg-background/95 backdrop-blur-md md:static md:rounded-xl md:border md:bg-card/80">
        <CardContent className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selected
            </p>
            <p className="truncate font-semibold text-foreground">
              {selectedCard.name}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full shrink-0 gap-2 sm:w-auto"
            disabled={isContinuing}
            onClick={() => void handleContinue()}
          >
            <Smartphone className="h-4 w-4" />
            {isContinuing ? "Please wait…" : "Continue to Get Number"}
            {!isContinuing ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
