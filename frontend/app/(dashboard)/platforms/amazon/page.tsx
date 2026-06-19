"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AmazonPlatformPage(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userPlatform = user?.preferredPlatform || "Facebook";

  useEffect(() => {
    if (userPlatform !== "Amazon") {
      router.replace("/platforms");
      return;
    }
    router.replace("/numbers?platform=amazon");
  }, [router, userPlatform]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to number acquisition...</p>
    </div>
  );
}
