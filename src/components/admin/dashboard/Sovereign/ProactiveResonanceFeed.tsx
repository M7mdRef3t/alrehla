import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Activity, Eye, ShieldCheck, Brain, ArrowRight } from "lucide-react";
import { CollapsibleSection } from "../../ui/CollapsibleSection";

interface ResonanceInsight {
  id: string;
  type: "emotional" | "analytical" | "actionable";
  title: string;
  narrative: string;
  timestamp: number;
  urgency: "low" | "medium" | "high";
}

const MOCK_INSIGHTS: ResonanceInsight[] = [
  {
    id: "r1",
    type: "emotional",
    title: "انخفاض في مستوى التناغم الجماعي",
    narrative: "في الساعات الأخيرة، لوحظ ارتفاع في مستويات القلق بين المسافرين الجدد في منطقة 'الوعي الذاتي'. ربما يشعرون بضغط التجربة العميقة. قد يكون من الجيد بث رسالة طمأنينة خفيفة عبر الرادار.",
    timestamp: Date.now() - 1000 * 60 * 15,
    urgency: "medium",
  },
  {
    id: "r2",
    type: "analytical",
    title: "نمط استكشاف غير مألوف",
    narrative: "مسار التحويل يشهد تدفقاً غير اعتيادي باتجاه 'مصفوفة الأحلام'. يبدو أن هناك وعيًا متزايدًا بالرغبة في استكشاف الذات. هذا مؤشر جيد للتوسع في هذه الوحدة.",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    urgency: "low",
  },
  {
    id: "r3",
    type: "actionable",
    title: "تدخل استباقي مقترح",
    narrative: "هناك مجموعة من 12 مسافراً عالقين في مرحلة 'التشخيص' لأكثر من يومين. النظام يقترح إرسال إشارة استباقية (Sovereign Echo) لتوجيههم بلطف للمرحلة التالية دون ضغط.",
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    urgency: "high",
  }
];

export const ProactiveResonanceFeed: FC = () => {
  const [insights, setInsights] = useState<ResonanceInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading AI insights
    const timer = setTimeout(() => {
      setInsights(MOCK_INSIGHTS);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CollapsibleSection
      title="النبض الاستباقي (Proactive Resonance)"
      subtitle="سرد عاطفي وتحليلي موجه للقيادة السيادية"
      icon={<Activity className="w-4 h-4 text-emerald-500" />}
      defaultExpanded={true}
    >
      <div className="mt-6 space-y-4 relative">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <div className="w-12 h-12 rounded-full border-b-2 border-emerald-500 animate-spin" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
                Analyzing collective consciousness...
              </p>
            </motion.div>
          ) : (
            insights.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-3xl border bg-slate-900/40 relative overflow-hidden group hover:bg-slate-900/60 transition-all ${
                  insight.urgency === 'high' ? 'border-rose-500/30' :
                  insight.urgency === 'medium' ? 'border-amber-500/30' :
                  'border-emerald-500/30'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -z-10 ${
                  insight.urgency === 'high' ? 'bg-rose-500/20' :
                  insight.urgency === 'medium' ? 'bg-amber-500/20' :
                  'bg-emerald-500/20'
                }`} />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end gap-2 mb-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        insight.type === 'emotional' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        insight.type === 'analytical' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {insight.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{insight.title}</h3>
                    <p className="text-sm font-bold text-slate-300 leading-relaxed">
                      {insight.narrative}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl border shrink-0 ${
                    insight.urgency === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                    insight.urgency === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    {insight.type === 'emotional' ? <Sparkles className="w-6 h-6" /> :
                     insight.type === 'analytical' ? <Brain className="w-6 h-6" /> :
                     <ShieldCheck className="w-6 h-6" />}
                  </div>
                </div>

                {insight.urgency === 'high' && (
                  <div className="mt-6 flex justify-end">
                    <button className="flex items-center gap-2 px-6 py-3 bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all group/btn">
                      <span>تنفيذ التدخل المقترح</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </CollapsibleSection>
  );
};
