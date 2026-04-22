"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, AlertCircle, Loader2, BookMarked } from "lucide-react";
import { Insight, insightService } from "@/services/insightService";
import { InsightModal } from "@/components/insights/InsightModal";

export default function HistoryPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  useEffect(() => {
    async function loadInsights() {
      try {
        setLoading(true);
        const data = await insightService.getInsights();
        setInsights(data);
      } catch (err: any) {
        setError(err.message || "فشل في جلب البصائر. تأكد من تسجيل الدخول.");
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  const categories = ["all", ...Array.from(new Set(insights.map(i => i.category)))];

  const filteredInsights = filter === "all" 
    ? insights 
    : insights.filter(i => i.category === filter);

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      all: "الكل",
      relationships: "علاقات",
      general: "عام",
      work: "عمل",
      self: "ذات",
    };
    return map[cat] || cat;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4 selection:bg-indigo-500/30">
      {/* Abstract Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white mb-4">
            خزنة البصائر
          </h1>
          <p className="text-slate-400 max-w-lg">
            هنا تُحفظ كل إشاراتك، دروسك، والمعاني التي التقطتها في الرحلة. 
            محمية بأمان ومشفرة لك وحدك.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                filter === cat 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105" 
                  : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 border border-white/5"
              }`}
            >
              {cat === 'all' && <BookMarked className="w-4 h-4" />}
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400">جاري فتح الخزنة...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300">{error}</p>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-white/5 rounded-3xl">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">الخزنة فارغة</h3>
            <p className="text-slate-500 text-sm">لم تسجل أي بصائر في هذا التصنيف بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsights.map(insight => (
              <button
                key={insight.id}
                onClick={() => setSelectedInsight(insight)}
                className="group text-right bg-slate-900/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 p-5 rounded-2xl transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                    {getCategoryLabel(insight.category)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(insight.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4 group-hover:text-white transition-colors">
                  {insight.content}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                      style={{ width: `${(insight.energy_level / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {insight.energy_level}/10
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <InsightModal 
        insight={selectedInsight} 
        onClose={() => setSelectedInsight(null)} 
      />
    </div>
  );
}
