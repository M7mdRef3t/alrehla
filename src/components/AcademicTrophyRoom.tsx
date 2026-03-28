/**
 * AcademicTrophyRoom.tsx — Full Academy Achievements Dashboard
 * Mastery Dashboard بتصميم Glassmorphism فاخر مطابق للـ mockup
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, LayoutDashboard, Award, BookOpen, Trophy,
  Download, Share2, Lock, ChevronRight,
  Zap, Target, Users, Brain,
  GraduationCap, Lightbulb, History,
} from "lucide-react";
import { useAchievementState } from "../state/achievementState";
import { ACHIEVEMENTS } from "../data/achievements";
import { loadStreak } from "../services/streakSystem";
import { getFromLocalStorage } from "../services/browserStorage";
import { useAuthState } from "../state/authState";
import { LeaderboardPanel } from "./LeaderboardPanel";

// ── Types ──────────────────────────────────────────────────────────────────
type NavSection = "overview" | "badges" | "certificates" | "pathways" | "library" | "leaderboard";

interface CompletedCourse { id: string; title: string; category: string; completedAt: string; instructor: string; totalHours?: string; }

// ── Helpers ────────────────────────────────────────────────────────────────
function loadCourses(): CompletedCourse[] {
  try { return JSON.parse(getFromLocalStorage("alrehla_course_completions") ?? "[]") as CompletedCourse[]; }
  catch { return []; }
}
function getXpLevel(xp: number) {
  const level = Math.max(1, Math.floor(xp / 200) + 1);
  return { level, progress: Math.min(100, ((xp % 200) / 200) * 100) };
}
function getQuizCount(): number {
  try { const a = JSON.parse(getFromLocalStorage("alrehla_quiz_history") ?? "[]") as { quizId: string }[]; return new Set(a.map(e => e.quizId)).size; }
  catch { return 0; }
}
function fmtDate(iso: string) {
  try { return new Intl.DateTimeFormat("ar-EG", { month: "short", year: "numeric" }).format(new Date(iso)); }
  catch { return iso.slice(0, 7); }
}
function shortId(id: string) { return `EI-${id.slice(0, 5).toUpperCase()}-X`; }

// ── Skill Pathway config ───────────────────────────────────────────────────
const SKILLS = [
  { id: "self_awareness", label: "الوعي الذاتي",  labelEn: "SELF-AWARENESS",  color: "#14d2c8" },
  { id: "regulation",    label: "التنظيم",         labelEn: "REGULATION",      color: "#818cf8" },
  { id: "empathy",       label: "التعاطف",         labelEn: "EMPATHY",         color: "#a78bfa" },
  { id: "social",        label: "المهارات الاجتماعية", labelEn: "SOCIAL SKILLS", color: "#6366f1" },
];

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",      label: "نظرة عامة",     icon: LayoutDashboard },
  { id: "badges",        label: "أوسمتي",         icon: Trophy },
  { id: "certificates",  label: "الشهادات",        icon: Award },
  { id: "pathways",      label: "مساراتي",         icon: Target },
  { id: "library",       label: "المكتبة",         icon: BookOpen },
  { id: "leaderboard",   label: "المتصدرون",       icon: Users },
];

// ── Badge icon map ─────────────────────────────────────────────────────────
const BADGE_ICONS: Record<string, string> = {
  starter_click: "🚀", mirror_discovery: "🪞", installer_click: "📲",
  first_step: "🌱", writer: "✍️", plan_seeker: "🧭", trained: "🏋️",
  growing_map: "🗺️", boundary_keeper: "🛡️", measured: "📊", reader: "📚",
  breather: "🫁", mission_complete: "✅", streak_1: "🔥", streak_3: "⚡",
  streak_7: "💎", quiz_first: "🎯", quiz_double: "🎓", quiz_half: "🏆", quiz_master: "👑",
  pulse_saver: "💾", pulse_explainer: "💡", person_located_on_map: "📍",
  armory_visited: "⚔️", exit_scripts_visited: "🚪", grounding_visited: "🌿",
  quiz_hub_visited: "🧠", login_success: "🔑",
};

// ── Recent activity generator ──────────────────────────────────────────────
function buildActivity(
  unlockedIds: string[],
  courses: CompletedCourse[],
  streak: { currentStreak: number; lastActiveDate: string },
  quizCount: number
) {
  const items: { color: string; label: string; sub: string; time: string }[] = [];
  if (courses.length > 0) {
    const c = courses[0];
    items.push({ color: "#14d2c8", label: "دورة مكتملة", sub: c.title, time: fmtDate(c.completedAt) });
  }
  if (unlockedIds.length > 0) {
    const a = ACHIEVEMENTS.find(a => a.id === unlockedIds[unlockedIds.length - 1]);
    if (a) items.push({ color: "#a78bfa", label: "وسام مفتوح", sub: a.title, time: "مؤخراً" });
  }
  if (quizCount > 0) items.push({ color: "#6366f1", label: "اختبار اجتُز", sub: `${quizCount} اختبار مكتمل`, time: "هذا الأسبوع" });
  if (streak.currentStreak > 0) items.push({ color: "#14d2c8", label: "إنجاز متواصل", sub: `${streak.currentStreak} يوم نشاط متواصل`, time: "الآن" });
  return items.slice(0, 4);
}

// ── Main Component ─────────────────────────────────────────────────────────
export function AcademicTrophyRoom({ onClose }: { onClose: () => void }) {
  const [nav, setNav] = useState<NavSection>("overview");

  const totalPoints  = useAchievementState(s => s.totalPoints);
  const unlockedIds  = useAchievementState(s => s.unlockedIds);
  const displayName  = useAuthState(s => s.displayName);

  const streak    = useMemo(() => loadStreak(), []);
  const courses   = useMemo(() => loadCourses(), []);
  const quizCount = useMemo(() => getQuizCount(), []);
  const { level, progress } = useMemo(() => getXpLevel(totalPoints), [totalPoints]);

  const unlocked = useMemo(() => ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)), [unlockedIds]);
  const locked   = useMemo(() => ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id)), [unlockedIds]);
  const activity = useMemo(() => buildActivity(unlockedIds, courses, streak, quizCount), [unlockedIds, courses, streak, quizCount]);

  // Skill scores derived from achievements+quiz+courses
  const skills = useMemo(() => {
    const self  = Math.min(100, unlocked.length * 8 + (streak.currentStreak > 3 ? 10 : 0));
    const reg   = Math.min(100, quizCount * 12 + 15);
    const emp   = Math.min(100, courses.length * 20 + 20);
    const social = Math.min(100, (courses.length + unlocked.length) * 5 + 10);
    const overall = Math.round((self + reg + emp + social) / 4);
    return { self, reg, emp, social, overall };
  }, [unlocked.length, courses.length, quizCount, streak.currentStreak]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0",
        fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        style={{
          width: "100%", maxWidth: 1040,
          height: "calc(100vh - 32px)", maxHeight: 900,
          borderRadius: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#070a14",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 0 1px rgba(20,210,200,0.06), 0 40px 100px rgba(0,0,0,0.9)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top App Bar ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,13,26,0.9)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(20,210,200,0.08)", border: "1px solid rgba(20,210,200,0.15)",
              borderRadius: 12, padding: "8px 14px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #14d2c8, #0ea5e9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 900, color: "#fff",
              }}>{level}</div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#f1f5f9" }}>
                  {displayName ?? "المستخدم"}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(20,210,200,0.8)" }}>
                  المستوى {level} • الذكاء العاطفي
                </p>
              </div>
            </div>
            <nav style={{ display: "flex", gap: 4 }}>
              {["Dashboard","Courses","Community","Insights"].map(n => (
                <button key={n} style={{
                  background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600,
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                }}>{n}</button>
              ))}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <GraduationCap size={18} style={{ color: "#14d2c8" }} />
            <span style={{ fontSize: 13, fontWeight: 900, color: "#14d2c8" }}>Academy Achievements</span>
            <button onClick={onClose} style={{
              marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center",
              width: 30, height: 30, borderRadius: 8, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
            }}><X size={14} /></button>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── Left Sidebar ── */}
          <aside style={{
            width: 200, flexShrink: 0, padding: "20px 12px",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            display: "flex", flexDirection: "column", gap: 4,
            overflowY: "auto",
          }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setNav(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                background: nav === item.id ? "rgba(20,210,200,0.1)" : "transparent",
                border: nav === item.id ? "1px solid rgba(20,210,200,0.2)" : "1px solid transparent",
                color: nav === item.id ? "#14d2c8" : "rgba(255,255,255,0.45)",
                fontSize: 13, fontWeight: 700, textAlign: "right",
                transition: "all 0.15s",
              }}>
                <item.icon size={15} />
                {item.label}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            <button style={{
              marginTop: 12,
              background: "linear-gradient(135deg, #14d2c8, #0ea5e9)",
              border: "none", borderRadius: 12, padding: "11px 16px",
              color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 0 24px rgba(20,210,200,0.3)",
            }}>
              بدء الدرس التالي
            </button>

            <div style={{ height: 12 }} />
          </aside>

          {/* ── Main Content ── */}
          <main style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px 0" }} className="no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={nav}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                {/* Center Column */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Hero header */}
                  {nav === "overview" && (
                    <div style={{
                      borderRadius: 20, padding: "28px 28px 24px",
                      background: "linear-gradient(135deg, rgba(20,210,200,0.07) 0%, rgba(99,102,241,0.05) 100%)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>
                            Mastery Dashboard
                          </h1>
                          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", maxWidth: 320 }}>
                            تطوير حدسك النفسي عبر التحليل الذاتي المدفوع بالبيانات
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          {[
                            { label: "INSIGHT LEVEL", value: String(level).padStart(2, "0") },
                            { label: "CERTIFICATES",  value: String(courses.length).padStart(2, "0") },
                          ].map(({ label, value }) => (
                            <div key={label} style={{
                              borderRadius: 14, padding: "12px 18px", textAlign: "center",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              minWidth: 96,
                            }}>
                              <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{label}</p>
                              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#f1f5f9" }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EI Pathway */}
                  {(nav === "overview" || nav === "pathways") && (
                    <div style={{
                      borderRadius: 18, padding: "20px 24px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: "#fff" }}>مسار الذكاء العاطفي</h3>
                          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>رحلتك نحو التعاطف المعرفي</p>
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 24, fontWeight: 900, color: "#14d2c8" }}>{skills.overall}%</p>
                          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>OVERALL MASTERY</p>
                        </div>
                      </div>
                      {/* Master bar */}
                      <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.05)", marginBottom: 20 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skills.overall}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          style={{ height: "100%", background: "linear-gradient(to left, #14d2c8, #818cf8)", borderRadius: 99 }}
                        />
                      </div>
                      {/* Skill bars */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                        {SKILLS.map((sk, i) => {
                          const vals = [skills.self, skills.reg, skills.emp, skills.social];
                          return (
                            <div key={sk.id}>
                              <div style={{ height: 4, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.05)", marginBottom: 6 }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${vals[i]}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                  style={{ height: "100%", background: sk.color, borderRadius: 99 }}
                                />
                              </div>
                              <p style={{ margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{sk.labelEn}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Badges Grid */}
                  {(nav === "overview" || nav === "badges") && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>
                          {nav === "overview" ? "أوسمة مفتوحة" : "جميع الأوسمة"}
                        </h3>
                        {nav === "overview" && unlocked.length > 4 && (
                          <button onClick={() => setNav("badges")} style={{
                            background: "transparent", border: "none",
                            color: "#14d2c8", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>عرض الكل <ChevronRight size={13} /></button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        {(nav === "overview" ? unlocked.slice(0, 3) : unlocked).map(a => (
                          <motion.div 
                            key={a.id} 
                            whileHover={{ scale: 1.03 }} 
                            style={{
                              position: "relative",
                              borderRadius: 16, padding: "16px 12px", textAlign: "center",
                              background: "rgba(20,210,200,0.05)",
                              border: "1px solid rgba(20,210,200,0.15)",
                              cursor: "help",
                            }}
                          >
                            {/* Tooltip */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              whileHover={{ opacity: 1, y: 0 }}
                              style={{
                                position: "absolute", bottom: "105%", left: "50%", transform: "translateX(-50%)",
                                width: 140, background: "rgba(10,13,26,0.95)", backdropFilter: "blur(10px)",
                                border: "1px solid rgba(20,210,200,0.3)", borderRadius: 10, padding: 8,
                                fontSize: 10, color: "rgba(255,255,255,0.8)", zIndex: 100, pointerEvents: "none",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                              }}
                            >
                              {a.description}
                            </motion.div>

                            <div style={{
                              width: 48, height: 48, borderRadius: "50%", margin: "0 auto 10px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "rgba(20,210,200,0.1)",
                              border: "1px solid rgba(20,210,200,0.2)",
                              fontSize: 22,
                            }}>{BADGE_ICONS[a.id] ?? a.icon}</div>
                            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 900, color: "#fff" }}>{a.title}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>مفتوح</p>
                          </motion.div>
                        ))}
                        {/* Locked badge */}
                        {(nav === "overview" ? locked.slice(0, 1) : locked.slice(0, 8)).map(a => (
                          <div key={a.id} style={{
                            position: "relative",
                            borderRadius: 16, padding: "16px 12px", textAlign: "center", opacity: 0.35,
                            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                            cursor: "help",
                          }}>
                            {/* Hidden Tooltip for locked */}
                            <div className="badge-tooltip" style={{
                              display: "none",
                              position: "absolute", bottom: "105%", left: "50%", transform: "translateX(-50%)",
                              width: 140, background: "rgba(10,13,26,0.95)", backdropFilter: "blur(10px)",
                              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 8,
                              fontSize: 10, color: "rgba(255,255,255,0.4)", zIndex: 100, pointerEvents: "none",
                            }}>
                              {a.description}
                            </div>
                            <style>{`
                              div:hover > .badge-tooltip { display: block !important; }
                            `}</style>

                            <div style={{
                              width: 48, height: 48, borderRadius: "50%", margin: "0 auto 10px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "rgba(255,255,255,0.04)", fontSize: 20, filter: "grayscale(1)",
                            }}><Lock size={18} style={{ color: "rgba(255,255,255,0.3)" }} /></div>
                            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.5)" }}>{a.title}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>مقفول</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certificates List */}
                  {(nav === "overview" || nav === "certificates") && (
                    <div>
                      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
                        الشهادات الاحترافية
                      </h3>
                      {courses.length === 0 ? (
                        <div style={{
                          borderRadius: 16, padding: "32px", textAlign: "center",
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        }}>
                          <GraduationCap size={28} style={{ color: "rgba(20,210,200,0.3)", marginBottom: 10 }} />
                          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                            لا توجد شهادات بعد
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                            أكمل دورة لتظهر شهادتها هنا
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {courses.map(c => (
                            <div key={c.id} style={{
                              display: "flex", alignItems: "center", gap: 14,
                              padding: "14px 18px", borderRadius: 16,
                              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                            }}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(20,210,200,0.08)", border: "1px solid rgba(20,210,200,0.15)",
                              }}>
                                <BookOpen size={16} style={{ color: "#14d2c8" }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 900, color: "#fff" }}>{c.title}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                                  {fmtDate(c.completedAt)} • Credential ID: {shortId(c.id)}
                                </p>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                {[
                                  { icon: Download, title: "تحميل" },
                                  { icon: Share2,   title: "مشاركة" },
                                ].map(({ icon: Icon, title }) => (
                                  <button key={title} title={title} style={{
                                    width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.5)",
                                  }} onClick={() => window.print()}>
                                    <Icon size={14} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Library placeholder */}
                  {nav === "library" && (
                    <div style={{
                      borderRadius: 18, padding: "40px", textAlign: "center",
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <BookOpen size={32} style={{ color: "rgba(20,210,200,0.4)", marginBottom: 12 }} />
                      <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.5)" }}>
                        مكتبة الموارد
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                        المصادر والمواد التعليمية ستظهر هنا
                      </p>
                    </div>
                  )}

                  {/* Leaderboard */}
                  {nav === "leaderboard" && <LeaderboardPanel />}

                </div>

                {/* ── Right Sidebar ── */}
                {nav === "overview" && (
                  <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* Recent Activity */}
                    <div style={{
                      borderRadius: 18, padding: "18px 16px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <History size={14} style={{ color: "#14d2c8" }} />
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>النشاط الأخير</h4>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {activity.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "12px 0" }}>
                            لا يوجد نشاط بعد
                          </p>
                        ) : activity.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                              background: item.color, boxShadow: `0 0 6px ${item.color}80`,
                            }} />
                            <div>
                              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 900, color: "#fff" }}>{item.label}</p>
                              <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.sub}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{item.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Insight Tip */}
                    <div style={{
                      borderRadius: 18, padding: "16px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Lightbulb size={14} style={{ color: "#f59e0b" }} />
                        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#f59e0b" }}>Insight Tip</h4>
                      </div>
                      <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                        {streak.currentStreak >= 3
                          ? `تسلسلك الحالي ${streak.currentStreak} يوم رائع! استمر لتكسب XP x2 عند الوصول لـ 7 أيام.`
                          : courses.length > 0
                          ? "سجّل يومياً لزيادة مؤشر إتقانك وفتح أوسمة جديدة بسرعة أكبر."
                          : "ابدأ بدورة واحدة يومياً لبناء عادة التعلم وكسب أول وسام أكاديمي."}
                      </p>
                      <div style={{
                        borderRadius: 12, overflow: "hidden", height: 70,
                        background: "linear-gradient(135deg, rgba(20,210,200,0.12), rgba(99,102,241,0.12))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Brain size={24} style={{ color: "rgba(20,210,200,0.5)" }} />
                      </div>
                    </div>

                    {/* XP Summary */}
                    <div style={{
                      borderRadius: 18, padding: "14px 16px",
                      background: "rgba(20,210,200,0.05)", border: "1px solid rgba(20,210,200,0.12)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>XP المجموع</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#14d2c8" }}>{totalPoints}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.2 }}
                          style={{ height: "100%", background: "linear-gradient(to left, #14d2c8, #0ea5e9)", borderRadius: 99 }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>المستوى {level}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{Math.round(progress)}%</span>
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </motion.div>
  );
}
