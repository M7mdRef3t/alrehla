import React, { type FC, useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Zap as Sparkles, HelpCircle, Minus } from "lucide-react";
import { motion } from "framer-motion";
import type { TopScenario } from "@/services/admin/adminTypes";
import { TikTokTeleprompterModal } from "./TikTokTeleprompterModal";
import { IllusionProfileModal } from "./IllusionProfileModal";
import { sendBroadcast, createBroadcast } from "@/services/admin/adminBroadcasts";
import type { BroadcastAudience } from "@/utils/broadcastAudience";
import { useToastState } from "@/modules/map/store/toast.store";
import { createCurrentUrl, pushUrl } from "@/services/navigation";

interface IllusionRadarProps {
  scenarios: TopScenario[] | null;
  isLoading: boolean;
}

const SCENARIO_HINTS: Record<string, string> = {
  "طوارئ": "حالات حرجة جداً، وجع عالي وضرر نفسي واضح بيحتاج تدخل فوري.",
  "سجين ذهني": "المستخدم حاسس إنه محبوس في العلاقة، وجع كتير بس مش عارف ياخد خطوة أو يتواصل.",
  "استنزاف نشط": "خناقات وتفاعل كتير بس كلها سلبية وبتسحب طاقة المستخدم الأرض.",
  "علاقة مشروطة": "علاقة ماشية بس على 'قشر بيض'، فيها شروط وتهديد دائم للأمان.",
  "ميناء آمن": "علاقة صحية، وجع قليل وأمان عالي، دي اللي بنطمح ليها.",
  "علاقة منقطعة": "علاقة انتهت فعلياً ومفيش فيها أي تواصل، مجرد ذكرى بتشغل حيز من الوعي."
};

export const IllusionRadar: FC<IllusionRadarProps> = ({ scenarios, isLoading }) => {
  const [selectedIllusion, setSelectedIllusion] = useState<string | null>(null);
  const [selectedPercent, setSelectedPercent] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  
  const { showToast } = useToastState();
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleOpenStudio = (illusionName: string, percent: number, count: number) => {
    setSelectedIllusion(illusionName);
    setSelectedPercent(percent);
    setSelectedCount(count);
    setIsStudioOpen(true);
  };

  const handleCloseStudio = () => {
    setIsStudioOpen(false);
    setSelectedIllusion(null);
  };

  const handleOpenProfile = (illusionName: string, percent: number, count: number) => {
    setSelectedIllusion(illusionName);
    setSelectedPercent(percent);
    setSelectedCount(count);
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setSelectedIllusion(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
        <div className="text-rose-500/50 text-[10px] font-black animate-pulse font-mono tracking-[0.3em] uppercase">
          جارٍ مسح الترددات...
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" dir="rtl">
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
                  dir="rtl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleOpenProfile(scenario.label, scenarioPercent, scenario.count)}
                  className={`flex flex-col gap-4 p-5 rounded-[28px] border backdrop-blur-md relative group transition-all hover:scale-[1.02] hover:bg-white/5 hover:z-50 cursor-pointer ${baseColor}`}
                >
                  {isHighPriority && (
                    <motion.div
                      animate={{ opacity: [0.1, 0.2, 0.1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-rose-500/10 via-transparent to-transparent"
                    />
                  )}

                  <div className="flex items-center justify-between z-10 relative">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-50">
                      <TrendingUp className={`w-3 h-3 ${iconColor}`} />
                      نقطة وهم
                    </span>
                    <div className="flex flex-col items-start text-right" dir="rtl">
                      <span className="font-mono text-xl font-black drop-shadow-lg">{Math.round(scenarioPercent)}%</span>
                      <span className="text-[8px] uppercase tracking-widest opacity-40">تردد الظهور</span>
                    </div>
                  </div>

                  {/* Trend Badge */}
                  {scenario.trend && (
                    <div className={`z-10 relative flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black w-fit ${
                      scenario.trend === "rising"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        : scenario.trend === "declining"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-700/40 text-slate-500 border border-slate-700/30"
                    }`}>
                      {scenario.trend === "rising" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : scenario.trend === "declining" ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>
                        {scenario.trend === "rising" ? "آخذ في الارتفاع" : scenario.trend === "declining" ? "في تراجع" : "مستقر"}
                        {scenario.trendDeltaPct != null && ` (${scenario.trendDeltaPct > 0 ? "+" : ""}${scenario.trendDeltaPct}%)`}
                      </span>
                    </div>
                  )}

                  <div className="z-10 relative space-y-4">
                      <div className="flex items-center gap-2 justify-start mb-1">
                        <h4 className="text-lg font-black leading-tight text-white group-hover:text-rose-500 transition-colors">
                          {scenario.label}
                        </h4>
                        {SCENARIO_HINTS[scenario.label] && (
                          <div className="group/hint relative">
                            <HelpCircle className="w-3 h-3 text-white/20 hover:text-white/60 transition-colors cursor-help" />
                            <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-[180px] p-2 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover/hint:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-relaxed shadow-2xl">
                              {SCENARIO_HINTS[scenario.label]}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold opacity-40 mt-1 flex items-center gap-1 justify-start" dir="rtl">
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {scenario.count} نفس متأثرة
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStudio(scenario.label, scenarioPercent, scenario.count);
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest group/btn relative z-10 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400 group-hover/btn:rotate-12 transition-transform" />
                      <span>تفكيك الوهم</span>
                    </button>

                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-[40px] bg-white/2">
              <Sparkles className="w-8 h-8 text-slate-800 mx-auto mb-4" />
              <span className="text-slate-600 text-xs font-black uppercase tracking-widest italic">بحر الوعي صافي.. مفيش أوهام مرصودة حالياً</span>
            </div>
          )}
        </div>
      </div>

      <TikTokTeleprompterModal
        isOpen={isStudioOpen}
        onClose={handleCloseStudio}
        illusionName={selectedIllusion || ""}
        illusionDescription={selectedIllusion ? (SCENARIO_HINTS[selectedIllusion] || "") : ""}
        illusionPercent={selectedPercent}
        illusionCount={selectedCount}
      />

      <IllusionProfileModal
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
        illusionName={selectedIllusion || ""}
        illusionPercent={selectedPercent}
        illusionCount={selectedCount}
        onPulseBroadcast={async (name) => {
          try {
            const broadcast = await createBroadcast({
              title: `نبض موجه: ${name}`,
              body: `تذكر أنك لست وحدك، الوهم المسمى بـ "${name}" هو مجرد سحابة عابرة.`,
              audience: { type: "illusion", value: name } as unknown as BroadcastAudience,
            });
            if (broadcast?.id) {
              await sendBroadcast(broadcast.id);
            }
            showToast(`تم إرسال النبض لمتأثري ${name}`, "success");
          } catch (error) {
            showToast(`حدث خطأ أثناء إرسال النبض`, "error");
          }
        }}
        onShowAffectedUsers={(name) => {
          showToast(`جاري عرض المتأثرين بوهم: ${name}`, "info");
          const url = createCurrentUrl();
          if (url) {
            url.searchParams.set("tab", "people-hub");
            url.searchParams.set("filter", name);
            pushUrl(url);
          }
        }}
      />
    </>
  );
};

