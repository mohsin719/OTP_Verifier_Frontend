import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DashboardLayoutClient } from "./dashboard-layout-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
