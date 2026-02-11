import type { FC } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Battery, Calendar, Shield } from "lucide-react";
import { getTimelineEvents, type JourneyEventPayload } from "../services/journeyTracking";
import { useMapState } from "../state/mapState";
import { useJourneyState } from "../state/journeyState";
import { usePulseState } from "../state/pulseState";
import { PATH_NAMES } from "../modules/pathEngine/pathResolver";
import type { PulseMood } from "../state/pulseState";

const MOOD_LABEL: Record<PulseMood, string> = {
  bright: "رايق",
  calm: "هادئ",
  anxious: "قلقان",
  angry: "غضبان",
  sad: "حزين",
  tense: "متوتر",
  hopeful: "متفائل",
  overwhelmed: "مغ overwhelm"
};

const RING_LABEL: Record<string, string> = {
  red: "المدار الأحمر",
  yellow: "المدار الأصفر",
  green: "المدار الأخضر"
};

interface JourneyTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  /** عند الضغط على بطاقة مرتبطة بشخص — يمرّر nodeId للتركيز على الخريطة */
  onCardClick?: (nodeId: string) => void;
}

type TimelineItem =
  | { kind: "task"; ts: number; taskLabel?: string; personLabel?: string; nodeId?: string }
  | { kind: "node"; ts: number; ring: string; personLabel?: string; isEmergency?: boolean; nodeId?: string }
  | { kind: "path"; ts: number; pathId: string; zone: string }
  | { kind: "pulse"; ts: number; energy: number; mood: PulseMood };

function formatTimeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "منذ لحظات" : `منذ ${mins} دقيقة`;
  if (hours < 24) return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;
  if (days < 7) return days === 1 ? "منذ يوم" : `منذ ${days} أيام`;
  return new Date(ts).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

export const JourneyTimeline: FC<JourneyTimelineProps> = ({ isOpen, onClose, onCardClick }) => {
  const nodes = useMapState((s) => s.nodes);
  const journeyStartedAt = useJourneyState((s) => s.journeyStartedAt);
  const pulseLogs = usePulseState((s) => s.logs);

  const stats = useMemo(() => {
    const startedAt = journeyStartedAt ?? Date.now();
    const daysCount = Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24));
    const liberatedCount = nodes.filter((n) => n.ring === "yellow" || n.ring === "red").length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekLogs = pulseLogs.filter((e) => e.timestamp >= weekAgo);
    const avgEnergy =
      weekLogs.length > 0
        ? (weekLogs.reduce((s, e) => s + e.energy, 0) / weekLogs.length).toFixed(1)
        : "—";

    return { daysCount, liberatedCount, avgEnergy };
  }, [nodes, journeyStartedAt, pulseLogs]);

  const items = useMemo((): TimelineItem[] => {
    const journeyEvents = getTimelineEvents();
    const list: TimelineItem[] = [];

    for (const e of journeyEvents) {
      if (e.type === "task_completed") {
        const p = e.payload as JourneyEventPayload["task_completed"];
        list.push({
          kind: "task",
          ts: e.timestamp,
          taskLabel: p.taskLabel,
          personLabel: p.personLabel,
          nodeId: p.nodeId
        });
      } else if (e.type === "node_added") {
        const p = e.payload as JourneyEventPayload["node_added"];
        list.push({
          kind: "node",
          ts: e.timestamp,
          ring: p.ring,
          personLabel: p.personLabel,
          isEmergency: p.isEmergency,
          nodeId: p.nodeId
        });
      } else if (e.type === "path_started") {
        const p = e.payload as JourneyEventPayload["path_started"];
        list.push({ kind: "path", ts: e.timestamp, pathId: p.pathId, zone: p.zone });
      }
    }

    for (const log of pulseLogs) {
      list.push({ kind: "pulse", ts: log.timestamp, energy: log.energy, mood: log.mood });
    }

    list.sort((a, b) => b.ts - a.ts);
    return list.slice(0, 80);
  }, [pulseLogs]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 380, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 h-full overflow-hidden border-l border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col"
        style={{ minWidth: 0 }}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 shrink-0 p-4 pb-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">سجل الرحلة</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/20 px-3 py-2 text-center">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                {stats.daysCount < 1 ? "اليوم الأول" : stats.daysCount}
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">أيام الصمود</p>
            </div>
            <div className="rounded-xl border border-rose-200/60 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-900/20 px-3 py-2 text-center">
              <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-rose-800 dark:text-rose-200">{stats.liberatedCount}</p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400">الأرض المحررة</p>
            </div>
            <div className="rounded-xl border border-teal-200/60 dark:border-teal-800/60 bg-teal-50/60 dark:bg-teal-900/20 px-3 py-2 text-center">
              <Battery className="w-4 h-4 text-teal-600 dark:text-teal-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-teal-800 dark:text-teal-200">{stats.avgEnergy}</p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400">شحن البطارية</p>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>ابدأ رحلتك وستظهر المحطات هنا</p>
            </div>
          ) : (
            items.map((item, i) => {
              let nodeId: string | undefined = item.kind === "task" ? item.nodeId : item.kind === "node" ? item.nodeId : undefined;
              if (!nodeId && (item.kind === "task" || item.kind === "node") && item.personLabel) {
                const match = nodes.find((n) => n.label === item.personLabel);
                if (match) nodeId = match.id;
              }
              const hasNode = (item.kind === "task" || item.kind === "node") && nodeId;
              const isClickable = hasNode && nodeId && onCardClick && nodes.some((n) => n.id === nodeId);
              return (
              <motion.button
                key={`${item.kind}-${item.ts}-${i}`}
                type="button"
                onClick={() => {
                  if (isClickable && nodeId) onCardClick(nodeId);
                  else if (!hasNode) {
                    // حدث "للعلم فقط" — نبضة خفيفة
                  }
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 px-4 py-3 text-right ${
                  isClickable ? "cursor-pointer hover:border-teal-300 dark:hover:border-teal-600 transition-all" : "cursor-default"
                }`}
                whileTap={isClickable ? { scale: 0.98 } : undefined}
              >
                {item.kind === "task" && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0" aria-hidden="true">🎯</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          تمت مهمة {item.taskLabel ? `${item.taskLabel}` : "الخطوة"}
                          {item.personLabel ? ` مع ${item.personLabel}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          خطوة ذكية لحماية طاقتك!
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{formatTimeAgo(item.ts)}</p>
                  </>
                )}
                {item.kind === "node" && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0" aria-hidden="true">🛡️</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          تم إضافة {item.personLabel ?? "شخص"} في {RING_LABEL[item.ring] ?? item.ring}
                          {item.isEmergency ? " (طوارئ)" : ""}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          بدأت ترسم حدودك بوضوح.
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{formatTimeAgo(item.ts)}</p>
                  </>
                )}
                {item.kind === "path" && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0" aria-hidden="true">🚀</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          بدء مسار {PATH_NAMES[item.pathId as keyof typeof PATH_NAMES] ?? item.pathId}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          البداية دومًا أصعب خطوة.
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{formatTimeAgo(item.ts)}</p>
                  </>
                )}
                {item.kind === "pulse" && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0" aria-hidden="true">🔋</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          يومك بدأ بطاقة {item.energy}/10 وشعور {MOOD_LABEL[item.mood]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          بس إنت قررت تبدأ رحلتك.
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{formatTimeAgo(item.ts)}</p>
                  </>
                )}
              </motion.button>
            );
            })
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
