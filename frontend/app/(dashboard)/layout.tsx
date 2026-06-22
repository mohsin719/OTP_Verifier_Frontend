"use client";

import type { ReactElement } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionKeeper } from "@/components/auth/session-keeper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return (
    <DashboardShell>
      <SessionKeeper />
      <div className="page-content">{children}</div>
    </DashboardShell>
  );
}
