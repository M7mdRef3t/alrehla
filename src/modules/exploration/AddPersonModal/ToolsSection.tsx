import type { FC, useState } from "react";
import { Info, ShieldAlert } from "lucide-react";
import { GenerationalEchoCard } from "../GenerationalEchoCard";
import { SymptomsChecklist } from "../SymptomsChecklist";
import type { ResultTemplate } from "@/utils/resultScreenTemplates";

interface ToolsSectionProps {
  summaryOnly: boolean;
  generationalEcho: any;
  displayName: string;
  isEmotionalPrisoner: boolean;
  activeRing: "green" | "yellow" | "red";
  addedNode: any;
  updateNodeSymptoms: (nodeId: string, ids: string[]) => void;
  result: ResultTemplate;
  normalizedObstacles: any[];
  detachmentReasons: string[] | undefined;
  onOpenTraumaRecoveryPath: () => void;
}

export const ToolsSection: FC<ToolsSectionProps> = ({
  summaryOnly,
  generationalEcho,
  displayName,
  isEmotionalPrisoner,
  activeRing,
  addedNode,
  updateNodeSymptoms,
  result,
  normalizedObstacles,
  detachmentReasons,
  onOpenTraumaRecoveryPath
}) => {
  const [showRealityPopup, setShowRealityPopup] = useState(false);
  const [showDopaminePopup, setShowDopaminePopup] = useState(false);

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {summaryOnly && generationalEcho && (
        <div className="p-1 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
          <GenerationalEchoCard snapshot={generationalEcho} onOpenRecoveryPath={onOpenTraumaRecoveryPath} />
        </div>
      )}

      {isEmotionalPrisoner && !summaryOnly && (
        <div className="px-6 py-6 rounded-[2rem] bg-slate-950/40 border border-indigo-500/10 text-right">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-[var(--consciousness-text)] mb-1">أعراض بتحصل معاك مع {displayName}؟</h4>
              <p className="text-xs text-[var(--consciousness-text-muted)] font-medium">اختار كل اللي ينطبق عليك للوصول لأدق خطة تعافي</p>
            </div>
          </div>
          <SymptomsChecklist ring={activeRing} personLabel={displayName} selectedSymptoms={addedNode?.analysis?.selectedSymptoms ?? []} onSymptomsChange={(ids) => addedNode && updateNodeSymptoms(addedNode.id, ids)} />
        </div>
      )}

      {!summaryOnly && (
        <>
          <div className="px-6 py-6 rounded-[2rem] bg-[#020617] border border-white/5 text-right">
            <h3 className="text-sm font-black text-amber-400 mb-5 flex items-center gap-2">
              <span className="opacity-80">🎒</span> أدواتك المطلوبة
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {result.requirements.map((item, index) => {
                const isReality = item.title.includes("ملف القضية") || item.title.includes("قائمة الواقع");
                const isDopamine = item.title.includes("بديل الدوبامين");
                return (
                  <li key={`${item.title}-${index}`} className="rounded-xl bg-[var(--page-surface-2)] px-4 py-4 border border-[var(--page-border-soft)] flex items-start justify-between gap-4">
                    <span>
                      <span className="font-black text-[var(--consciousness-text)] block mb-1 text-sm">{item.title}</span>{" "}
                      <span className="text-xs text-[var(--consciousness-text-muted)] font-medium leading-relaxed">{item.detail}</span>
                    </span>
                    {(isReality || isDopamine) && (
                      <button
                        type="button"
                        onClick={() => { if (isReality) setShowRealityPopup((v) => !v); else setShowDopaminePopup((v) => !v); }}
                        className="shrink-0 p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {showRealityPopup && (
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-2xl p-6 text-right text-base text-amber-100 shadow-2xl relative z-20">
                <p className="font-black text-amber-300 mb-3 text-lg">قائمة الواقع (ملف القضية الحقيقي)</p>
                {detachmentReasons && detachmentReasons.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 font-medium">
                    {detachmentReasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                ) : (
                  <p className="font-medium leading-relaxed opacity-90">ورقة مكتوب فيها «ليه بعدت عنهم؟» — تكتبها في خطة التعافي (مرساة الواقع) وتقرأها وقت الضعف لتثبيت عقلك.</p>
                )}
                <button type="button" onClick={() => setShowRealityPopup(false)} className="mt-4 text-sm font-black text-amber-400 hover:text-amber-300 underline underline-offset-4">إغلاق التلميح</button>
              </div>
            )}
            {showDopaminePopup && (
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-2xl p-6 text-right text-base text-amber-100 shadow-2xl relative z-20">
                <p className="font-black text-amber-300 mb-3 text-lg">بديل الدوبامين</p>
                <p className="font-medium leading-relaxed opacity-90">نشاط ممتع جاهز فوراً لما الفكرة تهاجمك — مثلاً: مشي، مكالمة صديق، لعبة، أو أي شيء يخلّيك تركز في الحاضر وتكسر حلقة التفكير.</p>
                <button type="button" onClick={() => setShowDopaminePopup(false)} className="mt-4 text-sm font-black text-amber-400 hover:text-amber-300 underline underline-offset-4">إغلاق التلميح</button>
              </div>
            )}
          </div>

          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/20 backdrop-blur-xl text-right shadow-2xl relative overflow-hidden transition-all hover:bg-rose-950/30">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl" />
            <h3 className="text-lg font-black text-[var(--consciousness-critical)] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--consciousness-critical)]/20 flex items-center justify-center text-xl">⚠️</span> 
              التحديات المتوقعة
            </h3>
            <ul className="space-y-4">
              {normalizedObstacles.map((item, index) => {
                const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
                return (
                  <li key={`${item.title}-${index}`} className="p-5 rounded-2xl bg-[var(--page-surface-2)] border border-[var(--page-border-soft)] transition-colors hover:bg-[var(--page-bg-alt)]">
                    <span className="font-black text-[var(--consciousness-critical)] block mb-2">{item.title}:</span>{" "}
                    <span className="text-base text-[var(--consciousness-text)] font-medium leading-relaxed">
                      {solutionHasReality ? (
                        <>
                          {item.solution.includes("ملف القضية الحقيقي") ? (
                            <>{item.solution.split("ملف القضية الحقيقي")[0]}<button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors">ملف القضية الحقيقي</button>{item.solution.split("ملف القضية الحقيقي")[1]}</>
                          ) : (
                            <>{item.solution.split("قائمة الواقع")[0]}<button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors">قائمة الواقع</button>{item.solution.split("قائمة الواقع")[1]}</>
                          )}
                        </>
                      ) : item.solution}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
