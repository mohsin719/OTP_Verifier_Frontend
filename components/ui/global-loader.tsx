"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPath = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (prevPath.current === null) {
      prevPath.current = currentPath;
      return;
    }

    if (prevPath.current === currentPath) return;
    prevPath.current = currentPath;

    setLoading(true);
    setProgress(10);

    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        return p + Math.random() * 15;
      });
    }, 150);

    const finish = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }, 600);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(finish);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/60 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
          transition: loading
            ? "width 200ms ease-out"
            : "width 200ms ease-out, opacity 300ms ease-out",
        }}
      />
    </div>
  );
}
