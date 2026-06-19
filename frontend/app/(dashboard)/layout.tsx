import type { ReactElement } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return <DashboardShell>{children}</DashboardShell>;
}
