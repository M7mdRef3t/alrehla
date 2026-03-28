/**
 * WeeklyChallengesScreen.tsx
 * ───────────────────────────
 * "تحديات المجتمع الأسبوعية" — Full-screen Glassmorphism UI
 * Sections: Hero challenge, Community Missions, Top Analysts,
 *            Community Echoes, Unlockables.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bell, User, BarChart2, Award, Users, Gift,
  ChevronRight, ThumbsUp, MessageSquare, Trophy,
  Zap, Shield, Flame, BookOpen, ArrowRight,
  Play, Calendar,
} from "lucide-react";
import { useAchievementState } from "../state/achievementState";
import { useAuthState } from "../state/authState";
import { loadStreak } from "../services/streakSystem";

// ── Types ──────────────────────────────────────────────────────────────────
type NavItem = "insights" | "challenges" | "leaderboard" | "rewards" | "community";
type Difficulty = "EASY" | "MODERATE" | "HARD";

interface Mission {
  id: string;
  icon: typeof Zap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  participants: string;
  joined: boolean;
}

interface TopAnalyst {
  rank: number;
  name: string;
  points: string;
  avatar: string;
  hasMedal?: boolean;
}

interface Echo {
  name: string;
  time: string;
  avatar: string;
  quote: string;
  likes: number;
}

interface Unlockable {
  icon: typeof Trophy;
  iconColor: string;
  title: string;
  sub: string;
  cta?: string;
  progress?: number;
}

// ── Static data ────────────────────────────────────────────────────────────
const MISSIONS: Mission[] = [
  {
    id: "conflict",
    icon: Shield,
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.15)",
    title: "ماراثون حل النزاعات",
    description: "مارس تقنيات تهدئة الصراعات في سيناريوهات اجتماعية افتراضية لبناء قدراتك.",
    difficulty: "MODERATE",
    participants: "1.2k",
    joined: false,
  },
  {
    id: "empathy",
    icon: Flame,
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.15)",
    title: "تعزيز التعاطف",
    description: "تمارين يومية دقيقة لرؤية العالم من خارج إطارك الخاص.",
    difficulty: "EASY",
    participants: "4.8k",
    joined: false,
  },
];

const TOP_ANALYSTS: TopAnalyst[] = [
  { rank: 1, name: "Julian S.", points: "4,210 Insight Pts", avatar: "JU", hasMedal: true  },
  { rank: 2, name: "Maya K.",   points: "2,520 Insight Pts", avatar: "MK", hasMedal: false },
  { rank: 3, name: "David W.",  points: "1,980 Insight Pts", avatar: "DW", hasMedal: false },
];

const ECHOES: Echo[] = [
  {
    name: "Marcus Chen", time: "٢ س",
    avatar: "MC",
    quote: "\"تحدي الاستماع النشط أنقذ عشائي العائلي بالفعل. بدلاً من الدفاع، استمعت لـ 'لماذا' خلف قلقهم. مغيّر للعبة.\"",
    likes: 42,
  },
  {
    name: "Elena Rostova", time: "٥ س",
    avatar: "ER",
    quote: "\"فتحت وسام 'مراقب الزن'! وقد أصبحت أكثر وعياً بمحفزاتي العاطفية في اجتماعات العمل.\"",
    likes: 128,
  },
];

const UNLOCKABLES: Unlockable[] = [
  {
    icon: Trophy,
    iconColor: "#f59e0b",
    title: "الميدالية النخبوية",
    sub: "يتطلب المستوى 15",
    progress: 65,
  },
  {
    icon: BookOpen,
    iconColor: "#14d2c8",
    title: "دورة الإحساس العصبي",
    sub: "الوصول المبكر متاح",
    cta: "ادخل الآن",
  },
];

const DIFF_COLOR: Record<Difficulty, { bg: string; text: string }> = {
  EASY:     { bg: "rgba(20,210,200,0.1)",  text: "#14d2c8" },
  MODERATE: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" },
  HARD:     { bg: "rgba(239,68,68,0.12)",  text: "#ef4444" },
};

// ── Component ──────────────────────────────────────────────────────────────
export function WeeklyChallengesScreen({ onBack }: { onBack: () => void }) {
  const [nav, setNav]       = useState<NavItem>("challenges");
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [joinedWeekly, setJoinedWeekly] = useState(false);

  const totalPoints = useAchievementState(s => s.totalPoints);
  const displayName = useAuthState(s => s.displayName);
  const streak      = useMemo(() => loadStreak(), []);
  const level       = Math.max(1, Math.floor(totalPoints / 200) + 1);
  const weeklyProgress = Math.min(7, streak.currentStreak);

  function toggleMission(id: string) {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, joined: !m.joined } : m));
  }

  const NAV_ITEMS: { id: NavItem; label: string; icon: typeof BarChart2 }[] = [
    { id: "insights",    label: "رؤى",         icon: BarChart2 },
    { id: "challenges",  label: "تحديات",       icon: Zap },
    { id: "leaderboard", label: "المتصدرون",    icon: Trophy },
    { id: "rewards",     label: "مكافآت",       icon: Gift },
    { id: "community",   label: "المجتمع",      icon: Users },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9600, overflowY: "auto",
      background: "#070a14",
      fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
      direction: "rtl",
    }}>
      {/* ── Top App Bar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 28px",
        background: "rgba(7,10,20,0.9)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#14d2c8", letterSpacing: "0.02em" }}>
          الرحلة · Analyst
        </span>

        {/* Center nav */}
        <nav style={{ display: "flex", gap: 2 }}>
          {["Insights","Challenges","Leaderboard","Rewards"].map(n => {
            const active = n === "Challenges";
            return (
              <button key={n} style={{
                background: "transparent", border: "none",
                padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: active ? 900 : 600,
                color: active ? "#fff" : "rgba(255,255,255,0.35)",
                borderBottom: active ? "2px solid #14d2c8" : "2px solid transparent",
              }}>{n}</button>
            );
          })}
        </nav>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: 7, cursor: "pointer", color: "rgba(255,255,255,0.5)",
            display: "flex",
          }}><Bell size={15} /></button>
          <button style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: 7, cursor: "pointer", color: "rgba(255,255,255,0.5)",
            display: "flex",
          }}><User size={15} /></button>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: 7, cursor: "pointer", color: "rgba(255,255,255,0.4)",
            display: "flex",
          }}><X size={15} /></button>
        </div>
      </header>

      {/* ── Layout ── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 53px)" }}>

        {/* ── Left Sidebar ── */}
        <aside style={{
          width: 192, flexShrink: 0,
          padding: "20px 12px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          display: "flex", flexDirection: "column", gap: 4,
          position: "sticky", top: 53, height: "calc(100vh - 53px)", overflowY: "auto",
        }}>
          {/* Profile chip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #14d2c8, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: "#fff",
            }}>{(displayName ?? "أ").charAt(0).toUpperCase()}</div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 900, color: "#fff" }}>
                {displayName ?? "المحلل"}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(20,210,200,0.7)" }}>
                المستوى {level} محلل ذكي
              </p>
            </div>
          </div>

          {/* Start Daily Reflection CTA */}
          <button style={{
            width: "100%", padding: "10px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #14d2c8, #0ea5e9)",
            color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer",
            marginBottom: 16,
            boxShadow: "0 0 18px rgba(20,210,200,0.25)",
          }}>
            ابدأ التأمل اليومي
          </button>

          {/* Nav */}
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setNav(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 12, cursor: "pointer",
              background: nav === item.id ? "rgba(20,210,200,0.08)" : "transparent",
              border: nav === item.id ? "1px solid rgba(20,210,200,0.18)" : "1px solid transparent",
              color: nav === item.id ? "#14d2c8" : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 700, textAlign: "right",
              transition: "all 0.15s",
            }}>
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: "24px 24px 40px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* Center column */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── Hero Challenge ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                borderRadius: 22,
                background: "linear-gradient(135deg, rgba(15,18,36,0.95) 0%, rgba(10,13,26,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "28px 28px 24px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Ambient glow */}
              <div style={{
                position: "absolute", top: -60, right: -60,
                width: 240, height: 240, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(20,210,200,0.06) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {/* Chip */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 99, padding: "4px 12px", marginBottom: 14,
                  }}>
                    <Zap size={10} style={{ color: "#14d2c8" }} />
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                      CHALLENGE OF THE WEEK
                    </span>
                  </div>

                  <h1 style={{ margin: "0 0 12px", fontSize: 30, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.25 }}>
                    ٧ أيام من <span style={{ color: "#14d2c8" }}>الاستماع النشط</span>
                  </h1>
                  <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 440 }}>
                    أتقن فن الحضور الكامل. انخرط في محادثات هادفة حيث الهدف ليس الرد، بل الفهم العميق لمشاعر الآخر.
                  </p>

                  {/* Progress */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>التقدم الحالي</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#14d2c8" }}>{weeklyProgress}/7 أيام</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(weeklyProgress / 7) * 100}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        style={{
                          height: "100%", borderRadius: 99,
                          background: "linear-gradient(to left, #14d2c8, #818cf8)",
                          boxShadow: "0 0 12px rgba(20,210,200,0.5)",
                        }}
                      />
                    </div>
                  </div>

                  {/* CTAs */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setJoinedWeekly(v => !v)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "11px 22px", borderRadius: 14, outline: "none", cursor: "pointer",
                        background: joinedWeekly
                          ? "rgba(20,210,200,0.12)"
                          : "linear-gradient(135deg, #14d2c8, #0ea5e9)",
                        color: joinedWeekly ? "#14d2c8" : "#fff",
                        fontSize: 13, fontWeight: 900,
                        border: joinedWeekly ? "1px solid rgba(20,210,200,0.3)" : "none",
                        boxShadow: joinedWeekly ? "none" : "0 0 24px rgba(20,210,200,0.3)",
                      }}
                    >
                      {joinedWeekly ? "✓ منضم للتحدي" : "متابعة التحدي"}
                      {!joinedWeekly && <ArrowRight size={15} />}
                    </motion.button>
                    <button style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "11px 20px", borderRadius: 14, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700,
                    }}>
                      <Calendar size={14} />
                      السجل اليومي
                    </button>
                  </div>
                </div>

                {/* Abstract image */}
                <div style={{
                  width: 200, height: 200, flexShrink: 0, borderRadius: 18, overflow: "hidden",
                  background: "linear-gradient(135deg, #0a0e1f 0%, #111827 100%)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  {/* Animated orb art */}
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    background: "radial-gradient(ellipse at 40% 40%, rgba(20,210,200,0.35) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)",
                    filter: "blur(12px)",
                    animation: "pulse 3s ease-in-out infinite",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 48,
                  }}>🌊</div>
                </div>
              </div>
            </motion.div>

            {/* ── Community Missions ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>مهمات المجتمع</h2>
                <button style={{
                  background: "transparent", border: "none",
                  color: "#14d2c8", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}>عرض الكل <ChevronRight size={13} /></button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {missions.map(m => {
                  const dc = DIFF_COLOR[m.difficulty];
                  return (
                    <motion.div key={m.id} whileHover={{ y: -2 }} style={{
                      borderRadius: 18, padding: "18px 18px 16px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      {/* Header row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: m.iconBg, border: `1px solid ${m.iconColor}22`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <m.icon size={18} style={{ color: m.iconColor }} />
                        </div>
                        <span style={{
                          padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 900,
                          background: dc.bg, color: dc.text, letterSpacing: "0.08em",
                        }}>{m.difficulty}</span>
                      </div>

                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{m.title}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.55, flexGrow: 1 }}>{m.description}</p>

                      {/* Footer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex" }}>
                            {["A","B","C"].map((l, i) => (
                              <div key={l} style={{
                                width: 22, height: 22, borderRadius: "50%",
                                marginRight: i < 2 ? -6 : 0, zIndex: 3 - i,
                                border: "2px solid #070a14",
                                background: ["#14d2c8","#818cf8","#f472b6"][i],
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 8, fontWeight: 900, color: "#fff",
                              }}>{l}</div>
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>+{m.participants}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => toggleMission(m.id)}
                          style={{
                            padding: "6px 14px", borderRadius: 10, outline: "none", cursor: "pointer",
                            background: m.joined ? "rgba(20,210,200,0.1)" : "rgba(20,210,200,0.9)",
                            color: m.joined ? "#14d2c8" : "#070a14",
                            fontSize: 12, fontWeight: 900,
                            border: m.joined ? "1px solid rgba(20,210,200,0.25)" : "none",
                          }}
                        >
                          {m.joined ? "✓ منضم" : "انضم للتحدي"}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Community Echoes ── */}
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 900, color: "#fff" }}>أصداء المجتمع</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {ECHOES.map((echo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      borderRadius: 16, padding: "18px 20px",
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRight: "3px solid rgba(20,210,200,0.3)",
                    }}
                  >
                    {/* Author */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: i === 0 ? "linear-gradient(135deg,#14d2c8,#6366f1)" : "linear-gradient(135deg,#f472b6,#818cf8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 900, color: "#fff",
                      }}>{echo.avatar}</div>
                      <div>
                        <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 900, color: "#fff" }}>{echo.name}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>منذ {echo.time}</p>
                      </div>
                    </div>

                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, fontStyle: "italic" }}>
                      {echo.quote}
                    </p>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { icon: ThumbsUp, label: String(echo.likes) },
                        { icon: MessageSquare, label: "رد" },
                      ].map(({ icon: Icon, label }) => (
                        <button key={label} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "transparent", border: "none",
                          color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>
                          <Icon size={13} />{label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 77 }}>

            {/* Top Analysts */}
            <div style={{
              borderRadius: 18, padding: "18px 16px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart2 size={14} style={{ color: "#14d2c8" }} />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>أبرز المحللين</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TOP_ANALYSTS.map(a => (
                  <div key={a.rank} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.3)",
                      width: 14, textAlign: "center", flexShrink: 0,
                    }}>{a.rank}</span>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: a.rank === 1
                        ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                        : a.rank === 2
                        ? "linear-gradient(135deg,#818cf8,#6366f1)"
                        : "linear-gradient(135deg,#14d2c8,#0ea5e9)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 900, color: "#fff",
                    }}>{a.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{a.points}</p>
                    </div>
                    {a.hasMedal && (
                      <Award size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
              <button style={{
                width: "100%", marginTop: 14,
                background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "8px 0",
                color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>
                عرض الترتيب الكامل
              </button>
            </div>

            {/* Unlockables */}
            <div style={{
              borderRadius: 18, padding: "18px 16px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Gift size={14} style={{ color: "#f59e0b" }} />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>المكافآت</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {UNLOCKABLES.map((u, i) => (
                  <div key={i} style={{
                    borderRadius: 12, padding: "12px 14px",
                    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: u.progress != null || u.cta ? 10 : 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `${u.iconColor}12`, border: `1px solid ${u.iconColor}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <u.icon size={14} style={{ color: u.iconColor }} />
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 900, color: "#fff" }}>{u.title}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{u.sub}</p>
                      </div>
                    </div>
                    {u.progress != null && (
                      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${u.progress}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          style={{ height: "100%", background: u.iconColor, borderRadius: 99 }}
                        />
                      </div>
                    )}
                    {u.cta && (
                      <button style={{
                        width: "100%", marginTop: 2,
                        background: "rgba(20,210,200,0.9)", border: "none",
                        borderRadius: 8, padding: "7px 0",
                        color: "#070a14", fontSize: 11, fontWeight: 900, cursor: "pointer",
                        letterSpacing: "0.05em",
                      }}>{u.cta.toUpperCase()}</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* pulse animation style */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%        { transform: scale(1.1); opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
