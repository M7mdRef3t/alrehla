import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, Heart, Zap, RefreshCw, X, ChevronRight } from "lucide-react";
import { Button } from "../../components/UI/Button";
import { useMasafatyAnalysis } from "./hooks/useMasafatyAnalysis";
import { trackEvent, AnalyticsEvents } from "../../services/analytics";

export function ActionToolkit() {
  const [showAIPopover, setShowAIPopover] = useState(false);
  const { maneuvers, refreshManeuvers, isLoading } = useMasafatyAnalysis();

  const actions = [
    { icon: MessageCircle, label: "رسالة سريعة", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { icon: Heart, label: "تقدير", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
    { icon: Zap, label: "تعديل مسافة", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { 
      icon: Sparkles, 
      label: "مناورات AI", 
      color: "bg-teal-500 text-slate-950 border-teal-400", 
      onClick: () => {
        trackEvent(AnalyticsEvents.AI_CHAT_USED, { source: "action_toolkit" });
        setShowAIPopover(true);
      }, 
      isPrimary: true 
    },
  ];

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
      <div className="flex gap-4 p-4 rounded-[2rem] bg-slate-950/60 backdrop-blur-3xl border border-white/5 shadow-2xl">
        {actions.map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-2 group"
            title={action.label}
            onClick={action.onClick}
          >
            <div className={`w-12 h-12 rounded-2xl ${action.color} border flex items-center justify-center shadow-lg transition-all group-hover:shadow-[0_0_20px_rgba(45,212,191,0.2)]`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{action.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showAIPopover && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[340px] ds-card p-6 shadow-2xl z-50 rounded-[2.5rem]"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                < Sparkles className="w-5 h-5 text-teal-400 fill-teal-400/20" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">مناورات استراتيجية</h3>
              </div>
              <button onClick={() => setShowAIPopover(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-8 h-8 text-teal-500/40" />
                  </motion.div>
                  <p className="text-xs text-teal-500/40 font-bold animate-pulse">جاري التفكير لثواني...</p>
                </div>
              ) : maneuvers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-500 font-bold">لا يوجد بيانات كافية حالياً.</p>
                  <button 
                    onClick={refreshManeuvers}
                    className="mt-4 text-xs text-teal-400 font-black flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" /> جرب تاني
                  </button>
                </div>
              ) : (
                maneuvers.map((m, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{m.type}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{m.description}</p>
                      <div className="flex items-center justify-between text-teal-400 group-hover:text-teal-300">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black">{m.actionLabel}</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trackEvent(AnalyticsEvents.PUNITIVE_FEEDBACK_GIVEN, { 
                              maneuver_id: m.id || idx.toString(),
                              maneuver_title: m.title
                            });
                            setShowAIPopover(false);
                          }}
                          className="p-2 -mr-2 rounded-full hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                          title="استبعاد (Kill Switch)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {maneuvers.length > 0 && (
              <button 
                onClick={refreshManeuvers}
                className="w-full mt-6 py-3 border border-dashed border-teal-500/20 rounded-2xl text-[10px] font-black text-teal-500/40 hover:text-teal-500 active:bg-teal-500/10 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" /> تحديث الرؤية
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
