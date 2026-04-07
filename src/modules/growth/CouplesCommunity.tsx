"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, Send, Sparkles, TrendingUp, Users, BarChart3,
  MessageCircle, Award, BookOpen, Loader2, ChevronDown,
  Star, Clock, ExternalLink, Globe,
} from "lucide-react";
import {
  fetchPosts, createPost, reactToPost, fetchCommunityStats,
  generateAnonName,
  type CommunityPost, type CommunityStats,
} from "@/services/communityForumService";

/* ══════════════════════════════════════════
   Constants
   ══════════════════════════════════════════ */

const CAT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  success: { label: "قصة نجاح", icon: "🏆", color: "#34D399" },
  advice: { label: "طلب نصيحة", icon: "💬", color: "#60A5FA" },
  lesson: { label: "درس تعلمته", icon: "📖", color: "#FBBF24" },
};

const DAILY_TIPS = [
  "جربوا 'ساعة الصدق' — 30 دقيقة لكل طرف يتكلم بحرية والآخر يستمع فقط بدون رد.",
  "اسألوا بعض السؤال ده النهاردة: 'إيه أكتر حاجة عملتها ليك خلتك تحس بالأمان؟'",
  "الحدود مش رفض — لما تقول 'أحتاج وقت لنفسي' ده معناه إنك بتحترم العلاقة.",
  "شاركوا يوميات المشاعر: كل واحد يكتب 3 مشاعر حسها النهاردة في ورقة واحدة مشتركة.",
  "لو حصل خلاف، اسألوا: 'إيه اللي أنا محتاجه فعلاً؟' قبل 'إيه اللي أنت عملته؟'",
  "خصصوا 10 دقائق كل ليلة للتقدير — كل طرف يقول حاجة واحدة يقدّرها في التاني.",
  "الاستقلالية تغذي العلاقة: شجعوا بعض على هوايات فردية ثم شاركوا تجاربكم.",
];

const PAGE_SIZE = 5;

/* ══════════════════════════════════════════
   Monthly Challenge Card
   ══════════════════════════════════════════ */

const CURRENT_CHALLENGE = {
  title: "30 يوم من الامتنان المشترك",
  badge: "تحدي الشهر",
  desc: "كل يوم، اكتب لشريكك جملة واحدة تعبّر عن شيء تقدّره فيه. بعد 30 يوماً ستُشكّلان مكتبة من المشاعر الحقيقية.",
  participants: 1247,
  daysLeft: 30 - (Math.floor(Date.now() / 86400000) % 30),
  icon: "🤝",
  color: "#14B8A6",
};

function MonthlyChallenge() {
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(CURRENT_CHALLENGE.participants);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(167,139,250,0.08))",
        border: "1px solid rgba(20,184,166,0.25)",
        borderRadius: 20, padding: "18px 20px", marginBottom: 16, position: "relative", overflow: "hidden",
      }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -20, left: -20, width: 120, height: 120,
        background: "rgba(20,184,166,0.06)", borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: "#14B8A6",
          background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)",
          padding: "3px 10px", borderRadius: 20,
        }}>
          🔥 {CURRENT_CHALLENGE.badge}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} color="#475569" />
          <span style={{ fontSize: 10, color: "#475569" }}>{CURRENT_CHALLENGE.daysLeft} يوم متبقي</span>
        </div>
      </div>

      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>
        {CURRENT_CHALLENGE.icon} {CURRENT_CHALLENGE.title}
      </h3>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
        {CURRENT_CHALLENGE.desc}
      </p>

      {/* Participants + CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex" }}>
            {["🟢", "🔵", "🟣"].map((c, i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: "50%",
                background: i === 0 ? "#14B8A6" : i === 1 ? "#60A5FA" : "#A78BFA",
                border: "2px solid #080b15",
                marginLeft: i > 0 ? -6 : 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 10,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            <strong style={{ color: "#e2e8f0" }}>{count.toLocaleString("ar")}</strong> مشارك
          </span>
        </div>

        <button onClick={() => { if (!joined) { setJoined(true); setCount(c => c + 1); } }}
          style={{
            background: joined ? "rgba(52,211,153,0.12)" : "linear-gradient(135deg, #14B8A6, #0d9488)",
            border: joined ? "1px solid rgba(52,211,153,0.3)" : "none",
            borderRadius: 12, padding: "8px 18px",
            color: joined ? "#34D399" : "#0a0d18",
            fontSize: 12, fontWeight: 800, cursor: "pointer",
            transition: "all 0.2s",
          }}>
          {joined ? "✓ منضم" : "ابدأ التحدي الآن"}
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Interest Groups
   ══════════════════════════════════════════ */

const INTEREST_GROUPS = [
  {
    id: "marriage", icon: "💍", title: "حديقة الزواج",
    desc: "استراتيجيات ترسم آفاق الزواج المستدام",
    members: 2600, color: "#F87171",
  },
  {
    id: "communication", icon: "💬", title: "تطوير التواصل",
    desc: "تقنيات وتمارين لتعميق الحوار اليومي",
    members: 1100, color: "#60A5FA",
  },
  {
    id: "relationships", icon: "🌍", title: "علاقات السافلة",
    desc: "الفهم والتعامل مع العلاقات المُعقّدة",
    members: 650, color: "#A78BFA",
  },
];

function InterestGroups() {
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setJoined(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={13} color="#64748b" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>مجموعات الاهتمام</h3>
        </div>
        <span style={{ fontSize: 10, color: "#475569", cursor: "pointer" }}>عرض الكل ←</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {INTEREST_GROUPS.map((g) => (
          <div key={g.id} style={{
            background: `${g.color}08`, border: `1px solid ${g.color}20`,
            borderRadius: 14, padding: "12px 12px",
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{g.icon}</div>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>{g.title}</p>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{g.desc}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, color: g.color, fontWeight: 700 }}>
                {g.members >= 1000 ? `${(g.members / 1000).toFixed(1)}k` : g.members} عضو
              </span>
              <button onClick={() => toggle(g.id)} style={{
                background: joined.has(g.id) ? `${g.color}15` : "rgba(255,255,255,0.05)",
                border: `1px solid ${joined.has(g.id) ? g.color + "40" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 8, padding: "3px 8px",
                color: joined.has(g.id) ? g.color : "#475569",
                fontSize: 9, fontWeight: 700, cursor: "pointer",
              }}>
                {joined.has(g.id) ? "✓ منضم" : "+ انضم"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Expert Corner
   ══════════════════════════════════════════ */

const EXPERTS = [
  {
    id: "e1", name: "د. سارة الأحمد", title: "معالجة نفسية — علاقات زوجية",
    emoji: "👩‍⚕️", rating: 4.9, sessions: 312, color: "#A78BFA",
    tags: ["التعلق العاطفي", "الحدود الشخصية"],
  },
  {
    id: "e2", name: "خالد منصور", title: "مستشار زواج — تواصل وحل نزاع",
    emoji: "👨‍💼", rating: 4.8, sessions: 198, color: "#60A5FA",
    tags: ["إدارة الخلافات", "الاستقلالية"],
  },
];

function ExpertCorner() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Award size={13} color="#FBBF24" />
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>زاوية الخبراء</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {EXPERTS.map((exp) => (
          <div key={exp.id} style={{
            background: `${exp.color}08`, border: `1px solid ${exp.color}18`,
            borderRadius: 14, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: `${exp.color}18`, border: `2px solid ${exp.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>
              {exp.emoji}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{exp.name}</p>
              <p style={{ margin: "1px 0 4px", fontSize: 10, color: "#64748b" }}>{exp.title}</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {exp.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: 9, color: exp.color, fontWeight: 600,
                    background: `${exp.color}10`, padding: "1px 7px", borderRadius: 10,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Rating + Book */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Star size={10} color="#FBBF24" fill="#FBBF24" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#e2e8f0" }}>{exp.rating}</span>
              </div>
              <button style={{
                background: exp.color, border: "none", borderRadius: 8, padding: "5px 10px",
                color: "#0a0d18", fontSize: 9, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <ExternalLink size={9} /> احجز جلسة
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   AI Daily Tip
   ══════════════════════════════════════════ */

function DailyTipCard() {
  const tip = DAILY_TIPS[Math.floor(Date.now() / 86400000) % DAILY_TIPS.length];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(167,139,250,0.05))",
        border: "1px solid rgba(20,184,166,0.2)",
        borderRadius: 16, padding: "13px 16px", marginBottom: 14,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <Sparkles size={12} color="#14B8A6" />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#14B8A6" }}>نصيحة AI اليوم</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{tip}</p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Post Card
   ══════════════════════════════════════════ */

function PostCard({ post, onReact }: { post: CommunityPost; onReact: (id: string) => void }) {
  const cat = CAT_CONFIG[post.category] ?? CAT_CONFIG.lesson;
  const [reacted, setReacted] = useState(false);
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(post.created_at).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "الآن";
    if (hours < 24) return `منذ ${hours}س`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  }, [post.created_at]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "12px 14px",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: `${cat.color}15`, border: `1px solid ${cat.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>
            {cat.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{post.display_name}</p>
            <span style={{
              fontSize: 8, fontWeight: 700, color: cat.color,
              background: `${cat.color}12`, padding: "1px 6px", borderRadius: 8,
            }}>
              {cat.label}
            </span>
          </div>
        </div>
        <span style={{ fontSize: 9, color: "#475569", flexShrink: 0 }}>{timeAgo}</span>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{post.content}</p>

      <button onClick={() => { if (!reacted) { setReacted(true); onReact(post.id); } }}
        style={{
          background: reacted ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${reacted ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 18, padding: "4px 10px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
        <Heart size={11} color={reacted ? "#F87171" : "#475569"} fill={reacted ? "#F87171" : "none"} />
        <span style={{ fontSize: 10, fontWeight: 600, color: reacted ? "#F87171" : "#475569" }}>
          {post.reactions + (reacted ? 1 : 0)}
        </span>
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   New Post Form
   ══════════════════════════════════════════ */

function NewPostForm({ onPost }: { onPost: (cat: CommunityPost["category"], content: string) => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CommunityPost["category"]>("lesson");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onPost(category, content.trim());
    setContent("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)",
        color: "#475569", fontSize: 12, cursor: "pointer", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8, textAlign: "right",
      }}>
        <Send size={13} /> شارك تجربتك مع المجتمع...
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14, padding: "14px", marginBottom: 12, overflow: "hidden",
      }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
        {Object.entries(CAT_CONFIG).map(([key, val]) => (
          <button key={key} onClick={() => setCategory(key as CommunityPost["category"])}
            style={{
              flex: 1, padding: "5px 6px", borderRadius: 9,
              background: category === key ? `${val.color}18` : "rgba(255,255,255,0.03)",
              border: `1px solid ${category === key ? val.color + "40" : "rgba(255,255,255,0.06)"}`,
              color: category === key ? val.color : "#475569",
              fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}>
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      <textarea id="couples-community-content" name="couplesCommunityContent" value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="شارك قصتك... (مجهول تماماً)" rows={3}
        style={{
          width: "100%", background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
          padding: "10px 12px", color: "#e2e8f0", fontSize: 12, resize: "none",
          outline: "none", lineHeight: 1.7, fontFamily: "var(--font-sans)",
          direction: "rtl", boxSizing: "border-box",
        }} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <button onClick={() => setExpanded(false)} style={{ background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>
          إلغاء
        </button>
        <button onClick={handleSubmit} disabled={!content.trim()} style={{
          background: content.trim() ? "linear-gradient(135deg, #14B8A6, #0d9488)" : "rgba(255,255,255,0.05)",
          border: "none", borderRadius: 8, padding: "7px 16px",
          color: content.trim() ? "#0a0d18" : "#475569",
          fontSize: 11, fontWeight: 700, cursor: content.trim() ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Send size={11} /> نشر
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Stats Dashboard
   ══════════════════════════════════════════ */

const DIM_LABELS: Record<string, { label: string; emoji: string }> = {
  attachment: { label: "التعلق", emoji: "🔗" },
  boundaries: { label: "الحدود", emoji: "🛡️" },
  codependency: { label: "الاعتمادية", emoji: "⚖️" },
  communication: { label: "التواصل", emoji: "💬" },
  selfawareness: { label: "الوعي الذاتي", emoji: "🧘" },
};

function StatsDashboard({ stats }: { stats: CommunityStats }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "تحليل مكتمل", value: stats.totalAnalyses, icon: <BarChart3 size={15} color="#14B8A6" />, color: "#14B8A6" },
          { label: "مقارنة ثنائية", value: stats.totalComparisons, icon: <Users size={15} color="#A78BFA" />, color: "#A78BFA" },
          { label: "متوسط التوافق", value: stats.avgCompatibility > 0 ? `${stats.avgCompatibility}%` : "—", icon: <Heart size={15} color="#F87171" />, color: "#F87171" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              background: `${kpi.color}08`, border: `1px solid ${kpi.color}20`,
              borderRadius: 14, padding: "12px", textAlign: "center",
            }}>
            <div style={{ marginBottom: 5 }}>{kpi.icon}</div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#e2e8f0" }}>{kpi.value}</p>
            <p style={{ margin: "2px 0 0", fontSize: 9, color: "#64748b" }}>{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {(stats.strongestDim || stats.weakestDim) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {stats.strongestDim && (
            <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <Award size={11} color="#34D399" />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399" }}>أقوى بُعد مشترك</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
                {DIM_LABELS[stats.strongestDim.id]?.emoji} {DIM_LABELS[stats.strongestDim.id]?.label}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#34D399", fontWeight: 700 }}>{stats.strongestDim.avg}%</p>
            </div>
          )}
          {stats.weakestDim && (
            <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <TrendingUp size={11} color="#FBBF24" />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#FBBF24" }}>يحتاج تطوير</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
                {DIM_LABELS[stats.weakestDim.id]?.emoji} {DIM_LABELS[stats.weakestDim.id]?.label}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#FBBF24", fontWeight: 700 }}>{stats.weakestDim.avg}%</p>
            </div>
          )}
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>توزيع الدرجات</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(stats.dimAverages).map(([dimId, avg], idx) => {
            const dim = DIM_LABELS[dimId];
            if (!dim) return null;
            const barColor = avg >= 70 ? "#34D399" : avg >= 45 ? "#FBBF24" : "#F87171";
            return (
              <div key={dimId}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>{dim.emoji} {dim.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{avg}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${avg}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + idx * 0.06 }}
                    style={{ height: "100%", background: barColor, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

interface CouplesCommunityProps {
  onBack?: () => void;
}

export function CouplesCommunity({ onBack }: CouplesCommunityProps) {
  const [tab, setTab] = useState<"forum" | "insights">("forum");
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([fetchPosts(50), fetchCommunityStats()]);
      setAllPosts(p);
      setStats(s);
      setLoading(false);
    })();
  }, []);

  const handleNewPost = useCallback(async (cat: CommunityPost["category"], content: string) => {
    const name = generateAnonName();
    const post = await createPost(name, cat, content);
    const newPost: CommunityPost = post ?? {
      id: `local-${Date.now()}`, display_name: name, category: cat,
      content, reactions: 0, created_at: new Date().toISOString(),
    };
    setAllPosts((prev) => [newPost, ...prev]);
  }, []);

  const handleReact = useCallback(async (postId: string) => {
    await reactToPost(postId);
  }, []);

  const filteredPosts = useMemo(() =>
    filter === "all" ? allPosts : allPosts.filter((p) => p.category === filter),
    [allPosts, filter]);

  const visiblePosts = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMore = visibleCount < filteredPosts.length;

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Loader2 size={32} color="#14B8A6" />
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 10,
              width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowLeft size={16} color="#94a3b8" />
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#e2e8f0" }}>مجتمع الثنائي ✨</h1>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>Ethereal Insight — مساحة للنمو المشترك</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, margin: "14px 0 16px",
          background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4,
        }}>
          {[
            { id: "forum" as const, label: "المنتدى", icon: <MessageCircle size={12} /> },
            { id: "insights" as const, label: "الإحصائيات", icon: <BarChart3 size={12} /> },
          ].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setVisibleCount(PAGE_SIZE); }}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 9,
                background: tab === t.id ? "rgba(20,184,166,0.15)" : "transparent",
                border: tab === t.id ? "1px solid rgba(20,184,166,0.3)" : "1px solid transparent",
                color: tab === t.id ? "#14B8A6" : "#475569",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "all 0.2s",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "forum" ? (
            <motion.div key="forum" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>

              {/* Monthly Challenge */}
              <MonthlyChallenge />

              {/* Interest Groups */}
              <InterestGroups />

              {/* Expert Corner */}
              <ExpertCorner />

              <DailyTipCard />

              {/* Filter pills */}
              <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "الكل", icon: "🌐" },
                  ...Object.entries(CAT_CONFIG).map(([id, v]) => ({ id, label: v.label, icon: v.icon })),
                ].map((f) => (
                  <button key={f.id} onClick={() => { setFilter(f.id); setVisibleCount(PAGE_SIZE); }}
                    style={{
                      padding: "4px 10px", borderRadius: 18, fontSize: 10, fontWeight: 600,
                      background: filter === f.id ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${filter === f.id ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.06)"}`,
                      color: filter === f.id ? "#14B8A6" : "#475569",
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>

              <NewPostForm onPost={handleNewPost} />

              {/* Posts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visiblePosts.map((post) => (
                  <PostCard key={post.id} post={post} onReact={handleReact} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <motion.button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12, marginTop: 12,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  <ChevronDown size={14} /> تحميل المزيد ({filteredPosts.length - visibleCount} متبقي)
                </motion.button>
              )}

              {visiblePosts.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <BookOpen size={28} color="#1e293b" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>لا توجد منشورات — كن أول من يشارك!</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="insights" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
              {stats && <StatsDashboard stats={stats} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
