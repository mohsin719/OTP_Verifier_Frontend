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
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs">
            <Link href="/services">
              <span>Get Number</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
