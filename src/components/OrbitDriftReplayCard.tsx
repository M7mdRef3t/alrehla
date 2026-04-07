import type { FC } from "react";
import type { OrbitDriftReplaySnapshot } from "@/utils/orbitDriftReplay";

interface OrbitDriftReplayCardProps {
  snapshot: OrbitDriftReplaySnapshot;
}

const toneStyles: Record<
  OrbitDriftReplaySnapshot["steps"][number]["tone"],
  { dot: string; card: string; text: string }
> = {
  green: {
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
    card: "border-emerald-500/20 bg-emerald-500/5",
    text: "text-emerald-300"
  },
  yellow: {
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]",
    card: "border-amber-500/20 bg-amber-500/5",
    text: "text-amber-300"
  },
  red: {
    dot: "bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
    card: "border-rose-500/20 bg-rose-500/5",
    text: "text-rose-300"
  },
  archived: {
    dot: "bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]",
    card: "border-white/10 bg-white/5",
    text: "text-slate-300"
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
    <section className="mb-6 rounded-3xl border border-white/10 bg-slate-900/40 p-5 text-right shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none group-hover:bg-teal-500/10 transition-all duration-700" />
      
      <div className="mb-4 flex items-center justify-between gap-2 relative z-10">
        <span className="rounded-lg bg-teal-500/20 px-3 py-1 text-[10px] font-black text-teal-400 border border-teal-500/30 uppercase tracking-widest shadow-inner">
          Replay
        </span>
        <h3 className="text-base font-black text-white tracking-tight">{snapshot.title}</h3>
      </div>

      <p className="text-sm leading-relaxed text-slate-300 mb-6 font-medium relative z-10">
        {snapshot.summary}
      </p>

      <div className="mt-4 space-y-4 relative z-10">
        {snapshot.steps.map((step, index) => {
          const styles = toneStyles[step.tone];
          return (
            <div key={step.id} className="flex items-stretch gap-4">
              <div className="flex w-3 flex-col items-center">
                <span className={`mt-2.5 h-2.5 w-2.5 rounded-full ${styles.dot} transition-transform duration-500 hover:scale-125`} />
                {index < snapshot.steps.length - 1 ? (
                  <span className="mt-2 h-full w-px bg-white/10" />
                ) : null}
              </div>
              <div className={`flex-1 rounded-2xl border px-4 py-4 transition-all duration-300 hover:bg-white/[0.03] ${styles.card}`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                    {formatRelativeTime(step.timestamp)}
                  </span>
                  <span className={`text-sm font-black ${styles.text}`}>{step.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400 font-medium italic">
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
