import { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Wrench, BookOpen, Info, LogIn, Sun, Moon, GraduationCap } from "lucide-react";
import { useAuthState } from "../state/authState";
import { useAchievementState } from "../state/achievementState";
import { useThemeState } from "../state/themeState";

const SCREEN_MAP: Record<string, string> = {
  home:      "landing",
  tools:     "tools",
  stories:   "stories",
  resources: "resources",
  about:     "about",
};

const TAB_ITEMS = [
  { id: "home",      label: "الرئيسية",      icon: Map },
  { id: "tools",     label: "الأدوات",       icon: Wrench },
  { id: "stories",   label: "قصص",           icon: BookOpen },
  { id: "resources", label: "تعلّم",          icon: GraduationCap },
  { id: "about",     label: "لماذا الرحلة؟", icon: Info },
] as const;

type TabId = typeof TAB_ITEMS[number]["id"];

/** Map active screen → nav tab id */
function getActiveTabId(screen?: string): string {
  if (!screen || screen === "landing") return "home";
  if (screen === "tools" || screen === "guided" || screen === "mission") return "tools";
  if (screen === "resources" || screen === "behavioral-analysis" || screen === "quizzes") return "resources";
  return screen;
}

export interface PlatformTabBarProps {
  activeScreen?: string;
  onNavigate?: (id: TabId | string) => void;
  onLogin?: () => void;
}

export const PlatformTabBar = memo(function PlatformTabBar({
  activeScreen,
  onNavigate,
  onLogin,
}: PlatformTabBarProps) {
  const user        = useAuthState((s) => s.user);
  const isLoggedIn  = Boolean(user);

  // #3 — real badge from achievement state
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const hasUnread            = isLoggedIn && Boolean(lastNewAchievementId);

  // #2 — dynamic active tab
  const activeTabId = getActiveTabId(activeScreen);

  // #5 — slide-up entry animation on mount
  const [entryDone, setEntryDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntryDone(true), 160);
    return () => clearTimeout(t);
  }, []);

  // Dark/Light mode toggle
  const resolvedTheme = useThemeState((s) => s.resolvedTheme);
  const setTheme      = useThemeState((s) => s.setTheme);
  const isDark        = resolvedTheme === "dark";
  const handleThemeToggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  // #1 — navigate with SCREEN_MAP
  const handleNav = (id: TabId | string) => {
    onNavigate?.(SCREEN_MAP[id as string] ?? id);
  };

  return (
    <motion.nav
      id="platform-tab-bar"
      role="navigation"
      dir="rtl"
      aria-label="التنقل السفلي"
      // #5 — entry animation: slide up from bottom
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: "0%", opacity: entryDone ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="fixed bottom-0 right-0 left-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Glass container */}
      <div
        className="flex items-center justify-around
                   backdrop-blur-xl bg-slate-900/90
                   border-t border-white/10
                   shadow-[0_-4px_24px_rgba(0,0,0,0.5)]
                   px-2 pt-2 pb-1"
      >
        {TAB_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTabId === id;
          // Show badge on "stories" tab if there's a new achievement (contextually good)
          const showBadge = id === "home" && hasUnread;

          return (
            <button
              key={id}
              type="button"
              id={`tab-bar-${id}`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleNav(id)}
              className="flex flex-col items-center gap-1 flex-1 py-1 relative"
            >
              {/* #2 — Active indicator */}
              {isActive && (
                <motion.span
                  layoutId="tab-bar-indicator"
                  className="absolute inset-0 rounded-xl bg-teal-500/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                    isActive ? "text-teal-400" : "text-slate-500"
                  }`}
                />
                {/* #3 — Real badge dot */}
                <AnimatePresence>
                  {showBadge && (
                    <motion.span
                      key="tab-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400
                                 ring-1 ring-slate-900 animate-pulse"
                    />
                  )}
                </AnimatePresence>
              </div>
              <span
                className={`text-[10px] font-medium relative z-10 transition-colors duration-200 ${
                  isActive ? "text-teal-400" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}

        {/* زر الثيم — متاح دائماً */}
        <button
          type="button"
          id="tab-bar-theme-toggle"
          aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
          onClick={handleThemeToggle}
          className="flex flex-col items-center gap-1 flex-1 py-1"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.span
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 flex items-center justify-center text-slate-500"
              >
                <Sun className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 flex items-center justify-center text-slate-500"
              >
                <Moon className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-medium text-slate-500">
            {isDark ? "فاتح" : "داكن"}
          </span>
        </button>

        {/* زر تسجيل الدخول لو مش مسجّل */}
        {!isLoggedIn && (
          <button
            type="button"
            id="tab-bar-login"
            aria-label="ابدأ الآن"
            onClick={onLogin}
            className="flex flex-col items-center gap-1 flex-1 py-1"
          >
            <span className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center
                             shadow-[0_0_12px_rgba(45,212,191,0.4)]">
              <LogIn className="w-4 h-4 text-slate-900" />
            </span>
            <span className="text-[10px] font-medium text-teal-400">ابدأ</span>
          </button>
        )}
      </div>
    </motion.nav>
  );
});
