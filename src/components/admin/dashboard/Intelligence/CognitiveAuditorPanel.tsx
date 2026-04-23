import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { executeAgentTool } from '@/services/agentTools';
import { Brain, FileCode, Search, AlertTriangle, CheckCircle, Flame, Zap as Sparkles, Activity } from 'lucide-react';
import { AwarenessSkeleton } from '@/modules/meta/AwarenessSkeleton';
import { useToastState } from '@/modules/map/dawayirIndex';

interface FrictionPoint {
  element: string;
  reason: string;
  severity: "high" | "medium" | "low";
}

interface CognitiveAuditReport {
  score: number;
  frictionPoints: FrictionPoint[];
  accessibilityGaps: string[];
  psychologicalRefinement: string;
  actionableCodeFix: string;
}

export const CognitiveAuditorPanel: React.FC = () => {
  const [filePath, setFilePath] = useState('src/modules/meta/HeroSection.tsx');
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<CognitiveAuditReport | null>(null);
  const showToast = useToastState(s => s.showToast);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) return;

    setIsAuditing(true);
    setReport(null);
    try {
      // Execute the Sovereign Agent Tool via the Admin API
      const response = await executeAgentTool("audit_ui_cognitive", { path: filePath.trim() });
      if (response && response.score !== undefined) {
        setReport(response as CognitiveAuditReport);
        showToast("اكتمل الفحص المعرفي للواجهة", "success");
      } else {
        throw new Error("Invalid report format received.");
      }
    } catch (error: any) {
      console.error("[CognitiveAuditor] Error:", error);
      showToast(error.message || "فشل الفحص المعرفي", "error");
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <span className="px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs">High Friction</span>;
      case 'medium': return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs">Medium</span>;
      case 'low': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs">Low</span>;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans">
      <header className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex flex-col items-center justify-center border border-indigo-500/30 ring-1 ring-white/5 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] group-hover:animate-shine duration-1000" />
            <Brain className="w-7 h-7 text-indigo-400 relative z-10" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">مفتش الوعي المعرفي</h1>
          <p className="text-sm font-bold text-indigo-400/80 uppercase tracking-widest mt-1">Cognitive UX Auditor</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 border border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl h-fit sticky top-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search className="w-4 h-4" />
            مسار المكوّن (Component Path)
          </h2>
          <form onSubmit={handleAudit} className="space-y-4">
             <div className="relative">
                <FileCode className="absolute right-3 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="src/components/..."
                  className="w-full bg-[#0B0F19] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-left text-teal-300 font-mono text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all shadow-inner"
                  dir="ltr"
                />
             </div>
             <button 
                type="submit" 
                disabled={isAuditing || !filePath}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl py-3 font-black tracking-widest uppercase disabled:opacity-50 transition-all border border-indigo-400/30 flex items-center justify-center gap-2"
             >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                {isAuditing ? <Activity className="w-5 h-5 animate-pulse" /> : <Brain className="w-5 h-5" />}
                {isAuditing ? 'جاري الفحص المعرفي...' : 'بدء الفحص (Audit)'}
             </button>
          </form>
          
          <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed">
             <p className="font-bold text-slate-300 mb-2">كيف تعمل الأداة؟</p>
             تقوم هذه الأداة بقراءة كود الـ React المعطى وتحليله بالذكاء الاصطناعي بناءً على القوانين المعرفية (Fitts's Law, Hick's Law, Gestalt) لتحديد أي تشتت أو احتكاك يمنع المستخدم من اتخاذ القرار.
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 min-h-[400px]">
          <AnimatePresence mode="wait">
            {isAuditing ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center border border-white/5 bg-slate-900/30 rounded-2xl p-12"
              >
                 <AwarenessSkeleton />
              </motion.div>
            ) : report ? (
              <motion.div 
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Header */}
                <div className="flex items-center gap-6 p-6 border border-white/10 bg-slate-900/80 rounded-2xl shadow-lg">
                   <div className="relative w-24 h-24 flex items-center justify-center">
                     <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="8"
                          strokeDasharray="283"
                          initial={{ strokeDashoffset: 283 }}
                          animate={{ strokeDashoffset: 283 - (283 * report.score) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`drop-shadow-[0_0_10px_currentColor] ${getScoreColor(report.score)}`}
                        />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-3xl font-black ${getScoreColor(report.score)}`}>{report.score}</span>
                     </div>
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-white tracking-tight">التقييم المعرفي (Cognitive Score)</h3>
                     <p className="text-slate-400 text-sm mt-1">درجة انسجام الواجهة مع الوعي الإنساني وخلوها من التعقيد.</p>
                   </div>
                </div>

                {/* Friction Points */}
                <div className="p-6 border border-white/5 bg-slate-900/50 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> نقاط الاحتكاك (Friction Points)
                  </h3>
                  {report.frictionPoints.length > 0 ? (
                    <div className="grid gap-3">
                      {report.frictionPoints.map((f, i) => (
                        <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                           <div className="flex justify-between items-start">
                             <span className="font-mono text-teal-300 text-xs bg-teal-500/10 px-2 py-1 rounded inline-block" dir="ltr">{f.element}</span>
                             {getSeverityBadge(f.severity)}
                           </div>
                           <p className="text-slate-300 text-sm leading-relaxed">{f.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                       <CheckCircle className="w-4 h-4" /> الواجهة خالية من نقاط الاحتكاك المعرفي القوية.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Psychological Refinement */}
                    <div className="p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl">
                      <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4" /> اللمسة النفسية
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{report.psychologicalRefinement}</p>
                    </div>

                    {/* Accessibility */}
                    <div className="p-6 border border-white/5 bg-slate-900/50 rounded-2xl">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4" /> سهولة الوصول
                      </h3>
                      {report.accessibilityGaps.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-amber-300/80 space-y-1">
                          {report.accessibilityGaps.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                      ) : (
                        <span className="text-emerald-400/80 text-sm">ممتازة.</span>
                      )}
                    </div>
                </div>

                {/* Code Fix */}
                <div className="p-6 border border-teal-500/30 bg-teal-500/5 rounded-2xl">
                    <h3 className="text-sm font-black text-teal-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <FileCode className="w-4 h-4" /> مقترح التعديل التقني (Actionable Fix)
                    </h3>
                    <div className="bg-[#0B0F19] rounded-xl p-4 border border-white/5 overflow-x-auto">
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap text-left" dir="ltr">
                          <code>{report.actionableCodeFix}</code>
                        </pre>
                    </div>
                </div>

              </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-white/5 bg-slate-900/20 rounded-2xl p-12 text-center border-dashed">
                  <Brain className="w-12 h-12 mb-4 opacity-20" />
                  <p>أدخل مسار المكوّن (Component) واضغط على الفحص لتحليله.</p>
                </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
