"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseAbortError, safeGetSession, supabase } from "../../../src/services/supabaseClient";

function sanitizeNextPath(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("جارٍ إكمال تسجيل الدخول...");
  const nextPath = useMemo(() => sanitizeNextPath(searchParams?.get("next") ?? null), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const completeAuth = async () => {
      if (!supabase) {
        router.replace(nextPath);
        return;
      }

      try {
        const code = searchParams?.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          await safeGetSession();
        }

        if (!cancelled) {
          router.replace(nextPath);
        }
      } catch (error) {
        if (isSupabaseAbortError(error)) {
          if (!cancelled) {
            router.replace(nextPath);
          }
          return;
        }

        if (!cancelled) {
          setMessage("تعذّر إكمال تسجيل الدخول. أعد المحاولة من جديد.");
        }
      }
    };

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white" dir="rtl">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-2xl backdrop-blur">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
        <h1 className="mb-3 text-2xl font-black">تسجيل الدخول</h1>
        <p className="text-sm leading-7 text-slate-300">{message}</p>
      </div>
    </main>
  );
}

function AuthCallbackFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white" dir="rtl">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-2xl backdrop-blur">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
        <h1 className="mb-3 text-2xl font-black">تسجيل الدخول</h1>
        <p className="text-sm leading-7 text-slate-300">جارٍ إكمال تسجيل الدخول...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
