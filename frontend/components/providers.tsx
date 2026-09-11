"use client";

import * as React from "react";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { GlobalLoader } from "@/components/ui/global-loader";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <Suspense fallback={null}>
        <GlobalLoader />
      </Suspense>
      {children}
      <Toaster
        richColors
        closeButton
        position="bottom-right"
        duration={4000}
        toastOptions={{
          classNames: {
            toast: "glass-panel border border-slate-200/90 shadow-xl font-sans text-xs sm:text-sm",
            title: "font-semibold text-slate-900",
            description: "text-slate-600 text-xs",
          },
        }}
      />
    </>
  );
}
