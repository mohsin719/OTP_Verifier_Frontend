import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";

export function PublicHeader(): ReactElement {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandLogo href="/" imageClassName="h-9 w-9" />
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/register">
              Get started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
