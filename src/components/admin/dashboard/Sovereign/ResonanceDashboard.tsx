import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldAlert, Cpu, HeartPulse, Brain, Crosshair, ArrowUp, ArrowDown, ChevronRight, Minimize2, Users, Share2, Unlink, Zap, MessageSquare, Compass, AlertCircle } from 'lucide-react';
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";

/**
 * ResonanceDashboard — نبض الرنين السيادي 🌀
 * =========================================
 * مراقب التزامن اللحظي، حالات الانقطاع (Ghosting)، وتأيين الوعي الجمعي.
 */

function getBearerToken(): string {
  return getAuthToken() ?? "";
}

export const ResonanceDashboard: FC = () => {
  const [pulseLevel, setPulseLevel] = useState(78);
  const [isIonizing, setIsIonizing] = useState(false);
  const [signals, setSignals] = useState<{ ghosting: any[], pairings: any[], stats: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch("/api/admin/sovereign/resonance-signals", {
          headers: {
            "Authorization": `Bearer ${getBearerToken() || ""}`
          }
        });
        const json = await res.json();
        if (json.ok) {
          setSignals(json.data);
          setPulseLevel(json.data.stats.resonanceScore);
        }
      } catch (e) {
        console.error("Failed to fetch resonance signals", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // Pulse check every min
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="p-10 text-center text-teal-500 font-black animate-pulse uppercase tracking-[0.5em]">Syncing Neural Resonance...</div>;

  return (
    <div className="space-y-6 p-2">
      {/* Header Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResonanceStat 
          label="شدة الرنين" 
          value={`${pulseLevel}%`} 
          icon={<HeartPulse className="w-4 h-4 text-teal-400" />} 
          trend="+4.2%" 
          color="teal"
        />
        <ResonanceStat 
          label="الارتباط النشط" 
          value={signals?.stats?.activePairings?.toString() || "0"} 
          icon={<Share2 className="w-4 h-4 text-indigo-400" />} 
          trend="مستقر"
          color="indigo"
        />
        <ResonanceStat 
          label="تأيين الوعي" 
          value={isIonizing ? "نشط" : "خامل"} 
          icon={<Zap className="w-4 h-4 text-amber-400" />} 
          trend="T-45m"
          color="amber"
          pulse={isIonizing}
        />
        <ResonanceStat 
          label="معدل الانقطاع" 
          value={`${signals?.stats?.ghostingRate || 0}%`} 
          icon={<Unlink className="w-4 h-4 text-rose-400" />} 
          trend="-0.8%"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Resonance Waveform */}
        <div className="lg:col-span-2 bg-[#0B0F19]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">تذبذب الرنين الجمعي</h3>
                <p className="text-[10px] text-white/40 font-bold">Resonance Waveform Monitor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[10px] font-mono text-teal-500 font-bold uppercase tracking-tighter">Live Stream</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
             {/* Simulated Waveform Visualization */}
             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" 
                />
             </div>
             
             <div className="w-full h-32 flex items-end gap-1 px-4">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [
                        Math.random() * 100 + 20, 
                        Math.random() * 100 + 20, 
                        Math.random() * 100 + 20
                      ] 
                    }}
                    transition={{ 
                      duration: 2 + Math.random(), 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="flex-1 bg-gradient-to-t from-teal-500/10 to-teal-400/40 rounded-t-sm"
                  />
                ))}
             </div>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
             <div className="flex gap-4">
               <div>
                  <p className="text-[9px] uppercase text-white/40 font-bold mb-1">Peak Amplitude</p>
                  <p className="text-xs font-mono font-black text-teal-400">0.842 rad/s</p>
               </div>
               <div className="border-r border-white/10" />
               <div>
                  <p className="text-[9px] uppercase text-white/40 font-bold mb-1">Coherence Factor</p>
                  <p className="text-xs font-mono font-black text-indigo-400">0.91 Sigma</p>
               </div>
             </div>
             <button 
              onClick={() => setIsIonizing(!isIonizing)}
              className="px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-xl text-[10px] font-black uppercase text-teal-400 transition-all"
             >
                {isIonizing ? "إلغاء التأيين" : "تفعيل بروتوكول التأيين"}
             </button>
          </div>
        </div>

        {/* Sidebar Alerts / Nudges */}
        <div className="space-y-4">
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3 text-rose-400">
               <Unlink className="w-4 h-4" />
               <span className="text-xs font-black uppercase tracking-widest">تحذيرات الانقطاع (Ghosting)</span>
            </div>
            <div className="space-y-2">
              {signals?.ghosting.length === 0 && <p className="text-[10px] text-white/20 italic p-2">No active ghosts detected.</p>}
              {signals?.ghosting.map((g: any, i: number) => (
                <GhostAlert key={i} name={g.name} time={g.time} status={g.status} />
              ))}
            </div>
          </div>

          <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
             <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <Compass className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">تزامن الرفقاء (Pairing)</span>
             </div>
             <div className="space-y-4">
                {signals?.pairings.length === 0 && <p className="text-[10px] text-white/20 italic text-center p-4">Idle Orbit...</p>}
                {signals?.pairings.map((p: any, i: number) => (
                  <PairItem 
                    key={i}
                    axis={p.axis} 
                    users={p.users} 
                    similarity={p.similarity} 
                  />
                ))}
             </div>
             <button className="w-full mt-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase text-indigo-400 transition-all">
                توليد اقترانات جديدة
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResonanceStat: FC<{ 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string; 
  color: "teal" | "indigo" | "amber" | "rose";
  pulse?: boolean;
}> = ({ label, value, icon, trend, color, pulse }) => {
  const colorMap = {
    teal: "text-teal-400 border-teal-500/10 bg-teal-500/5",
    indigo: "text-indigo-400 border-indigo-500/10 bg-indigo-500/5",
    amber: "text-amber-400 border-amber-500/10 bg-amber-500/5",
    rose: "text-rose-400 border-rose-500/10 bg-rose-500/5"
  };

  return (
    <div className={`p-4 rounded-3xl border ${colorMap[color]} backdrop-blur-md flex flex-col gap-1 relative overflow-hidden`}>
      {pulse && (
        <motion.div 
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-current pointer-events-none" 
        />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 bg-white/5 rounded-lg">{icon}</div>
        <span className="text-[9px] font-bold opacity-60 font-mono tracking-tighter uppercase">{trend}</span>
      </div>
      <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
};

const GhostAlert: FC<{ name: string; time: string; status: string }> = ({ name, time, status }) => (
  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">
        {name[0]}
      </div>
      <span className="text-xs font-bold text-white/80">{name}</span>
    </div>
    <div className="flex flex-col items-end">
       <span className="text-[9px] font-mono text-rose-400 font-bold">{time} Inactive</span>
       <span className="text-[8px] font-bold opacity-40 uppercase">{status}</span>
    </div>
  </div>
);

const PairItem: FC<{ axis: string; users: string[]; similarity: number }> = ({ axis, users, similarity }) => (
  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
    <div className="flex items-center justify-between">
       <span className="text-[10px] font-bold text-white/60">{axis}</span>
       <span className="text-[9px] font-mono text-indigo-400 font-bold">{Math.floor(similarity * 100)}% Match</span>
    </div>
    <div className="flex items-center justify-center gap-2">
       <div className="flex-1 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">{users[0]}</div>
       <Zap className="w-3 h-3 text-white/20" />
       <div className="flex-1 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">{users[1]}</div>
    </div>
  </div>
);
