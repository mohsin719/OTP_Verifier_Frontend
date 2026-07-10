import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://usnumhub.com",
  ),
  title: {
    default: "US Num Hub — Virtual US numbers & OTP",
    template: "%s | US Num Hub",
  },
  description:
    "Purchase temporary US phone numbers and receive OTP codes in realtime for verification workflows.",
  applicationName: "US Num Hub",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "US Num Hub — Virtual SMS verification",
    description:
      "Secure temporary numbers, wallet billing, and realtime OTP delivery.",
    type: "website",
    siteName: "US Num Hub",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "US Num Hub",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "US Num Hub",
    description: "Virtual US numbers and realtime OTP verification.",
    images: ["/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  const isMaintenanceLocked =
    process.env.NEXT_PUBLIC_MAINTENANCE_LOCK === "true";
  const isMaintenanceMode =
    isMaintenanceLocked ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" ||
    process.env.MAINTENANCE_MODE === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} min-h-screen antialiased`}
      >
        <Providers>
          {isMaintenanceMode ? <MaintenanceScreen /> : children}
        </Providers>
      </body>
    </html>
  );
}

function MaintenanceScreen(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Temporary Notice</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Site is under maintenance
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We are performing scheduled updates. Please check back soon.
        </p>
      </section>
    </main>
  );
}
