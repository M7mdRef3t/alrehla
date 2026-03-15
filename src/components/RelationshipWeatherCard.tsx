import type { FC } from "react";
import type { RelationshipWeatherSnapshot } from "../utils/relationshipWeather";

interface RelationshipWeatherCardProps {
  snapshot: RelationshipWeatherSnapshot;
  onSelectNode?: (nodeId: string) => void;
}

const toneStyles = {
  storm: {
    shell: "border-rose-200 bg-rose-50/80",
    badge: "bg-rose-600 text-white"
  },
  windy: {
    shell: "border-amber-200 bg-amber-50/80",
    badge: "bg-amber-500 text-white"
  },
  clear: {
    shell: "border-emerald-200 bg-emerald-50/80",
    badge: "bg-emerald-600 text-white"
  }
} as const;

export const RelationshipWeatherCard: FC<RelationshipWeatherCardProps> = ({
  snapshot,
  onSelectNode
}) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-right">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
          Daily Intel
        </span>
        <h3 className="text-sm font-bold text-white">{snapshot.title}</h3>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">
        {snapshot.summary}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {snapshot.highestRisk ? (
          <button
            type="button"
            onClick={() => onSelectNode?.(snapshot.highestRisk!.nodeId)}
            className={`rounded-2xl border p-4 text-right transition-all hover:scale-[1.01] ${toneStyles[snapshot.highestRisk.tone].shell}`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${toneStyles[snapshot.highestRisk.tone].badge}`}>
                {snapshot.highestRisk.badge}
              </span>
              <span className="text-xs font-semibold text-slate-700">أولوية اليوم</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{snapshot.highestRisk.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{snapshot.highestRisk.summary}</p>
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4 text-right">
            <span className="text-xs font-semibold text-slate-600">أولوية اليوم</span>
            <p className="mt-2 text-sm font-bold text-slate-900">لا يوجد ضغط نشط على الخريطة</p>
          </div>
        )}

        {snapshot.safeAnchor ? (
          <button
            type="button"
            onClick={() => onSelectNode?.(snapshot.safeAnchor!.nodeId)}
            className={`rounded-2xl border p-4 text-right transition-all hover:scale-[1.01] ${toneStyles[snapshot.safeAnchor.tone].shell}`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${toneStyles[snapshot.safeAnchor.tone].badge}`}>
                {snapshot.safeAnchor.badge}
              </span>
              <span className="text-xs font-semibold text-slate-700">مرسى آمن</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{snapshot.safeAnchor.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{snapshot.safeAnchor.summary}</p>
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4 text-right">
            <span className="text-xs font-semibold text-slate-600">مرسى آمن</span>
            <p className="mt-2 text-sm font-bold text-slate-900">لا يوجد مرسى واضح اليوم</p>
          </div>
        )}
      </div>

      {snapshot.watchlist.length > 0 ? (
        <div className="mt-4 space-y-2">
          {snapshot.watchlist.map((item) => (
            <button
              key={item.nodeId}
              type="button"
              onClick={() => onSelectNode?.(item.nodeId)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-3 text-right transition-colors hover:bg-slate-900/60"
            >
              <span className="text-xs font-semibold text-slate-400">{item.badge}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.summary}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
};
