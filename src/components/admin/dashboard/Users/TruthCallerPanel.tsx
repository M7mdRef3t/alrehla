import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  User, 
  Clock, 
  ShieldAlert, 
  Send, 
  X, 
  RefreshCw, 
  Search,
  CheckCircle,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { 
  fetchPendingInterventions, 
  updateInterventionStatus, 
  triggerManualAnalysis,
  executeIntervention
} from "@/services/admin/adminInterventions";
import type { InterventionEntry } from "@/services/admin/adminTypes";
import { useToastState } from "@/modules/map/store/toast.store";

export const TruthCallerPanel: FC = () => {
  const [interventions, setInterventions] = useState<InterventionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await fetchPendingInterventions();
    setInterventions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const { showToast } = useToastState();

  const handleAction = async (id: string, status: 'sent' | 'dismissed') => {
    setProcessingId(id);
    
    if (status === 'sent') {
      const intervention = interventions.find(i => i.id === id);
      if (intervention) {
        const result = await executeIntervention(intervention);
        if (result.success) {
          showToast("تم إرسال النداء بنجاح عبر (واتساب، تليجرام، وإشعارات) ✨", "success");
          setInterventions(prev => prev.map(i => i.id === id ? { ...i, status: 'sent' } : i));
        } else {
          showToast(result.error || "فشل في إرسال النداء", "error");
        }
      }
    } else {
      const success = await updateInterventionStatus(id, status);
      if (success) {
        showToast("تم تجاهل النداء", "info");
        setInterventions(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      }
    }
    
    setProcessingId(null);
  };

  const filteredInterventions = interventions.filter(i => 
    i.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.triggerReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = interventions.filter(i => i.status === 'unread').length;

  return (
    <div className="space-y-6 text-slate-200" dir="rtl">
      {/* Header Section */}
      <header className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">نداء الحق (Truth Caller)</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">محرك التدخل الاستباقي للرنين الروحي</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black text-white">{pendingCount} تدخلات معلقة</span>
             </div>
             <button 
               onClick={loadData}
               disabled={loading}
               className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
             >
               <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
         <div className="relative w-full md:w-1/2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="البحث في التدخلات، المسافرين، أو الأسباب..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-xs focus:border-indigo-500/50 outline-none transition-all"
            />
         </div>
         <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">فرز حسب: الأحدث</span>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex gap-1">
               {['all', 'unread', 'sent'].map(f => (
                 <button key={f} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all text-slate-400 hover:text-white">
                   {f === 'all' ? 'الكل' : f === 'unread' ? 'معلق' : 'تم الإرسال'}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Interventions List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredInterventions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]"
            >
               <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500/50" />
               </div>
               <p className="text-sm font-bold text-slate-500">لا توجد نداءات معلقة حالياً. المدار مستقر.</p>
            </motion.div>
          ) : (
            filteredInterventions.map((intervention, idx) => (
              <motion.div
                key={intervention.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 p-6 rounded-[2rem] border transition-all duration-500 ${
                  intervention.status === 'unread' 
                    ? 'bg-indigo-500/[0.03] border-indigo-500/20 hover:border-indigo-500/40' 
                    : 'bg-slate-900/40 border-white/5 opacity-60'
                }`}
              >
                {/* Meta Column */}
                <div className="flex flex-col items-center justify-center border-l border-white/5 pl-6 min-w-[100px]">
                   <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-3">
                      <User className="w-6 h-6 text-slate-400" />
                   </div>
                   <div className="text-center">
                      <p className="text-xs font-black text-white truncate max-w-[120px]">{intervention.userName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">{intervention.userEmail}</p>
                   </div>
                </div>

                {/* Content Column */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        intervention.triggerReason.includes('streak') || intervention.triggerReason.includes('crisis') 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {intervention.triggerReason.replace(/_/g, ' ')}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(intervention.createdAt).toLocaleString('ar-EG')}
                      </div>
                   </div>

                   <div className="relative">
                      <div className="absolute -right-4 top-0 bottom-0 w-1 bg-indigo-500/20 rounded-full" />
                      <p className="text-lg font-bold text-slate-100 leading-relaxed font-tajawal pr-2">
                        {intervention.aiMessage}
                      </p>
                   </div>

                   {intervention.metadata?.suggestedActions && (
                     <div className="flex flex-wrap gap-2">
                        {intervention.metadata.suggestedActions.map((action: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-400">
                             <BrainCircuit className="w-3 h-3 text-indigo-400" />
                             {action.label}
                             <span className="text-[8px] opacity-40 px-1 bg-black/40 rounded">{action.badge}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                {/* Actions Column */}
                <div className="flex flex-col justify-center gap-3">
                  {intervention.status === 'unread' ? (
                    <>
                      <button 
                        onClick={() => handleAction(intervention.id, 'sent')}
                        disabled={processingId === intervention.id}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
                      >
                        {processingId === intervention.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        إرسال النداء
                      </button>
                      <button 
                        onClick={() => handleAction(intervention.id, 'dismissed')}
                        disabled={processingId === intervention.id}
                        className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        {processingId === intervention.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        تجاهل
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">تمت المعالجة</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Stats */}
      <footer className="pt-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5 gap-4">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">معدل الاستجابة</span>
               <span className="text-xl font-black text-indigo-400">74%</span>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">توفير الأرواح</span>
               <span className="text-xl font-black text-rose-400">12</span>
            </div>
         </div>
         <div className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.3em]">
            SENTINEL_ALPHA :: TRUTH_CALLER_PROTOCOL_V4.2
         </div>
      </footer>
    </div>
  );
};
