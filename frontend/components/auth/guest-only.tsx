"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSessionRestore } from "@/hooks/use-session-restore";

export function GuestOnly({
  children,
  redirectTo = "/dashboard",
}: {
  children: ReactNode;
  redirectTo?: string;
}): ReactElement {
  const router = useRouter();
  const { ready, hydrated, isAuthenticated } = useSessionRestore();

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [ready, isAuthenticated, redirectTo, router]);

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
