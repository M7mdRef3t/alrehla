"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { RefreshCcw, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#030712] text-white selection:bg-rose-500/30">
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Background Ambient Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="w-full max-w-xl space-y-12 text-center relative z-10">
            {/* Cinematic Icon */}
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-rose-500/20 blur-3xl animate-pulse rounded-full" />
              <div className="w-full h-full rounded-[2rem] bg-[#0B0F19] border border-rose-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.2)]">
                <ShieldAlert className="w-16 h-16 text-rose-500" />
              </div>
            </div>

            {/* Message Hierarchy */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                انقطاع حرج في المسار
              </h1>
              <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                حصل حاجة مش متوقعة عطلت السيستم بالكامل. متقلقش، الفريق الفني اتبلغ وهنرجع الرحلة لوضعها الطبيعي فوراً.
              </p>
            </div>

            {/* Interactive Recovery */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => reset()}
                className="group relative px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-[0_10px_40px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_50px_rgba(225,29,72,0.5)] active:scale-95 flex items-center gap-3"
              >
                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                محاولة إصلاح سريعة
              </button>
            </div>

            {/* Debug Payload (Visible only in non-production) */}
            {process.env.NODE_ENV !== "production" && (
              <div className="mt-16 text-left">
                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase text-rose-500/50 tracking-[0.2em] mb-4">Diagnostic Trace</p>
                  <pre className="text-xs font-mono text-slate-500 break-all whitespace-pre-wrap leading-relaxed">
                    {error.message || "Unknown systemic failure"}
                    {error.digest && `\n\nDigest: ${error.digest}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
