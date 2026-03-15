import type { FC } from "react";
import type { OrbitDriftReplaySnapshot } from "../utils/orbitDriftReplay";

interface OrbitDriftReplayCardProps {
  snapshot: OrbitDriftReplaySnapshot;
}

const toneStyles: Record<
  OrbitDriftReplaySnapshot["steps"][number]["tone"],
  { dot: string; card: string }
> = {
  green: {
    dot: "bg-emerald-500",
    card: "border-emerald-200 bg-emerald-50/70"
  },
  yellow: {
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50/70"
  },
  red: {
    dot: "bg-rose-500",
    card: "border-rose-200 bg-rose-50/70"
  },
  archived: {
    dot: "bg-slate-500",
    card: "border-slate-200 bg-slate-100/80"
  }
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "منذ يوم" : `منذ ${days} أيام`;
  return new Date(timestamp).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

export const OrbitDriftReplayCard: FC<OrbitDriftReplayCardProps> = ({ snapshot }) => {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 text-right shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
          Replay
        </span>
        <h3 className="text-sm font-bold text-slate-900">{snapshot.title}</h3>
      </div>

      <p className="text-sm leading-relaxed text-slate-700">
        {snapshot.summary}
      </p>

      <div className="mt-4 space-y-3">
        {snapshot.steps.map((step, index) => {
          const styles = toneStyles[step.tone];
          return (
            <div key={step.id} className="flex items-stretch gap-3">
              <div className="flex w-4 flex-col items-center">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                {index < snapshot.steps.length - 1 ? (
                  <span className="mt-1 h-full w-px bg-slate-200" />
                ) : null}
              </div>
              <div className={`flex-1 rounded-2xl border px-3 py-3 ${styles.card}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {formatRelativeTime(step.timestamp)}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{step.title}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {step.caption}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
