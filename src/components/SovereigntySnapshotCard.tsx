import type { FC } from "react";
import type { SovereigntySnapshot } from "../utils/sovereigntySnapshot";

interface SovereigntySnapshotCardProps {
  snapshot: SovereigntySnapshot;
}

const toneStyles: Record<
  SovereigntySnapshot["tone"],
  { shell: string; chip: string; badge: string; title: string }
> = {
  danger: {
    shell: "bg-rose-50 border-rose-200",
    chip: "bg-rose-100 text-rose-800",
    badge: "bg-rose-600 text-white",
    title: "text-rose-950"
  },
  caution: {
    shell: "bg-amber-50 border-amber-200",
    chip: "bg-amber-100 text-amber-800",
    badge: "bg-amber-500 text-white",
    title: "text-amber-950"
  },
  safe: {
    shell: "bg-teal-50 border-teal-200",
    chip: "bg-teal-100 text-teal-800",
    badge: "bg-teal-600 text-white",
    title: "text-teal-950"
  },
  steady: {
    shell: "bg-slate-100 border-slate-200",
    chip: "bg-slate-200 text-slate-800",
    badge: "bg-slate-800 text-white",
    title: "text-slate-950"
  }
};

export const SovereigntySnapshotCard: FC<SovereigntySnapshotCardProps> = ({ snapshot }) => {
  const styles = toneStyles[snapshot.tone];

  return (
    <section className={`mb-6 rounded-2xl border p-4 text-right ${styles.shell}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles.badge}`}>
          {snapshot.sourceLabel}
        </span>
        <p className="text-[11px] font-semibold text-slate-500">قرار السيادة الآن</p>
      </div>

      <h3 className={`text-base font-extrabold leading-relaxed ${styles.title}`}>
        {snapshot.headline}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {snapshot.body}
      </p>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold text-slate-500">لماذا الآن؟</p>
        <div className="flex flex-wrap gap-2">
          {snapshot.reasons.map((reason) => (
            <span key={reason} className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.chip}`}>
              {reason}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/60 bg-white/70 px-3 py-2">
        <p className="text-[11px] font-semibold text-slate-500">الخطوة المقترحة</p>
        <p className="mt-1 text-sm font-bold text-slate-900">{snapshot.ctaLabel}</p>
      </div>
    </section>
  );
};
