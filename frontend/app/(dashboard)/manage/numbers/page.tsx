"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminNumbersPage(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace("/manage");
  }, [router]);

  return null;
}
