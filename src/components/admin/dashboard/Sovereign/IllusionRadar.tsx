import { logger } from "../../../../services/logger";
import React, { type FC, useState } from "react";
import { Radar, AlertTriangle, TrendingUp, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import type { TopScenario } from "../../../../services/adminApi";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { marketingCopywriter, type TikTokScriptGeneration } from "../../../../ai/aiMarketingCopy";
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
      <CollapsibleSection
        title="رادار الأوهام الجمعي (Illusion Radar)"
        icon={<Radar className="w-4 h-4" />}
        subtitle="جاري استشعار تشوهات الوعي الحالية..."
        defaultExpanded={true}
        headerColors="border-rose-500/20 bg-rose-500/5 text-rose-400"
      >
        <div className="flex items-center justify-center h-24">
          <div className="text-rose-500/50 text-xs animate-pulse font-mono tracking-widest">
            SCANNING FREQUENCIES...
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  const safeScenarios = scenarios && scenarios.length > 0 ? scenarios : [];

  return (
    <>
      <CollapsibleSection
        title="رادار الأوهام الجمعي (Illusion Radar)"
        icon={<Radar className="w-4 h-4" />}
        subtitle="أكثر التشوهات والسيناريوهات اللي مسيطرة على عقول الزوار الآن (لصناعة المحتوى)"
        defaultExpanded={true}
        headerColors="border-rose-500/20 bg-rose-500/5 text-rose-400"
      >
        <div className="pt-2">
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <p className="text-xs text-rose-200/80 leading-relaxed">
              **توجيه الحاكم:** استخدم التشوهات المتصدرة دي فوراً كمحتوى (تيك توك/إنستجرام) لضرب الأصنام وتفكيك الوهم بالعلم. ده اللي الناس بتعاني منه حرفياً دلوقتي!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {safeScenarios.length > 0 ? (
              safeScenarios.map((scenario, idx) => {
                const scenarioPercent = scenario.percent ?? scenario.percentage ?? scenario.share ?? 0;
                const scenarioKey = scenario.key ?? scenario.label;
                const isHighPriority = scenarioPercent > 30;
                const isMediumPriority = scenarioPercent > 15 && scenarioPercent <= 30;

                const baseColor = isHighPriority
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                  : isMediumPriority
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-slate-800 border-white/10 text-slate-400";

                const iconColor = isHighPriority ? "text-rose-400" : isMediumPriority ? "text-amber-400" : "text-slate-500";

                return (
                  <motion.div
                    key={scenarioKey}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex flex-col gap-1 p-3 rounded-2xl border backdrop-blur-md relative overflow-hidden group min-w-[140px] flex-1 ${baseColor}`}
                  >
                    {isHighPriority && (
                      <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent"
                      />
                    )}

                    <div className="flex items-center justify-between z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-70">
                        <TrendingUp className={`w-3 h-3 ${iconColor}`} />
                        تريند وهمي
                      </span>
                      <span className="font-mono text-xs opacity-90">{Math.round(scenarioPercent)}%</span>
                    </div>

                    <div className="z-10 mt-1 flex justify-between items-end">
                      <div>
                        <h4 className="text-sm font-bold shadow-black drop-shadow-md">
                          {scenario.label}
                        </h4>
                        <p className="text-[10px] opacity-60 mt-0.5">
                          {scenario.count} روح متأثرة
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismantle(scenario.label)}
                        disabled={isGenerating}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all disabled:opacity-50 flex items-center gap-1 text-[10px] font-bold"
                      >
                        {isGenerating && selectedIllusion === scenario.label ? (
                          <span className="animate-pulse">⏳ جاري السحب...</span>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-cyan-300" />
                            تفكيك
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="w-full py-8 text-center border border-dashed border-white/10 rounded-2xl">
                <span className="text-slate-500 text-xs">لا يوجد تشوهات أو سيناريوهات متصدرة حالياً (وعي نقي)</span>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* TikTok Creator Studio Modal */}
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
