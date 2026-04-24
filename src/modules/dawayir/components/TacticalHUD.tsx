import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Zap } from 'lucide-react';
import { useStressAura, type StressAura } from '../hooks/useStressAura';

interface TacticalHUDProps {
  nodesCount: number;
  edgesCount: number;
}

const stressBarColor: Record<string, string> = {
  calm: 'bg-teal-500/60',
  moderate: 'bg-amber-400/60',
  high: 'bg-orange-500/60',
  acute: 'bg-rose-500/70',
};

const stressDotColor: Record<string, string> = {
  calm: 'bg-teal-500',
  moderate: 'bg-amber-400',
  high: 'bg-orange-500',
  acute: 'bg-rose-500',
};

export function TacticalHUD({ nodesCount, edgesCount }: TacticalHUDProps) {
  const aura: StressAura = useStressAura();

  const stressPercent = aura.isConnected ? `${aura.stressLevel}%` : '0%';
  const barClass = stressBarColor[aura.category] || stressBarColor.calm;
  const dotClass = stressDotColor[aura.category] || stressDotColor.calm;

  return (
    <div className="absolute z-20 left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
        <div className="p-4 space-y-4 w-44 rounded-2xl" style={{ background:"rgba(6,10,22,0.82)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)" }}>
            {/* Stress Level — live */}
            <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-500 tracking-wide">مستوى التوتر</span>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: stressPercent }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${barClass}`}
                    />
                </div>
                {aura.isConnected && (
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-bold text-slate-400">{aura.stressLevel}/100</span>
                        <span className="text-[9px] font-black" style={{ color: aura.auraColor }}>{aura.statusLabel}</span>
                    </div>
                )}
            </div>

            {/* Vital Signs — live */}
            {aura.isConnected && (
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Heart className="w-2.5 h-2.5 text-rose-400" />
                            <span className="text-[8px] block text-slate-500">نبض</span>
                        </div>
                        <span className="text-sm font-black text-white font-mono">{aura.heartRate}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Activity className="w-2.5 h-2.5 text-teal-400" />
                            <span className="text-[8px] block text-slate-500">HRV</span>
                        </div>
                        <span className="text-sm font-black text-white font-mono">{aura.hrv}</span>
                    </div>
                </div>
            )}

            {/* Map Stats */}
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

            {/* Connection Status */}
            <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">حالة القراءة</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${aura.isConnected ? dotClass : 'bg-slate-600'} ${aura.isConnected ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold ${aura.isConnected ? 'text-teal-400' : 'text-slate-600'}`}>
                    {aura.isConnected ? 'متصل — بيانات حية' : 'غير متصل'}
                </span>
            </div>
        </div>
    </div>
  );
}
