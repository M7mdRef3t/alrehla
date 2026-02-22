import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Lock, Map } from "lucide-react";
import { ACHIEVEMENTS } from "../data/achievements";
import { useAchievementState } from "../state/achievementState";
import { useMapState } from "../state/mapState";

interface AchievementsProps {
  onClose: () => void;
}

export const Achievements: FC<AchievementsProps> = ({ onClose }) => {
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const totalPoints = useAchievementState((s) => s.totalPoints);
  const allNodes = useMapState((s) => s.nodes);

  const [tab, setTab] = useState<"achievements" | "journey">("achievements");

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  /* ── حسابات ملخص الرحلة ── */
  const activeNodes = useMemo(() => allNodes.filter((n) => !n.isNodeArchived), [allNodes]);
  const archivedNodes = useMemo(() => allNodes.filter((n) => n.isNodeArchived), [allNodes]);

  const greenCount = activeNodes.filter((n) => n.ring === "green").length;
  const yellowCount = activeNodes.filter((n) => n.ring === "yellow").length;
  const redCount = activeNodes.filter((n) => n.ring === "red").length;
  const total = activeNodes.length;

  const calmPct = total > 0 ? Math.round(((greenCount + yellowCount * 0.5) / total) * 100) : 0;

  /* أكثر شخص "داعم" = في المدار الأخضر وليس في الرمادي */
  const brightestNode = useMemo(
    () => activeNodes.filter((n) => n.ring === "green" && !n.isDetached)[0] ?? null,
    [activeNodes]
  );

  const TABS = [
    { id: "achievements" as const, label: "إنجازاتك", icon: Trophy },
    { id: "journey" as const, label: "ملخص الرحلة", icon: Map }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-title"
    >
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-600 overflow-hidden"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600 shrink-0">
          <h2 id="achievements-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            رحلتك
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-600 shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${active
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {tab === "achievements" ? (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-3"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 text-right">
                  {unlockedCount === totalCount
                    ? "ماشاء الله! خلصت كل الإنجازات"
                    : `حققت ${unlockedCount} من ${totalCount} — كمّل الرحلة عشان تفتح الباقي`}
                </p>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 text-right">
                  نقاطك: {totalPoints.toLocaleString("ar-EG")}
                </p>
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = unlockedIds.includes(a.id);
                  return (
                    <motion.div
                      key={a.id}
                      className={`rounded-xl border-2 p-4 text-right transition-colors ${unlocked
                          ? "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 opacity-75"
                        }`}
                      initial={false}
                      animate={{ opacity: unlocked ? 1 : 0.85 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0" aria-hidden>
                          {unlocked ? a.icon : "🔒"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {a.title}
                            {!unlocked && <Lock className="w-4 h-4 text-slate-400" />}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            {a.description}
                          </p>
                          {unlocked && a.hint && (
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
                              {a.hint}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="journey"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-4"
              >
                {/* الجملة الفلسفية */}
                <p className="text-xs text-center leading-relaxed"
                  style={{ color: "rgba(45,212,191,0.75)" }}>
                  التعافي مش سباق.. هو إنك النهاردة تكون عارف مكانك أحسن من امبارح.
                </p>

                {/* كارت توازن الدواير */}
                {total > 0 ? (
                  <div
                    className="rounded-xl p-4 text-right"
                    style={{
                      background: "linear-gradient(135deg, rgba(15,23,42,0.04), rgba(45,212,191,0.06))",
                      border: "1px solid rgba(45,212,191,0.2)"
                    }}
                  >
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                      توازن الدواير
                    </p>

                    {/* Gauge بسيط */}
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
                      {greenCount > 0 && (
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${(greenCount / total) * 100}%`, background: "#34d399" }}
                          title={`قريب: ${greenCount}`}
                        />
                      )}
                      {yellowCount > 0 && (
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${(yellowCount / total) * 100}%`, background: "#fbbf24" }}
                          title={`متذبذب: ${yellowCount}`}
                        />
                      )}
                      {redCount > 0 && (
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${(redCount / total) * 100}%`, background: "#f87171" }}
                          title={`بعيد: ${redCount}`}
                        />
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex justify-between text-[11px] mb-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{greenCount} قريب</span>
                      <span className="text-amber-500 font-semibold">{yellowCount} متذبذب</span>
                      <span className="text-rose-400 font-semibold">{redCount} بعيد</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center leading-relaxed">
                      دوايرك دلوقتي متزنة بنسبة{" "}
                      <span style={{ color: "#2dd4bf" }}>{calmPct}%</span>
                      {" "}..{" "}
                      {calmPct >= 60
                        ? "إنت بتتحرك في اتجاه الهدوء."
                        : calmPct >= 30
                          ? "لسه في شغل، بس الخريطة بتتوضح."
                          : "الوعي هو أول الطريق."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 text-center text-sm text-slate-500 dark:text-slate-400"
                    style={{ border: "1px solid rgba(45,212,191,0.15)" }}>
                    ابدأ بأول شخص في الخريطة وهنعرف نرسملك صورة رحلتك.
                  </div>
                )}

                {/* محطات عدت */}
                <div
                  className="rounded-xl p-4 text-right"
                  style={{
                    background: "rgba(248,250,252,0.6)",
                    border: "1px solid rgba(148,163,184,0.2)"
                  }}
                >
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    محطات عدت
                  </p>
                  {archivedNodes.length > 0 ? (
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                      قدرت توّدع{" "}
                      <span style={{ color: "#2dd4bf" }}>{archivedNodes.length}</span>
                      {" "}{archivedNodes.length === 1 ? "محطة" : "محطات"}
                      {" "}مكانتش مريحة ليك..{" "}
                      <span className="font-normal text-slate-500">مساحتك الخاصة وسعت.</span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      لسه في البداية — كل قرار بتاخده بتوسّع مساحتك.
                    </p>
                  )}
                </div>

                {/* أكتر دايرة منورة */}
                {brightestNode && (
                  <div
                    className="rounded-xl p-4 text-right"
                    style={{
                      background: "linear-gradient(135deg, rgba(52,211,153,0.06), rgba(45,212,191,0.08))",
                      border: "1px solid rgba(52,211,153,0.25)"
                    }}
                  >
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                      أكتر دايرة منورة
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                      <span style={{ color: "#34d399" }}>{brightestNode.label}</span>
                      {" "}هو أكتر حد قريب من طاقتك دلوقتي.
                      <span className="block text-xs text-slate-400 mt-1 font-normal">
                        يمكن ده وقت تشكره؟
                      </span>
                    </p>
                  </div>
                )}

                {/* إنت عملت خطوات حقيقية */}
                {(total > 0 || archivedNodes.length > 0) && (
                  <p className="text-xs text-center text-slate-400 dark:text-slate-500 leading-relaxed px-2">
                    إنت عملت خطوات حقيقية — والوعي ده هو اللي بيبني الاستقرار.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
