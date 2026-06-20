import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href,
  className,
  imageClassName,
  showText = true,
  textClassName,
  variant = "default",
}: {
  href?: string;
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: "default" | "sidebar";
}): ReactElement {
  const content = (
    <>
      <Image
        src="/brand/logo.png"
        alt="US Num Hub"
        width={160}
        height={160}
        priority
        className={cn(
          "shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.04]",
          variant === "sidebar"
            ? "h-11 w-11 drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]"
            : "h-10 w-10",
          imageClassName,
        )}
      />
      {showText ? (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            variant === "sidebar" && "text-[1.02rem] text-white",
            textClassName,
          )}
        >
          US Num Hub
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch={false}
        className={cn("group flex items-center gap-3", className)}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-3", className)}>{content}</div>;
}

export function SidebarBrandHeader({
  href = "/dashboard",
}: {
  href?: string;
}): ReactElement {
  return (
    <div className="sidebar-brand-header relative shrink-0 overflow-hidden px-4 py-5">
      <div aria-hidden className="sidebar-brand-mesh pointer-events-none absolute inset-0" />
      <div aria-hidden className="sidebar-brand-shine pointer-events-none absolute inset-0" />
      <BrandLogo
        href={href}
        variant="sidebar"
        className="relative z-10"
      />
    </div>
  );
}
