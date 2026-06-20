"use client";

import { useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AVATAR_PRESETS,
  getAvatarImageUrl,
  getAvatarPreset,
} from "@/lib/profile-avatars";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function AvatarPickerDialog({
  open,
  onOpenChange,
  selectedId,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onConfirm: (avatarId: string) => void;
}): ReactElement {
  const [draftId, setDraftId] = useState(selectedId);

  function handleOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      setDraftId(selectedId);
    }
    onOpenChange(nextOpen);
  }

  function handleSave(): void {
    onConfirm(draftId);
    onOpenChange(false);
  }

  const previewPreset = getAvatarPreset(draftId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your avatar</DialogTitle>
          <DialogDescription>
            Pick a unique illustrated avatar — it appears in your sidebar and
            profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-5">
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAvatarImageUrl(previewPreset)}
              alt={previewPreset.label}
              className="h-full w-full object-cover"
            />
          </div>
          <p className="text-sm font-medium">{previewPreset.label}</p>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {AVATAR_PRESETS.map((preset) => {
            const selected = draftId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDraftId(preset.id)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-full transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
                aria-label={`Select ${preset.label} avatar`}
                aria-pressed={selected}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAvatarImageUrl(preset)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {selected ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-primary/25">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
