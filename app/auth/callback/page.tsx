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
        console.error("[AuthCallback] Supabase client is null.");
        router.replace(nextPath);
        return;
      }

      try {
        const code = searchParams?.get("code");
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        
        console.log("[AuthCallback] URL Status:", {
          hasCode: !!code,
          hash: hash,
          origin: typeof window !== "undefined" ? window.location.origin : "unknown"
        });

        if (code) {
          console.log("[AuthCallback] Exchanging code for session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[AuthCallback] Exchange error details:", error);
            throw error;
          }
          console.log("[AuthCallback] Session exchange successful.");
        } else if (hash.includes("access_token")) {
          console.log("[AuthCallback] Extracting tokens manually from hash...");
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error("[AuthCallback] Manual setSession error:", error);
              throw error;
            }
            console.log("[AuthCallback] Session committed to storage. User:", data.session?.user?.email);
          } else {
             console.warn("[AuthCallback] Hash contained access_token but failed to parse correctly.");
          }
        } else if (hash.includes("error")) {
          console.error("[AuthCallback] Error provided in hash:", hash);
          setMessage(`خطأ من مزود الخدمة: ${decodeURIComponent(hash)}`);
          return;
        } else {
          console.log("[AuthCallback] No code or auth hash found, checking for existing session...");
          const session = await safeGetSession();
          console.log("[AuthCallback] safeGetSession result found:", !!session);
        }

        if (!cancelled) {
          console.log("[AuthCallback] Final redirection to:", nextPath);
          // Use full-page navigation to ensure the destination loads fresh JS
          // that reads the session from localStorage (avoids dev Fast Refresh clearing state).
          // Small delay to let Supabase finish writing to storage.
          await new Promise(resolve => setTimeout(resolve, 300));
          window.location.replace(nextPath);
        }


      } catch (error) {
        console.error("[AuthCallback] CRITICAL ERROR during callback process:", error);
        
        // Check for the specific "Invalid name" fetch error
        const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
        if (errorMessage.includes("Invalid name") || errorMessage.includes("fetch")) {
          console.error("[AuthCallback] Detected likely Header construction failure. Check environment variables for non-ASCII characters.");
        }

        if (isSupabaseAbortError(error)) {
          console.log("[AuthCallback] Abort error ignored.");
          if (!cancelled) {
            router.replace(nextPath);
          }
          return;
        }

        if (!cancelled) {
          setMessage(`تعذّر إكمال تسجيل الدخول: ${errorMessage}`);
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
