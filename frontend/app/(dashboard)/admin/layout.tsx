"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const router = useRouter();
  const { user, token, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }

  return <>{children}</>;
}
