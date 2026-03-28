/**
 * LeaderboardPanel.tsx
 * لوحة المتصدرين — تجلب أعلى 25 مستخدم من user_points وتعرضهم
 * مع تمييز المستخدم الحالي وشريط XP متحرك.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw, Crown, Zap, Users, Medal } from "lucide-react";
import { supabase, safeGetSession } from "../services/supabaseClient";

// ── Types ──────────────────────────────────────────────────────────────────
interface LeaderEntry {
  user_id: string;
  display_name: string | null;
  total_points: number;
  level: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getXpToNextLevel(level: number) {
  return level * 200;
}

function getLevelProgress(points: number) {
  const level   = Math.max(1, Math.floor(points / 200) + 1);
  const base    = (level - 1) * 200;
  const cap     = level * 200;
  const pct     = Math.min(100, Math.round(((points - base) / (cap - base)) * 100));
  return { level, pct };
}

function rankColor(rank: number): string {
  if (rank === 1) return "#f59e0b";   // gold
  if (rank === 2) return "#94a3b8";   // silver
  if (rank === 3) return "#cd7c3a";   // bronze
  return "rgba(255,255,255,0.25)";
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

function anonymise(name: string | null, userId: string): string {
  if (name && name.trim()) return name.trim();
  // بناء اسم مجهول من أول 5 أحرف من الـ user_id
  return `مستخدم·${userId.slice(0, 4).toUpperCase()}`;
}

// ── Main Component ─────────────────────────────────────────────────────────
export function LeaderboardPanel() {
  const [entries,    setEntries]    = useState<LeaderEntry[]>([]);
  const [myUserId,   setMyUserId]   = useState<string | null>(null);
  const [myRank,     setMyRank]     = useState<number | null>(null);
  const [myEntry,    setMyEntry]    = useState<LeaderEntry | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [lastFetch,  setLastFetch]  = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const session = await safeGetSession();
      const uid     = session?.user.id ?? null;
      setMyUserId(uid);

      if (!supabase) { setLoading(false); return; }

      // Top 25
      const { data, error } = await supabase
        .from("user_points")
        .select("user_id, display_name, total_points, level")
        .order("total_points", { ascending: false })
        .limit(25);

      if (error) { console.error("[Leaderboard]", error.message); setLoading(false); return; }

      const list = (data ?? []) as LeaderEntry[];
      setEntries(list);
      setLastFetch(new Date());

      // Find current user
      if (uid) {
        const myIdx = list.findIndex(e => e.user_id === uid);
        if (myIdx >= 0) {
          setMyRank(myIdx + 1);
          setMyEntry(list[myIdx]);
        } else {
          // Fetch current user's own entry if outside top-25
          const { data: meData } = await supabase
            .from("user_points")
            .select("user_id, display_name, total_points, level")
            .eq("user_id", uid)
            .single();
          if (meData) {
            setMyEntry(meData as LeaderEntry);
            // Count how many users have more points
            const { count } = await supabase
              .from("user_points")
              .select("user_id", { count: "exact", head: true })
              .gt("total_points", (meData as LeaderEntry).total_points);
            setMyRank((count ?? 0) + 1);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const topThree = entries.slice(0, 3);
  const rest     = entries.slice(3);

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={16} style={{ color: "#f59e0b" }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>لوحة المتصدرين</h3>
          {lastFetch && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
              · {lastFetch.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <button
          onClick={() => void fetchLeaderboard()}
          disabled={loading}
          title="تحديث"
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, width: 30, height: 30, cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)",
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* ── My Rank Banner (if outside top-25 or always visible) ── */}
      {myEntry && myUserId && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: 14, padding: "12px 16px",
            background: "linear-gradient(135deg, rgba(20,210,200,0.1), rgba(99,102,241,0.07))",
            border: "1px solid rgba(20,210,200,0.25)",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(20,210,200,0.12)", border: "1px solid rgba(20,210,200,0.3)",
            fontSize: 15, fontWeight: 900, color: "#14d2c8",
          }}>
            {myRank ?? "—"}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#14d2c8" }}>
              أنت · {anonymise(myEntry.display_name, myEntry.user_id)}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              مستوى {myEntry.level} · {myEntry.total_points.toLocaleString("ar")} XP
              {myRank && myRank > 1 && (
                <span> · تحتاج {((entries[myRank - 2]?.total_points ?? 0) - myEntry.total_points + 1).toLocaleString("ar")} XP للترقي</span>
              )}
            </p>
          </div>
          <Zap size={16} style={{ color: "#14d2c8" }} />
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                height: 60, borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Podium: Top 3 ── */}
      {!loading && topThree.length > 0 && (
        <div style={{
          borderRadius: 18, padding: "20px 16px",
          background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(20,210,200,0.04))",
          border: "1px solid rgba(245,158,11,0.12)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12 }}>
            {/* Reorder for visual podium: 2nd - 1st - 3rd */}
            {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry, visualIdx) => {
              const realRank = entries.indexOf(entry) + 1;
              const isMe     = entry.user_id === myUserId;
              const heights  = [80, 110, 65];
              const h        = heights[visualIdx] ?? 65;

              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: visualIdx * 0.1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: visualIdx === 1 ? 56 : 44, height: visualIdx === 1 ? 56 : 44,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${rankColor(realRank)}22, ${rankColor(realRank)}08)`,
                    border: `2px solid ${rankColor(realRank)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: visualIdx === 1 ? 22 : 16,
                    boxShadow: `0 0 20px ${rankColor(realRank)}40`,
                    position: "relative",
                  }}>
                    {realRank === 1 ? <Crown size={visualIdx === 1 ? 22 : 16} style={{ color: rankColor(realRank) }} /> : rankEmoji(realRank)}
                    {isMe && (
                      <div style={{
                        position: "absolute", bottom: -2, right: -2,
                        width: 14, height: 14, borderRadius: "50%",
                        background: "#14d2c8", border: "2px solid #070a14",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p style={{
                    margin: 0, fontSize: 11, fontWeight: 900,
                    color: isMe ? "#14d2c8" : "#fff",
                    textAlign: "center", maxWidth: 80,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {anonymise(entry.display_name, entry.user_id)}
                  </p>

                  {/* XP */}
                  <p style={{ margin: 0, fontSize: 10, color: rankColor(realRank), fontWeight: 700 }}>
                    {entry.total_points.toLocaleString("ar")}
                  </p>

                  {/* Podium base */}
                  <div style={{
                    width: "100%", height: h, borderRadius: "8px 8px 0 0",
                    background: `linear-gradient(to top, ${rankColor(realRank)}22, ${rankColor(realRank)}08)`,
                    border: `1px solid ${rankColor(realRank)}30`,
                    borderBottom: "none",
                    display: "flex", alignItems: "flex-start", justifyContent: "center",
                    paddingTop: 8,
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: rankColor(realRank), opacity: 0.6 }}>
                      {realRank}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ranks 4–25 ── */}
      {!loading && rest.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rest.map((entry, idx) => {
            const rank = idx + 4;
            const isMe = entry.user_id === myUserId;
            const { level, pct } = getLevelProgress(entry.total_points);

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  background: isMe
                    ? "linear-gradient(135deg, rgba(20,210,200,0.08), rgba(99,102,241,0.05))"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isMe ? "rgba(20,210,200,0.2)" : "rgba(255,255,255,0.05)"}`,
                  transition: "all 0.15s",
                }}
              >
                {/* Rank */}
                <span style={{
                  width: 28, textAlign: "center", flexShrink: 0,
                  fontSize: 12, fontWeight: 900,
                  color: isMe ? "#14d2c8" : "rgba(255,255,255,0.3)",
                }}>
                  {rank}
                </span>

                {/* Level badge */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isMe ? "rgba(20,210,200,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isMe ? "rgba(20,210,200,0.25)" : "rgba(255,255,255,0.07)"}`,
                  fontSize: 11, fontWeight: 900,
                  color: isMe ? "#14d2c8" : "rgba(255,255,255,0.4)",
                }}>
                  {level}
                </div>

                {/* Name + XP bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: "0 0 4px",
                    fontSize: 12, fontWeight: 700,
                    color: isMe ? "#14d2c8" : "#f1f5f9",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {anonymise(entry.display_name, entry.user_id)}
                    {isMe && <span style={{ marginRight: 6, fontSize: 10, opacity: 0.7 }}>· أنت</span>}
                  </p>
                  <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.02 }}
                      style={{
                        height: "100%", borderRadius: 99,
                        background: isMe
                          ? "linear-gradient(to left, #14d2c8, #0ea5e9)"
                          : "rgba(255,255,255,0.15)",
                      }}
                    />
                  </div>
                </div>

                {/* Points */}
                <span style={{
                  fontSize: 12, fontWeight: 900, flexShrink: 0,
                  color: isMe ? "#14d2c8" : "rgba(255,255,255,0.4)",
                }}>
                  {entry.total_points.toLocaleString("ar")} <span style={{ fontWeight: 400, fontSize: 10 }}>XP</span>
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && entries.length === 0 && (
        <div style={{
          borderRadius: 18, padding: "40px", textAlign: "center",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <Users size={32} style={{ color: "rgba(20,210,200,0.3)", marginBottom: 12 }} />
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
            لا يوجد متصدرون بعد
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            ابدأ رحلتك لتكون أول المتصدرين
          </p>
        </div>
      )}

      {/* ── Footer note ── */}
      {!loading && entries.length > 0 && (
        <p style={{ margin: 0, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
          <Medal size={10} style={{ display: "inline", marginLeft: 4 }} />
          يُحدَّث الترتيب في الوقت الفعلي عند كسب نقاط جديدة
        </p>
      )}

      {/* ── Keyframe for spin & pulse ── */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
