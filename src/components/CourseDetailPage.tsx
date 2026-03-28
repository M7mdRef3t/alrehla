"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CourseQuiz } from "./CourseQuiz";
import { VideoPlayer } from "./VideoPlayer";
import {
  X, CheckCircle, Circle, Bookmark, BookmarkCheck,
  Clock, Star, Users, RotateCcw, Share2, Trophy, ChevronDown,
  ChevronRight, ChevronUp, MessageCircle, FileText, BarChart2,
  Download, Wifi, WifiOff, Lock, Zap, Brain, Send,
  AlertCircle, Sparkles, GraduationCap, Play, Award, Maximize, Minimize,
} from "lucide-react";
import {
  fetchCourse, fetchModules, fetchUnits, fetchUserProgress, markUnitComplete,
  fetchUserProgressStats, hasActiveSession, fetchUserProgressDetail, saveVideoProgress,
  fetchComments, postComment, toggleLike,
  saveCourseCompletion,
  type DBCourse, type DBModule, type DBUnit, type UserProgressStats, type CourseComment,
} from "../services/learningService";
import { CourseCertificateModal } from "./CourseCertificateModal";
import { useAuthState } from "../state/authState";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

export interface CourseUnit {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  chapters?: any[]; // For VideoPlayer
  isCompleted?: boolean;
  isLocked?: boolean;
  isRecommended?: boolean; // Behavioral badge
}

export interface CourseModule {
  id: string;
  title: string;
  units: CourseUnit[];
}

export interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: { name: string; title: string; bio: string; emoji: string; color: string };
  rating: number;
  reviewCount: number;
  duration: string;
  color: string;
  emoji: string;
  category: string;
  whatYouLearn: string[];
  aiPersonalReason: string;
  modules: CourseModule[];
}

/* ══════════════════════════════════════════
   Mock Data
   ══════════════════════════════════════════ */

const MOCK_COURSE: CourseData = {
  id: "eq-mastery",
  title: "إتقان الذكاء العاطفي",
  subtitle: "تعمّق في علم النفس الاجتماعي وفهم الدوافع الخفية",
  description: "هذه الدورة ليست مجرد تدريب — إنها رحلة في أعماق النفس البشرية. من خلال «إتقان الذكاء العاطفي» ستكتسب الأدوات التحليلية اللازمة لفهم الدوافع الخفية وراء السلوكيات البشرية. ندمج علم النفس السلوكي وأحدث تقنيات تحليل التلوينات العاطفية لتمنحك رؤية 360 درجة من محيطك.",
  instructor: {
    name: "د. لينا الكاظم",
    title: "كبير محللي السلوك الإنساني",
    bio: "خبرة تزيد عن 15 عاماً في العلاج النفسي والذكاء الاصطناعي العاطفي. قادت د. لينا مئات المبادرات لتحسين الثقافة المؤسسية والنمو الشخصي للأفراد في جميع أنحاء العالم العربي.",
    emoji: "👩‍🏫",
    color: "#A78BFA",
  },
  rating: 4.9,
  reviewCount: 2847,
  duration: "٨ ساعات",
  color: "#06B6D4",
  emoji: "🧠",
  category: "الذكاء العاطفي",
  aiPersonalReason: "بناءً على تحليل نمطك السلوكي — تميل لتجنب الصراع العاطفي. هذه الدورة ستمنحك اللغة والأدوات للتعبير بثقة.",
  whatYouLearn: [
    "تقنيات قراءة اللغة الجسدية وإشارات الضغط النفسي",
    "إدارة الصراعات المعقدة باستخدام الذكاء العاطفي",
    "تطوير التعاطف التحليلي لتعزيز روابط القيادة",
    "بناء مرونة عاطفية فائقة ضد الضغوط الخارجية",
  ],
  modules: [
    {
      id: "m1", title: "الوحدة ١: الأساسيات",
      units: [
        { id: "u1-1", title: "مقدمة في التحليل الأثيري", duration: "١٨ دقيقة", isCompleted: true },
        { id: "u1-2", title: "تشريح العاطفة", duration: "١٤ دقيقة", isCompleted: true },
      ],
    },
    {
      id: "m2", title: "الوحدة ٢: الوعي الذاتي",
      units: [
        { id: "u2-1", title: "تحديد المحفزات الشخصية", duration: "٢٢ دقيقة", isCompleted: true, isRecommended: true },
        { id: "u2-2", title: "التحكم في النبضات", duration: "٢٨ دقيقة", isCompleted: false, isRecommended: true },
      ],
    },
    {
      id: "m3", title: "الوحدة ٣: التعاطف",
      units: [
        { id: "u3-1", title: "قوة التعاطف (جاري المشاهدة)", duration: "٣٢ دقيقة", isCompleted: false },
        { id: "u3-2", title: "قراءة المشاعر الصامتة", duration: "٢٥ دقيقة", isLocked: true },
      ],
    },
    {
      id: "m4", title: "الوحدة ٤: القيادة العاطفية",
      units: [
        { id: "u4-1", title: "الذكاء الاجتماعي المتقدم", duration: "٣٥ دقيقة", isLocked: true },
        { id: "u4-2", title: "بناء فرق عاطفياً ذكية", duration: "٤٠ دقيقة", isLocked: true },
        { id: "u4-3", title: "الإرث العاطفي — الخلاصة", duration: "٢٢ دقيقة", isLocked: true },
      ],
    },
  ],
};

/* ══════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════ */

const glass = (bg = "rgba(255,255,255,0.03)", border = "rgba(255,255,255,0.07)"): React.CSSProperties => ({
  background: bg, border: `1px solid ${border}`, borderRadius: 16, backdropFilter: "blur(12px)",
});

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const LS_PREFIX = "alrehla_course_";
const getLS = (key: string, fallback: unknown) => {
  try { const v = localStorage.getItem(LS_PREFIX + key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const setLS = (key: string, val: unknown) => { try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch { /* noop */ } };

/* ══════════════════════════════════════════
   Micro Achievement Toast
   ══════════════════════════════════════════ */

function MicroAchievement({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      style={{
        position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
        zIndex: 300, pointerEvents: "none",
        background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))",
        border: "1px solid rgba(16,185,129,0.4)",
        borderRadius: 20, padding: "12px 20px",
        backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", gap: 10, minWidth: 240,
      }}
    >
      <Trophy size={20} color="#10B981" />
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#10B981" }}>إنجاز مكتسب! 🎉</p>
        <p style={{ margin: 0, fontSize: 9, color: "#6EE7B7" }}>{title}</p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

export function CourseDetailPage({ isOpen, onClose, courseId = "eq-mastery", bookmarked = false, onBookmark }: Props) {
  // ── Supabase data (falls back to MOCK_COURSE when empty) ──
  const [dbCourse, setDbCourse] = useState<DBCourse | null>(null);
  const [dbModules, setDbModules] = useState<DBModule[]>([]);
  const [dbUnits, setDbUnits] = useState<DBUnit[]>([]);
  const [dbProgress, setDbProgress] = useState<Set<string>>(new Set());
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setDbLoading(true);
    // Try to resolve courseId: if it matches our seeded UUID pattern use it,
    // otherwise fetch the first published course as demo.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const resolvedId = UUID_RE.test(courseId)
      ? courseId
      : "a1b2c3d4-e5f6-0000-0000-000000000001"; // demo course
    Promise.all([
      fetchCourse(resolvedId),
      fetchModules(resolvedId),
      fetchUnits(resolvedId),
      fetchUserProgress(resolvedId),
    ]).then(([c, mods, units, prog]) => {
      if (cancelled) return;
      if (c) setDbCourse(c);
      if (mods.length) setDbModules(mods);
      if (units.length) setDbUnits(units);
      setDbProgress(prog);
    }).catch(console.error)
      .finally(() => { if (!cancelled) setDbLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, courseId]);

  // Merge DB data → CourseData shape (MOCK_COURSE as baseline fallback)
  const course: CourseData = dbCourse && dbModules.length && dbUnits.length ? {
    id: dbCourse.id,
    title: dbCourse.title,
    subtitle: (dbCourse.metadata?.subtitle as string) ?? MOCK_COURSE.subtitle,
    description: dbCourse.description ?? MOCK_COURSE.description,
    instructor: {
      name: dbCourse.instructor_name,
      title: (dbCourse.metadata?.instructor_title as string) ?? "مدرب معتمد",
      bio: dbCourse.instructor_bio ?? "",
      emoji: (dbCourse.metadata?.emoji as string) ?? "👩‍🏫",
      color: dbCourse.color,
    },
    rating: parseFloat((dbCourse.metadata?.rating as string) ?? "4.9"),
    reviewCount: parseInt((dbCourse.metadata?.students as string) ?? "1000"),
    duration: dbCourse.total_duration ?? "—",
    color: dbCourse.color,
    emoji: (dbCourse.metadata?.emoji as string) ?? "🧠",
    category: (dbCourse.metadata?.category as string) ?? "تطوير الذات",
    aiPersonalReason: (dbCourse.metadata?.ai_reason as string) ?? MOCK_COURSE.aiPersonalReason,
    whatYouLearn: (dbCourse.metadata?.what_you_learn as string[]) ?? MOCK_COURSE.whatYouLearn,
    modules: dbModules.map(mod => ({
      id: mod.id,
      title: mod.title,
      units: dbUnits
        .filter(u => u.module_id === mod.id)
        .map(u => ({
          id: u.id,
          title: u.title,
          duration: u.duration,
          videoUrl: u.video_url || undefined,
          chapters: (u.metadata?.chapters as any[]) || undefined,
          isCompleted: dbProgress.has(u.id),
          isLocked: u.is_locked,
        })),
    })),
  } : MOCK_COURSE;

  const resolvedCourseId = dbCourse?.id ?? courseId;
  const color = course.color;

  // ── Progress stats + auth check ──
  const [progressStats, setProgressStats] = useState<UserProgressStats | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    hasActiveSession().then(has => setIsGuest(!has)).catch(() => setIsGuest(false));
    if (resolvedCourseId) {
      fetchUserProgressStats(resolvedCourseId).then(stats => {
        if (stats) setProgressStats(stats);
      }).catch(console.error);
    }
  }, [isOpen, resolvedCourseId]);

  // State
  const [activeTab, setActiveTab] = useState<"content" | "notes" | "community" | "progress">("content");
  const [activeBottomTab, setActiveBottomTab] = useState<"notes" | "resources" | "discussions">("notes");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState("");
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(() =>
    new Set(getLS(`${courseId}_completed`, []) as string[])
  );
  const [detailedProgress, setDetailedProgress] = useState<Record<string, any>>({});
  const [offlineUnits, setOfflineUnits] = useState<Set<string>>(() =>
    new Set(getLS(`${courseId}_offline`, []) as string[])
  );
  const [notes, setNotes] = useState<string>(() => getLS(`${courseId}_notes`, "") as string);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  // New state
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [ratingOpen, setRatingOpen] = useState<string | null>(null); // unitId when open
  const [ratingValue, setRatingValue] = useState(0);
  const [nextLessonHighlight, setNextLessonHighlight] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [certVisible, setCertVisible] = useState(false);
  const user = useAuthState((s) => s.user);
  const displayName = useAuthState((s) => s.displayName);

  // Discussions — Supabase-backed with localStorage fallback for guests
  interface Comment { id: string; name: string; text: string; avatar: string; time: number; likes: number; liked: boolean; }
  const toLocal = (c: CourseComment): Comment => ({ id: c.id, name: c.display_name, text: c.body, avatar: c.avatar, time: new Date(c.created_at).getTime(), likes: c.likes, liked: c.liked ?? false });
  const [comments, setComments] = useState<Comment[]>(() => {
    try { return JSON.parse(localStorage.getItem(`${courseId}_comments`) ?? "[]") as Comment[]; } catch { return []; }
  });
  const [commentInput, setCommentInput] = useState("");
  const [commentsSource, setCommentsSource] = useState<"db" | "local">("local");

  // Fetch from Supabase when discussion tab is opened
  const loadComments = useCallback(async () => {
    const dbComments = await fetchComments(courseId);
    if (dbComments.length > 0) {
      setComments(dbComments.map(toLocal));
      setCommentsSource("db");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const addComment = async () => {
    if (!commentInput.trim()) return;
    const body = commentInput.trim();
    setCommentInput("");
    // Optimistic local update
    const tempId = `temp_${Date.now()}`;
    const optimistic: Comment = { id: tempId, name: "أنت", text: body, avatar: "✨", time: Date.now(), likes: 0, liked: false };
    setComments(prev => [optimistic, ...prev]);
    // Try Supabase
    const saved = await postComment({ courseId, body, displayName: "أنت", avatar: "✨" });
    if (saved) {
      setComments(prev => prev.map(c => c.id === tempId ? toLocal(saved) : c));
      setCommentsSource("db");
    } else {
      // Persist to localStorage if offline
      const updated = [optimistic, ...comments];
      localStorage.setItem(`${courseId}_comments`, JSON.stringify(updated));
    }
  };

  const likeComment = async (id: string) => {
    // Optimistic
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked } : c));
    const result = await toggleLike(id);
    if (result === null) {
      // Revert on failure
      setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked } : c));
    }
  };

  // Sync progress from DB
  useEffect(() => {
    if (!resolvedCourseId) return;
    fetchUserProgressDetail(resolvedCourseId).then(data => {
      const detail: Record<string, any> = {};
      const completed = new Set<string>(completedUnits);
      data.forEach(r => {
        detail[r.unit_id] = r;
        if (r.completed_at) completed.add(r.unit_id);
      });
      setDetailedProgress(detail);
      setCompletedUnits(completed);
    }).catch(console.error);

    if (!dbLoading && course.modules.length > 0) {
      const firstUnit = course.modules[0]?.units[0];
      if (firstUnit) {
        setExpandedModule(course.modules[0].id);
        setActiveUnitId(firstUnit.id);
      }
    }
  }, [resolvedCourseId, dbLoading]);

  // Auto-expand the module containing the active unit
  useEffect(() => {
    if (!activeUnitId) return;
    const parentMod = course.modules.find(m => m.units.some(u => u.id === activeUnitId));
    if (parentMod) setExpandedModule(parentMod.id);
  }, [activeUnitId, course.modules]);

  // Derived
  const allUnits = course.modules.flatMap(m => m.units);
  const totalUnits = allUnits.length;
  const doneCount = allUnits.filter(u => completedUnits.has(u.id) || u.isCompleted).length;
  const progressPct = Math.round((doneCount / totalUnits) * 100);

  // Responsive
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Resume from last watched unit
  useEffect(() => {
    if (!isOpen) return;
    const saved = getLS(`${courseId}_lastUnit`, "") as string;
    if (saved && allUnits.some(u => u.id === saved)) {
      setActiveUnitId(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId]);

  // Save last-watched unit on change
  useEffect(() => {
    if (activeUnitId) setLS(`${courseId}_lastUnit`, activeUnitId);
  }, [activeUnitId, courseId]);

  // Keyboard shortcuts: Space=play/pause, ←→=seek10s, F=fullscreen
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const vid = document.querySelector("video") as HTMLVideoElement | null;
      if (!vid) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        vid.paused ? vid.play() : vid.pause();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        vid.currentTime = Math.max(0, vid.currentTime - 10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          vid.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const markComplete = useCallback((uid: string) => {
    setCompletedUnits(prev => {
      const next = new Set(prev);
      next.add(uid);
      setLS(`${courseId}_completed`, [...next]);
      markUnitComplete(resolvedCourseId, uid).catch(console.error);
      const parentModule = course.modules.find(m => m.units.some(u => u.id === uid));
      if (parentModule && parentModule.units.every(u => next.has(u.id) || u.isCompleted)) {
        setAchievement(`أنت وحش! خلصت ${parentModule.title} بنجاح.. 🧠`);
      }
      // ── Check full course completion ──
      const totalAll = course.modules.flatMap(m => m.units).length;
      const doneAll = course.modules.flatMap(m => m.units).filter(u => next.has(u.id) || u.isCompleted).length;
      if (doneAll >= totalAll && totalAll > 0) {
        // Save certificate to Supabase (async, non-blocking)
        if (user?.id) {
          void saveCourseCompletion({
            userId: user.id,
            userName: displayName ?? user.email?.split("@")[0] ?? "المستخدم",
            courseId: resolvedCourseId,
            courseTitle: course.title,
            courseCategory: course.category,
            instructorName: course.instructor.name,
            totalHours: course.duration,
          });
        }
        // Show certificate modal after a short celebration delay
        setTimeout(() => setCertVisible(true), 800);
      }
      return next;
    });
    // Trigger rating modal
    setRatingOpen(uid);
    setRatingValue(0);
  }, [courseId, resolvedCourseId, course.modules, course, user, displayName]);

  const handleVideoEnded = useCallback((uid: string) => {
    markComplete(uid);
    const currentIndex = allUnits.findIndex(u => u.id === uid);
    if (currentIndex !== -1 && currentIndex < allUnits.length - 1) {
      const nextUnit = allUnits[currentIndex + 1];
      if (!nextUnit.isLocked) {
        setNextLessonHighlight(nextUnit.id);
        setAchievement("ثواني وهنقلب على الدرس اللي عليه الدور.. 🚀");
        setTimeout(() => {
          setActiveUnitId(nextUnit.id);
          setNextLessonHighlight(null);
        }, 2500);
      }
    }
  }, [allUnits, markComplete]);

  const lastSyncTime = useRef(0);
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
    if (Math.abs(time - lastSyncTime.current) > 15) {
      lastSyncTime.current = time;
      saveVideoProgress(resolvedCourseId, activeUnitId, time).catch(console.error);
    }
  }, [resolvedCourseId, activeUnitId]);

  const toggleOffline = useCallback((uid: string) => {
    setOfflineUnits(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      setLS(`${courseId}_offline`, [...next]);
      return next;
    });
  }, [courseId]);

  const activeUnit = allUnits.find(u => u.id === activeUnitId);

  // ── SIDEBAR ──
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* Progress summary */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0" }}>تقدمك</span>
          <span style={{ fontSize: 12, fontWeight: 900, color }}>{progressPct}% مكتمل</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ height: 5, borderRadius: 3, background: `linear-gradient(90deg, ${color}, #8B5CF6)` }}
          />
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 8, color: "#475569" }}>{doneCount} من {totalUnits} درس مكتمل</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 8px" }}>
        {([
          { id: "content", icon: GraduationCap, label: "المحتوى" },
          { id: "notes", icon: FileText, label: "ملاحظاتي" },
          { id: "community", icon: MessageCircle, label: "المجتمع" },
          { id: "progress", icon: BarChart2, label: "التقدم" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: "10px 4px", background: "none", border: "none",
            borderBottom: `2px solid ${activeTab === t.id ? color : "transparent"}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            transition: "all 0.2s",
          }}>
            <t.icon size={13} color={activeTab === t.id ? color : "#475569"} />
            <span style={{ fontSize: 7, fontWeight: 700, color: activeTab === t.id ? color : "#475569" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        <AnimatePresence mode="wait">
          {activeTab === "content" && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {course.modules.map(mod => {
                const modDone = mod.units.every(u => u.isCompleted || completedUnits.has(u.id));
                const isExpanded = expandedModule === mod.id;
                return (
                  <div key={mod.id} style={{ marginBottom: 2 }}>
                    <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                      background: isExpanded ? "rgba(255,255,255,0.04)" : "none",
                      border: "none", cursor: "pointer", textAlign: "right",
                    }}>
                      {modDone
                        ? <CheckCircle size={13} color="#10B981" />
                        : <Circle size={13} color="#334155" />}
                      <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: "#e2e8f0" }}>{mod.title}</span>
                      {isExpanded ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}
                        >
                          {mod.units.map(unit => {
                            const isDone = unit.isCompleted || completedUnits.has(unit.id);
                            const isActive = activeUnitId === unit.id;
                            const isOff = offlineUnits.has(unit.id);
                            return (
                              <div key={unit.id} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 12px 8px 24px",
                                background: isActive ? `${color}12` : "transparent",
                                borderRight: isActive ? `2px solid ${color}` : "2px solid transparent",
                                opacity: unit.isLocked ? 0.35 : 1,
                                cursor: unit.isLocked ? "not-allowed" : "pointer",
                              }}
                                onClick={() => !unit.isLocked && setActiveUnitId(unit.id)}
                              >
                                {unit.isLocked
                                  ? <Lock size={10} color="#334155" />
                                  : isDone
                                    ? <CheckCircle size={10} color="#10B981" />
                                    : <Play size={10} color={isActive ? color : "#475569"} fill={isActive ? color : "none"} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 9, fontWeight: isActive ? 800 : 600, color: isActive ? "#e2e8f0" : "#94a3b8", lineHeight: 1.4 }} className="truncate">
                                    {unit.title}
                                  </p>
                                  <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 1 }}>
                                    <span style={{ fontSize: 7, color: "#334155" }}>{unit.duration}</span>
                                    {unit.isRecommended && (
                                      <span style={{ fontSize: 6, fontWeight: 900, color: "#A78BFA", background: "rgba(167,139,250,0.15)", padding: "1px 4px", borderRadius: 4 }}>⚡ موصى</span>
                                    )}
                                  </div>
                                </div>
                                {!unit.isLocked && (
                                  <button onClick={e => { e.stopPropagation(); toggleOffline(unit.id); }} style={{
                                    background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.6, flexShrink: 0,
                                  }}>
                                    {isOff ? <Wifi size={9} color="#06B6D4" /> : <Download size={9} color="#334155" />}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: "8px 12px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 9, color: "#64748B" }}>ملاحظاتك الخاصة — تُحفظ تلقائياً</p>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setLS(`${courseId}_notes`, e.target.value); }}
                placeholder="اكتب أفكارك، أسئلتك، أو insights هنا..."
                style={{
                  width: "100%", minHeight: 160, padding: "10px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#e2e8f0", fontSize: 11, lineHeight: 1.7, resize: "vertical",
                  fontFamily: "inherit", direction: "rtl",
                }}
              />
            </motion.div>
          )}

          {activeTab === "community" && (
            <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: "8px 12px" }}>
              {[
                { name: "سارة أ.", text: "الوحدة الثانية غيّرت كيف أقرأ الناس — شكراً د. لينا!", time: "منذ ٢ ساعة", avatar: "🌸" },
                { name: "محمد خ.", text: "تمرين التحفيزات الشخصية كان بالغ الأثر. جرّبته مع زملائي.", time: "منذ ٥ ساعات", avatar: "✨" },
                { name: "نورة م.", text: "هل من أحد مرّ بصعوبة في الوحدة الثالثة؟ يسعدني التشارك.", time: "منذ يوم", avatar: "💙" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{c.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#e2e8f0" }}>{c.name}</span>
                      <span style={{ fontSize: 7, color: "#334155" }}>{c.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{c.text}</p>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input placeholder="شارك فكرة أو سؤالاً..." style={{
                  flex: 1, padding: "8px 10px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#e2e8f0", fontSize: 10, direction: "rtl",
                }} />
                <button style={{ background: color, border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
                  <Send size={12} color="#fff" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "progress" && (
            <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: "12px 14px" }}>
              {/* Guest prompt */}
              {isGuest && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ 
                    marginBottom: 16, padding: "12px 14px", borderRadius: 14, 
                    background: "rgba(245,158,11,0.06)", 
                    border: "1px solid rgba(245,158,11,0.15)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", gap: 10 
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertCircle size={16} color="#F59E0B" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#F59E0B" }}>{"سجّل الدخول لحفظ أثرك ✨"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(245,158,11,0.7)", lineHeight: 1.4 }}>{"تحتاج لتسجيل الدخول ليتمكن النظام من تتبع تقدمك في المحتوى."}</p>
                  </div>
                </motion.div>
              )}

              {/* Glassmorphic Stats Grid */}
              {progressStats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "دروس منتهية", value: progressStats.totalCompleted, clr: "#10B981", icon: <CheckCircle size={14} />, detail: "أحسنت!" },
                    { label: "محاولات تقييم", value: progressStats.totalQuizSessions, clr: color, icon: <Trophy size={14} />, detail: "إصرار رائع" },
                    { label: "متوسط الدرجات", value: progressStats.avgScore ? `${progressStats.avgScore}%` : "—", clr: "#8B5CF6", icon: <BarChart2 size={14} />, detail: "مستوى الوعي" },
                    { label: "شهادات إتمام", value: progressStats.passedCount, clr: "#F59E0B", icon: <Award size={14} />, detail: "تميز معرفي" },
                  ].map((s, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ translateY: -2 }}
                      style={{ 
                        padding: "14px 12px", borderRadius: 16, 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid rgba(255,255,255,0.05)",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div style={{ color: s.clr, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {s.icon}
                        <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>{s.detail}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em" }}>{s.value}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 8, color: "#94a3b8", fontWeight: 600 }}>{s.label}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Progress Summary */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#f1f5f9" }}>{"خارطة التعلم"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 8, color: "#64748b" }}>{"تتبع رحلتك عبر الوحدات"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 14, fontWeight: 950, color }}>{Math.round(((progressStats?.totalCompleted || 0) / (totalUnits || 1)) * 100)}%</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 4, height: 6, marginBottom: 16 }}>
                   {Array.from({ length: 12 }).map((_, i) => (
                     <div key={i} style={{ flex: 1, borderRadius: 3, background: i < (progressStats?.totalCompleted || 0) ? `linear-gradient(to bottom, ${color}, #8B5CF6)` : "rgba(255,255,255,0.05)" }} />
                   ))}
                </div>
              </div>

              {/* Detailed Module Progress */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {course.modules.map(mod => {
                  const done = mod.units.filter(u => u.isCompleted || completedUnits.has(u.id)).length;
                  const pct = Math.round((done / mod.units.length) * 100);
                  const isFullyDone = pct === 100;
                  
                  return (
                    <div key={mod.id} style={{ padding: "0 0 14px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                           <div style={{ 
                             width: 6, height: 6, borderRadius: "50%", 
                             background: isFullyDone ? "#10B981" : pct > 0 ? color : "rgba(255,255,255,0.1)" 
                           }} />
                           <span style={{ fontSize: 10, fontWeight: 800, color: isFullyDone ? "#f1f5f9" : "#cbd5e1" }}>{mod.title}</span>
                        </div>
                        <span style={{ fontSize: 8, fontWeight: 900, color: isFullyDone ? "#10B981" : "#64748b" }}>{done}/{mod.units.length}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          style={{ 
                            height: "100%", borderRadius: 2, 
                            background: isFullyDone ? "#10B981" : `linear-gradient(90deg, ${color}, #8B5CF6)`
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // ── MAIN CONTENT ──
  const MainContent = () => (
    <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "0 0 40px" : "0 0 90px" }}>
      {/* Hero */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${color}25, rgba(139,92,246,0.2), rgba(7,9,26,0.9))`,
        padding: "28px 20px 22px", marginBottom: 16,
      }}>
        {/* Ambient blobs */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `${color}12`, filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(139,92,246,0.1)", filter: "blur(30px)", pointerEvents: "none" }} />

        {/* Category tag */}
        <span style={{ fontSize: 8, fontWeight: 900, color, background: `${color}18`, border: `1px solid ${color}30`, padding: "3px 10px", borderRadius: 8, letterSpacing: "0.08em", display: "inline-block", marginBottom: 10 }}>
          {course.category}
        </span>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 6px", fontSize: isDesktop ? 22 : 18, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.3 }}>
              {course.emoji} {course.title}
            </h1>
            <p style={{ margin: "0 0 12px", fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>{course.subtitle}</p>

            {/* Meta */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ fontSize: 9, color: "#F59E0B", display: "flex", alignItems: "center", gap: 3, fontWeight: 800 }}>
                <Star size={10} fill="#F59E0B" /> {course.rating} ({course.reviewCount.toLocaleString()} تقييم)
              </span>
              <span style={{ fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={9} /> {course.duration}
              </span>
              <span style={{ fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                <Users size={9} /> {totalUnits} دروس
              </span>
            </div>

            {/* Session recall */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
                  borderRadius: 12, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
                  fontSize: 12, fontWeight: 900, color: "#fff",
                }}
              >
                <Play size={15} fill="#fff" /> استئناف الدرس
              </button>
              <button style={{
                display: "flex", alignItems: "center", gap: 5, padding: "10px 14px",
                borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 10, color: "#94a3b8",
              }}>
                <RotateCcw size={12} /> من البداية
              </button>
              <button onClick={onBookmark} style={{
                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                background: bookmarked ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${bookmarked ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}>
                {bookmarked ? <BookmarkCheck size={14} color="#F59E0B" /> : <Bookmark size={14} color="#475569" />}
              </button>
              <button style={{ padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Share2 size={14} color="#475569" />
              </button>
            </div>
          </div>

          {/* Instructor mini avatar */}
          {isDesktop && (
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: `${course.instructor.color}15`, border: `2px solid ${course.instructor.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 4,
              }}>{course.instructor.emoji}</div>
              <p style={{ margin: 0, fontSize: 8, color: "#64748B", fontWeight: 700 }}>{course.instructor.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* AI Personal Reason */}
        <div style={{ ...glass("rgba(167,139,250,0.06)", "rgba(167,139,250,0.2)"), padding: "14px 16px", borderRadius: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Brain size={16} color="#A78BFA" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 9, fontWeight: 900, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                🎯 لماذا هذه الدورة لك؟
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>{course.aiPersonalReason}</p>
            </div>
          </div>
        </div>

        {/* Currently Active Unit — Real VideoPlayer */}
        {activeUnit && (
          <div>
            {activeUnit.isRecommended && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: "#A78BFA", background: "rgba(167,139,250,0.15)", padding: "3px 10px", borderRadius: 8 }}>⚡ موصى بناءً على نمطك</span>
              </div>
            )}
            <VideoPlayer
              unitId={activeUnit.id}
              src={activeUnit.videoUrl}
              chapters={activeUnit.chapters}
              title={activeUnit.title}
              color={color}
              savedTime={detailedProgress[activeUnit.id]?.last_position}
              nextUnitTitle={allUnits[allUnits.findIndex(u => u.id === activeUnit.id) + 1]?.title}
              onEnded={() => handleVideoEnded(activeUnit.id)}
              onTimeUpdate={handleTimeUpdate}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{activeUnit.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={8} /> {activeUnit.duration}
                </p>
              </div>
              <button
                onClick={() => markComplete(activeUnit.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: completedUnits.has(activeUnit.id) || activeUnit.isCompleted
                    ? "rgba(16,185,129,0.15)" : `${color}15`,
                  color: completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "#10B981" : color,
                  fontSize: 9, fontWeight: 900,
                }}>
                <CheckCircle size={12} />
                {completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "مكتمل ✓" : "علّم مكتملاً"}
              </button>
            </div>
          </div>
        )}

        {/* About */}
        <div style={{ ...glass("rgba(6,182,212,0.04)", "rgba(6,182,212,0.12)"), padding: "16px", borderRadius: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 900, color }}>عن الدورة</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.9 }}>{course.description}</p>
        </div>

        {/* What you'll learn */}
        <div style={{ ...glass("rgba(139,92,246,0.04)", "rgba(139,92,246,0.12)"), padding: "16px", borderRadius: 16 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 900, color: "#A78BFA", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={14} /> ماذا ستتعلم
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 8 }}>
            {course.whatYouLearn.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <CheckCircle size={13} color="#A78BFA" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", lineHeight: 1.7 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructor */}
        <div style={{ ...glass("rgba(255,255,255,0.02)", "rgba(255,255,255,0.07)"), padding: "16px", borderRadius: 16 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>زاوية المدرب</p>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: `${course.instructor.color}15`, border: `2px solid ${course.instructor.color}25`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
            }}>{course.instructor.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#f1f5f9" }}>{course.instructor.name}</p>
              <p style={{ margin: "0 0 8px", fontSize: 9, color: course.instructor.color, fontWeight: 700 }}>{course.instructor.title}</p>
              <p style={{ margin: 0, fontSize: 10, color: "#64748B", lineHeight: 1.8 }}>{course.instructor.bio}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, padding: "14px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
            fontSize: 13, fontWeight: 900, color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          >
            <Play size={16} fill="#fff" /> متابعة التعلم
          </button>
          <button
            onClick={() => setQuizOpen(true)}
            style={{
              padding: "14px 16px", borderRadius: 16, cursor: "pointer",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 900, color: "#F59E0B",
            }}
          >
            <Trophy size={14} /> الاختبار النهائي
          </button>
        </div>
      </div>
    </div>
  );

  // ── DESKTOP LAYOUT — Immersive Player-First ──
  const DesktopLayout = () => {
    const activeBottomTabs = [
      { id: "notes" as const, label: "الملاحظات" },
      { id: "resources" as const, label: "المصادر" },
      { id: "discussions" as const, label: "النقاشات" },
    ];

    const RESOURCES = [
      { title: "دليل التعاطف التحليلي", size: "٢.٤ ميجا", type: "PDF" },
      { title: "تمارين الوعي العاطفي", size: "١.١ ميجا", type: "PDF" },
      { title: "ورقة عمل: قراءة المشاعر", size: "٠.٨ ميجا", type: "PDF" },
    ];

    return (
      <div style={{ display: "flex", height: "100%", overflow: "hidden", direction: "rtl", position: "relative" }}>
        {/* ── LEFT: Player + Info + Bottom Tabs ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 }}>

          {/* ── VIDEO PLAYER (sticky) ── */}
          <div style={{ background: "#000", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
            {activeUnit ? (
              <div style={{ position: "relative" }}>
                <VideoPlayer
                  unitId={activeUnit.id}
                  src={activeUnit.videoUrl}
                  chapters={activeUnit.chapters}
                  title={activeUnit.title}
                  color={color}
                  savedTime={detailedProgress[activeUnit.id]?.last_position}
                  nextUnitTitle={allUnits[allUnits.findIndex(u => u.id === activeUnit.id) + 1]?.title}
                  onEnded={() => handleVideoEnded(activeUnit.id)}
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>
            ) : (
              <div style={{
                aspectRatio: "16/9",
                background: `linear-gradient(135deg, ${color}18, rgba(139,92,246,0.12), #000)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ textAlign: "center" }}>
                  <Play size={48} color={`${color}80`} fill={`${color}40`} />
                  <p style={{ color: "rgba(255,255,255,0.3)", marginTop: 8, fontSize: 13 }}>اختر درساً لتبدأ</p>
                </div>
              </div>
            )}
          </div>

          {/* ── UNIT TITLE + ACTIONS ── */}
          {activeUnit && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 24px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ flex: 1 }}>
                {activeUnit.isRecommended && (
                  <span style={{ fontSize: 8, fontWeight: 900, color: "#A78BFA", background: "rgba(167,139,250,0.15)", padding: "2px 8px", borderRadius: 6, display: "inline-block", marginBottom: 6 }}>⚡ موصى بناءً على نمطك</span>
                )}
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.3 }}>{activeUnit.title}</h2>
                {/* Action buttons row */}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {/* Mark complete */}
                  <button
                    onClick={() => markComplete(activeUnit.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
                      borderRadius: 10, border: "none", cursor: "pointer",
                      background: completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "rgba(16,185,129,0.15)" : `${color}15`,
                      color: completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "#10B981" : color,
                      fontSize: 10, fontWeight: 900,
                    }}
                  >
                    <CheckCircle size={12} />
                    {completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "مكتمل ✓" : "علّم مكتملاً"}
                  </button>
                  {/* Focus mode */}
                  <button
                    onClick={() => setFocusMode(v => !v)}
                    title={focusMode ? "إظهار المنهج" : "وضع التركيز"}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                      borderRadius: 10, cursor: "pointer",
                      background: focusMode ? `${color}20` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${focusMode ? color + "40" : "rgba(255,255,255,0.08)"}`,
                      fontSize: 10, fontWeight: 800,
                      color: focusMode ? color : "#64748B",
                    }}
                  >
                    {focusMode ? <Maximize size={12} /> : <Minimize size={12} />}
                    {focusMode ? "إظهار المنهج" : "وضع التركيز"}
                  </button>
                  {/* Share at timestamp */}
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}?course=${courseId}&unit=${activeUnit.id}&t=${Math.floor(currentVideoTime)}`;
                      navigator.clipboard.writeText(url).catch(() => {});
                      setAchievement("تم نسخ رابط اللحظة! 🔗");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                      borderRadius: 10, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 10, fontWeight: 800, color: "#64748B",
                    }}
                  >
                    <Share2 size={11} /> مشاركة عند {fmtTime(currentVideoTime)}
                  </button>
                  {/* Get cert */}
                  <button
                    onClick={() => {
                      // If course ≥50% done, generate cert — else open quiz
                      if (progressPct >= 50) {
                        const canvas = document.createElement("canvas");
                        canvas.width = 900; canvas.height = 640;
                        const ctx = canvas.getContext("2d")!;
                        // Background
                        const bg = ctx.createLinearGradient(0, 0, 900, 640);
                        bg.addColorStop(0, "#0a0f2e"); bg.addColorStop(1, "#050810");
                        ctx.fillStyle = bg; ctx.fillRect(0, 0, 900, 640);
                        // Border frame
                        ctx.strokeStyle = color; ctx.lineWidth = 3;
                        ctx.strokeRect(24, 24, 852, 592);
                        ctx.strokeStyle = `${color}40`; ctx.lineWidth = 1;
                        ctx.strokeRect(34, 34, 832, 572);
                        // Title
                        ctx.fillStyle = color; ctx.font = "bold 18px Arial";
                        ctx.textAlign = "center"; ctx.fillText("شهادة إتمام", 450, 100);
                        // Course name
                        ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 30px Arial";
                        ctx.fillText(course.title, 450, 160);
                        // Subtitle
                        ctx.fillStyle = "#94a3b8"; ctx.font = "16px Arial";
                        ctx.fillText("بإكمال الدورة التعليمية بنجاح", 450, 210);
                        // Progress
                        ctx.fillStyle = "#10B981"; ctx.font = "bold 22px Arial";
                        ctx.fillText(`${progressPct}% إنجاز`, 450, 270);
                        // Instructor
                        ctx.fillStyle = "#64748B"; ctx.font = "14px Arial";
                        ctx.fillText(`المدرب: ${course.instructor.name}`, 450, 330);
                        // Date
                        ctx.fillStyle = "#475569"; ctx.font = "12px Arial";
                        ctx.fillText(new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }), 450, 380);
                        // Trophy emoji area
                        ctx.font = "60px Arial"; ctx.fillText("🏆", 450, 490);
                        // Download
                        const a = document.createElement("a");
                        a.href = canvas.toDataURL("image/png");
                        a.download = `certificate-${course.title}.png`;
                        a.click();
                        setAchievement("تم تحميل الشهادة! 🎓");
                      } else {
                        setQuizOpen(true);
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                      borderRadius: 10, cursor: "pointer",
                      background: progressPct >= 50 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.08)",
                      border: `1px solid ${progressPct >= 50 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.2)"}`,
                      fontSize: 10, fontWeight: 900,
                      color: progressPct >= 50 ? "#10B981" : "#F59E0B",
                    }}
                  >
                    <Trophy size={11} /> {progressPct >= 50 ? "تحميل الشهادة" : "الاختبار النهائي"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── BOTTOM TABS (Notes / Resources / Discussions) ── */}
          <div style={{ flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", padding: "0 24px" }}>
            {activeBottomTabs.map(t => (
              <button key={t.id} onClick={() => { setActiveBottomTab(t.id); if (t.id === "discussions") loadComments(); }} style={{
                padding: "12px 20px", background: "none", border: "none",
                borderBottom: `2px solid ${activeBottomTab === t.id ? color : "transparent"}`,
                cursor: "pointer", fontSize: 12, fontWeight: activeBottomTab === t.id ? 800 : 600,
                color: activeBottomTab === t.id ? color : "#475569",
                transition: "all 0.2s",
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── BOTTOM TAB CONTENT ── */}
          <div style={{ flex: 1, padding: "20px 24px", minHeight: 300 }}>
            <AnimatePresence mode="wait">

              {activeBottomTab === "notes" && (
                <motion.div key="notes-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", gap: 20 }}>
                  {/* Note input */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <textarea
                        value={notes}
                        onChange={e => { setNotes(e.target.value); setLS(`${courseId}_notes`, e.target.value); }}
                        placeholder="ابدأ بكتابة ملاحظاتك هنا..."
                        style={{
                          width: "100%", minHeight: 120, padding: 12, borderRadius: 12,
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                          color: "#e2e8f0", fontSize: 12, lineHeight: 1.8, resize: "vertical",
                          fontFamily: "inherit", direction: "rtl", outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {/* Export .txt */}
                          <button
                            onClick={() => {
                              const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
                              const a = document.createElement("a");
                              a.href = URL.createObjectURL(blob);
                              a.download = `${course.title}-notes.txt`;
                              a.click();
                            }}
                            style={{
                              padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              fontSize: 9, fontWeight: 800, color: "#64748B",
                              display: "flex", alignItems: "center", gap: 4,
                            }}>
                            <Download size={9} /> تحميل
                          </button>
                          {/* Copy all */}
                          <button
                            onClick={() => { navigator.clipboard.writeText(notes).catch(() => {}); setAchievement("تم نسخ كل الملاحظات! 📋"); }}
                            style={{
                              padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              fontSize: 9, fontWeight: 800, color: "#64748B",
                              display: "flex", alignItems: "center", gap: 4,
                            }}>
                            <Share2 size={9} /> نسخ الكل
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            if (!notes.trim()) return;
                            const stamp = fmtTime(currentVideoTime);
                            const withStamp = `[${stamp}] ${notes}`;
                            setNotes(withStamp);
                            setLS(`${courseId}_notes`, withStamp);
                          }}
                          style={{
                            padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                            background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
                            fontSize: 10, fontWeight: 900, color: "#fff",
                            display: "flex", alignItems: "center", gap: 5,
                          }}>
                          <FileText size={10} /> حفظ عند {fmtTime(currentVideoTime)}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Saved notes history — parse [HH:MM] prefixed lines */}
                  <div style={{ width: 280, flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#64748B" }}>سجلاتك المحفوظة</p>
                      <span style={{ fontSize: 8, color: "#334155" }}>{notes.split("\n").filter(l => l.trim()).length} سطر</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                      {notes.split("\n").filter(l => l.trim()).length === 0 ? (
                        <p style={{ fontSize: 10, color: "#334155", textAlign: "center", marginTop: 24 }}>لا توجد ملاحظات بعد</p>
                      ) : (
                        notes.split("\n").filter(l => l.trim()).map((line, i) => {
                          const match = line.match(/^\[([\d:]+)\]\s*(.*)/);
                          const stamp = match ? match[1] : null;
                          const text = match ? match[2] : line;
                          return (
                            <div key={i} style={{
                              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10,
                            }}>
                              {stamp && (
                                <button style={{
                                  flexShrink: 0, padding: "3px 8px", borderRadius: 8, cursor: "pointer",
                                  background: `${color}12`, border: `1px solid ${color}25`,
                                  fontSize: 10, fontWeight: 900, color, alignSelf: "flex-start",
                                }}>{stamp}</button>
                              )}
                              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", lineHeight: 1.6, flex: 1 }}>{text}</p>
                              <button
                                onClick={() => {
                                  const newNotes = notes.split("\n").filter((_, idx) => idx !== i).join("\n");
                                  setNotes(newNotes);
                                  setLS(`${courseId}_notes`, newNotes);
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: 12, padding: 2, alignSelf: "flex-start" }}>
                                ✕
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeBottomTab === "resources" && (
                <motion.div key="resources-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p style={{ margin: "0 0 16px", fontSize: 10, color: "#64748B" }}>مصادر قابلة للتحميل لهذا الدرس</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {RESOURCES.map((r, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                      }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                          background: `${color}12`, border: `1px solid ${color}20`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <FileText size={18} color={color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{r.title}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 9, color: "#475569" }}>{r.type} · {r.size}</p>
                        </div>
                        <button style={{
                          padding: "7px 14px", borderRadius: 10, border: `1px solid ${color}30`,
                          background: `${color}10`, cursor: "pointer",
                          fontSize: 10, fontWeight: 800, color, display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <Download size={11} /> تحميل
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeBottomTab === "discussions" && (
                <motion.div key="discussions-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {/* Source badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 10px", borderRadius: 8, background: commentsSource === "db" ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.1)", border: `1px solid ${commentsSource === "db" ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.15)"}`, color: commentsSource === "db" ? "#10B981" : "#64748B" }}>
                      {commentsSource === "db" ? "🌐 مباشر من Supabase" : "📱 محلي فقط"}
                    </span>
                    <button onClick={loadComments} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 10px", cursor: "pointer", fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                      <RotateCcw size={9} /> تحديث
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 340, overflowY: "auto" }}>
                    {/* Seed comments when empty */}
                    {comments.length === 0 && [
                      { id: "s1", name: "سارة أ.", text: "الوحدة الثانية غيّرت كيف أقرأ الناس — شكراً د. لينا!", avatar: "\uD83C\uDF38", time: Date.now() - 7200000, likes: 12, liked: false },
                      { id: "s2", name: "محمد خ.", text: "تمرين التحفيزات الشخصية كان بالغ الأثر. جرّبته مع زملائي.", avatar: "\u2728", time: Date.now() - 18000000, likes: 8, liked: false },
                      { id: "s3", name: "نورة م.", text: "هل من أحد مرّ بصعوبة في الوحدة الثالثة؟ يسعدني التشارك.", avatar: "\uD83D\uDC99", time: Date.now() - 86400000, likes: 5, liked: false },
                    ].map(c => (
                      <div key={c.id} style={{
                        display: "flex", gap: 12, padding: "14px 16px",
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 14,
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{c.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0" }}>{c.name}</span>
                            <span style={{ fontSize: 9, color: "#334155" }}>{new Date(c.time).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{c.text}</p>
                          <button style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                            ❤️ {c.likes}
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Real comments */}
                    {comments.map((c) => (
                      <div key={c.id} style={{
                        display: "flex", gap: 12, padding: "14px 16px",
                        background: c.name === "\u0623\u0646\u062a" ? `rgba(${color.replace("#","").match(/../g)?.map(x=>parseInt(x,16)).join(",") ?? "6,182,212"},0.06)` : "rgba(255,255,255,0.02)",
                        border: c.name === "\u0623\u0646\u062a" ? `1px solid ${color}20` : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 14,
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{c.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: c.name === "\u0623\u0646\u062a" ? color : "#e2e8f0" }}>{c.name}</span>
                            <span style={{ fontSize: 9, color: "#334155" }}>{new Date(c.time).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{c.text}</p>
                          <button onClick={() => likeComment(c.id)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 9, color: c.liked ? "#F43F5E" : "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                            {c.liked ? "❤️" : "🤍"} {c.likes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addComment()}
                      placeholder="\u0634\u0627\u0631\u0643 \u0641\u0643\u0631\u0629 \u0623\u0648 \u0633\u0624\u0627\u0644\u064b\u0627..."
                      style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 11, direction: "rtl", outline: "none" }}
                    />
                    <button onClick={addComment} style={{ background: `linear-gradient(135deg, ${color}, #8B5CF6)`, border: "none", borderRadius: 12, padding: "10px 14px", cursor: "pointer" }}>
                      <Send size={14} color="#fff" />
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: Curriculum Sidebar ── */}
        {!focusMode && (
        <div style={{
          width: 300, flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
          background: "rgba(7,9,26,0.6)",
          transition: "width 0.3s ease",
        }}>
          {/* Module title + progress */}
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin: "0 0 2px", fontSize: 8, fontWeight: 900, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase" }}>الوحدة الحالية</p>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 900, color: "#f1f5f9" }}>
              {course.modules.find(m => m.units.some(u => u.id === activeUnitId))?.title ?? course.title}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: "#475569" }}>{doneCount} من {totalUnits} درس</span>
              <span style={{ fontSize: 9, fontWeight: 900, color }}>{progressPct}% اتمام</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${color}, #8B5CF6)` }}
              />
            </div>
          </div>

          {/* Course tree */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {course.modules.map(mod => {
              const modDone = mod.units.every(u => u.isCompleted || completedUnits.has(u.id));
              const isExpanded = expandedModule === mod.id;
              return (
                <div key={mod.id}>
                  <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                    background: isExpanded ? "rgba(255,255,255,0.04)" : "none",
                    border: "none", cursor: "pointer", textAlign: "right",
                  }}>
                    {modDone ? <CheckCircle size={13} color="#10B981" /> : <Circle size={13} color="#334155" />}
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: "#e2e8f0", textAlign: "right" }}>{mod.title}</span>
                    {isExpanded ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                        {mod.units.map(unit => {
                          const isDone = unit.isCompleted || completedUnits.has(unit.id);
                          const isActive = activeUnitId === unit.id;
                          return (
                            <div key={unit.id} style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "9px 14px 9px 26px",
                              background: nextLessonHighlight === unit.id
                                ? `${color}22`
                                : isActive ? `${color}14` : "transparent",
                              borderRight: isActive ? `3px solid ${color}` : nextLessonHighlight === unit.id ? `3px solid ${color}80` : "3px solid transparent",
                              boxShadow: nextLessonHighlight === unit.id ? `inset 0 0 20px ${color}18` : "none",
                              opacity: unit.isLocked ? 0.35 : 1,
                              cursor: unit.isLocked ? "not-allowed" : "pointer",
                              transition: "all 0.3s",
                            }} onClick={() => !unit.isLocked && setActiveUnitId(unit.id)}>
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                background: isDone ? "rgba(16,185,129,0.1)" : isActive ? `${color}15` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${isDone ? "rgba(16,185,129,0.3)" : isActive ? `${color}30` : "rgba(255,255,255,0.06)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {unit.isLocked ? <Lock size={10} color="#334155" /> :
                                  isDone ? <CheckCircle size={11} color="#10B981" /> :
                                  <Play size={10} color={isActive ? color : nextLessonHighlight === unit.id ? color : "#475569"} fill={isActive ? color : "none"} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                                <p style={{ margin: 0, fontSize: 10, fontWeight: isActive ? 800 : 600, color: isActive ? "#e2e8f0" : "#94a3b8", lineHeight: 1.4 }}>
                                  {nextLessonHighlight === unit.id && <span style={{ fontSize: 8, color, marginLeft: 4 }}>▶ التالي</span>}
                                  {unit.title}
                                </p>
                                <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 2, justifyContent: "flex-end" }}>
                                  <span style={{ fontSize: 8, color: "#334155" }}>{unit.duration}</span>
                                  {unit.isRecommended && <span style={{ fontSize: 7, fontWeight: 900, color: "#A78BFA", background: "rgba(167,139,250,0.15)", padding: "1px 4px", borderRadius: 4 }}>⚡ موصى</span>}
                                  {isDone && <span style={{ fontSize: 7, color: "#10B981" }}>✓</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Certificate CTA */}
          <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setQuizOpen(true)}
              style={{
                width: "100%", padding: "13px", borderRadius: 14, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${color}22, rgba(139,92,246,0.2))`,
                borderColor: `${color}30`, borderStyle: "solid", borderWidth: 1,
                fontSize: 12, fontWeight: 900, color: "#e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <GraduationCap size={16} color={color} /> احصل على الشهادة
            </button>
          </div>
        </div>
        )} {/* end !focusMode */}
      </div>
    );
  };

  // ── MOBILE LAYOUT — Video-First ──
  const MobileLayout = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", direction: "rtl" }}>
      {/* Sticky video */}
      <div style={{ background: "#000", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
        {activeUnit ? (
          <VideoPlayer
            unitId={activeUnit.id}
            src={activeUnit.videoUrl}
            chapters={activeUnit.chapters}
            title={activeUnit.title}
            color={color}
            savedTime={detailedProgress[activeUnit.id]?.last_position}
            nextUnitTitle={allUnits[allUnits.findIndex(u => u.id === activeUnit.id) + 1]?.title}
            onEnded={() => handleVideoEnded(activeUnit.id)}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <div style={{ aspectRatio: "16/9", background: "#0a0a18", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={40} color={`${color}60`} fill={`${color}30`} />
          </div>
        )}
      </div>

      {/* Unit title strip */}
      {activeUnit && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>{activeUnit.title}</h2>
          <button onClick={() => markComplete(activeUnit.id)} style={{
            padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "rgba(16,185,129,0.15)" : `${color}15`,
            color: completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "#10B981" : color,
            fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", gap: 4,
          }}>
            <CheckCircle size={10} />
            {completedUnits.has(activeUnit.id) || activeUnit.isCompleted ? "✓" : "علّم"}
          </button>
        </div>
      )}

      {/* Scrollable content (curriculum) */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {course.modules.map(mod => {
          const isExpanded = expandedModule === mod.id;
          return (
            <div key={mod.id}>
              <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                background: isExpanded ? "rgba(255,255,255,0.04)" : "none", border: "none", cursor: "pointer",
              }}>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: "#e2e8f0", textAlign: "right" }}>{mod.title}</span>
                {isExpanded ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                    {mod.units.map(unit => {
                      const isDone = unit.isCompleted || completedUnits.has(unit.id);
                      const isActive = activeUnitId === unit.id;
                      return (
                        <div key={unit.id} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px 9px 24px",
                          background: isActive ? `${color}12` : "transparent",
                          borderRight: isActive ? `3px solid ${color}` : "3px solid transparent",
                          opacity: unit.isLocked ? 0.35 : 1, cursor: unit.isLocked ? "not-allowed" : "pointer",
                        }} onClick={() => !unit.isLocked && setActiveUnitId(unit.id)}>
                          {unit.isLocked ? <Lock size={10} color="#334155" /> :
                            isDone ? <CheckCircle size={11} color="#10B981" /> :
                            <Play size={10} color={isActive ? color : "#475569"} fill={isActive ? color : "none"} />}
                          <p style={{ margin: 0, fontSize: 10, fontWeight: isActive ? 800 : 600, color: isActive ? "#e2e8f0" : "#94a3b8", flex: 1, textAlign: "right" }}>{unit.title}</p>
                          <span style={{ fontSize: 8, color: "#334155" }}>{unit.duration}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom tabs bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(7,9,26,0.95)", backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px",
        display: "flex", gap: 6,
      }}>
        {(["content", "notes", "community", "progress"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: "8px 4px",
            background: activeTab === t ? `${color}12` : "none",
            border: `1px solid ${activeTab === t ? `${color}25` : "transparent"}`,
            borderRadius: 10, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 8, color: activeTab === t ? color : "#475569", fontWeight: 700 }}>
              {t === "content" ? "المحتوى" : t === "notes" ? "ملاحظات" : t === "community" ? "مجتمع" : "تقدم"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );



  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 110, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              dir="rtl"
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 111,
                height: "97dvh", borderRadius: "24px 24px 0 0",
                background: "#07091a",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}
            >
              {/* Handle + Top bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
                background: "rgba(7,9,26,0.95)", backdropFilter: "blur(16px)",
              }}>
                <div style={{ display: "flex", justifyContent: "center", position: "absolute", top: 8, left: "50%" }}>
                  <div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                </div>
                <button onClick={onClose} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: 8, cursor: "pointer", color: "#94a3b8",
                }}>
                  <X size={16} />
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>دورة تدريبية</p>
                  <p style={{ margin: "1px 0 0", fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{course.title}</p>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <div style={{
                    fontSize: 9, fontWeight: 900, color,
                    background: `${color}15`, border: `1px solid ${color}25`,
                    padding: "3px 8px", borderRadius: 8,
                  }}>{progressPct}%</div>
                </div>
              </div>

              {/* Progress bar strip */}
              <div style={{ height: 2, background: "rgba(255,255,255,0.04)", flexShrink: 0 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${color}, #8B5CF6)` }}
                />
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                {isDesktop ? <DesktopLayout /> : <MobileLayout />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Micro Achievement */}
      <AnimatePresence>
        {achievement && <MicroAchievement title={achievement} onDone={() => setAchievement(null)} />}
      </AnimatePresence>

      {/* ⭐ Lesson Rating Modal */}
      <AnimatePresence>
        {ratingOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setRatingOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "#0f1128", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
                padding: "32px 28px", minWidth: 300, textAlign: "center", direction: "rtl",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#f1f5f9" }}>أتممت الدرس!</h3>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748B" }}>كيف كان هذا الدرس؟</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRatingValue(s)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 28, transition: "transform 0.15s",
                    transform: ratingValue >= s ? "scale(1.2)" : "scale(1)",
                    filter: ratingValue >= s ? "drop-shadow(0 0 6px gold)" : "none",
                  }}>
                    {ratingValue >= s ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setAchievement(ratingValue >= 4 ? "شكراً! سعيد إنك استمتعت بالدرس 🌟" : "شكراً لتقييمك، سنحسّن المحتوى 💪");
                  setRatingOpen(null);
                }}
                style={{
                  padding: "10px 32px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
                  fontSize: 12, fontWeight: 900, color: "#fff",
                }}
              >
                {ratingValue > 0 ? "إرسال التقييم" : "تخطي"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Quiz */}
      <CourseQuiz
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        courseId={resolvedCourseId}
        courseTitle={course.title}
        color={color}
        onPassed={(score) => setAchievement(`اجتزت الاختبار النهائي بـ ${score}%! 🎓`)}
      />

      {/* ── Certificate Modal ── */}
      <CourseCertificateModal
        isOpen={certVisible}
        onClose={() => setCertVisible(false)}
        courseId={resolvedCourseId}
        courseTitle={course.title}
        courseCategory={course.category}
        instructorName={course.instructor.name}
        totalHours={course.duration}
      />
    </>
  );
}
