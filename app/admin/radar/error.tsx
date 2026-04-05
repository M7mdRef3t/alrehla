"use client";

import { useEffect } from "react";
import { RefreshCcw, ShieldAlert } from "lucide-react";

export default function RadarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Radar Screen Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center space-y-12 bg-background p-6">
      {/* Radar Error Icon */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-destructive/20 animate-pulse" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-10 w-10 animate-bounce" />
        </div>
      </div>

      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-destructive font-inter">
          Radar Offline
        </h1>
        <p className="mx-auto max-w-sm text-lg font-ibm-arabic text-muted-foreground">
          فقدنا الاتصال بالمؤشرات.. معلش حاجة عطلت في المسح الشامل.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-destructive px-10 py-4 text-xl font-bold text-destructive-foreground shadow-2xl transition-all hover:scale-105 active:scale-95"
      >
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] transition-all duration-1000 group-hover:bg-[position:100%_100%]" />
        <RefreshCcw className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
        إعادة تشغيل الرادار
      </button>

      {/* Dev only detail */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 max-w-lg rounded-lg border border-destructive/10 bg-destructive/5 p-4 font-mono text-xs text-destructive opacity-40">
          <p className="font-bold">Failure Digest: {error.digest ?? "No digest"}</p>
          <p className="mt-1 break-all">{error.message}</p>
        </div>
      )}
    </div>
  );
}
