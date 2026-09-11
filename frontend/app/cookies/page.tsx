import type { ReactElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how US Num Hub uses cookies to keep you signed in and improve your experience.",
};

const LAST_UPDATED = "September 11, 2026";

export default function CookiePolicyPage(): ReactElement {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden">
      <PublicHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">

          {/* Header */}
          <div className="mb-10 flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              <Cookie className="h-4 w-4" />
              <span>Cookie Policy</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              How we use cookies
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: {LAST_UPDATED}
            </p>
            <p className="mt-2 text-base text-slate-600 leading-relaxed">
              We keep this simple. US Num Hub uses a small number of cookies that are essential
              to make the site work. We do <strong>not</strong> use advertising cookies or sell
              your data to anyone.
            </p>
          </div>

          {/* Cards */}
          <div className="space-y-6">

            {/* Essential cookies */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Authentication cookies</h2>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    When you sign in, we store a secure session token so you stay logged in
                    as you navigate between pages. Without this cookie the site cannot
                    identify you and you would need to sign in on every page.
                  </p>
                  <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs font-mono text-slate-500">
                    sb-* (Supabase auth session) · HTTP-only · Expires with session
                  </div>
                </div>
              </div>
            </section>

            {/* Preference cookies */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <RefreshCw className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Preference storage</h2>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    We use your browser&apos;s <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code> (not a cookie)
                    to remember small preferences such as your currency display choice. This data
                    never leaves your device and is not sent to our servers.
                  </p>
                </div>
              </div>
            </section>

            {/* What we DON'T do */}
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-900">What we do NOT do</h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-emerald-800">
                    {[
                      "We do not use advertising or tracking cookies",
                      "We do not sell or share your data with advertisers",
                      "We do not use third-party analytics (e.g. Google Analytics)",
                      "We do not fingerprint your browser or device",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-500">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Your choices */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Your choices</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                You can click <strong>Reject</strong> on the cookie banner and the site will
                still work. The only thing you may lose is your login session being remembered
                across page loads (you may need to sign in again).
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                To clear all cookies, use your browser&apos;s settings (usually under{" "}
                <em>Privacy &amp; Security → Clear browsing data</em>).
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Questions?</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                If you have any questions about how we use cookies, you can reach us through
                our{" "}
                <Link href="/policies" className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
                  Privacy &amp; Policies page
                </Link>
                .
              </p>
            </section>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
