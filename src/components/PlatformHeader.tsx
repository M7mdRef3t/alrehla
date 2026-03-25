import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogIn, User, ChevronDown, LogOut, Settings, Map, Wrench, BookOpen, Info, Sun, Moon, BarChart2, Sparkles, Brain } from "lucide-react";
import { AlrehlaIcon } from "./logo/AlrehlaIcon";
import { useAuthState } from "../state/authState";
import { useAchievementState } from "../state/achievementState";
import { useThemeState } from "../state/themeState";
import { supabase } from "../services/supabaseClient";
import { NotificationsPanel } from "./NotificationsPanel";

/** روابط التنقل الرئيسية */
const NAV_LINKS = [
  { id: "home",     label: "الرئيسية",      icon: Map },
  { id: "tools",    label: "الأدوات",       icon: Wrench },
  { id: "insights", label: "تحليلات",       icon: BarChart2 },
  { id: "stories",  label: "قصص",           icon: BookOpen },
  { id: "about",    label: "لماذا الرحلة؟", icon: Info },
] as const;

type NavLinkId = typeof NAV_LINKS[number]["id"];

/** Map header nav IDs → app screen names */
const SCREEN_MAP: Record<string, string> = {
  home:     "landing",
  landing:  "landing",
  tools:    "tools",
  stories:  "stories",
  about:    "about",
  insights: "insights",
  quizzes:  "quizzes",
  "behavioral-analysis": "behavioral-analysis",
  resources: "resources",
  profile:  "landing",
  settings: "settings",
};

export interface PlatformHeaderProps {
  /** الشاشة المفعّلة حاليًا */
  activeScreen?: string;
  /** تشغيل تسجيل الدخول */
  onLogin?: () => void;
  /** الانتقال إلى شاشة */
  onNavigate?: (id: NavLinkId | string) => void;
  /** تسجيل الخروج مع redirect */
  onLogout?: () => void;
}

// --- Helper: map screen name → nav link id for active detection ---
function getActiveNavId(screen?: string): string {
  if (!screen || screen === "landing") return "home";
  if (screen === "tools" || screen === "guided" || screen === "mission") return "tools";
  return screen;
}

export const PlatformHeader = memo(function PlatformHeader({
  activeScreen,
  onLogin,
  onNavigate,
  onLogout,
}: PlatformHeaderProps) {
  const [scrolled, setScrolled]         = useState(false);
  const [hidden, setHidden]             = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  // #5 — entry animation
  const [entryDone, setEntryDone]       = useState(false);
  const lastScrollY  = useRef(0);
  const userMenuRef  = useRef<HTMLDivElement>(null);
  const bellRef      = useRef<HTMLButtonElement>(null);

  // ── Auth state ──
  const user        = useAuthState((s) => s.user);
  const firstName   = useAuthState((s) => s.firstName);
  const displayName = useAuthState((s) => s.displayName);
  const status      = useAuthState((s) => s.status);
  const isLoggedIn  = Boolean(user);
  const avatarInitial = (firstName?.[0] ?? displayName?.[0] ?? "أ").toUpperCase();
  const avatarUrl     =
    (user as { user_metadata?: { avatar_url?: string } } | null)
      ?.user_metadata?.avatar_url ?? null;

  // #3 — Real notification badge: new achievement = unread notification
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew         = useAchievementState((s) => s.clearLastNew);
  const hasUnread            = isLoggedIn && Boolean(lastNewAchievementId);

  // #2 — Active state from screen prop
  const resolvedTheme = useThemeState((s) => s.resolvedTheme);
  const setTheme      = useThemeState((s) => s.setTheme);
  const isDark        = resolvedTheme === "dark";
  const handleThemeToggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  const activeNavId = getActiveNavId(activeScreen);

  // #5 — Slide-down entry animation on first mount
  useEffect(() => {
    const t = setTimeout(() => setEntryDone(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Scroll behavior: transparent → solid & auto-hide on scroll down
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setHidden(y > lastScrollY.current && y > 120);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // #1 — Real navigation with screen mapping
  const handleNav = useCallback((id: NavLinkId | string) => {
    const mappedScreen = SCREEN_MAP[id] ?? id;
    onNavigate?.(mappedScreen);
    setUserMenuOpen(false);
  }, [onNavigate]);

  // #4 — Logout: signOut then navigate to landing
  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    try {
      await supabase?.auth.signOut();
    } catch {
      // fail silently
    }
    // Navigate to landing after logout
    onLogout?.();
    onNavigate?.("landing");
  }, [onLogout, onNavigate]);

  // Dismiss badge on bell click — now opens panel instead
  const handleBellClick = useCallback(() => {
    setNotifOpen((p) => !p);
  }, []);

  // #5 — Entry animation values
  const yInitial  = entryDone ? (hidden ? "-100%" : "0%") : "-100%";
  const opacityInitial = entryDone ? 1 : 0;

  return (
    <motion.header
      role="banner"
      dir="rtl"
      aria-label="الشريط العلوي"
      // #5 — Combined entry + hide/show animation
      initial={{ y: "-100%", opacity: 0 }}
      animate={{
        y: hidden ? "-100%" : "0%",
        opacity: entryDone ? 1 : 0,
      }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className={`
        fixed top-0 right-0 left-0 z-50
        hidden md:flex items-center justify-between
        px-6 lg:px-10 h-16
        transition-[background,border-color,box-shadow] duration-300
        ${scrolled
          ? "backdrop-blur-xl bg-slate-900/80 border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
        }
      `}
    >
      {/* ── الشعار ── */}
      <button
        type="button"
        id="header-logo"
        onClick={() => handleNav("home")}
        className="flex items-center gap-2 group"
        aria-label="الرحلة – الصفحة الرئيسية"
      >
        <AlrehlaIcon
          size={34}
          className="transition-opacity group-hover:opacity-90"
        />
        <span className="text-white font-bold text-base tracking-wide group-hover:text-teal-300 transition-colors">
          الرحلة
        </span>
      </button>

      {/* ── روابط التنقل ── */}
      <nav aria-label="التنقل الرئيسي" className="flex items-center gap-1">
        {NAV_LINKS.map(({ id, label }) => {
          // #2 — Active state from live screen
          const isActive = activeNavId === id;
          return (
            <button
              key={id}
              type="button"
              id={`header-nav-${id}`}
              onClick={() => handleNav(id)}
              className={`
                relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isActive
                  ? "text-teal-300"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
              {isActive && (
                <motion.span
                  layoutId="header-nav-indicator"
                  className="absolute inset-0 rounded-full bg-teal-500/15 border border-teal-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── الجانب الأيسر: إشعارات + مستخدم ── */}
      <div className="flex items-center gap-3">
        {/* ── Theme Toggle ── */}
        <button
          type="button"
          id="header-theme-toggle"
          aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
          onClick={handleThemeToggle}
          className="w-9 h-9 rounded-full flex items-center justify-center
                     text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.span
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* #3 — زر الإشعارات + نافذة الإشعارات */}
        <div className="relative">
          <AnimatePresence>
            {isLoggedIn && (
              <motion.button
                key="bell"
                ref={bellRef}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                id="header-notifications"
                aria-label={hasUnread ? "لديك إشعارات جديدة" : "الإشعارات"}
                aria-expanded={notifOpen}
                onClick={handleBellClick}
                className={`w-9 h-9 rounded-full flex items-center justify-center
                           text-slate-400 hover:text-white hover:bg-white/10 transition-all relative
                           ${notifOpen ? "bg-white/10 text-white" : ""}`}
              >
                <Bell className={`w-5 h-5 transition-colors ${hasUnread ? "text-teal-400" : ""}`} />
                {/* Badge */}
                <AnimatePresence>
                  {hasUnread && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-teal-400
                                 ring-2 ring-slate-900 animate-pulse"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>

          {/* نافذة الإشعارات */}
          {isLoggedIn && (
            <NotificationsPanel
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              anchorRef={bellRef}
            />
          )}
        </div>

        {/* زر المستخدم / تسجيل الدخول */}
        {status === "loading" ? (
          <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
        ) : isLoggedIn ? (
          /* Avatar + dropdown */
          <div ref={userMenuRef} className="relative" id="header-user-menu">
            <button
              type="button"
              onClick={() => setUserMenuOpen((p) => !p)}
              className="flex items-center gap-2 rounded-full px-1 pr-1 pl-3 py-0.5
                         bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-teal-500/40
                         transition-all text-sm text-slate-200 group"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName ?? "المستخدم"}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600
                                 flex items-center justify-center text-xs font-bold text-slate-900">
                  {avatarInitial}
                </span>
              )}
              <span className="hidden lg:inline max-w-[8rem] truncate">{firstName ?? "حسابي"}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 top-12 w-52 rounded-2xl overflow-hidden
                             bg-slate-900/95 backdrop-blur-xl border border-white/10
                             shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-white/[0.08]">
                    <p className="text-sm font-semibold text-white truncate">{displayName ?? firstName ?? "المستخدم"}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email ?? ""}</p>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleNav("profile")}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300
                                 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                      role="menuitem"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      الملف الشخصي
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleNav("insights"); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300
                                 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                      role="menuitem"
                    >
                      <BarChart2 className="w-4 h-4 text-slate-400" />
                      تحليل العلاقات
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleNav("quizzes"); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300
                                 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                      role="menuitem"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      اختبارات الشخصية
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleNav("behavioral-analysis"); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300
                                 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                      role="menuitem"
                    >
                      <Brain className="w-4 h-4 text-slate-400" />
                      تحليل الأنماط
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleNav("resources"); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300
                                 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                      role="menuitem"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      مركز الموارد
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav("settings")}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300
                                 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      الإعدادات
                    </button>
                    <div className="border-t border-white/[0.08] mt-1 pt-1">
                      {/* #4 — Logout with redirect */}
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400
                                   hover:bg-rose-500/10 transition-colors text-right w-full"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* زر تسجيل الدخول */
          <button
            type="button"
            id="header-login"
            onClick={onLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                       bg-teal-500 hover:bg-teal-400 text-slate-900
                       shadow-[0_0_16px_rgba(45,212,191,0.3)] hover:shadow-[0_0_24px_rgba(45,212,191,0.5)]
                       transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            ابدأ الآن
          </button>
        )}
      </div>
    </motion.header>
  );
});
