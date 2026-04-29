import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, ChevronLeft, User, AlertCircle } from "lucide-react";
import { fetchPendingInterventions } from "@/services/admin/adminInterventions";
import type { InterventionEntry } from "@/services/admin/adminTypes";

export const TruthCallerMiniFeed: FC = () => {
  const [interventions, setInterventions] = useState<InterventionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchPendingInterventions(5);
      setInterventions(data.filter(i => i.status === 'unread'));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;
  if (interventions.length === 0) return null;

  return (
    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] p-6 mb-8 overflow-hidden relative" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">تنبيهات نداء الحق</h3>
        </div>
        <span className="text-[10px] font-black text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
          {interventions.length} تدخلات عاجلة
        </span>
      </div>

      <div className="space-y-3">
        {interventions.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500" />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{item.userName}</span>
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[300px]">{item.triggerReason.replace(/_/g, ' ')}</p>
               </div>
            </div>
            
            <button className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
               <Send className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
