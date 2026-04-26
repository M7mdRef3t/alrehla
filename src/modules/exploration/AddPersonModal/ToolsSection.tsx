import { useState, type FC } from "react";
import { motion } from "framer-motion";
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
        <div className="group relative px-10 py-10 rounded-[3rem] bg-slate-950/40 border border-white/5 text-right backdrop-blur-3xl overflow-hidden">
          {/* HUD Corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-indigo-500/20 rounded-tl-3xl" />
          
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <ShieldAlert className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="pt-1">
              <h4 className="text-xl font-black text-white mb-2 tracking-tight">أعراض بتحصل معاك مع {displayName}؟</h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">اختار كل اللي ينطبق عليك للوصول لأدق خطة تعافي</p>
            </div>
          </div>
          <div className="relative z-10">
            <SymptomsChecklist ring={activeRing} personLabel={displayName} selectedSymptoms={addedNode?.analysis?.selectedSymptoms ?? []} onSymptomsChange={(ids) => addedNode && updateNodeSymptoms(addedNode.id, ids)} />
          </div>
        </div>
      )}

      {!summaryOnly && (
        <>
          <div className="group relative px-10 py-10 rounded-[3rem] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 text-right backdrop-blur-3xl">
            {/* HUD Corners */}
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500/20 rounded-br-3xl" />

            <h3 className="text-[10px] font-black text-amber-600 mb-8 flex items-center gap-3 font-tajawal">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> أدواتك المطلوبة
            </h3>
            <ul className="grid grid-cols-1 gap-4 text-sm text-slate-300">
              {result.requirements.map((item, index) => {
                const isReality = item.title.includes("ملف القضية") || item.title.includes("قائمة الواقع");
                const isDopamine = item.title.includes("بديل الدوبامين");
                return (
                  <li key={`${item.title}-${index}`} className="group/tool relative rounded-2xl bg-white/[0.03] px-6 py-6 border border-white/5 flex items-center justify-between gap-6 transition-all hover:bg-white/[0.05] hover:border-white/10">
                    <div className="flex-1">
                      <span className="font-black text-white block mb-2 text-lg tracking-tight">{item.title}</span>
                      <span className="text-sm text-slate-400 font-medium leading-relaxed">{item.detail}</span>
                    </div>
                    {(isReality || isDopamine) && (
                      <button
                        type="button"
                        onClick={() => { if (isReality) setShowRealityPopup((v) => !v); else setShowDopaminePopup((v) => !v); }}
                        className="shrink-0 w-12 h-12 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center transition-all hover:bg-amber-500/20 hover:text-amber-400 border border-transparent hover:border-amber-500/30"
                      >
                        <Info className="w-6 h-6" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {showRealityPopup && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-3xl p-8 text-right text-lg text-amber-100 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative z-20"
              >
                <p className="font-black text-amber-400 mb-4 text-xl tracking-tight">قائمة الواقع (ملف القضية الحقيقي)</p>
                {detachmentReasons && detachmentReasons.length > 0 ? (
                  <ul className="space-y-3 font-medium">
                    {detachmentReasons.map((r, i) => <li key={i} className="flex items-start gap-3"><span className="text-amber-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{r}</li>)}
                  </ul>
                ) : (
                  <p className="font-medium leading-relaxed">ورقة مكتوب فيها «ليه بعدت عنهم؟» — تكتبها في خطة التعافي (مرساة الواقع) وتقرأها وقت الضعف لتثبيت عقلك.</p>
                )}
                <button type="button" onClick={() => setShowRealityPopup(false)} className="mt-6 text-sm font-black text-amber-500 hover:text-amber-400 font-tajawal border-b border-amber-500/20">إغلاق التلميح</button>
              </motion.div>
            )}
            {showDopaminePopup && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-3xl p-8 text-right text-lg text-amber-100 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative z-20"
              >
                <p className="font-black text-amber-400 mb-4 text-xl tracking-tight">بديل الدوبامين</p>
                <p className="font-medium leading-relaxed text-lg">نشاط ممتع جاهز فوراً لما الفكرة تهاجمك — مثلاً: مشي، مكالمة صديق، لعبة، أو أي شيء يخلّيك تركز في الحاضر وتكسر حلقة التفكير.</p>
                <button type="button" onClick={() => setShowDopaminePopup(false)} className="mt-6 text-sm font-black text-amber-500 hover:text-amber-400 font-tajawal border-b border-amber-500/20">إغلاق التلميح</button>
              </motion.div>
            )}
          </div>

          <div className="group relative p-10 rounded-[3rem] bg-rose-950/20 border border-rose-500/10 backdrop-blur-3xl text-right shadow-2xl overflow-hidden transition-all hover:bg-rose-950/30">
            {/* Ambient Glow */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <h3 className="text-[10px] font-black text-rose-400 mb-8 flex items-center gap-3 font-tajawal">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> التحديات المتوقعة
            </h3>
            <ul className="space-y-6">
              {normalizedObstacles.map((item, index) => {
                const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
                return (
                  <li key={`${item.title}-${index}`} className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] hover:border-rose-500/20">
                    <span className="font-black text-rose-400 block mb-3 text-lg tracking-tight">{item.title}</span>
                    <span className="text-lg text-slate-300 font-medium leading-relaxed tracking-tight">
                      {solutionHasReality ? (
                        <>
                          {item.solution.includes("ملف القضية الحقيقي") ? (
                            <>{item.solution.split("ملف القضية الحقيقي")[0]}<button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors mx-1">ملف القضية الحقيقي</button>{item.solution.split("ملف القضية الحقيقي")[1]}</>
                          ) : (
                            <>{item.solution.split("قائمة الواقع")[0]}<button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors mx-1">قائمة الواقع</button>{item.solution.split("قائمة الواقع")[1]}</>
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
