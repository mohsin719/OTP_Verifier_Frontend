"use client";

import type { ReactElement } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getAvatarImageUrl,
  getAvatarInitials,
  getAvatarPreset,
  resolveAvatarId,
} from "@/lib/profile-avatars";
import { useProfileStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";

export function UserAvatar({
  userId,
  username,
  publicId,
  className,
  fallbackClassName,
}: {
  userId: string;
  username?: string | null;
  publicId?: string | null;
  className?: string;
  fallbackClassName?: string;
}): ReactElement {
  const storedId = useProfileStore((s) => s.avatarByUserId[userId] ?? null);
  const avatarId = resolveAvatarId(storedId, userId);
  const preset = getAvatarPreset(avatarId);
  const initials = getAvatarInitials(username, publicId);

  return (
    <Avatar className={className}>
      <AvatarImage
        src={getAvatarImageUrl(preset)}
        alt={`${preset.label} avatar`}
      />
      <AvatarFallback
        className={cn("bg-muted text-muted-foreground", fallbackClassName)}
        delayMs={600}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
