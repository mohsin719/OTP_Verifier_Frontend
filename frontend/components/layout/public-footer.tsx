import type { ReactElement } from "react";
import Link from "next/link";

export function PublicFooter(): ReactElement {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
          aria-label="Legal"
        >
          <Link
            href="/policies"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy &amp; Policies
          </Link>
          <Link
            href="/policies#privacy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/policies#terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/policies#refunds"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Refunds
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">
          US Num Hub — Virtual SMS verification platform
        </p>
      </div>
    </footer>
  );
}
