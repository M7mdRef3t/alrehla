import { logger } from "@/services/logger";
import React, { type FC, useState } from "react";
import { AlertTriangle, TrendingUp, Zap as Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { TopScenario } from "@/services/admin/adminTypes";
import { marketingCopywriter, type TikTokScriptGeneration } from "@/ai/aiMarketingCopy";
import { TikTokTeleprompterModal } from "./TikTokTeleprompterModal";

interface IllusionRadarProps {
  scenarios: TopScenario[] | null;
  isLoading: boolean;
}

export const IllusionRadar: FC<IllusionRadarProps> = ({ scenarios, isLoading }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIllusion, setSelectedIllusion] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<TikTokScriptGeneration | null>(null);

  const handleDismantle = async (illusionName: string) => {
    setIsGenerating(true);
    setSelectedIllusion(illusionName);
    setGeneratedScript(null);
    try {
      const result = await marketingCopywriter.generateIllusionDismantlingScript({
        illusionName
      });
      if (result) {
        setGeneratedScript(result);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
        <div className="text-rose-500/50 text-[10px] font-black animate-pulse font-mono tracking-[0.3em] uppercase">
          Scanning Frequencies...
        </div>
      </div>
    );
  }

  const safeScenarios = scenarios && scenarios.length > 0 ? scenarios : [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-rose-500/5 rounded-3xl border border-rose-500/10 mb-8 max-w-2xl flex-row-reverse text-right">
          <div className="p-2 bg-rose-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-xs text-rose-200/60 leading-relaxed font-bold italic">
            استخدم التشوهات المتصدرة دي فوراً كمحتوى لتفكيك الوهم بالعلم. ده اللي الناس بتعاني منه حرفياً دلوقتي!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {safeScenarios.length > 0 ? (
            safeScenarios.map((scenario, idx) => {
              const scenarioPercent = scenario.percent ?? scenario.percentage ?? scenario.share ?? 0;
              const scenarioKey = scenario.key ?? scenario.label;
              const isHighPriority = scenarioPercent > 30;
              const isMediumPriority = scenarioPercent > 15 && scenarioPercent <= 30;

              const baseColor = isHighPriority
                ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                : isMediumPriority
                ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                : "bg-white/2 border-white/5 text-slate-400";

              const iconColor = isHighPriority ? "text-rose-400" : isMediumPriority ? "text-amber-400" : "text-slate-500";

              return (
                <motion.div
                  key={scenarioKey}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex flex-col gap-4 p-5 rounded-[28px] border backdrop-blur-md relative overflow-hidden group transition-all hover:scale-[1.02] hover:bg-white/5 ${baseColor}`}
                >
                  {isHighPriority && (
                    <motion.div
                      animate={{ opacity: [0.1, 0.2, 0.1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent"
                    />
                  )}

                  <div className="flex items-center justify-between z-10 relative flex-row-reverse text-right">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-50 flex-row-reverse">
                      <TrendingUp className={`w-3 h-3 ${iconColor}`} />
                      Illusion Node
                    </span>
                    <div className="flex flex-col items-start">
                      <span className="font-mono text-xl font-black drop-shadow-lg">{Math.round(scenarioPercent)}%</span>
                      <span className="text-[8px] uppercase tracking-widest opacity-40">Frequency</span>
                    </div>
                  </div>

                  <div className="z-10 relative space-y-4 text-right">
                    <div>
                      <h4 className="text-lg font-black leading-tight text-white group-hover:text-rose-500 transition-colors">
                        {scenario.label}
                      </h4>
                      <p className="text-[10px] font-bold opacity-40 mt-1 flex items-center gap-1 flex-row-reverse">
                         <span className="w-1 h-1 rounded-full bg-current" />
                         {scenario.count} Souls Affected
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismantle(scenario.label)}
                      disabled={isGenerating}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest group/btn"
                    >
                      {isGenerating && selectedIllusion === scenario.label ? (
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full border border-t-transparent border-white animate-spin" />
                           <span>Dismantling...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-cyan-400 group-hover/btn:rotate-12 transition-transform" />
                          <span>تفكيك الوهم</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-[40px] bg-white/2">
              <Sparkles className="w-8 h-8 text-slate-800 mx-auto mb-4" />
              <span className="text-slate-600 text-xs font-black uppercase tracking-widest italic">The Sea of Consciousness is Pure...</span>
            </div>
          )}
        </div>
      </div>

      <TikTokTeleprompterModal
        isOpen={!!generatedScript || (isGenerating && !!selectedIllusion)}
        onClose={() => { setGeneratedScript(null); setSelectedIllusion(null); }}
        isGenerating={isGenerating}
        scriptData={generatedScript}
        illusionName={selectedIllusion || ""}
      />
    </>
  );
};
