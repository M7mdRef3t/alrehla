import React, { useEffect, useState } from "react";
import { Brain, Star, CheckCircle, AlertTriangle, Play, RefreshCw, Layers, Zap } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";

interface OracleStats {
  total: number;
  analyzed: number;
  pending: number;
  funnel: {
    visitors24h: number;
    leads24h: number;
    conversionRate: number;
  }
}

interface OracleLead {
  id: string;
  name: string;
  email: string;
  metadata: any;
  last_ai_analysis_at: string;
}

function getBearerToken(): string {
  return getAuthToken() ?? "";
}

export function OracleLeadsAnalysis({ onOpenWhatsapp }: { 
  onOpenWhatsapp: (
    leadId: string, 
    phone: string, 
    name: string, 
    oracleAdvice?: string, 
    leadGrade?: string,
    campaign?: string,
    source?: string
  ) => void 
}) {
  const [stats, setStats] = useState<OracleStats | null>(null);
  const [recentInsights, setRecentInsights] = useState<OracleLead[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchOracleData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/intelligence/oracle-leads", {
        headers: { authorization: `Bearer ${getBearerToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentInsights(data.recentInsights || []);
        setDistribution(data.distribution || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/intelligence/oracle-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ batchSize: 5 })
      });
      if (res.ok) {
        await fetchOracleData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchOracleData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Oracle Dashboard Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">وحي البيانات (Oracle Intelligence)</h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">تحليل النوايا وتصنيف الـ Meta Leads العميق</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={fetchOracleData} 
            className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={triggerAnalysis} 
            disabled={analyzing || (stats?.pending === 0)}
            className="flex items-center gap-2 px-4 py-2 border border-purple-500/30 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
            {analyzing ? "جاري التحليل..." : `تحليل دفعة جديدة`}
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-black/20 border border-white/5 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">إجمالي Leads</p>
            <p className="text-2xl font-black text-white">{stats.total}</p>
          </div>
          <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl relative overflow-hidden">
            <p className="text-[10px] text-purple-400/80 uppercase tracking-widest font-black mb-1">تم تحليلهم (AI)</p>
            <p className="text-2xl font-black text-purple-400">{stats.analyzed}</p>
            <div className="absolute right-2 bottom-2 opacity-5"><Brain className="w-12 h-12" /></div>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <p className="text-[10px] text-amber-400/80 uppercase tracking-widest font-black mb-1">في انتظار التحليل</p>
            <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black mb-1">Conversion (24h)</p>
            <p className="text-2xl font-black text-emerald-400">{stats.funnel.conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Recent Insights List */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">أحدث التحليلات الإستراتيجية</h4>
        </div>
        <div className="divide-y divide-white/5">
          {recentInsights.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-bold">لا يوجد تحليلات بعد. اضغط على 'تحليل دفعة جديدة' للبدء.</div>
          ) : (
            recentInsights.map((lead) => {
              const grade = lead.metadata?.oracle_grade || "N/A";
              const intent = lead.metadata?.oracle_intent || "غير معروف";
              const reasoning = lead.metadata?.oracle_reasoning || "لا يوجد تفاصيل تفكير مسجلة.";
              const phone = lead.metadata?.phone || lead.metadata?.fb_phone || "";
              
              const gradeColor = 
                grade === "A" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                grade === "B" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                grade === "C" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                "text-slate-400 bg-slate-500/10 border-slate-500/20";
              
              return (
                <div key={lead.id} className="p-5 hover:bg-white/[0.02] transition-colors relative group">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest border ${gradeColor}`}>
                          GRADE {grade}
                        </span>
                        <h5 className="text-sm font-bold text-white">{lead.name || "مجهول الهوية"}</h5>
                        <span className="text-[10px] text-slate-500">{lead.email}</span>
                      </div>
                      
                      <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                        <p className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-2">
                          <Star className="w-3 h-3" /> النية المكتشفة: {intent}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          {reasoning}
                        </p>
                      </div>
                      
                      {lead.metadata?.oracle_recommended_action && (
                        <div className="mt-2 text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" /> التوصية: {lead.metadata.oracle_recommended_action}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => onOpenWhatsapp(
                          lead.id, 
                          phone, 
                          lead.name, 
                          reasoning, 
                          grade,
                          lead.metadata?.campaign,
                          lead.metadata?.source
                        )}
                        className="px-4 py-2 border border-slate-700 hover:border-emerald-500/50 bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        عرض رسائل WhatsApp
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
