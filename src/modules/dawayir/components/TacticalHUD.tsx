import React from 'react';
import { motion } from 'framer-motion';

interface TacticalHUDProps {
  nodesCount: number;
  edgesCount: number;
}

export function TacticalHUD({ nodesCount, edgesCount }: TacticalHUDProps) {
  return (
    <div className="absolute z-20 left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
        <div className="p-4 space-y-4 w-44 rounded-2xl" style={{ background:"rgba(6,10,22,0.82)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)" }}>
            <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-500 tracking-wide">مستوى التشتت</span>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        className="h-full bg-rose-500/50"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] block text-slate-500">نقاط الرصد</span>
                    <span className="text-sm font-black text-white font-mono">{nodesCount}</span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] block text-slate-500">الروابط الحية</span>
                    <span className="text-sm font-black text-white font-mono">{edgesCount}</span>
                </div>
            </div>
            <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">حالة القراءة</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-teal-400">مستقرة</span>
            </div>
        </div>
    </div>
  );
}
