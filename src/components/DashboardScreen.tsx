import type { FC } from "react";
import { useMemo, useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useMapState } from "../state/mapState";
import { mapCopy } from "../copy/map";
import { landingCopy } from "../copy/landing";
import { WarRoomWidget } from "./CommandCenter/WarRoomWidget";
import { MedalsBoard } from "./Armory/MedalsBoard";
import { EmergencySOS } from "./CommandCenter/EmergencySOS";
import { Medal } from "../types/tactical";
import { StreakWidget } from "./StreakWidget";
import { QuickPathModal } from "./QuickPathModal";
import { ShareableMapCard } from "./ShareableMapCard";
import { recordDailyVisit } from "../services/streakSystem";
import { Zap, Share2, Settings, X, Gift, Users } from "lucide-react";
import SupportCirclesScreen from "../modules/community/SupportCirclesScreen";
import { ReferralPanel } from "./ReferralPanel";
import { LevelBanner } from "./Gamification/LevelBanner";
import { DailyQuests } from "./Gamification/DailyQuests";
import { useGamificationState } from "../services/gamificationEngine";
import { AIOracleWidget } from "./CommandCenter/AIOracleWidget";
import { AccessManager, SubscriptionInfo } from "../modules/billing/AccessManager";
import { supabase } from "../services/supabaseClient";

/* ════════════════════════════════════════════════
   DASHBOARD SCREEN — غرفة العمليات
   ════════════════════════════════════════════════ */

interface DashboardScreenProps {
  firstName: string | null;
  onNavigateToMap: () => void;
  onOpenAchievements: () => void;
  onNavigateToSettings?: () => void;
}

/* ── Mini node for the live map card ── */
interface MiniNode {
  id: string;
  label: string;
  ring: "green" | "yellow" | "red" | "grey";
  x: number;
  y: number;
  isNodeArchived?: boolean;
}

const RING_COLOR: Record<string, string> = {
  green: "rgba(52,211,153,0.85)",
  yellow: "rgba(251,191,36,0.85)",
  red: "rgba(248,113,113,0.85)",
  grey: "rgba(148,163,184,0.5)",
};

/* ── Floating node in mini-map ── */
const FloatingNode: FC<{
  node: MiniNode;
  index: number;
  mouseX: { get: () => number };
  mouseY: { get: () => number };
}> = ({ node, index, mouseX, mouseY }) => {
  const depth = 0.04 + (index % 3) * 0.015;
  const px = useSpring(useMotionValue(node.x), { stiffness: 60, damping: 20 });
  const py = useSpring(useMotionValue(node.y), { stiffness: 60, damping: 20 });

  useEffect(() => {
    // Animation logic
  }, [mouseX, mouseY, depth, px, py, node.x, node.y]);

  const size = node.ring === "green" ? 9 : node.ring === "yellow" ? 8 : 7;

  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%,-50%)",
      }}
      animate={{
        y: [0, -4, 0, 3, 0],
        x: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration: 4 + index * 0.7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.3,
      }}
    >
      {/* Glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 2.8,
          height: size * 2.8,
          background: RING_COLOR[node.ring],
          opacity: 0.15,
          filter: "blur(4px)",
        }}
      />
      {/* Node dot */}
      <div
        className="rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: RING_COLOR[node.ring],
          boxShadow: `0 0 ${size * 1.5}px ${RING_COLOR[node.ring]}`,
        }}
      />
      {/* Label */}
      <span
        className="absolute top-full mt-1 text-[8px] font-semibold whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {node.label}
      </span>
    </motion.div>
  );
};

/* ── Main Dashboard ── */
export const DashboardScreen: FC<DashboardScreenProps> = ({
  firstName,
  onNavigateToMap,
  onOpenAchievements,
  onNavigateToSettings,
}) => {
  const nodes = useMapState((s) => s.nodes);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseXRaw = useMotionValue(0);
  const mouseYRaw = useMotionValue(0);

  const activeNodes = useMemo(() => nodes.filter((n) => !n.isNodeArchived), [nodes]);
  const greenCount = activeNodes.filter((n) => n.ring === "green").length;
  const yellowCount = activeNodes.filter((n) => n.ring === "yellow").length;
  const redCount = activeNodes.filter((n) => n.ring === "red").length;



  // Wave 1: Modal state
  const [showQuickPath, setShowQuickPath] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        AccessManager.getSubscriptionStatus(session.user.id).then((info) => {
          setSubInfo(info);
          if (info.features.hasShadowMemory) {
            void import("../services/shadowMemory").then(({ ShadowMemory }) => {
              return ShadowMemory.recordSnapshot(session.user.id);
            });
          }
        });
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        AccessManager.getSubscriptionStatus(session.user.id).then(setSubInfo);
      } else {
        setSubInfo(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { addXP } = useGamificationState();

  // Wave 1: Record daily visit for streak
  useEffect(() => {
    const res = recordDailyVisit();
    if (res.currentStreak > 0) {
      addXP(20, "تسجيل دخول يومي");
    }
  }, [addXP]);

  /* Spread nodes across a virtual 100×100 grid */
  const miniNodes: MiniNode[] = useMemo(() => {
    const positions = [
      [50, 38], [28, 55], [72, 52], [38, 72], [64, 70],
      [20, 35], [78, 38], [55, 80], [30, 80], [80, 68],
    ];
    return activeNodes.slice(0, 10).map((n, i) => ({
      id: n.id,
      label: n.label,
      ring: n.ring as "green" | "yellow" | "red" | "grey",
      x: positions[i]?.[0] ?? 50 + (i * 13) % 40,
      y: positions[i]?.[1] ?? 50 + (i * 7) % 35,
      isNodeArchived: n.isNodeArchived,
    }));
  }, [activeNodes]);

  /* Parallax on pointer move */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseXRaw.set((e.clientX - cx) / rect.width);
    mouseYRaw.set((e.clientY - cy) / rect.height);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? "صباح النور" : hour < 17 ? "مرحباً" : "مساء الخير";
    return firstName ? `${timeGreet} يا قائد ${firstName}` : `${timeGreet} يا قائد`;
  }, [firstName]);

  return (
    <motion.div
      className="w-full min-h-[100dvh] flex flex-col px-4 py-6 gap-6 overflow-y-auto pb-24"
      style={{ maxWidth: 480, margin: "0 auto" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      dir="rtl"
    >
      {/* ── Greeting header ── */}
      <motion.div
        className="flex items-center justify-between pt-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div>
          <p className="text-xs font-medium text-teal-500/80 uppercase tracking-widest">
            غرفة العمليات المركزية
          </p>
          <h1 className="text-xl font-bold leading-snug text-white mt-1">
            {greeting}
          </h1>
          <p className="text-sm text-slate-400">حالة النظام: مستقر 🟢</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Streak compact badge */}
          <StreakWidget compact />
          {/* Settings gear */}
          {onNavigateToSettings && (
            <motion.button
              onClick={onNavigateToSettings}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b",
              }}
              whileHover={{ color: "#94a3b8", borderColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.93 }}
              aria-label="الإعدادات"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          )}
          {/* Avatar circle */}
          <div
            onClick={onOpenAchievements}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer overflow-hidden border-2 border-teal-500/30 hover:border-teal-500 transition-colors"
          >
            {firstName ? (
              <div className="text-lg font-bold text-teal-500">
                {firstName[0].toUpperCase()}
              </div>
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
          </div>
        </div>
      </motion.div>

      {/* ── AI Oracle Insight ── */}
      {subInfo?.features.hasAiOracle && <AIOracleWidget />}

      {/* ── Level & Progress Banner ── */}
      <LevelBanner />

      {/* ── Wave 1: Quick Action Buttons ── */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <motion.button
          onClick={() => setShowQuickPath(true)}
          className="flex items-center gap-3 p-3 rounded-2xl font-bold bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-right">
            <p className="text-xs text-white">جملة طوارئ</p>
            <p className="text-[10px] text-slate-400 font-normal">خروج فوري</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowCommunity(true)}
          className="flex items-center gap-3 p-3 rounded-2xl font-bold bg-slate-800/40 border border-slate-700/50 hover:border-teal-500/50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-right">
            <p className="text-xs text-white">مجتمع الدعم</p>
            <p className="text-[10px] text-slate-400 font-normal">دوائر مجهولة</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowReferral(true)}
          className="flex items-center gap-3 p-3 rounded-2xl font-bold bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-right">
            <p className="text-xs text-white">ادعُ قائداً</p>
            <p className="text-[10px] text-slate-400 font-normal">احصل على بريميوم</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowShareCard(true)}
          className="flex items-center gap-3 p-3 rounded-2xl font-bold bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-right">
            <p className="text-xs text-white">شارك الخريطة</p>
            <p className="text-[10px] text-slate-400 font-normal">انتشار فيروسي</p>
          </div>
        </motion.button>
      </motion.div>

      {/* ── Wave 1: Streak Widget ── */}
      <StreakWidget />

      {/* ── Live Map Card (Radar) ── */}
      <motion.div
        ref={cardRef}
        className="relative rounded-3xl overflow-hidden cursor-pointer group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.55 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseXRaw.set(0); mouseYRaw.set(0); }}
        onClick={onNavigateToMap}
      >
        {/* Background & Grid */}
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Radar Scan Effect */}
        <div className="absolute inset-0 rounded-full border border-teal-500/10 animate-[ping_4s_linear_infinite]" />

        {/* Mini-map area */}
        <div className="relative w-full" style={{ height: 220 }}>
          {/* Center "me" dot */}
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "42%", transform: "translate(-50%,-50%)" }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: 14, height: 14,
                background: "rgba(45,212,191,0.9)",
                boxShadow: "0 0 18px rgba(45,212,191,0.6)",
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Floating nodes */}
          {miniNodes.map((node, i) => (
            <FloatingNode
              key={node.id}
              node={node}
              index={i}
              mouseX={{ get: () => mouseXRaw.get() }}
              mouseY={{ get: () => mouseYRaw.get() }}
            />
          ))}

          {activeNodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <p className="text-teal-500 font-bold mb-2">الرادار فاضي!</p>
              <p className="text-slate-500 text-xs">ابدأ استطلاع محيطك وضيف أول دايرة.</p>
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-5 pt-12 flex items-end justify-between">
          <div>
            <p className="text-xs font-mono text-teal-400/70 mb-1">
              إحصائيات الميدان
            </p>
            <div className="flex gap-3 text-xs font-bold text-white">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {greenCount} آمن</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {redCount} خطر</span>
            </div>
          </div>

          {/* Launch button */}
          <motion.div
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold bg-teal-500/10 border border-teal-500/30 text-teal-300 group-hover:bg-teal-500/20 transition-all"
            whileHover={{ scale: 1.05 }}
          >
            فتح الخريطة الاستراتيجية
          </motion.div>
        </div>
      </motion.div>

      {/* ── War Room Widget (Daily Intel) ── */}
      <WarRoomWidget />

      {/* ── Daily Quests ── */}
      <DailyQuests />

      {/* ── Medals Board ── */}
      <MedalsBoard />

      {/* ── Emergency SOS ── */}
      <div className="py-4 flex justify-center">
        <EmergencySOS />
      </div>

      {/* ── Wave 1: Modals ── */}
      <AnimatePresence>
        {showQuickPath && (
          <QuickPathModal onClose={() => setShowQuickPath(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showShareCard && (
          <ShareableMapCard onClose={() => setShowShareCard(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCommunity && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <button
              onClick={() => setShowCommunity(false)}
              className="absolute top-6 left-6 z-50 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <SupportCirclesScreen />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReferral && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-sm">
              <ReferralPanel onClose={() => setShowReferral(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
