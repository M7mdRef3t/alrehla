"use client";

import { useEffect } from "react";
import { MoveRight, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an analytics service or dashboard
    console.error("Root Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-6">
        {/* Error Visual */}
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse" />
          <div className="flex h-full w-full items-center justify-center rounded-full bg-destructive/20 text-destructive text-4xl">
            ⚠️
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
            توقف مؤقت في الرحلة..
          </h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground">
            معلش، حاجة وقفتنا وإحنا بنرتبلك الطريق. متقلقش، تقدر تجرب تاني أو ترجع لرحلتك.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-lg font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCcw className="h-5 w-5" />
            جرب تاني
          </button>
          
          <a
            href="/"
            className="flex items-center gap-2 rounded-full border border-input bg-background px-8 py-3 text-lg font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          >
            كمّل رحلتك
            <MoveRight className="mr-2 h-5 w-5 rotate-180" />
          </a>
        </div>

        {/* Small Debug Note (Optional) */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-12 max-w-md overflow-hidden rounded-lg bg-muted p-4 text-left font-mono text-xs text-muted-foreground opacity-50">
            <p className="font-bold underline mb-2">Debug Info (Dev Only):</p>
            <p className="break-all">{error.message}</p>
            {error.digest && <p className="mt-1 italic">Digest: {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
