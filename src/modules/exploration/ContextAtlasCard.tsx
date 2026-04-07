import type { FC } from "react";
import { mapCopy } from "@/copy/map";
import type { ContextAtlasItem, ContextAtlasKey, ContextAtlasSnapshot } from "@/utils/contextAtlas";

interface ContextAtlasCardProps {
  snapshot: ContextAtlasSnapshot;
  isUnifiedMode: boolean;
  selectedContexts: ContextAtlasKey[];
  onToggleMode: () => void;
  onToggleContext: (context: ContextAtlasKey) => void;
  onFocusContext: (context: ContextAtlasKey) => void;
  onSelectNode?: (nodeId: string) => void;
}

function getContextLabel(key: ContextAtlasKey): string {
  if (key === "family") return mapCopy.contextFamily;
  if (key === "work") return mapCopy.contextWork;
  if (key === "love") return mapCopy.contextLove;
  return mapCopy.contextGeneral;
}

function buildStatus(item: ContextAtlasItem): string {
  if (item.pressureCount > 0 && item.safeCount > 0) {
    return `${item.pressureCount} ضغط / ${item.safeCount} دعم`;
  }
  if (item.pressureCount > 0) return `${item.pressureCount} نقطة ضغط`;
  if (item.safeCount > 0) return `${item.safeCount} نقطة دعم`;
  return "تحت المراقبة";
}

export const ContextAtlasCard: FC<ContextAtlasCardProps> = ({
  snapshot,
  isUnifiedMode,
  selectedContexts,
  onToggleMode,
  onToggleContext,
  onFocusContext,
  onSelectNode
}) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-right">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleMode}
          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold text-white hover:bg-white/15"
        >
          {isUnifiedMode ? "العودة لقطاع الرحلة" : "عدسة موحدة"}
        </button>
        <div>
          <h3 className="text-sm font-bold text-white">{snapshot.title}</h3>
          <p className="mt-1 text-xs text-slate-400">{snapshot.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {snapshot.contexts.map((item) => {
          const isSelected = selectedContexts.includes(item.key);
          return (
            <article
              key={item.key}
              className={`rounded-2xl border p-4 transition-all ${
                isSelected ? "border-teal-400/40 bg-teal-500/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    isSelected ? "bg-teal-500 text-slate-950" : "bg-white/10 text-slate-200"
                  }`}
                >
                  {item.count} علاقات
                </span>
                <h4 className="text-sm font-bold text-white">{getContextLabel(item.key)}</h4>
              </div>

              <p className="text-xs font-semibold text-slate-300">{buildStatus(item)}</p>

              {item.leadLabel ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  أثقل نقطة الآن: <span className="font-semibold text-slate-200">{item.leadLabel}</span>
                </p>
              ) : null}

              {item.supportLabel ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  أقرب دعم: <span className="font-semibold text-teal-200">{item.supportLabel}</span>
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => (isUnifiedMode ? onToggleContext(item.key) : onFocusContext(item.key))}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    isUnifiedMode
                      ? isSelected
                        ? "bg-white text-slate-900 hover:bg-slate-100"
                        : "bg-white/10 text-slate-200 hover:bg-white/15"
                      : "bg-teal-500 text-slate-950 hover:bg-teal-400"
                  }`}
                >
                  {isUnifiedMode ? (isSelected ? "ضمن العدسة" : "أدخل للعدسة") : "ركز هنا"}
                </button>

                {onSelectNode && (item.leadNodeId || item.supportNodeId) ? (
                  <button
                    type="button"
                    onClick={() => onSelectNode(item.leadNodeId ?? item.supportNodeId!)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                  >
                    افتح الشخص
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
