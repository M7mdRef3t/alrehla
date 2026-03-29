import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  LogIn,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Wrench,
  BookOpen,
  Info,
  Sun,
  Moon,
  BarChart2,
  Sparkles,
  Brain,
  Home,
  ArrowLeftCircle,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { AlrehlaIcon } from "./logo/AlrehlaIcon";
import { useAuthState, getEffectiveRoleFromState } from "../state/authState";
import { useAchievementState } from "../state/achievementState";
import { useThemeState } from "../state/themeState";
import { signOut } from "../services/authService";
import { NotificationsPanel } from "./NotificationsPanel";
import { isPrivilegedRole } from "../utils/featureFlags";

const NAV_LINKS = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "tools", label: "الأدوات", icon: Wrench },
  { id: "insights", label: "تحليلات", icon: BarChart2 },
  { id: "stories", label: "قصص", icon: BookOpen },
  { id: "about", label: "لماذا الرحلة؟", icon: Info },
] as const;

type NavLinkId = (typeof NAV_LINKS)[number]["id"];

const SCREEN_MAP: Record<string, string> = {
  home: "landing",
  landing: "landing",
  tools: "tools",
  stories: "stories",
  about: "about",
  insights: "insights",
  quizzes: "quizzes",
  "behavioral-analysis": "behavioral-analysis",
  resources: "resources",
  profile: "settings",
  settings: "settings",
};

const MARKETING_NAV_IDS = new Set<NavLinkId>(["home", "stories", "about"]);

const SCREEN_LABELS: Record<string, string> = {
  tools: "الأدوات",
  insights: "تحليل العلاقات",
  stories: "قصص",
  about: "لماذا الرحلة؟",
  quizzes: "اختبارات الشخصية",
  "behavioral-analysis": "تحليل الأنماط",
  resources: "مركز الموارد",
  settings: "الإعدادات",
  profile: "الملف الشخصي",
};

export interface PlatformHeaderProps {
  activeScreen?: string;
  onLogin?: () => void;
  onNavigate?: (id: NavLinkId | string) => void;
  onLogout?: () => void;
}

function getActiveNavId(screen?: string): string {
  if (!screen || screen === "landing") return "home";
  if (screen === "tools" || screen === "guided" || screen === "mission") return "tools";
  return screen;
}

// ─── Desktop Header ──────────────────────────────────────────────────────────
export const PlatformHeader = memo(function PlatformHeader({
  activeScreen,
  onLogin,
  onNavigate,
  onLogout,
}: PlatformHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const lastScrollY = useRef(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);


  const user = useAuthState((s) => s.user);
  const firstName = useAuthState((s) => s.firstName);
  const displayName = useAuthState((s) => s.displayName);
  const status = useAuthState((s) => s.status);
  const role = useAuthState(getEffectiveRoleFromState);
  const roleOverride = useAuthState((s) => s.roleOverride);
  const setRoleOverride = useAuthState((s) => s.setRoleOverride);
  const isPrivilegedUser = isPrivilegedRole(role);
  const isViewingAsUser = roleOverride === "user";
  const isLoggedIn = Boolean(user);
  const avatarInitial = (firstName?.[0] ?? displayName?.[0] ?? "أ").toUpperCase();
  const avatarUrl =
    (user as { user_metadata?: { avatar_url?: string } } | null)?.user_metadata?.avatar_url ?? null;

  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const hasUnread = isLoggedIn && Boolean(lastNewAchievementId);

  const resolvedTheme = useThemeState((s) => s.resolvedTheme);
  const setTheme = useThemeState((s) => s.setTheme);
  const isDark = resolvedTheme === "dark";

  const activeNavId = getActiveNavId(activeScreen);
  const visibleNavLinks = NAV_LINKS;

  // Screen label shown in header while scrolled (when not on home)
  const screenLabel = activeNavId !== "home" ? (SCREEN_LABELS[activeNavId] ?? null) : null;

  const handleThemeToggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);


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

  // ── Reset on screen change: show header, scroll to top ──
  useEffect(() => {
    // Always show header when navigating to a new screen
    setHidden(false);
    // Scroll page to top on screen transition (SPA doesn't do this automatically)
    window.scrollTo({ top: 0, behavior: "instant" });
    lastScrollY.current = 0;
    setScrolled(false);
  }, [activeScreen]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNav = useCallback(
    (id: NavLinkId | string) => {
      const mappedScreen = SCREEN_MAP[id] ?? id;
      onNavigate?.(mappedScreen);
      setUserMenuOpen(false);
    },
    [onNavigate]
  );

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    await signOut(); // centralised — errors swallowed inside signOut()
    onLogout?.();
    onNavigate?.("landing");
  }, [onLogout, onNavigate]);

  const handleBellClick = useCallback(() => {
    setNotifOpen((previous) => !previous);
  }, []);

  // ── Landing CTA — FIX: if logged in → enter app, not show login ──
  const handleLandingCta = useCallback(() => {
    if (isLoggedIn) {
      onNavigate?.("tools");
    } else {
      onLogin?.();
    }
  }, [isLoggedIn, onLogin, onNavigate]);

  return (
    <motion.header
      role="banner"
      dir="rtl"
      aria-label="الشريط العلوي"
      animate={{ 
        y: hidden ? "-100%" : "0%",
        backgroundColor: scrolled ? "var(--glass-bg)" : "rgba(0, 0, 0, 0)" 
      }}
      className={`
        fixed top-0 right-0 left-0 z-50
        hidden md:flex items-center justify-between
        px-6 lg:px-12 h-20
        transition-[border-color,box-shadow,height] duration-500
        ${
          scrolled
            ? "backdrop-blur-2xl border-b shadow-[0_8px_32px_rgba(0,0,0,0.1)] h-16"
            : "border-b border-transparent h-20"
        }
      `}
      style={{ borderColor: scrolled ? "var(--glass-border)" : "transparent" }}
    >
      {/* Logo */}
      <button
        type="button"
        id="header-logo"
        onClick={() => handleNav("home")}
        className="flex items-center gap-3 group relative"
        aria-label="الرحلة - الصفحة الرئيسية"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
           <AlrehlaIcon size={scrolled ? 36 : 42} className="transition-all duration-500" />
           <motion.div 
             className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full -z-10"
             animate={{ opacity: [0, 0.4, 0] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           />
        </motion.div>
        <span className="font-bold text-lg tracking-tight group-hover:text-teal-400 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
          الرحلة
        </span>
      </button>

      {/* Screen label — shows when scrolled & not on home */}
      <AnimatePresence>
        {scrolled && activeNavId !== "home" && screenLabel && (
          <motion.span
            key="screen-label"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: "var(--text-secondary)" }}
          >
            {screenLabel}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Nav Links */}
      <nav
        aria-label="التنقل الرئيسي"
        className="flex items-center relative gap-2"
      >
        {visibleNavLinks.map(({ id, label, icon: Icon }) => {
          const isActive = activeNavId === id;
          return (
            <button
              key={id}
              type="button"
              id={`header-nav-${id}`}
              onClick={() => handleNav(id)}
              className={`
                relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${isActive 
                  ? "opacity-100" 
                  : "opacity-60 hover:opacity-100"
                }
              `}
              style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="header-nav-indicator"
                  className="absolute inset-0 rounded-full bg-white/5 border shadow-[inner_0_0_12px_rgba(255,255,255,0.05)]"
                  style={{ borderColor: "var(--glass-border)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {isActive && (
                <Icon className="w-4 h-4 text-teal-400 relative z-10" />
              )}
              <span className="relative z-10">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className="w-1 h-1 rounded-full bg-teal-400 absolute -bottom-1 left-1/2 -translate-x-1/2"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          id="header-theme-toggle"
          aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
          onClick={handleThemeToggle}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
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

        {/* Bell — show everywhere if logged in */}
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
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all relative ${
                    notifOpen ? "bg-white/10 text-white" : ""
                  }`}
                >
                  <Bell className={`w-5 h-5 transition-colors ${hasUnread ? "text-teal-400" : ""}`} />
                  <AnimatePresence>
                    {hasUnread && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-slate-900 animate-pulse"
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
            </AnimatePresence>

            {isLoggedIn && (
              <NotificationsPanel
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                anchorRef={bellRef}
              />
            )}
          </div>

        {/* User Area */}
        {status === "loading" ? (
          <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
        ) : isLoggedIn ? (
          /* ── User Dropdown Menu ── */
          <div ref={userMenuRef} className="relative" id="header-user-menu">
            <button
              type="button"
              onClick={() => setUserMenuOpen((previous) => !previous)}
              className="flex items-center gap-2 rounded-full px-1 pr-1 pl-3 py-0.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-teal-500/40 transition-all text-sm text-slate-200 group"
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
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-slate-900">
                  {avatarInitial}
                </span>
              )}
              <span className="hidden lg:inline max-w-[8rem] truncate">{firstName ?? "حسابي"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 top-12 w-52 rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
                  style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-white/[0.08]">
                    <p className="text-sm font-semibold text-white truncate" style={{ color: "var(--text-primary)" }}>
                      {displayName ?? firstName ?? "المستخدم"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user?.email ?? ""}</p>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    {[
                      { id: "profile", label: "الملف الشخصي", Icon: User },
                      { id: "insights", label: "تحليل العلاقات", Icon: BarChart2 },
                      { id: "quizzes", label: "اختبارات الشخصية", Icon: Sparkles },
                      { id: "behavioral-analysis", label: "تحليل الأنماط", Icon: Brain },
                      { id: "resources", label: "مركز الموارد", Icon: BookOpen },
                      { id: "settings", label: "الإعدادات", Icon: Settings },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleNav(id)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors text-right w-full"
                        role="menuitem"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        {label}
                      </button>
                    ))}

                    {/* Owner Switch — only for privileged roles */}
                    {isPrivilegedUser && (
                      <div className="border-t border-white/[0.08] mt-1 pt-1">
                        <button
                          type="button"
                          id="header-owner-switch"
                          onClick={() => {
                            setRoleOverride(isViewingAsUser ? null : "user");
                            setUserMenuOpen(false);
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-right w-full ${
                            isViewingAsUser
                              ? "text-amber-400 hover:bg-amber-500/10"
                              : "text-teal-400 hover:bg-teal-500/10"
                          }`}
                          role="menuitem"
                          aria-label={isViewingAsUser ? "العودة لوضع الأونر" : "تجربة واجهة المستخدم"}
                        >
                          {isViewingAsUser ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {isViewingAsUser ? "العودة لوضع الأونر" : "تجربة واجهة المستخدم"}
                        </button>
                      </div>
                    )}

                    <div className="border-t border-white/[0.08] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-right w-full"
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            id="header-landing-cta"
            onClick={handleLandingCta}
            className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <LogIn className="w-5 h-5 text-slate-900 relative z-10" />
            <span className="text-slate-900 relative z-10">تسجيل الدخول</span>
            
            <motion.div 
              className="absolute -right-4 top-0 w-12 h-full bg-white/20 skew-x-[30deg] -translate-x-[200%]"
              animate={{ translateX: ["-200%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            />
          </motion.button>
        )}
      </div>
    </motion.header>
  );
});

// ─── Mobile Bottom Navigation Bar ────────────────────────────────────────────
const MOBILE_NAV = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "tools", label: "الأدوات", icon: Wrench },
  { id: "insights", label: "تحليلات", icon: BarChart2 },
  { id: "stories", label: "قصص", icon: BookOpen },
  { id: "settings", label: "الإعدادات", icon: Settings },
] as const;

export const MobileNavBar = memo(function MobileNavBar({
  activeScreen,
  onNavigate,
}: Pick<PlatformHeaderProps, "activeScreen" | "onNavigate">) {
  const activeNavId = getActiveNavId(activeScreen);

  const handleNav = useCallback(
    (id: string) => {
      const mappedScreen = SCREEN_MAP[id] ?? id;
      onNavigate?.(mappedScreen);
    },
    [onNavigate]
  );

  return (
    <nav
      dir="rtl"
      aria-label="التنقل السفلي"
      className="fixed bottom-0 right-0 left-0 z-50 md:hidden
        flex items-stretch justify-around
        backdrop-blur-2xl
        border-t
        pb-safe pt-2 px-2
        shadow-[0_-4px_32px_rgba(0,0,0,0.3)]"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      {MOBILE_NAV.map(({ id, label, icon: Icon }) => {
        const isActive = activeNavId === id;
        return (
          <button
            key={id}
            type="button"
            id={`mobile-nav-${id}`}
            onClick={() => handleNav(id)}
            aria-current={isActive ? "page" : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative"
          >
            {isActive && (
              <motion.span
                layoutId="mobile-nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-teal-400"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon
              className={`w-5 h-5 transition-colors ${
                isActive ? "text-teal-400" : "text-slate-500"
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-teal-400" : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});
