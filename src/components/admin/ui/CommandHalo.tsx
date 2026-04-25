import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Terminal, 
  Command, 
  ChevronRight, 
  Cpu, 
  Zap, 
  Shield, 
  Eye,
  Settings,
  X,
  Flame,
  Activity,
  Zap as Sparkles,
  Lock,
  Unlock
} from "lucide-react";
import { AdminTab, NAV_ITEMS, CLEAN_NAV_LABELS } from "../adminNavigation";
import { createCurrentUrl, pushUrl } from "@/services/navigation";
import { useLockdownState } from "@/domains/admin/store/lockdown.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { CommandOrchestrator as SovereignOrchestrator } from "@/services/commandOrchestrator";
import { AlertTriangle, Fingerprint } from "lucide-react";

export const CommandHalo: React.FC = () => {
  const { isLockedDown, triggerLockdown, liftLockdown } = useLockdownState();
  const resonanceScore = useAdminState(s => s.resonanceScore);
  const latestFriction = useAdminState(s => s.latestFriction);
  const aiInterventions = useAdminState(s => s.aiInterventions || []);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const navigateTo = (tab: AdminTab) => {
    const url = createCurrentUrl();
    if (!url) return;
    url.searchParams.set("tab", tab);
    pushUrl(url);
    setIsOpen(false);
  };

  const navResults = NAV_ITEMS.filter(item => {
    const label = CLEAN_NAV_LABELS[item.id] ?? item.label;
    return label.toLowerCase().includes(query.toLowerCase()) || 
           item.id.toLowerCase().includes(query.toLowerCase());
  }).map(item => ({
    ...item,
    type: "navigation" as const,
    subtitle: "انتقال إلى اللوحة"
  }));

  const actionResults = [
    { 
      id: "toggle-lockdown", 
      label: isLockedDown ? "فك تجميد النبض (Lift Lockdown)" : "تجميد النبض (Sovereign Freeze)", 
      icon: isLockedDown ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />, 
      type: "action" as const, 
      actionId: "toggle-lockdown",
      subtitle: isLockedDown ? "استعادة العمليات الحيوية" : "إيقاف العمليات مؤقتاً لحماية النظام" 
    },
    { id: "broadcast-all", label: "بث استغاثة (Emergency Broadcast)", icon: <Activity className="h-4 w-4" />, type: "action" as const, actionId: "broadcast-all", subtitle: "رسالة لكل المستخدمين" },
    { id: "audit-system", label: "تدقيق القيادة (Sovereign Audit)", icon: <Shield className="h-4 w-4" />, type: "action" as const, actionId: "audit-system", subtitle: "فحص أمان النظام" },
    ...aiInterventions.map(ai => ({
      ...ai,
      id: ai.id,
      label: ai.label,
      subtitle: ai.subtitle,
      actionId: ai.actionId,
      type: "action" as const,
      isAi: true,
      icon: ai.iconType === "shield" ? <Shield className="h-4 w-4" /> :
            ai.iconType === "zap" ? <Zap className="h-4 w-4" /> :
            ai.iconType === "activity" ? <Activity className="h-4 w-4" /> :
            ai.iconType === "flame" ? <Flame className="h-4 w-4" /> :
            ai.iconType === "lock" ? <Lock className="h-4 w-4" /> :
            ai.iconType === "unlock" ? <Unlock className="h-4 w-4" /> :
            <Command className="h-4 w-4" />
    }))
  ].filter(action => action.label.toLowerCase().includes(query.toLowerCase()) || query === "");

  const filteredItems = [...actionResults, ...navResults].slice(0, 10);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
      if (e.key === "Enter" && filteredItems[selectedIndex]) {
        const item = filteredItems[selectedIndex];
        if (item.type === "navigation") {
          navigateTo(item.id as AdminTab);
        } else if (item.id === "toggle-lockdown" || ("actionId" in item && item.actionId === "toggle-lockdown")) {
          if (isLockedDown) liftLockdown();
          else triggerLockdown();
          setIsOpen(false);
        } else {
          if ("actionId" in item && item.actionId) {
             SovereignOrchestrator.executeIntervention(item.actionId);
          } else {
             console.log("Executing Sovereign Action:", item.id);
          }
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-slate-900/80 border border-indigo-500/20 rounded-2xl shadow-[0_0_80px_rgba(79,70,229,0.2)] overflow-hidden backdrop-blur-2xl"
            dir="rtl"
          >
            {/* Command Input */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-indigo-500/10 bg-slate-900/40">
              <Command className="h-5 w-5 text-indigo-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="استدعاء القيادة... (Enter للحفظ، / للأوامر)"
                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder:text-slate-500 font-display font-medium"
              />
              <div className="flex items-center gap-2">
                 <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-mono">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Sovereign Intelligence Header (Visible when no query or special context) */}
            <AnimatePresence>
              {!query && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 py-4 bg-indigo-500/10 border-b border-indigo-500/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Fingerprint className={`w-5 h-5 ${resonanceScore < 50 ? 'text-rose-400' : 'text-indigo-400'}`} />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-indigo-500/30 rounded-full blur-sm"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-indigo-300 tracking-[0.2em]">Collective Pulse</span>
                      <span className="text-sm font-bold text-white">{resonanceScore}% Resonance</span>
                    </div>
                  </div>

                  {latestFriction && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] font-black text-rose-200 uppercase tracking-tighter">
                        Friction: {latestFriction}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="p-2 max-h-[450px] overflow-y-auto no-scrollbar">
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  {filteredItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const isAction = "type" in item && item.type === "action";
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if ("type" in item && item.type === "navigation") {
                            navigateTo(item.id as AdminTab);
                          } else {
                            console.log("Action:", item.id);
                            setIsOpen(false);
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-200 ${
                          isSelected 
                          ? "bg-indigo-600/20 ring-1 ring-indigo-500/40 translate-x-1" 
                          : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isSelected 
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110" 
                            : isAction ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-slate-800 text-slate-400"
                          }`}>
                            {item.icon}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-100">{CLEAN_NAV_LABELS[item.id as AdminTab] ?? item.label}</div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-indigo-400" : "text-slate-500"}`}>
                              {item.subtitle || item.id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isAction && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                              System Action
                            </span>
                          )}
                          {isSelected && (
                            <motion.div layoutId="halo-arrow" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                              <ChevronRight className="h-4 w-4 text-indigo-400 rotate-180" />
                            </motion.div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto border border-slate-700/50">
                    <Sparkles className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-slate-300 font-bold">لا توجد بيانات مطابقة</p>
                    <p className="text-xs text-slate-500 mt-1">حاول البحث بكلمات مفتاحية مختلفة لنظام القيادة.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-indigo-500/5 border-t border-indigo-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3 opacity-60">
                 <Terminal className="h-4 w-4 text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Halo Protocol active</span>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-[10px] text-slate-400">
                    <span className="font-mono text-indigo-400 font-bold">↑↓</span>
                    <span>تحرك</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-[10px] text-slate-400">
                    <span className="font-mono text-indigo-400 font-bold">Enter</span>
                    <span>اختيار</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
