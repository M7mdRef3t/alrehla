import type { FC } from "react";
import { useState } from "react";
import type { BoundaryEvidenceSnapshot } from "../utils/boundaryEvidence";

interface BoundaryEvidenceCardProps {
  evidence: BoundaryEvidenceSnapshot;
}

const toneStyles: Record<
  BoundaryEvidenceSnapshot["tone"],
  { shell: string; badge: string; item: string; metric: string }
> = {
  danger: {
    shell: "bg-rose-50 border-rose-200",
    badge: "bg-rose-600 text-white",
    item: "bg-white/80 border-rose-200",
    metric: "bg-white/90 border-rose-200"
  },
  caution: {
    shell: "bg-amber-50 border-amber-200",
    badge: "bg-amber-500 text-white",
    item: "bg-white/80 border-amber-200",
    metric: "bg-white/90 border-amber-200"
  }
};

export const BoundaryEvidenceCard: FC<BoundaryEvidenceCardProps> = ({ evidence }) => {
  const [copied, setCopied] = useState(false);
  const styles = toneStyles[evidence.tone];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(evidence.copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={`mb-6 rounded-2xl border p-4 text-right ${styles.shell}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-white"
        >
          {copied ? "تم النسخ" : "نسخ الملف"}
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-bold text-slate-700">
            النمط: {evidence.patternLabel}
          </span>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles.badge}`}>
            {evidence.title}
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-700">{evidence.summary}</p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className={`rounded-2xl border px-3 py-3 ${styles.metric}`}>
          <p className="text-[11px] font-bold text-slate-500">ثقة الملف</p>
          <p className="mt-1 text-lg font-black text-slate-900">{evidence.confidenceScore}%</p>
        </div>
        <div className={`rounded-2xl border px-3 py-3 ${styles.metric}`}>
          <p className="text-[11px] font-bold text-slate-500">الإشارة الأقوى</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-800">
            {evidence.strongestSignal}
          </p>
        </div>
        <div className={`rounded-2xl border px-3 py-3 ${styles.metric}`}>
          <p className="text-[11px] font-bold text-slate-500">نافذة القرار</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-800">
            {evidence.actionWindow}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {evidence.items.map((item) => (
          <li
            key={item}
            className={`rounded-xl border px-3 py-2 text-sm leading-relaxed text-slate-800 ${styles.item}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
};
