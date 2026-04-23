"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthModal } from "@/modules/exploration/GoogleAuthModal";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && !loading && user) {
      router.replace("/");
    }
  }, [user, loading, router, mounted]);

  const handleClose = () => {
    // If they close the login modal, send them back to home
    router.push("/");
  };

  if (!mounted || loading || user) {
    // Loading state matching callback page
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white" dir="rtl">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-2xl backdrop-blur">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
          <h1 className="mb-3 text-2xl font-black">جاري التحقق...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950" dir="rtl">
      {/* 
        We use the existing GoogleAuthModal to ensure 100% logic and UI reuse.
        It renders as a fixed overlay, so the main background will act as the backdrop.
      */}
      <GoogleAuthModal
        isOpen={true}
        onClose={handleClose}
        onNotNow={handleClose}
      />
    </main>
  );
}
