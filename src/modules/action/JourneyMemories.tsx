import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { trackingService } from "@/domains/journey";

const HEAVY_TASK_PATTERNS = [
  /رد\s*(بارد|رسمي|حد)/i,
  /بلوك|حظر/i,
  /رسم\s*حد/i,
  /قول\s*لا/i,
  /تجاهل/i,
  /الصيام\s*الشعوري/i
];

function formatTimeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "لحظات" : `${mins} دقيقة`;
  if (hours < 24) return hours === 1 ? "ساعة" : `${hours} ساعة`;
  if (days === 1) return "يوم";
  if (days < 7) return `${days} أيام`;
  if (days === 7) return "أسبوع";
  if (days < 14) return "أكثر من أسبوع";
  if (days < 30) return "أسبوعين";
  return new Date(ts).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

function isHeavyTask(taskLabel: string): boolean {
  return HEAVY_TASK_PATTERNS.some((p) => p.test(taskLabel));
}

interface JourneyMemoriesProps {
  nodeId: string;
  ring?: "green" | "yellow" | "red";
}

export const JourneyMemories: FC<JourneyMemoriesProps> = ({ nodeId, ring = "yellow" }) => {
  const memory = useMemo(() => trackingService.getLastTaskForNode(nodeId), [nodeId]);

  if (!memory) return null;

  const timeAgo = formatTimeAgo(memory.timestamp);
  const heavy = isHeavyTask(memory.taskLabel);

  const bgClass =
    ring === "green"
      ? "bg-teal-50/80 dark:bg-teal-900/20 border-teal-200/60 dark:border-teal-700/50"
      : ring === "red"
        ? "bg-rose-50/60 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/50"
        : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-xl border px-4 py-3 text-right ${bgClass}`}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2
          className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            من {timeAgo}.. نفّذت مهمة: <span className="font-semibold">{memory.taskLabel}</span>
          </p>
          {heavy && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              خطوة كانت محتاجة شجاعة.. استمر.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
