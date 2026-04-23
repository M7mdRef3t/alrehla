import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Filter, Calendar, Zap, 
  ChevronLeft, X, Search, Zap as Sparkles,
  Layers, Clock, ArrowRight
} from "lucide-react";
import { nexusService } from "@/services/nexusService";

interface Insight {
  id: number;
  content: string;
  category: string;
  energy_level: number;
  exercise_code: string;
  created_at: string;
}

export const InsightsVaultScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      const data = await nexusService.getMyInsights();
      setInsights(data);
      setLoading(false);
    };
    fetchInsights();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(insights.map(i => i.category));
    return ["all", ...Array.from(cats)];
  }, [insights]);

  const filteredInsights = useMemo(() => {
    if (filter === "all") return insights;
    return insights.filter(i => i.category === filter);
  }, [insights, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[60] flex flex-col pt-16 md:pt-0"
      style={{ background: "linear-gradient(135deg, #080c1a 0%, #0c1225 100%)" }}
    >
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">خزنة البصائر</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Insights Vault — التاريخ السيادي</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
              filter === cat 
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" 
                : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat === "all" ? "الكل" : cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-bold">جاري فتح الخزنة...</p>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
            <BookOpen className="w-12 h-12 text-slate-700" />
            <p className="text-sm text-slate-500 font-bold">الخزنة فارغة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsights.map((insight, idx) => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onClick={() => setSelectedInsight(insight)}
                delay={idx * 0.05}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <InsightDetailModal 
            insight={selectedInsight} 
            onClose={() => setSelectedInsight(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const InsightCard: React.FC<{ insight: Insight; onClick: () => void; delay: number }> = ({ insight, onClick, delay }) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="text-right p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] text-slate-500 font-bold">
            {new Date(insight.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
          </span>
        </div>
        <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-[9px] font-black text-indigo-400 uppercase">{insight.category}</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-300 leading-relaxed font-medium line-clamp-3">
        {insight.content}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-slate-500 font-bold">طاقة {insight.energy_level}/10</span>
        </div>
        <div className="flex items-center gap-1 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black">قراءة المزيد</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </motion.button>
  );
};

const InsightDetailModal: React.FC<{ insight: Insight; onClose: () => void }> = ({ insight, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0c1225] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-indigo-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{insight.category}</p>
              <h3 className="text-white font-black">بصيرة مكتشفة</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold">{new Date(insight.created_at).toLocaleString("ar-EG")}</span>
            </div>
            <p className="text-lg text-white leading-relaxed font-medium first-letter:text-3xl first-letter:font-black" dir="rtl">
              {insight.content}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">مستوى الطاقة</p>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-black text-white">{insight.energy_level}/10</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">كود الممارسة</p>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-black text-white">{insight.exercise_code || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-black/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-600/20"
          >
            إغلاق الخزنة
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
