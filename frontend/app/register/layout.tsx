import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create account",
  description: "Register for US Num Hub and start receiving OTP codes on virtual US numbers.",
};

export default function RegisterLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
