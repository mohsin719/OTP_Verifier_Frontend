"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoader(): null | ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef<string | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (prevPath.current === null) {
      prevPath.current = currentPath;
      return;
    }

    if (prevPath.current === currentPath) return;
    prevPath.current = currentPath;

    setLoading(true);

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
    }

    finishTimerRef.current = setTimeout(() => {
      setLoading(false);
      finishTimerRef.current = null;
    }, 450);

    return () => {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    };
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-[3px] overflow-hidden"
      aria-hidden="true"
    >
      <div className="global-route-loader h-full w-full bg-primary shadow-[0_0_8px_2px] shadow-primary/60" />
    </div>
  );
}
