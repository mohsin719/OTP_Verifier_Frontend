"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSessionRestore } from "@/hooks/use-session-restore";
import { useAuthStore } from "@/stores/auth-store";

export function GuestOnly({
  children,
  redirectTo = "/dashboard",
}: {
  children: ReactNode;
  redirectTo?: string;
}): ReactElement {
  const router = useRouter();
  const { ready, hydrated, isAuthenticated } = useSessionRestore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (ready && isAuthenticated) {
      const destination = user?.role === "ADMIN" ? "/manage" : redirectTo;
      router.replace(destination);
    }
  }, [ready, isAuthenticated, redirectTo, user?.role, router]);

  if (!hydrated || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
