import type { ReactNode } from "react";
import { MessageCircle, User } from "lucide-react";
import type { LandingChromeVisibility } from '@/orchestration/chromeVisibility';
import type { AppShellScreen } from "@/domains/dawayir/store/navigation.store";
import { useMapState } from "@/domains/dawayir/store/map.store";

interface AppChromeShellProps {
  chromeVisibility: LandingChromeVisibility;
  authUser: { id?: string } | null;
  whatsAppLink: string | null;
  screen: AppShellScreen;
  onOpenProfile: () => void;
  onOpenWhatsApp: () => void;
  onOpenPulse: () => void;
  onOpenLibrary: () => void;
  onNavigate: (screen: AppShellScreen) => void;
  libraryOpen: boolean;
  children: ReactNode;
}

export function AppChromeShell({
  chromeVisibility,
  authUser,
  whatsAppLink,
  screen,
  onOpenProfile,
  onOpenWhatsApp,
  onOpenPulse,
  onOpenLibrary,
  onNavigate,
  libraryOpen,
  children
}: AppChromeShellProps) {
  const nodes = useMapState((s) => s.nodes);
  const archivedNodesCount = nodes.filter((node) => node.isNodeArchived).length;
  const hasActiveNodes = nodes.some((node) => !node.isNodeArchived);

  return (
    <>
      {chromeVisibility.showFloatingProfile && (
        <div className="fixed z-[80] top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-auto pl-4 md:hidden" dir="ltr">
          <button
            type="button"
            onClick={onOpenProfile}
            className="group w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0 cursor-pointer relative"
            style={{ color: "var(--text-secondary)" }}
            aria-label={authUser ? "حسابي" : "تسجيل الدخول"}
          >
            <span className="relative inline-flex items-center justify-center">
              <User className="w-5 h-5" />
              {authUser && (
                <span
                  className="absolute top-0 right-0 w-2 h-2 rounded-full"
                  style={{ background: "var(--soft-teal)", boxShadow: "0 0 0 2px var(--page-bg)" }}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="pointer-events-none absolute top-full mt-1 right-0 max-w-48 rounded-2xl px-3 py-1 text-[11px] font-medium leading-snug opacity-0 translate-y-1 bg-slate-900/90 text-slate-50 border border-white/10 backdrop-blur-md group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 text-center">
              {authUser ? "افتح حسابك" : "سجّل دخولك واحفظ رحلتك"}
            </span>
          </button>
        </div>
      )}

      {chromeVisibility.showFloatingWhatsApp && whatsAppLink && (
        <button
          type="button"
          onClick={onOpenWhatsApp}
          className="fixed z-40 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-6 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white w-12 h-12 shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
          title="تواصل واتساب"
          aria-label="تواصل واتساب"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
        </button>
      )}

      {children}

      {chromeVisibility.showMobileBottomNav && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-teal-500/15"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "calc(60px + env(safe-area-inset-bottom))"
          }}
          aria-label="التنقل الرئيسي"
        >
          {/* حياتي — Life OS Command Center */}
          <button
            type="button"
            onClick={() => onNavigate("life-os" as AppShellScreen)}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
            style={{ color: screen === "life-os" ? "#a78bfa" : "rgba(148,163,184,0.55)" }}
            aria-label="حياتي"
          >
            <span className="relative inline-flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: screen === "life-os" ? "drop-shadow(0 0 8px rgba(139,92,246,0.7))" : "none", transition: "filter 0.3s" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a7 7 0 0 1 0 14 7 7 0 0 1 0-14" />
                <circle cx="12" cy="9" r="2" fill="currentColor" stroke="none" />
                <path d="M12 14v4" />
                <path d="M9 18h6" />
              </svg>
            </span>
            <span className="text-[10px] font-semibold">حياتي</span>
          </button>
          {/* الخريطة */}
          <button
            type="button"
            onClick={() => onNavigate("map")}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
            style={{ color: screen === "map" ? "var(--soft-teal)" : "rgba(148,163,184,0.55)" }}
            aria-label="الخريطة"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="5.5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-[10px] font-semibold">الخريطة</span>
          </button>
          {/* المسار */}
          <button
            type="button"
            onClick={() => onNavigate("tools")}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
            style={{ color: screen === "tools" ? "var(--soft-teal)" : "rgba(148,163,184,0.55)" }}
            aria-label="المسار"
          >
            <span className="relative inline-flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                style={{ filter: screen === "tools" ? "drop-shadow(0 0 8px rgba(45,212,191,0.7))" : "none", transition: "filter 0.3s" }}
              >
                <path d="M3 3v18h18" />
                <path d="M7 15l4-4 3 3 5-6" />
              </svg>
              {screen !== "tools" && hasActiveNodes && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "var(--soft-teal)", boxShadow: "0 0 0 1.5px rgba(15,23,42,0.95)" }}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="text-[10px] font-semibold">المسار</span>
          </button>
          {/* النبض */}
          <button
            type="button"
            onClick={onOpenPulse}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
            style={{ color: "rgba(148,163,184,0.55)" }}
            aria-label="النبض"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-[10px] font-semibold">النبض</span>
          </button>
          {/* أنا */}
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200"
            style={{ color: screen === "settings" ? "var(--soft-teal)" : "rgba(148,163,184,0.55)" }}
            aria-label="أنا"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-[10px] font-semibold">أنا</span>
          </button>
        </nav>
      )}
    </>
  );
}
