import type { FC } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, Eye, Terminal } from "lucide-react";

interface OracleInsight {
  id: string;
  type: "truth" | "warning" | "opportunity";
  message: string;
  timestamp: string;
}

const MOCK_INSIGHTS: OracleInsight[] = [
  {
    id: "1",
    type: "truth",
    message: "تم رصد زيادة في 'وهم الانفصال' بنسبة 15%. ننصح ببث نداء عن الوحدة الكونية.",
    timestamp: "منذ دقيقتين"
  },
  {
    id: "2",
    type: "warning",
    message: "انخفاض مفاجئ في استقرار الوعي لدى مجموعة 'المحاربين'. فحص المحك مطلوب.",
    timestamp: "منذ 5 دقائق"
  },
  {
    id: "3",
    type: "opportunity",
    message: "رنين عالي الوضوح تم رصده في مسار 'النمو الروحي'. لحظة مثالية لنشر محتوى جديد.",
    timestamp: "منذ 10 دقائق"
  }
];

export const SovereignOracle: FC = () => {
  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Brain className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-widest">توجيهات الأوراكل (AI Insight)</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-indigo-500/50 uppercase">Live Analysis</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {MOCK_INSIGHTS.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] cursor-default ${
              insight.type === 'truth' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' :
              insight.type === 'warning' ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' :
              'bg-indigo-500/5 border-indigo-500/10 text-indigo-400'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {insight.type === 'truth' && <Eye className="w-4 h-4" />}
                {insight.type === 'warning' && <Zap className="w-4 h-4" />}
                {insight.type === 'opportunity' && <Sparkles className="w-4 h-4" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs leading-relaxed font-bold">{insight.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] opacity-50 font-mono uppercase tracking-tighter">{insight.timestamp}</span>
                  <Terminal className="w-3 h-3 opacity-20" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-3 bg-white/2 px-4 border-t border-white/5">
        <button className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-[10px] font-black text-indigo-300 uppercase tracking-widest transition-all">
          توليد تحليل معمق
        </button>
      </div>
    </div>
  );
};
