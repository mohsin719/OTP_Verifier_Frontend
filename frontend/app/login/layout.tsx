import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to US Num Hub to lease virtual US numbers and receive OTP codes.",
};

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
