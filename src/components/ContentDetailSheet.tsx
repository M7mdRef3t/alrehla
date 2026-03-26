"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Play, Pause, CheckCircle, Circle, ChevronDown, ChevronUp,
  Bookmark, BookmarkCheck, Clock, Star, Users, RotateCcw,
  ArrowLeft, Volume2, Maximize2, ListVideo, Share2, Trophy,
  BookOpen, Dumbbell, Timer, ChevronRight,
  Flame,
} from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

export type ContentDetailType = "video-course" | "article" | "exercise";

export interface ContentDetailItem {
  id: string;
  type: ContentDetailType;
  title: string;
  subtitle?: string;
  description: string;
  author?: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  emoji?: string;
  color?: string;
  // Video course specific
  units?: CourseUnit[];
  // Article specific
  content?: string;
  readingTime?: string;
  // Exercise specific
  steps?: ExerciseStep[];
  difficulty?: string;
}

interface CourseUnit {
  id: string;
  title: string;
  duration: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  videoUrl?: string;
}

interface ExerciseStep {
  id: string;
  title: string;
  instruction: string;
  duration?: number; // seconds
  tip?: string;
}

/* ══════════════════════════════════════════
   Mock data helpers
   ══════════════════════════════════════════ */

function buildMockItem(id: string, type: ContentDetailType): ContentDetailItem {
  if (type === "video-course") return {
    id, type,
    title: "التواصل الفعّال: ما وراء الكلمات",
    subtitle: "دورة شاملة في علم النفس الاجتماعي وفهم العلاقات",
    description: "تعمّق في علم النفس الكامن وراء الروابط الإنسانية. اكتشف كيف تشكّل درنتك لغة جسدك ونبرياتك الخفية علاقاتك. مناسب لمن يريد تطوير مهارات التواصل من الجذور.",
    author: "د. سارة الأنصاري",
    duration: "٤ ساعات و٣٠ دقيقة",
    rating: 4.9, reviewCount: 1243,
    category: "التواصل", emoji: "💬", color: "#06B6D4",
    units: [
      { id: "u1", title: "مقدمة: لماذا نُسيء الفهم؟", duration: "١٨ دقيقة", isCompleted: true },
      { id: "u2", title: "لغة الجسد والإشارات الضمنية", duration: "٢٥ دقيقة", isCompleted: true },
      { id: "u3", title: "الأنماط اللاواعية في الحوار", duration: "٣٢ دقيقة", isCompleted: false },
      { id: "u4", title: "الاستماع الفعّال — ما هو حقاً؟", duration: "٢٨ دقيقة", isCompleted: false },
      { id: "u5", title: "التعبير عن الاحتياجات بوضوح", duration: "٣٥ دقيقة", isLocked: true },
      { id: "u6", title: "إدارة الصراع بدون خسارة", duration: "٤٠ دقيقة", isLocked: true },
      { id: "u7", title: "بناء الثقة طويلة الأمد", duration: "٣٠ دقيقة", isLocked: true },
    ],
  };

  if (type === "article") return {
    id, type,
    title: "علم الروابط: لماذا تحتاج للآخرين؟",
    subtitle: "استكشاف علمي عميق لبيولوجيا الانتماء والوحدة",
    description: "",
    author: "د. خالد المنصور",
    readingTime: "١٢ دقيقة",
    rating: 4.8, reviewCount: 876,
    category: "علم النفس", emoji: "🧬", color: "#8B5CF6",
    content: `
## لماذا الوحدة مؤلمة بيولوجياً؟

الوحدة ليست مجرد شعور عاطفي — إنها **إشارة بيولوجية للخطر** طوّرها الإنسان عبر ملايين السنين. عندما تشعر بالانفصال عن الآخرين، يُفعّل دماغك نفس مناطق الألم الجسدي.

دراسة نُشرت في مجلة **Nature Human Behaviour** (2019) أثبتت أن الأشخاص المعزولين يُعالجون الألم الجسدي بشكل مختلف — كأن المجتمع المحيط يُشكّل جزءاً من جهازهم العصبي.

## أوكسيتوسين: هرمون الارتباط

هرمون الأوكسيتوسين يُطلق عند:
- اللمس الإيجابي (المصافحة، العناق)
- الاستماع الحقيقي من شخص يهتم بك
- الإحساس بأنك مفهوم ومقبول

**النتيجة:** انخفاض مستويات الكورتيزول، تحسّن المناعة، رفع مستوى الثقة بالنفس.

## متلازمة التعلق — جذورك تُحدد علاقاتك

نظرية التعلق (Bowlby) تقول إن نمط ارتباطك بمقدّم الرعاية الأول (الأم/الأب) يُشكّل **قالباً عصبياً** تُعيد تطبيقه في كل علاقاتك لاحقاً — رومانسية، صداقة، عمل.

الأنماط الأساسية:
- **التعلق الآمن**: تثق بالآخرين وبنفسك
- **التعلق القلق**: تخاف الهجران، تحتاج تأكيداً دائماً
- **التعلق التجنبي**: تحمي نفسك بالبعد العاطفي

## خلاصة: كيف تبني روابط أعمق؟

١. **الحضور الكامل**: ضع هاتفك واستمع بجسدك كله
٢. **الضعف المقصود**: شارك شيئاً حقيقياً — لك فحى
٣. **الاتساق**: الثقة تُبنى بالأفعال المتكررة لا الوعود
٤. **الاحتواء بلا إصلاح**: أحياناً الآخر يريد أن يُسمع فقط
    `,
  };

  // exercise
  return {
    id, type,
    title: "تمرين مرساة الواقع",
    subtitle: "تقنية تهدئة عصبية مثبتة علمياً — ٥ دقائق فقط",
    description: "تُعيد هذه التقنية الجهاز العصبي للحالة المتزنة عبر تفعيل الحواس وكسر حالة الاجترار.",
    author: "مركز الرحلة",
    duration: "٥ دقائق",
    rating: 4.9, reviewCount: 2105,
    difficulty: "مبتدئ", emoji: "⚓", color: "#10B981",
    steps: [
      { id: "s1", title: "استقر وأغلق عينيك", instruction: "اجلس بوضع مريح — على كرسي أو الأرض. أغمض عينيك وخذ ثلاثة أنفاس عميقة وبطيئة.", duration: 30, tip: "لا بأس لو كانت أفكارك لا تزال تتسابق — هذا طبيعي" },
      { id: "s2", title: "٥ أشياء تراها", instruction: "افتح عينيك. اذكر بشكل صامت ٥ أشياء تراها الآن أمامك. خذ وقتك مع كل شيء.", duration: 60, tip: "لاحظ التفاصيل — اللون، الشكل، الحجم" },
      { id: "s3", title: "٤ أشياء تلمسها", instruction: "المس ٤ أشياء قريبة منك. ركّز على الملمس — ناعم؟ خشن؟ بارد؟ دافئ؟", duration: 40 },
      { id: "s4", title: "٣ أصوات تسمعها", instruction: "أصغ جيداً. حدّد ٣ أصوات في البيئة المحيطة بك الآن — قريبة أو بعيدة.", duration: 30, tip: "قد تحتاج ثواني حتى تسمع الأصوات الخافتة" },
      { id: "s5", title: "٢ رائحتان وطعم", instruction: "ما الذي تشمّه الآن؟ أي طعم في فمك؟ هذا يُفعّل المنطقة الأبدائية من دماغك.", duration: 20 },
      { id: "s6", title: "تنفس ٤-٧-٨", instruction: "شهيق من الأنف ٤ ثواني → احبس ٧ ثواني → زفير من الفم ٨ ثواني. كرّر ٤ مرات.", duration: 80, tip: "هذا يُفعّل الجهاز العصبي السمباثاوي ويُهدئ الجسم فوراً" },
    ],
  };
}

/* ══════════════════════════════════════════
   Glass style
   ══════════════════════════════════════════ */

const glass = (bg = "rgba(255,255,255,0.03)", border = "rgba(255,255,255,0.07)"): React.CSSProperties => ({
  background: bg, border: `1px solid ${border}`, borderRadius: 16, backdropFilter: "blur(12px)",
});

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

interface Props {
  itemId: string;
  itemType: ContentDetailType;
  isOpen: boolean;
  onClose: () => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

export function ContentDetailSheet({ itemId, itemType, isOpen, onClose, bookmarked = false, onBookmark }: Props) {
  const item = buildMockItem(itemId, itemType);
  const color = item.color ?? "#06B6D4";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            dir="rtl"
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
              height: "95dvh", borderRadius: "24px 24px 0 0",
              background: "#07091a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              overflowY: "auto",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Handle bar */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
            </div>

            {/* Ambient glow */}
            <div style={{
              position: "sticky", top: 0, height: 0, pointerEvents: "none",
              background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${color}18 0%, transparent 70%)`,
              zIndex: 1,
            }} />

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 0 40px" }}>
              {/* Top bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 20px 16px",
                position: "sticky", top: 0, zIndex: 10,
                background: "rgba(7,9,26,0.92)", backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <button onClick={onClose} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: 8, cursor: "pointer", color: "#94a3b8",
                }}>
                  <X size={16} />
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {itemType === "video-course" ? "دورة تدريبية" : itemType === "article" ? "مقال" : "تمرين"}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 12, fontWeight: 800, color: "#e2e8f0" }} className="truncate">
                    {item.title}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 8, cursor: "pointer", color: "#475569" }}>
                    <Share2 size={14} />
                  </button>
                  <button onClick={onBookmark} style={{ background: bookmarked ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${bookmarked ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: 8, cursor: "pointer" }}>
                    {bookmarked ? <BookmarkCheck size={14} color="#F59E0B" /> : <Bookmark size={14} color="#475569" />}
                  </button>
                </div>
              </div>

              {/* Hero */}
              <div style={{
                margin: "0 16px 16px",
                padding: "20px",
                borderRadius: 20,
                background: `linear-gradient(135deg, ${color}18, rgba(139,92,246,0.1))`,
                border: `1px solid ${color}20`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -10, left: -10, fontSize: 80, opacity: 0.06 }}>
                  {item.emoji}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                    background: `${color}20`, border: `1px solid ${color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                  }}>{item.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.4 }}>
                      {item.title}
                    </h1>
                    <p style={{ margin: "0 0 8px", fontSize: 10, color: "#94a3b8" }}>{item.subtitle}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {item.rating && (
                        <span style={{ fontSize: 9, color: "#F59E0B", fontWeight: 800, display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={9} fill="#F59E0B" /> {item.rating} ({item.reviewCount?.toLocaleString()})
                        </span>
                      )}
                      {item.duration && (
                        <span style={{ fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={9} /> {item.duration}
                        </span>
                      )}
                      {item.difficulty && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.12)", padding: "1px 7px", borderRadius: 6 }}>
                          {item.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {item.author && (
                  <p style={{ margin: "10px 0 0", fontSize: 9, color: "#64748B" }}>
                    بقلم / إعداد: <span style={{ color: "#94a3b8", fontWeight: 700 }}>{item.author}</span>
                  </p>
                )}
              </div>

              {/* Type-specific content */}
              <div style={{ padding: "0 16px" }}>
                {itemType === "video-course" && item.units && (
                  <VideoCourseLayout units={item.units} color={color} description={item.description} />
                )}
                {itemType === "article" && item.content && (
                  <ArticleLayout content={item.content} color={color} readingTime={item.readingTime} />
                )}
                {itemType === "exercise" && item.steps && (
                  <ExerciseLayout steps={item.steps} color={color} description={item.description} />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════
   Layout: Video Course
   ══════════════════════════════════════════ */

function VideoCourseLayout({ units, color, description }: { units: CourseUnit[]; color: string; description: string }) {
  const [activeUnit, setActiveUnit] = useState<string | null>(units.find(u => !u.isCompleted && !u.isLocked)?.id ?? units[0].id);
  const completed = units.filter(u => u.isCompleted).length;
  const pct = Math.round((completed / units.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Progress */}
      <div style={{ ...glass("rgba(6,182,212,0.05)", "rgba(6,182,212,0.15)"), padding: "14px 16px", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#e2e8f0" }}>تقدمك في الدورة</span>
          <span style={{ fontSize: 10, fontWeight: 900, color }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 6 }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ height: 5, borderRadius: 3, background: `linear-gradient(90deg, ${color}, #8B5CF6)` }}
          />
        </div>
        <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>{completed} من {units.length} وحدات مكتملة</p>
      </div>

      {/* Currently playing */}
      {activeUnit && (() => {
        const unit = units.find((u) => u.id === activeUnit);
        if (!unit) return null;
        return (
          <VideoPlayer
            src={unit.videoUrl || ""}
            title={unit.title}
            unitId={unit.id}
            chapters={[]}
          />
        );
      })()}

      {/* Unit list */}
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "#94a3b8" }}>محتوى الدورة</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {units.map((unit, idx) => {
            const isActive = activeUnit === unit.id;
            const unitColor = unit.isLocked ? "#1e293b" : unit.isCompleted ? "#10B981" : isActive ? color : "#334155";
            return (
              <motion.button
                key={unit.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => !unit.isLocked && setActiveUnit(unit.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12, cursor: unit.isLocked ? "not-allowed" : "pointer",
                  background: isActive ? `${color}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isActive ? `${color}30` : "rgba(255,255,255,0.05)"}`,
                  opacity: unit.isLocked ? 0.4 : 1,
                  textAlign: "right", width: "100%",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: unit.isCompleted ? "rgba(16,185,129,0.15)" : isActive ? `${color}15` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${unitColor}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: unitColor,
                }}>
                  {unit.isCompleted ? <CheckCircle size={14} color="#10B981" /> : <span>{idx + 1}</span>}
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: unit.isLocked ? "#1e293b" : "#e2e8f0" }}>{unit.title}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 9, color: "#334155", display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={8} /> {unit.duration}
                    {unit.isLocked && <span style={{ marginRight: 6, color: "#1e293b" }}>🔒 مقفل</span>}
                  </p>
                </div>
                {isActive && <Play size={12} color={color} />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* About */}
      <div style={{ ...glass("rgba(139,92,246,0.04)", "rgba(139,92,246,0.12)"), padding: "14px 16px", borderRadius: 16 }}>
        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: "#A78BFA" }}>عن هذه الدورة</p>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>{description}</p>
      </div>

      {/* CTA */}
      <button style={{
        width: "100%", padding: "14px", borderRadius: 16, border: "none",
        background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
        fontSize: 13, fontWeight: 900, color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <Play size={16} fill="#fff" /> متابعة التعلم
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Layout: Long Article
   ══════════════════════════════════════════ */

function ArticleLayout({ content, color, readingTime }: { content: string; color: string; readingTime?: string }) {
  const [readProgress, setReadProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current?.closest("[data-scroll]") ?? document.querySelector("[style*='overflow-y: auto']");
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el as HTMLElement;
    setReadProgress(Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
  }, []);

  useEffect(() => {
    const el = containerRef.current?.closest("[style*='overflow-y: auto']") as HTMLElement | null;
    if (el) { el.addEventListener("scroll", handleScroll); return () => el.removeEventListener("scroll", handleScroll); }
  }, [handleScroll]);

  // Convert markdown-like to styled nodes
  const lines = content.split("\n").filter(l => l.trim());

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Reading meta */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={9} /> وقت القراءة: {readingTime}
        </span>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: 3, borderRadius: 2, width: `${readProgress}%`, background: color, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 9, color, fontWeight: 700 }}>{readProgress}%</span>
      </div>

      {/* Article body */}
      <div style={{ ...glass("rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)"), padding: "20px 16px", borderRadius: 18, marginBottom: 14 }}>
        {lines.map((line, i) => {
          if (line.startsWith("## ")) {
            return <h2 key={i} style={{ margin: "18px 0 8px", fontSize: 14, fontWeight: 900, color: "#f1f5f9", borderRight: `3px solid ${color}`, paddingRight: 10 }}>{line.replace("## ", "")}</h2>;
          }
          if (line.startsWith("- ")) {
            return <p key={i} style={{ margin: "4px 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.8, paddingRight: 12, position: "relative" }}>
              <span style={{ position: "absolute", right: 0, color }}> </span>
              • {line.replace("- ", "")}
            </p>;
          }
          if (line.includes("**")) {
            // Simple bold handling
            const parts = line.split(/\*\*(.*?)\*\*/);
            return <p key={i} style={{ margin: "6px 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.9 }}>
              {parts.map((part, j) => j % 2 === 1
                ? <strong key={j} style={{ color: "#e2e8f0", fontWeight: 800 }}>{part}</strong>
                : part)}
            </p>;
          }
          if (line.match(/^[١٢٣٤٥٦٧٨٩\d]\./)) {
            return <p key={i} style={{ margin: "5px 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.8, paddingRight: 4 }}>{line}</p>;
          }
          return <p key={i} style={{ margin: "6px 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.9 }}>{line}</p>;
        })}
      </div>

      {/* Key takeaways */}
      <div style={{ ...glass("rgba(139,92,246,0.06)", "rgba(139,92,246,0.15)"), padding: "14px 16px", borderRadius: 16, marginBottom: 14 }}>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "#A78BFA" }}>✨ أبرز ما تعلمته</p>
        {["الوحدة استجابة بيولوجية وليست ضعفاً", "الأوكسيتوسين يتحكم في شعورك بالأمان", "نمط تعلقك القديم يُشكّل علاقاتك الحالية"].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
            <CheckCircle size={12} color="#A78BFA" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Layout: Guided Exercise
   ══════════════════════════════════════════ */

function ExerciseLayout({ steps, color, description }: { steps: ExerciseStep[]; color: string; description: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = steps[currentStep];
  const totalDuration = step?.duration ?? 30;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(p => {
          if (p >= totalDuration) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setCompleted(prev => new Set([...prev, currentStep]));
            return p;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, totalDuration, currentStep]);

  const goToStep = useCallback((idx: number) => {
    setIsRunning(false);
    setElapsed(0);
    setCurrentStep(idx);
  }, []);

  const progressPct = Math.min((elapsed / totalDuration) * 100, 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* About */}
      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.8, padding: "0 2px" }}>{description}</p>

      {/* Step navigator */}
      <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
        {steps.map((_, i) => (
          <button key={i} onClick={() => goToStep(i)} style={{
            width: completed.has(i) ? 26 : currentStep === i ? 26 : 20,
            height: 6, borderRadius: 3, border: "none", cursor: "pointer",
            background: completed.has(i) ? "#10B981" : currentStep === i ? color : "rgba(255,255,255,0.1)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>

      {/* Active step card */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "20px", borderRadius: 20,
          background: `${color}10`, border: `1.5px solid ${color}30`,
          position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -15, left: -15, fontSize: 80, opacity: 0.04 }}>
          {currentStep + 1}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: `${color}20`, border: `1px solid ${color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, color,
          }}>{currentStep + 1}</div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#f1f5f9" }}>{step.title}</h3>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8", lineHeight: 1.9 }}>{step.instruction}</p>
        {step.tip && (
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 12px" }}>
            <p style={{ margin: 0, fontSize: 9, color: "#F59E0B" }}>💡 {step.tip}</p>
          </div>
        )}

        {/* Timer */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: "#475569" }}>الوقت</span>
            <span style={{ fontSize: 11, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
              {elapsed}s / {totalDuration}s
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: 5, borderRadius: 3, background: `linear-gradient(90deg, ${color}, #8B5CF6)` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setIsRunning(r => !r)}
            style={{
              flex: 1, padding: "10px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${color}, #8B5CF6)`,
              color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {isRunning ? <><Pause size={14} /> إيقاف</> : <><Play size={14} fill="#fff" /> {elapsed > 0 ? "استئناف" : "ابدأ"}</>}
          </button>
          <button onClick={() => { setElapsed(0); setIsRunning(false); }} style={{
            padding: "10px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569", cursor: "pointer",
          }}>
            <RotateCcw size={14} />
          </button>
        </div>
      </motion.div>

      {/* All steps list */}
      <div>
        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: "#94a3b8" }}>خطوات التمرين</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => goToStep(i)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
              borderRadius: 12, cursor: "pointer", textAlign: "right", width: "100%",
              background: currentStep === i ? `${color}10` : "rgba(255,255,255,0.02)",
              border: `1px solid ${currentStep === i ? `${color}25` : "rgba(255,255,255,0.04)"}`,
            }}>
              {completed.has(i)
                ? <CheckCircle size={14} color="#10B981" />
                : <Circle size={14} color={currentStep === i ? color : "#334155"} />}
              <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: currentStep === i ? "#e2e8f0" : "#64748B" }}>{s.title}</span>
              {s.duration && <span style={{ fontSize: 8, color: "#334155" }}>{s.duration}s</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Complete button */}
      {completed.size === steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "16px", borderRadius: 16, textAlign: "center",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <Trophy size={24} color="#10B981" style={{ margin: "0 auto 6px" }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#10B981" }}>أكملت التمرين! 🎉</p>
          <p style={{ margin: "3px 0 0", fontSize: 9, color: "#475569" }}>+20 نقطة مضافة لرحلتك</p>
        </motion.div>
      )}
    </div>
  );
}
