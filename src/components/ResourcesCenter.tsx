"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Video, HelpCircle, MessageSquare,
  Search, Tag, Play, Copy, Check, ChevronDown, ChevronUp,
  Bookmark, BookmarkCheck, Star, Clock, Sparkles,
  Heart, Dumbbell, ExternalLink, Flame, ListVideo,
  Calendar, GraduationCap, Users, Trophy, ChevronRight,
  Activity, TrendingUp, Award, CheckCircle2, BarChart3
} from "lucide-react";
import {
  videos as rawVideos,
  successStories,
  faqs,
  categoryLabels,
  type ContentCategory,
  type VideoContent,
  type SuccessStory,
  type FAQItem,
} from "../data/educationalContent";
import { trackAffiliateLinkClicked, trackAffiliateLinkExposed } from "../modules/analytics/affiliateTracking";
import { useAchievementState } from "../state/achievementState";
import { ContentDetailSheet, type ContentDetailType } from "./ContentDetailSheet";
import { CourseDetailPage } from "./CourseDetailPage";
import { fetchContentItems, fetchDBArticles, fetchDBVideoCourses, type UserProgressStats } from "../services/learningService";

/* ══════════════════════════════════════════
   Types & Config
   ══════════════════════════════════════════ */

export type ResourceTab = "videos" | "articles" | "exit-scripts" | "exercises" | "faqs" | "webinars" | "progress";

/* ─── Hero / Recommended ─── */
interface HeroItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  color: string;
  bg: string;
  emoji: string;
  tab: ResourceTab;
  patternId?: string; // links to behavioral pattern
}

const HERO_ITEMS: HeroItem[] = [
  {
    id: "h1", tab: "videos",
    title: "التواصل الفعّال: ما وراء الكلمات",
    subtitle: "تعمّق في علم النفس الكامن وراء الروابط الإنسانية. اكتشف كيف تشكّل درنتك لغة جسدك ونبرياتك الخفية علاقاتك.",
    tag: "موصى به لنموك", color: "#06B6D4",
    bg: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.12))",
    emoji: "💬", patternId: "p2",
  },
  {
    id: "h2", tab: "exercises",
    title: "مرساة الواقع — تمرين 5 دقائق",
    subtitle: "تقنية تهدئة سريعة مثبتة علمياً تعيدك للحاضر فوراً عند الشعور بالاجترار أو القلق.",
    tag: "مناسب لنمطك", color: "#10B981",
    bg: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))",
    emoji: "⚓", patternId: "p3",
  },
  {
    id: "h3", tab: "articles",
    title: "علم الروابط: لماذا تحتاج للآخرين؟",
    subtitle: "استكشاف للأنساق العصبية والبيولوجيا الاجتماعية للانتماء، وتأثيره على الصحة العقلية.",
    tag: "جديد وحصري", color: "#8B5CF6",
    bg: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(244,63,94,0.08))",
    emoji: "🧬",
  },
];

/* ─── Expert Webinars ─── */
interface Webinar {
  id: string;
  title: string;
  host: string;
  date: string;
  duration: string;
  category: string;
  emoji: string;
  color: string;
  isLive?: boolean;
  registrants: number;
}

const WEBINARS: Webinar[] = [
  {
    id: "w1", emoji: "🧠",
    title: "الأنماط العاطفية الخفية في العلاقات",
    host: "د. سارة الأنصاري", date: "الثلاثاء ٢٨ يناير — ٩م",
    duration: "٦٠ دقيقة", category: "علم النفس",
    color: "#8B5CF6", registrants: 347,
  },
  {
    id: "w2", emoji: "💬",
    title: "فن الحوار: كيف تتكلم ليسمعك الآخرون",
    host: "أ. خالد المنصور", date: "الخميس ٣٠ يناير — ٨م",
    duration: "٩٠ دقيقة", category: "مهارات التواصل",
    color: "#06B6D4", registrants: 512, isLive: false,
  },
  {
    id: "w3", emoji: "🌟",
    title: "بناء الثقة بالنفس من جديد",
    host: "أ. نورة العتيبي", date: "الأحد ٢ فبراير — ٧م",
    duration: "٤٥ دقيقة", category: "نمو شخصي",
    color: "#F59E0B", registrants: 228,
  },
];

interface ExitScript {
  id: string;
  situation: string;
  phrases: string[];
  icon: string;
  color: string;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "مبتدئ" | "متوسط" | "متقدم";
  category: string;
  icon: string;
  steps: string[];
}

type DBMeta = Record<string, unknown>;

type DBVideoCourse = {
  id: string | number;
  title?: string;
  estimated_minutes?: number;
  metadata?: DBMeta | null;
};

type DBArticle = {
  id: string | number;
  title?: string;
  estimated_minutes?: number;
  metadata?: DBMeta | null;
};

const TAB_CONFIG: { id: ResourceTab; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: "videos",       label: "فيديوهات",    icon: Video,          color: "#F43F5E" },
  { id: "articles",     label: "قصص نجاح",    icon: BookOpen,       color: "#8B5CF6" },
  { id: "exit-scripts", label: "جمل الخروج",  icon: MessageSquare,  color: "#06B6D4" },
  { id: "exercises",    label: "تمارين",       icon: Dumbbell,       color: "#10B981" },
  { id: "faqs",         label: "أسئلة شائعة", icon: HelpCircle,     color: "#F59E0B" },
  { id: "webinars",     label: "جلسات مباشرة", icon: Users,          color: "#A78BFA" },
  { id: "progress",     label: "تقدمك",       icon: TrendingUp,     color: "#10B981" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  "مبتدئ": "#10B981",
  "متوسط": "#F59E0B",
  "متقدم": "#F43F5E",
};

// Fake progress per content id (Supabase in production)
const PROGRESS_MAP: Record<string, number> = {
  "ex1": 100, "ex2": 60, "ex5": 30,
};

// Fake ratings per content id
const RATINGS_MAP: Record<string, number> = {
  "ex1": 4.9, "ex2": 4.7, "ex3": 4.8, "ex4": 4.6, "ex5": 4.9,
};

// Suggested by smart alert (patternId → content IDs)
const ALERT_SUGGESTED: Record<string, string[]> = {
  p1: ["es1", "es2", "ex3"],
  p2: ["ex2"],
  p3: ["ex1", "ex5"],
};

// Active pattern (production: read from Supabase behavioral_alerts)
const ACTIVE_PATTERN_ID = "p3";

/* Helper: map difficulty score (1-5) → Arabic label */
function mapDifficulty(score: number): Exercise["difficulty"] {
  if (score <= 2) return "مبتدئ";
  if (score <= 4) return "متوسط";
  return "متقدم";
}

/* Helper: path_id → category label */
function mapPathCategory(pathId: string): string {
  const MAP: Record<string, string> = {
    path_protection: "حماية",
    path_detox: "فك ارتباط",
    path_deepening: "تعميق علاقات",
    path_negotiation: "تفاوض",
    path_clarity: "وضوح",
  };
  return MAP[pathId] ?? "نمو شخصي";
}


/* ══════════════════════════════════════════
   Exit Scripts Data
   ══════════════════════════════════════════ */

const EXIT_SCRIPTS: ExitScript[] = [
  {
    id: "es1", situation: "شخص يتجاوز حدودك", icon: "🛡️", color: "#F43F5E",
    phrases: [
      "أنا بقدّر علاقتنا، لكن هذا الموضوع مش مريح لي.",
      "أفضل ما نتكلمش عن هذا.",
      "أنا محتاج مساحة حالياً، وأتمنى تفهم.",
      "لا، مش مناسب لي. شكرًا على تفهمك.",
    ],
  },
  {
    id: "es2", situation: "طلب مفرِط في العمل", icon: "💼", color: "#F59E0B",
    phrases: [
      "مش هقدر أضيف هذا حالياً بسبب أولوياتي الحالية.",
      "ممكن ننسق ده الأسبوع الجاي؟ جدولي ممتلئ.",
      "أنا ملتزم بمواعيد ثانية، هل ممكن فلان يساعد؟",
      "هذا مش في نطاق دوري، لكن أقدر أوجهك للشخص المناسب.",
    ],
  },
  {
    id: "es3", situation: "ضغط عاطفي من شريك", icon: "💔", color: "#8B5CF6",
    phrases: [
      "أنا بحس بضغط، ومحتاج وقت أفكر.",
      "أنا مش بقول إنك غلط، بس محتاج نأخذها بهدوء.",
      "أتمنى نتكلم بس بطريقة أهدأ.",
      "حبك مهم لي، لكن طريقة الكلام دي بتوجعني.",
    ],
  },
  {
    id: "es4", situation: "تدخل من العائلة", icon: "👨‍👩‍👧", color: "#06B6D4",
    phrases: [
      "بحبكم، لكن ده قرار شخصي محتاج آخذه بنفسي.",
      "بقدّر رأيكم، بس أنا محتاج أتعلم من تجاربي.",
      "أنا مش برفضكم، أنا بحمي مساحتي الخاصة.",
      "ممكن نتكلم عن هذا في وقت ثاني؟ مش حاسس إنه مناسب حالياً.",
    ],
  },
];

/* ══════════════════════════════════════════
   Exercises Data
   ══════════════════════════════════════════ */

const EXERCISES: Exercise[] = [
  {
    id: "ex1",
    title: "تمرين مرساة الواقع",
    description: "تقنية تهدئة سريعة عند الشعور بالقلق أو الاجترار.",
    duration: "5 دقائق",
    difficulty: "مبتدئ",
    category: "تهدئة",
    icon: "⚓",
    steps: [
      "اكتب 3 أشياء تشوفها حواليك الآن.",
      "اكتب 2 أصوات تسمعها.",
      "اكتب 1 شيء تقدر تلمسه.",
      "اتنفس 4 ثواني شهيق، 7 ثواني زفير.",
      "كرر حتى تحس بالهدوء.",
    ],
  },
  {
    id: "ex2",
    title: "تصنيف الأفكار الاجترارية",
    description: "حوّل الفكرة المزعجة لتصنيف بدل ما تتفاعل معاها.",
    duration: "10 دقائق",
    difficulty: "متوسط",
    category: "وعي ذاتي",
    icon: "🧠",
    steps: [
      "اكتب الفكرة المزعجة كما هي.",
      "صنّفها: ذنب؟ حنين؟ خوف؟ غضب؟",
      "اسأل: هل هذه حقيقة أم تفسير؟",
      "اكتب بديل واقعي للفكرة.",
      "اقرأ البديل 3 مرات ببطء.",
    ],
  },
  {
    id: "ex3",
    title: "تمرين الحدود اليومي",
    description: "بناء عضلة الحدود بممارسة يومية بسيطة.",
    duration: "3 دقائق",
    difficulty: "مبتدئ",
    category: "حدود",
    icon: "🚧",
    steps: [
      "اختر موقف واحد صغير اليوم قلت فيه 'أيوه' وأنت مش مرتاح.",
      "اكتب ما كان يمكنك قوله بدلاً من ذلك.",
      "تخيل نفسك تقولها بثقة وهدوء.",
      "في المرة القادمة، جرب الجملة الجديدة.",
    ],
  },
  {
    id: "ex4",
    title: "الصيام الشعوري",
    description: "تقليل الاجترار حول شخص معين بشكل تدريجي.",
    duration: "أسبوع",
    difficulty: "متقدم",
    category: "فك ارتباط",
    icon: "🧘",
    steps: [
      "حدد الشخص اللي بتفكر فيه كتير.",
      "كل ما تفكر فيه، اكتب: 'فكرت في [الاسم] الساعة [الوقت] لمدة [كم دقيقة]'.",
      "في نهاية اليوم، راجع السجل. لاحظ المحفزات.",
      "استبدل كل فترة اجترار بنشاط بديل محدد مسبقاً.",
      "قارن عدد مرات التفكير في اليوم 1 واليوم 7.",
    ],
  },
  {
    id: "ex5",
    title: "تنفس 4-7-8",
    description: "تقنية التنفس المهدئة للجهاز العصبي.",
    duration: "4 دقائق",
    difficulty: "مبتدئ",
    category: "تهدئة",
    icon: "🌬️",
    steps: [
      "اجلس بوضع مريح وأغلق عينيك.",
      "شهيق من الأنف لمدة 4 ثواني.",
      "احبس النفس لمدة 7 ثواني.",
      "زفير من الفم لمدة 8 ثواني.",
      "كرر 4 مرات على الأقل.",
    ],
  },
];

/* ══════════════════════════════════════════
   Glass Style
   ══════════════════════════════════════════ */

const glass = (bg = "rgba(255,255,255,0.03)", border = "rgba(255,255,255,0.07)"): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 20,
  backdropFilter: "blur(12px)",
});

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

export function ResourcesCenter({
  onBack,
  initialTab,
  initialSearch,
}: {
  onBack: () => void;
  initialTab?: ResourceTab;
  initialSearch?: string;
}) {
  const [activeTab, setActiveTab] = useState<ResourceTab>(initialTab ?? "videos");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | "all">("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("alrehla_bookmarks");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [detailItem, setDetailItem] = useState<{ id: string; type: ContentDetailType } | null>(null);
  const [queue, setQueue] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("alrehla_queue") ?? "[]"); } catch { return []; }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("alrehla_recent") ?? "[]"); } catch { return []; }
  });
  const [offlineSaved] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem("alrehla_offline");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Supabase: fetch DB articles ──
  const [dbArticles, setDbArticles] = useState<DBArticle[]>([]);
  const [dbVideos, setDbVideos] = useState<DBVideoCourse[]>([]);
  const [globalStats, setGlobalStats] = useState<UserProgressStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    fetchDBArticles().then(items => { if (items.length > 0) setDbArticles(items); }).catch(console.error);
    fetchDBVideoCourses().then(items => { if (items.length > 0) setDbVideos(items); }).catch(console.error);
    
    // Fetch global stats
    const loadStats = async () => {
      setIsStatsLoading(true);
      try {
        const { fetchGlobalUserProgressStats } = await import("../services/learningService");
        const stats = await fetchGlobalUserProgressStats();
        setGlobalStats(stats);
      } catch (err) {
        console.error("Failed to load global stats:", err);
      } finally {
        setIsStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  // ── Supabase: fetch practice content_items ──
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  useEffect(() => {
    fetchContentItems("practice").then(items => {
      const mapped: Exercise[] = items
        .filter(item => item.title && (item.title as string) !== "debug_insert_probe")
        .map(item => {
          const meta = (item.metadata ?? {}) as Record<string, unknown>;
          return {
            id: item.id as string,
            title: item.title as string,
            description: (meta.description as string)
              ?? `تمرين من مسار ${mapPathCategory(meta.path_id as string ?? "")}`,
            duration: `${item.estimated_minutes ?? 5} دقيقة`,
            difficulty: mapDifficulty(Number(item.difficulty ?? 3)),
            category: mapPathCategory(meta.path_id as string ?? ""),
            icon: "🎯",
            steps: [
              `ابدأ بالتصفحة الرئيسية واختر "ابدأ التمرين".`,
              `اجعل ${item.estimated_minutes ?? 5} دقائق لهذا التمرين دون انقطاع.`,
              "سجّل ملاحظتك بعد الانتهاء.",
            ],
          };
        });
      if (mapped.length > 0) setDbExercises(mapped);
    }).catch(console.error);
  }, []);

  // Merged exercises: DB items first, then mock
  const mergedExercises = useMemo(
    () => dbExercises.length > 0 ? [...dbExercises, ...EXERCISES] : EXERCISES,
    [dbExercises]
  );

  // Auto-cycle hero
  useEffect(() => {
    heroTimer.current = setInterval(() => setHeroIdx((p) => (p + 1) % HERO_ITEMS.length), 5000);
    return () => { if (heroTimer.current) clearInterval(heroTimer.current); };
  }, []);

  // Persist queue + offline
  useEffect(() => { localStorage.setItem("alrehla_queue", JSON.stringify(queue)); }, [queue]);
  useEffect(() => { localStorage.setItem("alrehla_offline", JSON.stringify([...offlineSaved])); }, [offlineSaved]);

  const toggleQueue = useCallback((id: string) => {
    setQueue((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const markViewed = useCallback((id: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((x) => x !== id);
      const updated = [id, ...filtered].slice(0, 8);
      localStorage.setItem("alrehla_recent", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Learning streak from localStorage
  const streak = useMemo(() => {
    try { return parseInt(localStorage.getItem("alrehla_streak") ?? "0", 10) || 3; } catch { return 3; }
  }, []);

  const isSuggested = useCallback((id: string) => {
    const suggestedIds = ALERT_SUGGESTED[ACTIVE_PATTERN_ID] ?? [];
    return suggestedIds.includes(id);
  }, []);

  const markLibraryOpened = useAchievementState((s) => s.markLibraryOpened);

  useEffect(() => { markLibraryOpened(); }, [markLibraryOpened]);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem("alrehla_bookmarks", JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Filter helpers
  const matchSearch = useCallback((text: string) => text.toLowerCase().includes(search.toLowerCase()), [search]);
  const matchCat = useCallback((cat: ContentCategory) => selectedCategory === "all" || cat === selectedCategory, [selectedCategory]);

  const filteredVideos = useMemo(() => rawVideos.filter((v) => matchSearch(v.title + v.description) && matchCat(v.category)), [matchSearch, matchCat]);
  const filteredStories = useMemo(() => successStories.filter((s) => matchSearch(s.title + s.summary) && matchCat(s.category)), [matchSearch, matchCat]);
  const filteredFaqs = useMemo(() => faqs.filter((f) => matchSearch(f.question + f.answer) && matchCat(f.category)), [matchSearch, matchCat]);
  const filteredExercises = useMemo(() => mergedExercises.filter((e) => matchSearch(e.title + e.description)), [matchSearch, mergedExercises]);

  // Stats
  const stats = useMemo(() => ({
    total: rawVideos.length + successStories.length + faqs.length + EXIT_SCRIPTS.length + mergedExercises.length,
    bookmarked: bookmarks.size,
    videos: rawVideos.length,
    stories: successStories.length,
  }), [bookmarks.size, mergedExercises.length]);

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#050810",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 70% 40% at 30% 15%, rgba(6,182,212,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 60%)",
      }} />

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(180deg, rgba(6,182,212,0.12) 0%, rgba(5,8,16,1) 100%)",
          padding: "24px 24px 28px",
          borderBottom: "1px solid rgba(6,182,212,0.1)",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button
              onClick={onBack}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: 7, cursor: "pointer", color: "#475569",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{
                margin: 0, fontSize: 22, fontWeight: 900,
                background: "linear-gradient(135deg, #06B6D4, #8B5CF6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                مركز الموارد التعليمية
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 10, color: "#334155" }}>
                كل ما تحتاجه للفهم والتعلم والممارسة — في مكان واحد.
              </p>
            </div>
            {/* Learning Streak */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 12, padding: "6px 10px",
            }}>
              <Flame size={14} color="#F59E0B" />
              <span style={{ fontSize: 12, fontWeight: 900, color: "#F59E0B" }}>{streak}</span>
              <span style={{ fontSize: 8, color: "#78716C", fontWeight: 700 }}>أيام</span>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen size={22} color="#06B6D4" />
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[
              { label: "مادة تعليمية", value: stats.total, color: "#06B6D4" },
              { label: "فيديو", value: stats.videos, color: "#F43F5E" },
              { label: "قصة نجاح", value: stats.stories, color: "#8B5CF6" },
              { label: "محفوظ", value: stats.bookmarked, color: "#F59E0B" },
              { label: "في القائمة", value: queue.length, color: "#A78BFA" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, ...glass(), borderRadius: 14,
                padding: "8px 6px", textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
                <p style={{ margin: "1px 0 0", fontSize: 7, color: "#475569", fontWeight: 700 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={14} color="#334155" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في المقالات والفيديوهات والتمارين..."
              style={{
                width: "100%", padding: "10px 36px 10px 14px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, color: "#e2e8f0", fontSize: 12,
                outline: "none",
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                padding: "5px 12px", borderRadius: 10, fontSize: 9, fontWeight: 800,
                background: selectedCategory === "all" ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedCategory === "all" ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: selectedCategory === "all" ? "#06B6D4" : "#475569", cursor: "pointer",
              }}
            >
              الكل
            </button>
            {(Object.keys(categoryLabels) as ContentCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "5px 12px", borderRadius: 10, fontSize: 9, fontWeight: 800,
                  background: selectedCategory === cat ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedCategory === cat ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}`,
                  color: selectedCategory === cat ? "#06B6D4" : "#475569", cursor: "pointer",
                }}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(5,8,16,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", gap: 0, maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
          {TAB_CONFIG.map((t) => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "12px 0", fontSize: 10, fontWeight: isActive ? 800 : 600,
                  color: isActive ? t.color : "#475569",
                  borderBottom: isActive ? `2px solid ${t.color}` : "2px solid transparent",
                  background: "transparent", border: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          HERO: Recommended Section
         ══════════════════════════════════════════ */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px 0", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-${heroIdx}`}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            onClick={() => setActiveTab(HERO_ITEMS[heroIdx].tab)}
            whileHover={{ scale: 1.01 }}
            style={{
              cursor: "pointer", padding: "20px", borderRadius: 22, marginBottom: 14,
              background: HERO_ITEMS[heroIdx].bg,
              border: `1px solid ${HERO_ITEMS[heroIdx].color}25`,
              backdropFilter: "blur(16px)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: -20, left: -20, fontSize: 80, opacity: 0.07,
              filter: "blur(2px)", lineHeight: 1,
            }}>{HERO_ITEMS[heroIdx].emoji}</div>
            <span style={{
              fontSize: 8, fontWeight: 900, letterSpacing: "0.12em",
              color: HERO_ITEMS[heroIdx].color,
              background: `${HERO_ITEMS[heroIdx].color}15`,
              padding: "3px 10px", borderRadius: 8, marginBottom: 8, display: "inline-block",
            }}>
              ⭐ {HERO_ITEMS[heroIdx].tag}
            </span>
            <h2 style={{ margin: "6px 0 6px", fontSize: 16, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.4 }}>
              {HERO_ITEMS[heroIdx].emoji} {HERO_ITEMS[heroIdx].title}
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
              {HERO_ITEMS[heroIdx].subtitle}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button style={{
                background: HERO_ITEMS[heroIdx].color, border: "none", borderRadius: 10,
                padding: "7px 16px", fontSize: 10, fontWeight: 900, color: "#fff", cursor: "pointer",
              }}>
                ابدأ التعلم الآن
              </button>
              <button style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "7px 12px", fontSize: 10, color: "#94a3b8", cursor: "pointer",
              }}>
                عرض التفاصيل
              </button>
            </div>
            {/* Dots */}
            <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", gap: 4 }}>
              {HERO_ITEMS.map((_, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); setHeroIdx(i); }} style={{
                  width: i === heroIdx ? 16 : 5, height: 5, borderRadius: 3,
                  background: i === heroIdx ? HERO_ITEMS[heroIdx].color : "rgba(255,255,255,0.15)",
                  cursor: "pointer", transition: "all 0.3s",
                }} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Personal Library ── */}
        {(bookmarks.size > 0 || recentlyViewed.length > 0) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Trophy size={13} color="#F59E0B" />
              <span style={{ fontSize: 11, fontWeight: 900, color: "#e2e8f0" }}>مكتبتك الشخصية</span>
              <span style={{ fontSize: 9, color: "#334155", marginRight: "auto" }}>✨</span>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {recentlyViewed.slice(0, 4).map((id) => (
                <div key={id} style={{
                  flexShrink: 0, ...glass("rgba(139,92,246,0.06)", "rgba(139,92,246,0.15)"),
                  padding: "8px 12px", borderRadius: 12, minWidth: 120,
                }}>
                  <p style={{ margin: 0, fontSize: 8, color: "#75569A", fontWeight: 700 }}>تابعت مؤخراً</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#e2e8f0", fontWeight: 700 }}>{id}</p>
                </div>
              ))}
              {bookmarks.size > 0 && (
                <div style={{
                  flexShrink: 0, ...glass("rgba(245,158,11,0.06)", "rgba(245,158,11,0.15)"),
                  padding: "8px 12px", borderRadius: 12, minWidth: 100,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <Bookmark size={14} color="#F59E0B" />
                  <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 900, color: "#F59E0B" }}>{bookmarks.size}</p>
                  <p style={{ margin: 0, fontSize: 8, color: "#78716C" }}>محفوظ</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Upgrade to Pro ── */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{
            marginBottom: 16, padding: "14px 18px", borderRadius: 18,
            background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))",
            border: "1px solid rgba(139,92,246,0.25)",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap size={18} color="#A78BFA" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#e2e8f0" }}>افتح الأرشيف الكامل</p>
            <p style={{ margin: "2px 0 0", fontSize: 9, color: "#64748B" }}>+٢٠٠ محتوى حصري • جلسات مباشرة أسبوعية • دعم شخصي</p>
          </div>
          <button style={{
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            border: "none", borderRadius: 10, padding: "7px 14px",
            fontSize: 9, fontWeight: 900, color: "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            ترقية Pro
          </button>
        </motion.div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 80px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {/* ═══ Progress ═══ */}
          {activeTab === "progress" && (
            <motion.div key="progress" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <ProgressDashboard stats={globalStats} loading={isStatsLoading} />
            </motion.div>
          )}

          {/* ═══ Videos ═══ */}
          {activeTab === "videos" && (
            <motion.div key="videos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* DB Video-Courses from Supabase */}
              {dbVideos.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Sparkles size={11} color="#F43F5E" />
                    <span style={{ fontSize: 9, fontWeight: 900, color: "#F43F5E", textTransform: "uppercase", letterSpacing: "0.06em" }}>فيديوهات من المنصة</span>
                    <span style={{ fontSize: 8, color: "#334155", marginRight: "auto" }}>DB</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dbVideos
                      .filter(v => String(v.title ?? "").toLowerCase().includes(search.toLowerCase()))
                      .map((v, i) => {
                        const meta = (v.metadata ?? {}) as DBMeta;
                        const vid = String(v.id);
                        return (
                          <motion.div key={vid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ ...glass("rgba(244,63,94,0.05)", "rgba(244,63,94,0.18)"), padding: "14px 16px", cursor: "pointer" }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              {meta.thumbnail ? (
                                <img src={String(meta.thumbnail)} alt="" style={{ width: 64, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 64, height: 40, borderRadius: 8, background: "rgba(244,63,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{String(meta.emoji ?? "🎬")}</div>
                              )}
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{String(v.title)}</p>
                                <p style={{ margin: "3px 0 6px", fontSize: 10, color: "#64748B", lineHeight: 1.5 }}>{String(meta.summary ?? "")}</p>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <span style={{ fontSize: 8, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}><Clock size={8} /> {String(meta.duration ?? v.estimated_minutes + " دقيقة")}</span>
                                  {meta.views && <span style={{ fontSize: 8, color: "#334155" }}>{Number(meta.views).toLocaleString("ar")} مشاهدة</span>}
                                </div>
                              </div>
                              <Play size={14} color="#F43F5E" style={{ flexShrink: 0 }} />
                            </div>
                          </motion.div>
                        );
                    })}
                  </div>
                </div>
              )}
              {filteredVideos.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredVideos.map((v, idx) => (
                    <VideoCard key={v.id} video={v} idx={idx} bookmarked={bookmarks.has(v.id)} onBookmark={() => toggleBookmark(v.id)} inQueue={queue.includes(v.id)} onToggleQueue={() => toggleQueue(v.id)} suggested={isSuggested(v.id)} rating={RATINGS_MAP[v.id]}
                      onOpenDetail={() => setDetailItem({ id: v.id, type: "video-course" })} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ Articles / Stories ═══ */}
          {activeTab === "articles" && (
            <motion.div key="articles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* DB Articles from Supabase */}
              {dbArticles.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Sparkles size={11} color="#06B6D4" />
                    <span style={{ fontSize: 9, fontWeight: 900, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.06em" }}>مقالات مُختارة</span>
                    <span style={{ fontSize: 8, color: "#334155", marginRight: "auto" }}>DB</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dbArticles
                      .filter(a => String(a.title ?? "").toLowerCase().includes(search.toLowerCase()))
                      .map((a, i) => {
                        const meta = (a.metadata ?? {}) as DBMeta;
                        const aid = String(a.id);
                        return (
                          <motion.div key={aid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ ...glass("rgba(6,182,212,0.05)", "rgba(6,182,212,0.18)"), padding: "14px 16px", cursor: "pointer" }}
                            onClick={() => markViewed(aid)}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                {String(meta.emoji ?? "📚")}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{String(a.title)}</p>
                                <p style={{ margin: "4px 0 6px", fontSize: 10, color: "#64748B", lineHeight: 1.6 }}>{String(meta.summary ?? "")}</p>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span style={{ fontSize: 8, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                                    <Clock size={8} /> {String(a.estimated_minutes ?? 0)} دقيقة
                                  </span>
                                  {meta.author && <span style={{ fontSize: 8, color: "#475569" }}>{String(meta.author)}</span>}
                                  {meta.reads && <span style={{ fontSize: 8, color: "#334155" }}>{Number(meta.reads).toLocaleString("ar")} قراءة</span>}
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(aid); }}
                                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                                {bookmarks.has(aid) ? <BookmarkCheck size={14} color="#F59E0B" /> : <Bookmark size={14} color="#334155" />}
                              </button>
                            </div>
                          </motion.div>
                        );
                    })}
                  </div>
                </div>
              )}
              {/* Mock stories */}
              {filteredStories.length === 0 && dbArticles.length === 0 ? (
                <EmptyState />
              ) : filteredStories.length > 0 && (
                <div>
                  {dbArticles.length > 0 && <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>قصص نجاح</p>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredStories.map((s, idx) => (
                      <StoryCard key={s.id} story={s} idx={idx}
                        onToggle={() => setDetailItem({ id: s.id, type: "article" })}
                        bookmarked={bookmarks.has(s.id)} onBookmark={() => toggleBookmark(s.id)} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ Exit Scripts ═══ */}
          {activeTab === "exit-scripts" && (
            <motion.div key="exit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {EXIT_SCRIPTS.map((es, idx) => (
                  <motion.div key={es.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{ ...glass(`${es.color}08`, `${es.color}20`), padding: "16px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>{es.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>{es.situation}</span>
                      <span style={{
                        marginRight: "auto", fontSize: 9, fontWeight: 700, color: es.color,
                        background: `${es.color}15`, padding: "2px 8px", borderRadius: 8,
                      }}>
                        {es.phrases.length} جملة
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {es.phrases.map((p, pIdx) => {
                        const uid = `${es.id}-${pIdx}`;
                        return (
                          <div key={pIdx} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 12px",
                            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 12,
                          }}>
                            <p style={{ flex: 1, margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                              "{p}"
                            </p>
                            <button
                              onClick={() => handleCopy(p, uid)}
                              style={{
                                flexShrink: 0, display: "flex", alignItems: "center", gap: 3,
                                padding: "4px 8px", borderRadius: 8,
                                background: copiedId === uid ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${copiedId === uid ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                                cursor: "pointer", fontSize: 8, fontWeight: 700,
                                color: copiedId === uid ? "#10B981" : "#475569",
                              }}
                            >
                              {copiedId === uid ? <><Check size={9} /> تم</> : <><Copy size={9} /> نسخ</>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ Exercises ═══ */}
          {activeTab === "exercises" && (
            <motion.div key="exercises" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredExercises.map((ex, idx) => (
                  <ExerciseCard key={ex.id} exercise={ex} idx={idx}
                    onToggle={() => { markViewed(ex.id); setDetailItem({ id: ex.id, type: "exercise" }); }}
                    bookmarked={bookmarks.has(ex.id)} onBookmark={() => toggleBookmark(ex.id)}
                    progress={PROGRESS_MAP[ex.id]}
                    rating={RATINGS_MAP[ex.id]}
                    inQueue={queue.includes(ex.id)} onToggleQueue={() => toggleQueue(ex.id)}
                    suggested={isSuggested(ex.id)} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ Webinars ═══ */}
          {activeTab === "webinars" && (
            <motion.div key="webinars" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {WEBINARS.map((w, idx) => (
                  <motion.div key={w.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{ ...glass(`${w.color}06`, `${w.color}20`), padding: "14px 16px" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                        background: `${w.color}15`, border: `1px solid ${w.color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      }}>{w.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{w.title}</h4>
                          {w.isLive && (
                            <span style={{
                              fontSize: 7, fontWeight: 900, color: "#F43F5E",
                              background: "rgba(244,63,94,0.15)", padding: "2px 6px", borderRadius: 6,
                              animation: "pulse 1.5s infinite",
                            }}>🔴 مباشر</span>
                          )}
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: 9, color: "#64748B" }}>مع {w.host}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 8, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                            <Calendar size={9} />{w.date}
                          </span>
                          <span style={{ fontSize: 8, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                            <Clock size={9} />{w.duration}
                          </span>
                          <span style={{ fontSize: 8, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                            <Users size={9} />{w.registrants} مسجّل
                          </span>
                        </div>
                      </div>
                      <button style={{
                        flexShrink: 0, background: w.color, border: "none",
                        borderRadius: 10, padding: "7px 12px",
                        fontSize: 9, fontWeight: 900, color: "#fff", cursor: "pointer",
                      }}>سجّل الآن</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ FAQs ═══ */}
          {activeTab === "faqs" && (
            <motion.div key="faqs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {filteredFaqs.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filteredFaqs.map((f, idx) => (
                    <FAQCard key={f.id} faq={f} idx={idx}
                      expanded={expandedId === f.id}
                      onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Course Detail Page (video courses) */}
      <CourseDetailPage
        isOpen={!!detailItem && detailItem.type === "video-course"}
        onClose={() => setDetailItem(null)}
        courseId={detailItem?.id}
        bookmarked={detailItem ? bookmarks.has(detailItem.id) : false}
        onBookmark={() => detailItem && toggleBookmark(detailItem.id)}
      />

      {/* Content Detail Sheet (articles + exercises) */}
      {detailItem && detailItem.type !== "video-course" && (
        <ContentDetailSheet
          itemId={detailItem.id}
          itemType={detailItem.type}
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          bookmarked={bookmarks.has(detailItem.id)}
          onBookmark={() => toggleBookmark(detailItem.id)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Sub-Components
   ══════════════════════════════════════════ */

function VideoCard({ video, idx, bookmarked, onBookmark, inQueue, onToggleQueue, suggested, rating, onOpenDetail }: {
  video: VideoContent; idx: number; bookmarked: boolean; onBookmark: () => void;
  inQueue?: boolean; onToggleQueue?: () => void;
  suggested?: boolean; rating?: number; onOpenDetail?: () => void;
}) {
  useEffect(() => {
    if (!video.videoUrl) return;
    trackAffiliateLinkExposed(video.videoUrl, { placement: "resources_center_video", contentId: video.id, title: video.title });
  }, [video.id, video.title, video.videoUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{
        ...glass("rgba(244,63,94,0.04)", "rgba(244,63,94,0.12)"),
        padding: "14px", display: "flex", gap: 12,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 100, height: 68, borderRadius: 12, overflow: "hidden", flexShrink: 0,
        background: "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(139,92,246,0.1))",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Video size={24} color="#F43F5E" />
        )}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.3)", cursor: onOpenDetail ? "pointer" : "default",
        }} onClick={onOpenDetail}>
          <Play size={20} color="#fff" fill="#fff" />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {suggested && (
          <span style={{
            fontSize: 7, fontWeight: 900, color: "#A78BFA",
            background: "rgba(167,139,250,0.15)", padding: "2px 7px", borderRadius: 6,
            display: "inline-block", marginBottom: 4,
          }}>⚡ موصى بناءً على نمطك</span>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0", flex: 1 }}>{video.title}</h4>
          <button onClick={onBookmark} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {bookmarked ? <BookmarkCheck size={14} color="#F59E0B" /> : <Bookmark size={14} color="#334155" />}
          </button>
        </div>
        <p style={{ margin: "3px 0 6px", fontSize: 10, color: "#475569", lineHeight: 1.6 }}>
          {video.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 8, color: "#334155", display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} /> {video.duration}
          </span>
          {rating && (
            <span style={{ fontSize: 8, color: "#F59E0B", display: "flex", alignItems: "center", gap: 2, fontWeight: 700 }}>
              <Star size={9} fill="#F59E0B" /> {rating.toFixed(1)}
            </span>
          )}
          <span style={{
            fontSize: 8, fontWeight: 700, color: "#06B6D4",
            background: "rgba(6,182,212,0.1)", padding: "1px 6px", borderRadius: 6,
          }}>
            {categoryLabels[video.category]}
          </span>
          {onToggleQueue && (
            <button onClick={onToggleQueue} style={{
              background: inQueue ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${inQueue ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 6, padding: "2px 6px", cursor: "pointer",
              fontSize: 8, fontWeight: 700, color: inQueue ? "#A78BFA" : "#475569",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <ListVideo size={9} />{inQueue ? "في القائمة" : "أضف"}
            </button>
          )}
          {video.videoUrl && (
            <a
              href={video.videoUrl.replace("/embed/", "/watch?v=")}
              target="_blank" rel="noopener noreferrer"
              onClick={() => trackAffiliateLinkClicked(video.videoUrl!, { placement: "resources_center_video", contentId: video.id, title: video.title })}
              style={{
                fontSize: 8, fontWeight: 800, color: "#F43F5E",
                display: "flex", alignItems: "center", gap: 3,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={9} /> شاهد
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StoryCard({ story, idx, onToggle, bookmarked, onBookmark }: {
  story: SuccessStory; idx: number; onToggle: () => void;
  bookmarked: boolean; onBookmark: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{ ...glass("rgba(139,92,246,0.04)", "rgba(139,92,246,0.12)"), overflow: "hidden" }}
    >
      <div
        onClick={onToggle}
        style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Heart size={16} color="#A78BFA" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{story.title}</h4>
          <p style={{ margin: 0, fontSize: 10, color: "#475569", lineHeight: 1.6 }}>{story.summary}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 8, color: "#334155", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} /> {story.duration}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: "#8B5CF6",
              background: "rgba(139,92,246,0.1)", padding: "1px 6px", borderRadius: 6,
            }}>
              {categoryLabels[story.category]}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onBookmark(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {bookmarked ? <BookmarkCheck size={14} color="#F59E0B" /> : <Bookmark size={14} color="#334155" />}
          </button>
          <ChevronRight size={14} color="#475569" />
        </div>
      </div>

    </motion.div>
  );
}

function ExerciseCard({ exercise, idx, onToggle, bookmarked, onBookmark, progress, rating, inQueue, onToggleQueue, suggested }: {
  exercise: Exercise; idx: number; onToggle: () => void;
  bookmarked: boolean; onBookmark: () => void;
  progress?: number; rating?: number;
  inQueue?: boolean; onToggleQueue?: () => void;
  suggested?: boolean;
}) {
  const diffColor = DIFFICULTY_COLORS[exercise.difficulty] ?? "#475569";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{ ...glass("rgba(16,185,129,0.04)", "rgba(16,185,129,0.12)"), overflow: "hidden" }}
    >
      <div
        onClick={onToggle}
        style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}
      >
        <span style={{ fontSize: 24 }}>{exercise.icon}</span>
        <div style={{ flex: 1 }}>
          {suggested && (
            <span style={{
              fontSize: 7, fontWeight: 900, color: "#A78BFA",
              background: "rgba(167,139,250,0.15)", padding: "2px 7px", borderRadius: 6,
              display: "inline-block", marginBottom: 4,
            }}>⚡ موصى بناءً على نمطك</span>
          )}
          <h4 style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{exercise.title}</h4>
          <p style={{ margin: 0, fontSize: 10, color: "#475569", lineHeight: 1.6 }}>{exercise.description}</p>
          {progress !== undefined && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 7, color: "#475569" }}>التقدم</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: progress >= 100 ? "#10B981" : "#06B6D4" }}>{progress}%</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: 3, borderRadius: 2, width: `${progress}%`, background: progress >= 100 ? "#10B981" : "#06B6D4", transition: "width 0.5s" }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 8, color: "#334155", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} /> {exercise.duration}
            </span>
            {rating && (
              <span style={{ fontSize: 8, color: "#F59E0B", display: "flex", alignItems: "center", gap: 2, fontWeight: 700 }}>
                <Star size={9} fill="#F59E0B" /> {rating.toFixed(1)}
              </span>
            )}
            <span style={{
              fontSize: 8, fontWeight: 700, color: diffColor,
              background: `${diffColor}15`, padding: "1px 6px", borderRadius: 6,
            }}>
              {exercise.difficulty}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: "#06B6D4",
              background: "rgba(6,182,212,0.1)", padding: "1px 6px", borderRadius: 6,
            }}>
              {exercise.category}
            </span>
            {onToggleQueue && (
              <button onClick={(e) => { e.stopPropagation(); onToggleQueue(); }} style={{
                background: inQueue ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${inQueue ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 6, padding: "2px 6px", cursor: "pointer",
                fontSize: 8, fontWeight: 700, color: inQueue ? "#A78BFA" : "#475569",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <ListVideo size={9} />{inQueue ? "في القائمة" : "أضف"}
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onBookmark(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {bookmarked ? <BookmarkCheck size={14} color="#F59E0B" /> : <Bookmark size={14} color="#334155" />}
          </button>
          <ChevronRight size={14} color="#475569" />
        </div>
      </div>

    </motion.div>
  );
}

function FAQCard({ faq, idx, expanded, onToggle }: {
  faq: FAQItem; idx: number; expanded: boolean; onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      style={{ ...glass("rgba(245,158,11,0.04)", "rgba(245,158,11,0.12)"), overflow: "hidden" }}
    >
      <div onClick={onToggle} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <HelpCircle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.6 }}>
          {faq.question}
        </p>
        {expanded ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 14px 12px" }}>
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 12, padding: "10px 12px",
              }}>
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>{faq.answer}</p>
              </div>
              {faq.tags && faq.tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {faq.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 8, color: "#475569", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "2px 6px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <Tag size={7} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProgressDashboard({ stats, loading }: { stats: UserProgressStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, border: "3px solid rgba(6,182,212,0.1)", borderTopColor: "#06B6D4", borderRadius: "50%", margin: "0 auto 16px" }}
        />
        <p style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>جاري تحميل إنجازاتك...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
        }}>
          <GraduationCap size={32} color="#8B5CF6" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: "#e2e8f0", margin: "0 0 10px" }}>سجّل دخولك لمتابعة تقدمك</h3>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24, padding: "0 20px" }}>
          انضم لعائلة الرحلة الآن لتتمكن من حفظ إنجازاتك، تتبع الدروس التي أكملتها، ومشاهدة نموّك يوماً بعد يوم.
        </p>
        <button 
          onClick={() => window.location.href = "/auth"}
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            border: "none", borderRadius: 14, padding: "12px 32px",
            fontSize: 14, fontWeight: 900, color: "#fff", cursor: "pointer",
            boxShadow: "0 10px 20px -5px rgba(139,92,246,0.4)"
          }}
        >
          تسجيل الدخول / إنشاء حساب
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "دروس مكتملة", value: stats.totalCompleted, icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    { label: "اختبارات منجزة", value: stats.totalQuizSessions, icon: Award, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    { label: "متوسط الدرجات", value: `${stats.avgScore}%`, icon: BarChart3, color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
    { label: "اختبارات ناجحة", value: stats.passedCount, icon: Trophy, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Grid Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              padding: "20px 16px", borderRadius: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center", position: "relative", overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute", top: -10, left: -10, opacity: 0.05,
              transform: "rotate(-15deg)"
            }}>
              <s.icon size={64} color={s.color} />
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px", border: `1px solid ${s.color}30`
            }}>
              <s.icon size={16} color={s.color} />
            </div>
            <h4 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff" }}>{s.value}</h4>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#64748B", fontWeight: 700 }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Accuracy Chart Placeholder (Using simple bars) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 20, borderRadius: 22,
          background: "linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))",
          border: "1px solid rgba(6,182,212,0.12)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Activity size={16} color="#06B6D4" />
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#e2e8f0" }}>تحليل الأداء</h4>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>دقة الإجابات</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: "#06B6D4" }}>{stats.avgScore}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${stats.avgScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: "100%", background: "linear-gradient(90deg, #06B6D4, #8B5CF6)", borderRadius: 3 }} 
              />
            </div>
          </div>

          <div style={{ 
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12
          }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <TrendingUp size={16} color="#10B981" />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
              لقد أكملت <span style={{ color: "#fff", fontWeight: 700 }}>{stats.totalCompleted}</span> درساً حتى الآن. استمر في التقدم للوصول للدرع الذهبي!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Last Activity */}
      {stats.lastActivity && (
        <div style={{ textAlign: "center", opacity: 0.6 }}>
          <p style={{ fontSize: 9, color: "#475569" }}>
            آخر نشاط: {new Date(stats.lastActivity).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <Search size={32} color="#1e293b" style={{ margin: "0 auto 10px" }} />
      <p style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>لا توجد نتائج</p>
      <p style={{ fontSize: 10, color: "#1e293b" }}>جرب كلمات بحث مختلفة أو غيّر الفئة.</p>
    </div>
  );
}
