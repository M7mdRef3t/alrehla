import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, RefreshCw, Save, LogOut, Info, Shield, AlertTriangle, Heart, User, Sparkles, ClipboardList, Eye, EyeOff } from 'lucide-react';
import { useEmergencyState } from '@/domains/admin/store/emergency.store';

interface MapSidebarProps {
  onAddPerson?: () => void;
  onRearrange: () => void;
  onSave: () => void;
  onShowOracle: () => void;
  onShowPlan: () => void;
  isSaving?: boolean;
  data?: any;
  isHudVisible?: boolean;
  isHudPinned?: boolean;
  onToggleHud?: () => void;
  onEmergency?: () => void;
}

export function MapSidebar({ onAddPerson, onRearrange, onSave, onShowOracle, onShowPlan, isSaving, data, isHudVisible = true, isHudPinned = false, onToggleHud, onEmergency }: MapSidebarProps) {
  const openEmergency = useEmergencyState(s => s.open);
  const handleEmergency = onEmergency ?? openEmergency;
  // Derive real insights from data
  const redNodes = data?.nodes?.filter((n: any) => n.ring === 'red' && !n.isNodeArchived && !n.isDetached) || [];
  const mostDrained = redNodes.length > 0 ? redNodes[0].label : 'لا يوجد استنزاف';
  
  const greenNodes = data?.nodes?.filter((n: any) => n.ring === 'green' && !n.isNodeArchived && !n.isDetached) || [];
  const mostSafe = greenNodes.length > 0 ? greenNodes[0].label : 'لا مساحة أمان حالياً';
  return (
    <div className="absolute top-[110px] right-6 bottom-6 w-80 z-40 flex flex-col gap-4 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {isHudVisible && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            className="flex flex-col gap-4 pointer-events-none"
          >
            {/* 📊 Quick Summary Widget */}
            <div 
              className="p-5 rounded-[2rem] pointer-events-auto border border-white/10 shadow-2xl space-y-4"
              style={{
                background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95))",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <Info size={16} className="text-teal-400" />
                  </div>
                  <h3 className="text-sm font-black text-white">ملخص سريع</h3>
              </div>

              <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-teal-500/30 transition-all">
                      <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">أكثر علاقة مستنزفة</span>
                          <span className="text-sm font-bold text-rose-400">{mostDrained}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <User size={18} className="text-rose-400" />
                      </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-teal-500/30 transition-all">
                      <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">أكثر مساحة أمان</span>
                          <span className="text-sm font-bold text-teal-400">{mostSafe}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                          <Heart size={18} className="text-teal-400" />
                      </div>
                  </div>
              </div>
            </div>

            {/* 🗺️ Map Legend Widget */}
            <div 
              className="p-5 rounded-[2rem] pointer-events-auto border border-white/10 shadow-2xl space-y-4"
              style={{
                background: "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Shield size={16} className="text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-black text-white">مفتاح الخريطة</h3>
              </div>

              <div className="space-y-3">
                  {[
                      { label: 'دائرة الأمان', color: 'bg-teal-400', desc: 'علاقات تمنحك الدعم والراحة والأمان' },
                      { label: 'منطقة الحذر', color: 'bg-amber-400', desc: 'علاقات تتطلب وعيًا وحدودًا صحية' },
                      { label: 'منطقة الاستنزاف', color: 'bg-rose-500', desc: 'علاقات تستنزف طاقتك وتحتاج مراجعة' },
                  ].map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                          <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-200">{item.label}</span>
                              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet Exit button moved to CoreMapScreen as fixed absolute element */}
    </div>
  );
}
