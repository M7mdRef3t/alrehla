import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Zap, Medal, RefreshCw, ArrowLeft, TrendingUp, Star } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import { useAuthState } from "../state/authState";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  rank: number;
  avatar_seed?: string;
}

interface Props {
  onBack?: () => void;
}

/* ══════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════ */

const RANK_CONFIG: Record<number, { color: string; icon: typeof Trophy; label: string; glow: string }> = {
  1: { color: "#FBBF24", icon: Crown,  label: "الأول",   glow: "rgba(251,191,36,0.3)" },
  2: { color: "#94A3B8", icon: Medal,  label: "الثاني",  glow: "rgba(148,163,184,0.3)" },
  3: { color: "#CD7C4A", icon: Medal,  label: "الثالث",  glow: "rgba(205,124,74,0.3)"  },
};

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];
function getLevel(pts: number) {
  let lv = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (pts >= LEVEL_THRESHOLDS[i]) lv = i + 1;
  }
  return lv;
}
function getLevelLabel(lv: number) {
  const labels = ["مبتدئ","متعلم","مستكشف","واعٍ","ماهر","محترف","خبير","سيد","أسطورة","حكيم"];
  return labels[(lv - 1) % labels.length];
}

function AvatarCircle({ name, seed, size = 44 }: { name: string; seed?: string; size?: number }) {
  const colors = ["#06B6D4","#8B5CF6","#EC4899","#10B981","#F59E0B","#3B82F6","#EF4444","#14B8A6"];
  const idx = Math.abs((seed ?? name).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx + 2) % colors.length]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontWeight: 900, fontSize: size * 0.38, color: "#fff",
        boxShadow: `0 0 ${size * 0.4}px ${colors[idx]}40`,
      }}
    >
      {name?.[0]?.toUpperCase() ?? "؟"}
    </div>
  );
}

/* ══════════════════════════════════════════
   Top 3 Podium
   ══════════════════════════════════════════ */

function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = [70, 96, 56];
  const rankIdxMap = [2, 1, 3];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, padding: "24px 16px 0", marginBottom: 8 }}>
      {order.map((entry, i) => {
        const rank = rankIdxMap[i];
        const cfg = RANK_CONFIG[rank];
        const Icon = cfg.icon;
        const level = getLevel(entry.total_points);
        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 180 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: rank === 1 ? 1.2 : 1 }}
          >
            {/* Crown / Icon */}
            <Icon size={rank === 1 ? 22 : 16} color={cfg.color} style={{ marginBottom: 4 }} />

            {/* Avatar */}
            <div style={{ position: "relative", marginBottom: 6 }}>
              <AvatarCircle name={entry.display_name} size={rank === 1 ? 56 : 44} />
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                background: cfg.color, borderRadius: "50%",
                width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 900, color: "#0a0d18",
              }}>{rank}</div>
            </div>

            {/* Name */}
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 800, color: "#e2e8f0", textAlign: "center", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.display_name}
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 9, color: cfg.color, fontWeight: 700 }}>{getLevelLabel(level)}</p>

            {/* Podium Block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[i] }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              style={{
                width: "100%", borderRadius: "8px 8px 0 0",
                background: `linear-gradient(180deg, ${cfg.color}20, ${cfg.color}08)`,
                border: `1px solid ${cfg.color}30`,
                borderBottom: "none",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}
            >
              <Zap size={12} color={cfg.color} />
              <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 900, color: cfg.color }}>
                {entry.total_points.toLocaleString("ar")}
              </p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   Row Card
   ══════════════════════════════════════════ */

function RowCard({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const cfg = RANK_CONFIG[entry.rank];
  const level = getLevel(entry.total_points);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: entry.rank * 0.04 }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 16, marginBottom: 8,
        background: isMe
          ? "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.08))"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isMe ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.07)"}`,
        position: "relative", overflow: "hidden",
      }}
    >
      {isMe && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "rgba(6,182,212,0.15)", fontSize: 8, fontWeight: 900,
          color: "#06B6D4", padding: "2px 8px", borderRadius: "0 16px 0 8px",
        }}>أنت</div>
      )}

      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: 10, flexShrink: 0,
        background: cfg ? `${cfg.color}15` : "rgba(255,255,255,0.05)",
        border: `1px solid ${cfg ? cfg.color + "40" : "rgba(255,255,255,0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 900,
        color: cfg ? cfg.color : "#64748b",
      }}>
        {entry.rank}
      </div>

      {/* Avatar */}
      <AvatarCircle name={entry.display_name} size={36} />

      {/* Meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.display_name}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 10, color: "#475569" }}>
          {getLevelLabel(level)} · المستوى {level}
        </p>
      </div>

      {/* Points */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: cfg ? cfg.color : "#A78BFA" }}>
          {entry.total_points.toLocaleString("ar")}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 9, color: "#334155", fontWeight: 600 }}>نقطة</p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main Export
   ══════════════════════════════════════════ */

export function LeaderboardScreen({ onBack }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthState((s) => s.user?.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = supabase;
      if (!client) throw new Error("no client");

      const { data, error: err } = await client
        .from("user_points")
        .select("user_id, display_name, total_points")
        .order("total_points", { ascending: false })
        .limit(50);

      if (err) throw err;

      const ranked: LeaderboardEntry[] = (data ?? []).map((row, i) => ({
        user_id: row.user_id as string,
        display_name: (row.display_name as string) || "مجاهد",
        total_points: (row.total_points as number) ?? 0,
        rank: i + 1,
      }));
      setEntries(ranked);
    } catch {
      // Fallback demo data if Supabase is unreachable
      setEntries([
        { user_id: "demo1", display_name: "محمد",   total_points: 4850, rank: 1 },
        { user_id: "demo2", display_name: "سارة",   total_points: 3720, rank: 2 },
        { user_id: "demo3", display_name: "أحمد",   total_points: 2940, rank: 3 },
        { user_id: "demo4", display_name: "ليلى",   total_points: 2100, rank: 4 },
        { user_id: "demo5", display_name: "عمر",    total_points: 1750, rank: 5 },
        { user_id: "demo6", display_name: "نور",    total_points: 1200, rank: 6 },
        { user_id: "demo7", display_name: "يوسف",   total_points:  980, rank: 7 },
        { user_id: "demo8", display_name: "ريم",    total_points:  720, rank: 8 },
      ]);
      setError("عرض بيانات تجريبية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);
  const myEntry = entries.find(e => e.user_id === userId);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(167,139,250,0.08))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={22} color="#FBBF24" />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>لوحة الصدارة</h1>
            <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>أبطال رحلة التحول</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button
            onClick={load}
            whileTap={{ scale: 0.9, rotate: 180 }}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "8px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, color: "#94a3b8",
            }}
          >
            <RefreshCw size={14} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>تحديث</span>
          </motion.button>
          {onBack && (
            <motion.button
              onClick={onBack}
              whileTap={{ scale: 0.95 }}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "8px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13,
              }}
            >
              <ArrowLeft size={14} /> رجوع
            </motion.button>
          )}
        </div>
      </div>

      {/* Demo hint */}
      {error && (
        <div style={{ background: "rgba(251,191,36,0.08)", borderBottom: "1px solid rgba(251,191,36,0.15)", padding: "6px 24px", fontSize: 10, color: "#FBBF24", textAlign: "center" }}>
          {error} — بيانات تجريبية
        </div>
      )}

      {/* My rank pill */}
      {myEntry && (
        <div style={{ padding: "12px 24px 0" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.08))",
              border: "1px solid rgba(6,182,212,0.25)",
              borderRadius: 14, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <TrendingUp size={16} color="#06B6D4" />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
              أنت في المرتبة <span style={{ color: "#06B6D4" }}>#{myEntry.rank}</span> بـ{" "}
              <span style={{ color: "#A78BFA" }}>{myEntry.total_points.toLocaleString("ar")} نقطة</span>
            </p>
          </motion.div>
        </div>
      )}

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={28} color="#FBBF24" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && entries.length > 0 && (
        <>
          {/* Podium */}
          {top3.length >= 3 && <Podium top3={top3} />}

          {/* Divider */}
          <div style={{ padding: "16px 24px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <Star size={12} color="#334155" />
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* List */}
          <div style={{ padding: "0 16px" }}>
            {rest.map(entry => (
              <RowCard key={entry.user_id} entry={entry} isMe={entry.user_id === userId} />
            ))}
          </div>

          {entries.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 24px", color: "#334155" }}>
              <Trophy size={40} color="#1e293b" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>لا يوجد بيانات بعد</p>
              <p style={{ margin: "6px 0 0", fontSize: 11 }}>ابدأ رحلتك وكسب النقاط لتظهر هنا</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
