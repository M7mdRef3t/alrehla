"use client";
import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dna, 
  Zap, 
  Scan, 
  CheckCircle2, 
  XCircle, 
  History, 
  Box, 
  TrendingUp, 
  AlertTriangle,
  Flame
} from "lucide-react";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getAuthToken } from "@/domains/auth/store/auth.store";

/**
 * EvolutionarySynapse — مشتبك التطور الجيني 🧬🌀
 * ===========================================
 * اللوحة الحاكمة للطفرات البرمجية التي يولدها الوكيل السيادي.
 */

interface Mutation {
    id: string;
    component_id: string;
    variant_name: string;
    variant_path: string;
    hypothesis: string;
    is_active: boolean;
    resonance_score_delta: number;
    friction_events_count: number;
    created_at: string;
}

export const EvolutionarySynapse: FC = () => {
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  
  const authToken = getAuthToken();
  const bearer = authToken ?? "";

  const fetchMutations = async () => {
    try {
      const res = await fetch("/api/admin/sovereign/mutations", {
        headers: { "Authorization": `Bearer ${bearer}` }
      });
      const json = await res.json();
      if (json.ok) setMutations(json.data);
    } catch (e) {
      console.error("Failed to fetch genome mutations", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMutations();
  }, [bearer]);

  const toggleMutation = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/sovereign/mutations", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${bearer}` 
        },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      if (res.ok) fetchMutations();
    } catch (e) {
      console.error("Failed to update mutation status", e);
    }
  };

  const triggerEvolutionScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/admin/sovereign/evolve", {
        method: "POST",
        headers: { "Authorization": `Bearer ${bearer}` }
      });
      if (res.ok) fetchMutations();
    } catch (e) {
      console.error("Evolution scan failed", e);
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black text-indigo-500 animate-pulse uppercase tracking-[0.5em]">Mapping Neural Genome...</div>;

  return (
    <div className="space-y-8 p-4">
      {/* Genome Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0B0F19]/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
               <Dna className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">الجينوم التطوري للـ DNA</h2>
               <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Autonomous Code Evolution Registry</p>
            </div>
         </div>

         <div className="flex gap-4">
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Mutant Variants</p>
               <p className="text-xl font-black text-indigo-400">{mutations.filter(m => m.is_active).length}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/5 self-center" />
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Genome Proposals</p>
               <p className="text-xl font-black text-white">{mutations.length}</p>
            </div>
            <button 
              onClick={triggerEvolutionScan}
              disabled={isScanning}
              className={`px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
            >
               <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
               {isScanning ? "Scanning Neural Patterns..." : "تحفيز قفزة تطورية"}
            </button>
         </div>
      </div>

      {/* Mutations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {mutations.length === 0 && (
           <div className="lg:col-span-2 py-32 text-center bg-slate-900/10 border border-dashed border-white/5 rounded-[3rem] space-y-4">
              <History className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No mutation hypotheses generated yet.</p>
           </div>
         )}
         
         <AnimatePresence>
            {mutations.map((mutation, idx) => (
               <motion.div 
                 key={mutation.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className={`group p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${
                   mutation.is_active ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#0B0F19]/60 border-white/5 hover:border-white/10'
                 }`}
               >
                  {mutation.is_active && (
                    <div className="absolute top-0 right-0 p-4">
                       <Flame className="w-6 h-6 text-indigo-400 animate-pulse fill-indigo-400/20" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-6">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Box className="w-4 h-4 text-indigo-400" />
                           <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">{mutation.component_id}</span>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">{mutation.variant_name}</h3>
                     </div>
                     <MutationToggle 
                       active={mutation.is_active} 
                       onClick={() => toggleMutation(mutation.id, mutation.is_active)} 
                     />
                  </div>

                  <div className="space-y-4">
                     <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 min-h-[80px]">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1">
                           <Zap className="w-3 h-3" /> فرضية التطور (Evolution Hypothesis)
                        </p>
                        <p className="text-xs text-slate-300 font-bold leading-relaxed">{mutation.hypothesis}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact</span>
                           <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span className="text-xs font-mono font-black text-emerald-400">+{Math.floor(mutation.resonance_score_delta * 100)}%</span>
                           </div>
                        </div>
                        <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Friction</span>
                           <span className="text-xs font-mono font-black text-white">{mutation.friction_events_count}pts</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex items-center gap-1.5">
                        <History className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Captured {new Date(mutation.created_at).toLocaleDateString()}</span>
                     </div>
                     <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${mutation.is_active ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {mutation.is_active ? "Injected into Collective Mind" : "Quarantined / Dormant"}
                     </span>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>

      {/* Evolution Ethics Warning */}
      <footer className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] flex items-center gap-4">
         <div className="p-2 bg-indigo-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-indigo-400" />
         </div>
         <p className="text-[10px] text-indigo-300/80 font-bold leading-relaxed uppercase tracking-wide italic">
             "كل طفرة تختار تفعيلها هي "جين" جديد في جسم المنصة. التصديق على الطفرات غير المدروسة قد يؤدي إلى تحلل تماسك المسارات." — System Governance Rule.
         </p>
      </footer>
    </div>
  );
};

const MutationToggle: FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-14 h-7 rounded-full transition-all relative shrink-0 overflow-hidden ${
      active ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-800 border border-white/10'
    }`}
  >
    <motion.div 
      animate={{ x: active ? 28 : 4 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`w-5 h-5 rounded-full absolute top-1 flex items-center justify-center ${
        active ? 'bg-white text-indigo-500' : 'bg-slate-600 text-slate-900'
      }`}
    >
       {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    </motion.div>
  </button>
);
