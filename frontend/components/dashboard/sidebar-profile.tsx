"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AuthUser } from "@/lib/auth-types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/dashboard/user-avatar";

export function SidebarProfile({
  user,
  href,
  active,
  onNavigate,
}: {
  user: AuthUser;
  href: string;
  active?: boolean;
  onNavigate?: () => void;
}): ReactElement {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06]",
        active && "border-sky-400/30 bg-sky-500/10",
      )}
    >
      <UserAvatar
        userId={user.id}
        username={user.username}
        publicId={user.publicId}
        className="h-9 w-9"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">
          {user.username || user.publicId}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {user.email}
        </p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
