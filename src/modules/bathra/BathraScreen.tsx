/**
 * بذرة — Bathra: بذور العادات الصغيرة
 *
 * ازرع بذرة صغيرة كل يوم — وشاهدها تنمو:
 * - Plant micro-habits (< 5 min)
 * - Water them daily (check-in)
 * - Watch growth stages: seed → sprout → sapling → tree
 * - Garden overview with all your plants
 * - Streak tracking & category stats
 */

import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Plus, Droplets, Archive, ChevronDown, Zap as Sparkles } from "lucide-react";
import {
  useBathraState,
  CATEGORY_META,
  STAGE_META,
  type HabitCategory,
  type Seed,
} from "./store/bathra.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "garden" | "plant" | "stats" | "archive";

const GROWTH_VISUALS: Record<string, { scale: number; opacity: number }> = {
  seed:    { scale: 0.6, opacity: 0.5 },
  sprout:  { scale: 0.75, opacity: 0.7 },
  sapling: { scale: 0.9, opacity: 0.85 },
  tree:    { scale: 1.0, opacity: 1.0 },
};

/* ═══════════════════════════════════════════ */
/*           PLANT FORM                       */
/* ═══════════════════════════════════════════ */

const PlantForm: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { plantSeed } = useBathraState();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HabitCategory>("mind");
  const [emoji, setEmoji] = useState("🌱");
  const [duration, setDuration] = useState(2);

  const EMOJI_OPTIONS = ["🌱", "🌸", "🌻", "🌹", "🍀", "🌾", "🌴", "🌵", "🪴", "💐"];

  const handleSubmit = () => {
    if (!title.trim()) return;
    plantSeed({ title: title.trim(), emoji, category, duration });
    onDone();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-4">
      {/* Title */}
      <div>
        <label className="text-[9px] text-emerald-400/50 font-bold block mb-1">اسم العادة *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: قراءة 5 دقائق"
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.05] focus:border-emerald-400/20 focus:outline-none"
        />
      </div>

      {/* Emoji */}
      <div>
        <label className="text-[9px] text-emerald-400/50 font-bold block mb-1.5">اختر رمز</label>
        <div className="flex gap-1.5 flex-wrap">
          {EMOJI_OPTIONS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)}
              className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
              style={{
                background: emoji === e ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${emoji === e ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.04)"}`,
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-[9px] text-emerald-400/50 font-bold block mb-1.5">التصنيف</label>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(CATEGORY_META) as HabitCategory[]).map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <button key={c} onClick={() => setCategory(c)}
                className="px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                style={{
                  background: category === c ? `${meta.color}15` : "rgba(255,255,255,0.02)",
                  color: category === c ? meta.color : "#475569",
                  border: `1px solid ${category === c ? `${meta.color}25` : "rgba(255,255,255,0.03)"}`,
                }}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-[9px] text-emerald-400/50 font-bold block mb-1.5">المدة (دقائق)</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 5].map((d) => (
            <button key={d} onClick={() => setDuration(d)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: duration === d ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)",
                color: duration === d ? "#34d399" : "#475569",
                border: `1px solid ${duration === d ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {d} د
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit}
        disabled={!title.trim()}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
        style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        🌱 ازرع البذرة
      </button>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*           SEED CARD                        */
/* ═══════════════════════════════════════════ */

const SeedCard: FC<{ seed: Seed; idx: number }> = ({ seed, idx }) => {
  const { waterSeed, archiveSeed, isWateredToday } = useBathraState();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");

  const watered = isWateredToday(seed.id);
  const catMeta = CATEGORY_META[seed.category];
  const stageMeta = STAGE_META[seed.stage];
  const vis = GROWTH_VISUALS[seed.stage];

  const handleWater = () => {
    if (!watered) {
      waterSeed(seed.id, note || undefined);
      setNote("");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: watered ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.01)",
        border: `1px solid ${watered ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 text-right">
        {/* Plant visual */}
        <motion.div
          animate={{ scale: vis.scale }}
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${catMeta.color}08`,
            border: `1px solid ${catMeta.color}15`,
            opacity: vis.opacity,
          }}
        >
          <span className="text-xl">{seed.emoji}</span>
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white">{seed.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${catMeta.color}10`, color: catMeta.color }}
            >
              {catMeta.emoji} {catMeta.label}
            </span>
            <span className="text-[8px] text-slate-500">
              {stageMeta.emoji} {stageMeta.label}
            </span>
            {seed.currentStreak > 0 && (
              <span className="text-[8px] font-bold text-orange-400">
                🔥 {seed.currentStreak} يوم
              </span>
            )}
          </div>
        </div>

        {/* Water button inline */}
        {!seed.archivedAt && (
          <motion.button
            onClick={(e) => { e.stopPropagation(); handleWater(); }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: watered ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.1)",
              border: `1px solid ${watered ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.15)"}`,
            }}
          >
            {watered ? (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            ) : (
              <Droplets className="w-4 h-4 text-blue-400" />
            )}
          </motion.button>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Growth Progress */}
              <div className="flex items-center gap-2 py-2">
                {(["seed", "sprout", "sapling", "tree"] as const).map((st, i) => {
                  const sMeta = STAGE_META[st];
                  const active = ["seed", "sprout", "sapling", "tree"].indexOf(seed.stage) >= i;
                  return (
                    <div key={st} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-lg transition-all ${active ? "" : "grayscale opacity-30"}`}>
                        {sMeta.emoji}
                      </span>
                      <div className="w-full h-1 rounded-full" style={{
                        background: active ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.04)"
                      }} />
                      <span className="text-[7px] text-slate-600">{sMeta.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Stats row */}
              <div className="flex gap-2">
                {[
                  { label: "إجمالي الري", value: seed.totalWatered, emoji: "💧" },
                  { label: "السلسلة الحالية", value: seed.currentStreak, emoji: "🔥" },
                  { label: "أفضل سلسلة", value: seed.bestStreak, emoji: "⭐" },
                  { label: "دقائق/يوم", value: seed.duration, emoji: "⏱️" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 p-2 rounded-lg text-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <span className="text-[9px]">{s.emoji}</span>
                    <p className="text-[11px] font-black text-white">{s.value}</p>
                    <p className="text-[6px] text-slate-600 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Water note (if not watered) */}
              {!watered && !seed.archivedAt && (
                <div className="flex gap-2">
                  <input value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="ملاحظة اليوم (اختياري)..."
                    className="flex-1 px-3 py-2 rounded-lg text-[10px] text-white placeholder-slate-600 bg-white/[0.03] border border-white/[0.04] focus:outline-none"
                  />
                  <button onClick={handleWater}
                    className="px-4 py-2 rounded-lg text-[9px] font-bold"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.15)" }}
                  >
                    💧 اسقِ
                  </button>
                </div>
              )}

              {/* Archive */}
              {!seed.archivedAt && (
                <button onClick={() => archiveSeed(seed.id)}
                  className="w-full py-2 rounded-lg text-[9px] text-slate-600 hover:text-red-400 transition flex items-center justify-center gap-1"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <Archive className="w-3 h-3" /> أرشفة
                </button>
              )}

              {/* Recent Water Logs */}
              {seed.waterLogs.length > 0 && (
                <div>
                  <p className="text-[8px] text-emerald-400/40 font-bold mb-1">آخر الري:</p>
                  <div className="flex gap-1 flex-wrap">
                    {seed.waterLogs.slice(-7).reverse().map((l, i) => (
                      <span key={i} className="text-[7px] px-1.5 py-0.5 rounded-md bg-white/[0.03] text-slate-500">
                        {l.date.slice(5)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*           CATEGORY STATS                   */
/* ═══════════════════════════════════════════ */

const CategoryStatsView: FC = () => {
  const { getCategoryStats, getGardenStats } = useBathraState();
  const catStats = useMemo(() => getCategoryStats(), [getCategoryStats]);
  const garden = useMemo(() => getGardenStats(), [getGardenStats]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
      {/* Garden Overview */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "أشجار نمت", value: garden.treesGrown, emoji: "🌳", color: "#10b981" },
          { label: "إجمالي الري", value: garden.totalWatered, emoji: "💧", color: "#3b82f6" },
          { label: "أفضل سلسلة", value: garden.bestStreak, emoji: "🔥", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl text-center"
            style={{ background: `${s.color}06`, border: `1px solid ${s.color}10` }}
          >
            <span className="text-sm">{s.emoji}</span>
            <p className="text-lg font-black text-white mt-0.5">{s.value}</p>
            <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* By Category */}
      {catStats.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-slate-600">لا توجد بيانات بعد — ازرع أول بذرة</p>
        </div>
      ) : (
        catStats.map((cs) => {
          const meta = CATEGORY_META[cs.category];
          return (
            <div key={cs.category} className="p-4 rounded-xl"
              style={{ background: `${meta.color}03`, border: `1px solid ${meta.color}06` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[11px] font-bold text-white">{meta.label}</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold" style={{ color: meta.color }}>{cs.count} بذور</span>
                  <span className="text-[8px] text-slate-500 block">متوسط: {cs.avgStreak} يوم</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const BathraScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("garden");
  const { seeds, getActiveSeeds, getArchivedSeeds, getGardenStats, isWateredToday } = useBathraState();

  const activeSeeds = useMemo(() => getActiveSeeds(), [seeds]);
  const archivedSeeds = useMemo(() => getArchivedSeeds(), [seeds]);
  const stats = useMemo(() => getGardenStats(), [seeds]);

  // Sort: unwatered first, then by streak desc
  const sortedActive = useMemo(() => {
    return [...activeSeeds].sort((a, b) => {
      const aWatered = isWateredToday(a.id) ? 1 : 0;
      const bWatered = isWateredToday(b.id) ? 1 : 0;
      if (aWatered !== bWatered) return aWatered - bWatered;
      return b.currentStreak - a.currentStreak;
    });
  }, [activeSeeds, isWateredToday]);

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #061208 0%, #0a1f10 40%, #061208 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <Sprout className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">بذرة</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">بذور العادات الصغيرة</p>
            </div>
          </div>

          {/* Today's progress */}
          <div className="text-left">
            <p className="text-xl font-black text-emerald-400">
              {stats.todayWatered}<span className="text-sm text-slate-600">/{stats.todayTotal}</span>
            </p>
            <p className="text-[8px] text-slate-600 font-bold">سُقيت اليوم</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "بذور", value: stats.totalSeeds, emoji: "🌱", color: "#10b981" },
            { label: "أشجار", value: stats.treesGrown, emoji: "🌳", color: "#22c55e" },
            { label: "إجمالي الري", value: stats.totalWatered, emoji: "💧", color: "#3b82f6" },
            { label: "أفضل streak", value: stats.bestStreak, emoji: "🔥", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 p-2 rounded-xl text-center"
              style={{ background: `${s.color}06`, border: `1px solid ${s.color}10` }}
            >
              <span className="text-xs">{s.emoji}</span>
              <p className="text-sm font-black text-white mt-0.5">{s.value}</p>
              <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "garden", label: "الحديقة", icon: "🌱" },
            { key: "stats", label: "إحصائيات", icon: "📊" },
            { key: "archive", label: "الأرشيف", icon: "📦" },
            { key: "plant", label: "ازرع جديد", icon: "➕" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[9px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#34d399" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Garden View ═══ */}
      {viewMode === "garden" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {sortedActive.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Sprout className="w-10 h-10 text-emerald-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">الحديقة فارغة</p>
              <p className="text-xs text-slate-600">ازرع أول بذرة — وابدأ رحلة النمو.</p>
              <button onClick={() => setViewMode("plant")}
                className="px-5 py-2 rounded-xl text-[10px] font-bold mx-auto"
                style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)" }}
              >
                <Plus className="w-3 h-3 inline mr-1" /> ازرع بذرة
              </button>
            </div>
          ) : (
            sortedActive.map((s, idx) => <SeedCard key={s.id} seed={s} idx={idx} />)
          )}
        </motion.div>
      )}

      {/* ═══ Stats View ═══ */}
      {viewMode === "stats" && <CategoryStatsView />}

      {/* ═══ Archive View ═══ */}
      {viewMode === "archive" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-3">
          {archivedSeeds.length === 0 ? (
            <div className="py-16 text-center">
              <Archive className="w-8 h-8 text-emerald-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">الأرشيف فارغ</p>
            </div>
          ) : (
            archivedSeeds.map((s, idx) => <SeedCard key={s.id} seed={s} idx={idx} />)
          )}
        </motion.div>
      )}

      {/* ═══ Plant View ═══ */}
      {viewMode === "plant" && (
        <PlantForm onDone={() => setViewMode("garden")} />
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}
      >
        <Sprout className="w-5 h-5 text-emerald-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          ازرع بذرة صغيرة كل يوم — واسقِها بصبر.
          <br />
          في ٢١ يوم تصبح شجرة — وعادتك تصبح جزء منك.
        </p>
      </motion.div>
    </div>
  );
};

export default BathraScreen;
