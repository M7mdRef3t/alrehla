import React, { useMemo } from "react";
import { Radar, AlertTriangle, ArrowLeftRight, Activity, Users } from "lucide-react";
import { useTruthTestState } from "@/services/truthTest.store";
import type { TruthTestType } from "@/services/truthTestEngine";

export interface ConnectionRadarProps {
  onForwardToLab: (title: string, hypothesis: string) => void;
}

const TYPE_LABELS: Record<TruthTestType, string> = {
  connection_feeling: "إحساس بالاتصال",
  pre_feeling: "إحساس مسبق (توقع تواصل)",
  intent_reading: "قراءة نية"
};

export const ConnectionRadar: React.FC<ConnectionRadarProps> = ({ onForwardToLab }) => {
  const tests = useTruthTestState((s) => s.tests);

  // Filter and group anomalies
  const anomalies = useMemo(() => {
    const failedTests = tests.filter(t => t.outcome === "denied" || t.outcome === "coincidence");
    
    // Group by personId or "unknown" + type
    const groups: Record<string, {
      id: string;
      personName: string;
      type: TruthTestType;
      count: number;
      lastDate: number;
    }> = {};

    failedTests.forEach(t => {
      const pName = t.personName || "شخص غير محدد";
      const key = `${pName}_${t.type}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          personName: pName,
          type: t.type,
          count: 0,
          lastDate: 0
        };
      }
      
      groups[key].count += 1;
      if (t.outcomeTimestamp && t.outcomeTimestamp > groups[key].lastDate) {
        groups[key].lastDate = t.outcomeTimestamp;
      }
    });

    // Only return groups with >= 2 failures to reduce noise, sorted by count descending
    return Object.values(groups)
      .filter(g => g.count >= 2)
      .sort((a, b) => b.count - a.count);

  }, [tests]);

  if (anomalies.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Radar className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-400">الرادار هادئ</h3>
          <p className="text-[10px] text-slate-400 mt-1">لا توجد تناقضات متكررة بين الإحساس والواقع حالياً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-rose-500/20 p-5 rounded-3xl space-y-4">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center relative">
          <Radar className="w-5 h-5 text-rose-400" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            رصد التناقضات (Connection Radar)
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
              {anomalies.length} إشارات
            </span>
          </h3>
          <p className="text-[10px] text-rose-300/70 mt-1 uppercase tracking-widest">
            تناقض متكرر بين الإحساس الداخلي والأفعال في الواقع
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {anomalies.map((anomaly) => (
          <div key={anomaly.id} className="bg-black/30 border border-rose-500/10 p-4 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">{anomaly.personName}</span>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {anomaly.count} إخفاقات متتالية
              </span>
            </div>

            <p className="text-sm text-rose-200/80 mb-4 font-medium flex items-center gap-2 relative z-10">
              <Activity className="w-4 h-4 text-rose-400/50" />
              النوع: {TYPE_LABELS[anomaly.type]}
            </p>

            <button
              onClick={() => {
                const title = `وهم ${TYPE_LABELS[anomaly.type]} مع [${anomaly.personName}]`;
                const hypothesis = `تشير بيانات الرادار إلى ${anomaly.count} إخفاقات متتالية في "${TYPE_LABELS[anomaly.type]}"، مما يرجح أن الإحساس بالاتصال كان إسقاطاً عاطفياً وليس تواصلاً حقيقياً.`;
                onForwardToLab(title, hypothesis);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-2 relative z-10"
            >
              <ArrowLeftRight className="w-4 h-4" />
              إحالة للمختبر (دراسة الظاهرة)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
