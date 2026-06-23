import type { ReactElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Shield, ShieldCheck, Wallet } from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export const metadata: Metadata = {
  title: "Privacy & Policies",
  description:
    "Privacy policy, terms of service, refunds, and security practices for US Num Hub.",
};

const LAST_UPDATED = "June 23, 2026";

const sections = [
  { id: "commitment", label: "Our commitment" },
  { id: "privacy", label: "Privacy policy" },
  { id: "security", label: "Security" },
  { id: "terms", label: "Terms of service" },
  { id: "refunds", label: "Refunds & usage" },
  { id: "contact", label: "Contact" },
] as const;

export default function PoliciesPage(): ReactElement {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden">
      <PublicHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Privacy &amp; Policies
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Clear, honest policies so you know how US Num Hub protects your data and
              how our verification service works.
            </p>
          </div>

          <nav
            className="mt-8 flex flex-wrap gap-2"
            aria-label="Policy sections"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className="mt-10 space-y-12 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <PolicySection id="commitment" title="Our commitment to you">
              <p>
                US Num Hub helps you receive OTP codes on temporary US phone numbers
                through a secure dashboard. We built this service with privacy and
                reliability in mind — your account, wallet, and verification activity
                are handled with care.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>We do not sell your personal data to third parties.</li>
                <li>We use industry-standard security for sign-in and sessions.</li>
                <li>We explain our rules clearly so there are no surprises.</li>
              </ul>
            </PolicySection>

            <PolicySection id="privacy" title="Privacy policy">
              <PolicySubheading>Information we collect</PolicySubheading>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">Account details</strong> — email,
                  username, and a unique public user ID when you register.
                </li>
                <li>
                  <strong className="text-foreground">Service usage</strong> — leased
                  numbers, OTP delivery status, wallet transactions, and platform
                  preferences needed to run the service.
                </li>
                <li>
                  <strong className="text-foreground">Technical data</strong> — basic
                  logs (IP address, browser type, timestamps) used for security,
                  fraud prevention, and troubleshooting.
                </li>
              </ul>

              <PolicySubheading>How we use your information</PolicySubheading>
              <ul className="list-disc space-y-2 pl-5">
                <li>To provide OTP delivery and manage your wallet balance.</li>
                <li>To keep your account secure and prevent abuse.</li>
                <li>To send important emails such as verification and password reset codes.</li>
                <li>To improve reliability and support when you contact us.</li>
              </ul>

              <PolicySubheading>Cookies &amp; sessions</PolicySubheading>
              <p>
                We use secure, httpOnly cookies to keep you signed in safely. Session
                tokens are stored with modern security practices. You can sign out at
                any time to end your session on a device.
              </p>

              <PolicySubheading>Data retention</PolicySubheading>
              <p>
                We keep account and transaction records as long as your account is
                active and as required for billing, security, and legal compliance.
                OTP content is used only to deliver your verification code through the
                dashboard.
              </p>
            </PolicySection>

            <PolicySection id="security" title="Security">
              <div className="grid gap-4 sm:grid-cols-2">
                <TrustCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Protected sign-in"
                  text="Passwords are hashed. Access tokens expire and refresh securely via httpOnly cookies."
                />
                <TrustCard
                  icon={<Lock className="h-5 w-5" />}
                  title="Encrypted connections"
                  text="All traffic between your browser and our servers uses HTTPS/TLS encryption."
                />
                <TrustCard
                  icon={<Shield className="h-5 w-5" />}
                  title="Account safeguards"
                  text="Rate limiting, role-based access, and monitoring help prevent misuse and unauthorized access."
                />
                <TrustCard
                  icon={<Wallet className="h-5 w-5" />}
                  title="Wallet integrity"
                  text="Balance changes are recorded in a transaction ledger. Debits and refunds are tied to your account."
                />
              </div>
              <p className="mt-4">
                No online service can guarantee 100% security, but we continuously
                update dependencies and follow security best practices to protect your
                account and data.
              </p>
            </PolicySection>

            <PolicySection id="terms" title="Terms of service">
              <PolicySubheading>Using the service</PolicySubheading>
              <ul className="list-disc space-y-2 pl-5">
                <li>You must be at least 18 years old to create an account.</li>
                <li>
                  Numbers are leased temporarily for legitimate verification purposes
                  only. Abuse, spam, or illegal activity is prohibited.
                </li>
                <li>
                  You are responsible for complying with the rules of any third-party
                  platform where you use a leased number.
                </li>
              </ul>

              <PolicySubheading>Platform selection</PolicySubheading>
              <p>
                OTP delivery is <strong className="text-foreground">platform-specific</strong>.
                You must select the correct platform before requesting a number. If you
                choose the wrong platform and do not receive an OTP, that is your
                responsibility. We are not liable for loss, refund, or replacement in
                such cases.
              </p>

              <PolicySubheading>Number lease</PolicySubheading>
              <ul className="list-disc space-y-2 pl-5">
                <li>Each number lease has a limited time window shown in your dashboard.</li>
                <li>
                  If you change platform while a number is still active, use{" "}
                  <strong className="text-foreground">Switch</strong> on the Get Number
                  page to release it before getting a new one.
                </li>
                <li>Pricing is shown on the Get Number page before you confirm.</li>
              </ul>
            </PolicySection>

            <PolicySection id="refunds" title="Refunds & usage">
              <PolicySubheading>When a refund may apply</PolicySubheading>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  If you <strong className="text-foreground">cancel</strong> a number
                  before an OTP is received, the lease fee may be refunded to your
                  wallet balance.
                </li>
                <li>
                  If a lease <strong className="text-foreground">expires</strong> without
                  an OTP, an automatic refund may be credited where applicable.
                </li>
              </ul>

              <PolicySubheading>When refunds do not apply</PolicySubheading>
              <ul className="list-disc space-y-2 pl-5">
                <li>After an OTP has already been received on a number.</li>
                <li>Wrong platform selected by the user.</li>
                <li>Delays or blocks caused by the third-party platform you are verifying with.</li>
                <li>Wallet top-ups processed through admin recharge (contact support for billing questions).</li>
              </ul>

              <PolicySubheading>Wallet balance</PolicySubheading>
              <p>
                Your wallet is used to pay for number leases. Top-ups are handled
                manually via admin WhatsApp. Keep your user ID ready when requesting
                a recharge from the Wallet or Get Number pages.
              </p>
            </PolicySection>

            <PolicySection id="contact" title="Contact">
              <p>
                Questions about privacy, security, or your account? Sign in and use
                the in-app support options, or reach us through the official WhatsApp
                contact shown in your Wallet recharge flow.
              </p>
              <p className="mt-4">
                <Link href="/" className="text-primary hover:underline">
                  ← Back to home
                </Link>
              </p>
            </PolicySection>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function PolicySubheading({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <h3 className="pt-2 text-base font-medium text-foreground">{children}</h3>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}): ReactElement {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}
