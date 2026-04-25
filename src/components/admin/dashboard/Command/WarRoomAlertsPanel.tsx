import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, XCircle, RefreshCw } from "lucide-react";
import { fetchAlertIncidents, updateAlertIncidentStatus, resetAlertIncidents } from "@/services/admin/adminAlerts";
import { type AlertIncident } from "@/services/admin/adminTypes";

interface WarRoomAlertsPanelProps {
  minimal?: boolean;
}

export const WarRoomAlertsPanel: FC<WarRoomAlertsPanelProps> = ({ minimal }) => {
  const [incidents, setIncidents] = useState<AlertIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadIncidents = async () => {
    setIsLoading(true);
    const data = await fetchAlertIncidents();
    setIncidents(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async (id: string, status: "ack" | "resolved") => {
    setIsProcessing(id);
    const success = await updateAlertIncidentStatus(id, status);
    if (success) {
      await loadIncidents();
    }
    setIsProcessing(null);
  };

  const handleResetAll = async () => {
    if (!window.confirm("Are you sure you want to resolve ALL active incidents?")) return;
    setIsProcessing("reset-all");
    const success = await resetAlertIncidents();
    if (success) {
      await loadIncidents();
    }
    setIsProcessing(null);
  };

  const criticalCount = incidents.filter(i => i.severity === "critical").length;
  const highCount = incidents.filter(i => i.severity === "high").length;
  const activeIncidents = incidents.filter(i => i.status === "open" || i.status === "ack");

  const content = (
    <>
      {!minimal && (
        <div className="flex items-center justify-between flex-row-reverse mb-8">
          <div className="flex items-center gap-3 flex-row-reverse text-right">
            <div className={`p-3 rounded-2xl ${activeIncidents.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
              <ShieldAlert className={`w-6 h-6 ${activeIncidents.length > 0 ? "text-rose-500" : "text-emerald-500"}`} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">War Room Alerts</h2>
              <p className="text-rose-500/60 text-[10px] font-black uppercase tracking-widest text-right">Active System Incidents</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-row-reverse">
            <button 
              onClick={loadIncidents}
              disabled={isLoading}
              className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {activeIncidents.length > 0 && (
              <button 
                onClick={handleResetAll}
                disabled={isProcessing === "reset-all"}
                className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black text-rose-500 hover:text-white hover:bg-rose-500 transition-all uppercase tracking-widest flex items-center gap-2 flex-row-reverse disabled:opacity-50"
              >
                <CheckCircle className="w-3 h-3" />
                Resolve All
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-row-reverse gap-4 mb-6">
        <div className="flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 flex-row-reverse text-right">
          <span className="text-rose-500 font-black">{criticalCount}</span>
          <span className="text-[10px] text-rose-500/70 font-bold uppercase tracking-widest">Critical</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 flex-row-reverse text-right">
          <span className="text-amber-500 font-black">{highCount}</span>
          <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">High</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {isLoading && incidents.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center opacity-50">
            <RefreshCw className="w-8 h-8 text-slate-500 animate-spin mb-4" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Scanning Grid...</p>
          </div>
        ) : activeIncidents.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center opacity-50 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-xs text-emerald-400 font-black uppercase tracking-widest">System Stable: 0 Active Incidents</p>
          </div>
        ) : (
          <AnimatePresence>
            {activeIncidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-2xl border ${
                  incident.severity === "critical" 
                    ? "bg-rose-500/5 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" 
                    : incident.severity === "high" 
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-white/5 border-white/10"
                } relative group`}
              >
                <div className="flex items-start justify-between flex-row-reverse gap-4 text-right">
                  <div className="flex-1 flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                      {incident.severity === "critical" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter">{incident.rule_key}</h4>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mb-3">{incident.segment}</p>
                    {incident.status === 'open' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-[9px] font-black uppercase tracking-widest">
                        UNACKNOWLEDGED
                      </span>
                    )}
                    {incident.status === 'ack' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[9px] font-black uppercase tracking-widest">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {incident.status === "open" && (
                      <button
                        onClick={() => handleUpdate(incident.id, "ack")}
                        disabled={isProcessing === incident.id}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdate(incident.id, "resolved")}
                      disabled={isProcessing === incident.id}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </>
  );

  if (minimal) return content;

  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
      {content}
    </div>
  );
};
