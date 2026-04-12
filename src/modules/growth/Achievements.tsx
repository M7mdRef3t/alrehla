import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Map } from "lucide-react";
import { ACHIEVEMENTS } from "@/data/achievements";
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { useMapState } from "@/domains/dawayir/store/map.store";

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

  const brightestNode = useMemo(
    () => activeNodes.filter((n) => n.ring === "green" && !n.isDetached)[0] ?? null,
    [activeNodes]
  );

  const TABS = [
    { id: "achievements" as const, label: "إنجازاتك", icon: Trophy },
    { id: "journey" as const, label: "ملخص الرحلة", icon: Map }
  ];

  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-title"
    >
      <motion.div
        className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(10,15,30,0.97) 0%, rgba(15,23,42,0.95) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
        }}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 id="achievements-title" className="text-base font-black text-white flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: "#fbbf24" }} />
            رحلتك
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex shrink-0 px-5 pt-3 pb-0 gap-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors rounded-t-xl border-b-2"
                style={{
                  borderColor: active ? "#34d399" : "transparent",
                  color: active ? "#34d399" : "rgba(255,255,255,0.35)",
                  background: active ? "rgba(52,211,153,0.06)" : "transparent"
                }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" dir="rtl">
          <AnimatePresence mode="wait">
            {tab === "achievements" ? (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="p-4 space-y-3"
              >
                {/* Progress summary */}
                <div
                  className="rounded-2xl p-3"
                  style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "rgba(251,191,36,0.9)" }}>
                      {unlockedCount === totalCount
                        ? "ماشاء الله! أتممت كل الإنجازات 🎉"
                        : `${unlockedCount} من ${totalCount} إنجاز`}
                    </p>
                    <p className="text-xs font-black" style={{ color: "#fbbf24" }}>
                      {totalPoints.toLocaleString("ar-EG")} نقطة
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Achievement cards */}
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = unlockedIds.includes(a.id);
                  return (
                    <motion.div
                      key={a.id}
                      className="rounded-2xl p-3.5"
                      style={{
                        background: unlocked
                          ? "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.05))"
                          : "rgba(255,255,255,0.02)",
                        border: `1px solid ${unlocked ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)"}`,
                        opacity: unlocked ? 1 : 0.65
                      }}
                      initial={false}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0" aria-hidden>
                          {unlocked ? a.icon : "🔒"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-white">{a.title}</h3>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {a.description}
                          </p>
                          {unlocked && a.hint && (
                            <p className="text-xs mt-1.5 font-medium" style={{ color: "rgba(251,191,36,0.7)" }}>
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
                transition={{ duration: 0.18 }}
                className="p-4 space-y-4"
              >
                {/* الجملة الفلسفية */}
                <p className="text-xs text-center leading-relaxed" style={{ color: "rgba(45,212,191,0.55)" }}>
                  التعافي مش سباق.. هو إنك النهاردة تكون عارف مكانك أحسن من امبارح.
                </p>

                {/* كارت توازن الدواير */}
                {total > 0 ? (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(15,23,42,0.4), rgba(45,212,191,0.06))",
                      border: "1px solid rgba(45,212,191,0.15)"
                    }}
                  >
                    <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                      توازن الدواير
                    </p>

                    {/* Gauge */}
                    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-3">
                      {greenCount > 0 && (
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${(greenCount / total) * 100}%`, background: "#34d399" }}
                        />
                      )}
                      {yellowCount > 0 && (
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${(yellowCount / total) * 100}%`, background: "#fbbf24" }}
                        />
                      )}
                      {redCount > 0 && (
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${(redCount / total) * 100}%`, background: "#f87171" }}
                        />
                      )}
                    </div>

                    <div className="flex justify-between text-[11px] mb-3">
                      <span className="font-semibold" style={{ color: "#34d399" }}>{greenCount} قريب</span>
                      <span className="font-semibold" style={{ color: "#fbbf24" }}>{yellowCount} متذبذب</span>
                      <span className="font-semibold" style={{ color: "#f87171" }}>{redCount} بعيد</span>
                    </div>

                    <p className="text-sm font-semibold text-center leading-relaxed text-white">
                      دوايرك متزنة بنسبة{" "}
                      <span style={{ color: "#34d399" }}>{calmPct}%</span>
                      {" "}..{" "}
                      <span className="font-normal text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {calmPct >= 60
                          ? "إنت بتتحرك في اتجاه الهدوء."
                          : calmPct >= 30
                            ? "لسه في شغل، بس الخريطة بتتوضح."
                            : "الوعي هو أول الطريق."}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl p-4 text-center text-sm"
                    style={{ border: "1px solid rgba(45,212,191,0.1)", color: "rgba(255,255,255,0.35)" }}
                  >
                    ابدأ بأول شخص في الخريطة وهنعرف نرسملك صورة رحلتك.
                  </div>
                )}

                {/* محطات عدت */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    محطات عدت
                  </p>
                  {archivedNodes.length > 0 ? (
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      قدرت توّدع{" "}
                      <span style={{ color: "#34d399" }}>{archivedNodes.length}</span>
                      {" "}{archivedNodes.length === 1 ? "محطة" : "محطات"}
                      {" "}مكانتش مريحة ليك..{" "}
                      <span className="font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>مساحتك الخاصة وسعت.</span>
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                      لسه في البداية — كل قرار بتاخده بتوسّع مساحتك.
                    </p>
                  )}
                </div>

                {/* أكتر دايرة منورة */}
                {brightestNode && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(52,211,153,0.06), rgba(45,212,191,0.08))",
                      border: "1px solid rgba(52,211,153,0.2)"
                    }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: "#34d399" }}>
                      أكتر دايرة منورة
                    </p>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      <span style={{ color: "#34d399" }}>{brightestNode.label}</span>
                      {" "}هو أكتر حد قريب من طاقتك دلوقتي.
                      <span className="block text-xs mt-1 font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>
                        يمكن ده وقت تشكره؟
                      </span>
                    </p>
                  </div>
                )}

                {(total > 0 || archivedNodes.length > 0) && (
                  <p className="text-xs text-center leading-relaxed px-2" style={{ color: "rgba(255,255,255,0.25)" }}>
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
