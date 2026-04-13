import React from 'react';
import { Clock, AlertCircle, Heart, Terminal, Loader2 } from 'lucide-react';

export interface OraclePrediction {
  needsMoreData?: boolean;
  error?: string;
  burnout_probability: number;
  trajectory_summary: string;
  preventative_action?: string;
}

interface OracleModalProps {
  prediction: OraclePrediction;
  hasActiveCoach: boolean;
  isSharing: boolean;
  onClose: () => void;
  onNotifyCoach: () => void;
}

export function OracleModal({ prediction, hasActiveCoach, isSharing, onClose, onNotifyCoach }: OracleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
        <div className="p-8 max-w-lg w-full relative overflow-hidden rounded-3xl" style={{ background:"rgba(6,10,22,0.92)", border:"1px solid rgba(20,184,166,0.2)", backdropFilter:"blur(32px)" }}>

            {/* Status Header based on Calibration */}
            {prediction.needsMoreData ? (
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/5 border border-white/10 text-slate-400 rounded-2xl flex items-center justify-center mb-6"><Clock className="w-10 h-10" /></div>
                    <h2 className="text-2xl font-black text-white mb-3 tracking-tight">البيانات غير مكتملة</h2>
                    <p className="text-slate-400 font-medium">{prediction.error}</p>
                </div>
            ) : prediction.burnout_probability > 60 ? (
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse"><AlertCircle className="w-10 h-10" /></div>
                    <h2 className="text-2xl font-black text-rose-400 mb-3 tracking-tight">احتمالية الإرهاق: {prediction.burnout_probability}%</h2>
                    <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 mb-6 text-right w-full">
                        <p className="text-rose-200/80 text-sm leading-[1.8] font-bold">{prediction.trajectory_summary}</p>
                    </div>
                    {prediction.preventative_action && (
                        <div className="w-full text-right p-6 rounded-2xl shadow-inner" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                            <h4 className="font-black text-teal-400 mb-3 flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
                                <Terminal className="w-4 h-4" /> خطوة وقائية:
                            </h4>
                            <p className="text-slate-200 text-sm leading-relaxed font-medium">{prediction.preventative_action}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><Heart className="w-10 h-10" /></div>
                    <h2 className="text-2xl font-black text-emerald-400 mb-3 tracking-tight">الوضع مستقر: {prediction.burnout_probability}%</h2>
                    <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mb-6 text-right w-full">
                        <p className="text-emerald-200/80 text-sm leading-[1.8] font-bold">{prediction.trajectory_summary}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-mono"
                >
                    إغلاق
                </button>
                {hasActiveCoach && prediction?.burnout_probability > 60 && (
                    <button
                        onClick={onNotifyCoach}
                        disabled={isSharing}
                        className="flex-1 py-4 bg-rose-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-400 transition-all flex items-center justify-center gap-2"
                    >
                        {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        إخطار الكوتش
                    </button>
                )}
            </div>
        </div>
    </div>
  );
}
