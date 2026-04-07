import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, ShieldAlert, Trash2 } from 'lucide-react';
import { DispatcherEngine } from '@/services/dispatcherEngine';

interface CoachAlert {
    id: string;
    severity: "critical" | "warning" | "info";
    message: string;
    created_at: string;
}

interface CoachAlertCenterProps {
    alerts: CoachAlert[];
    onRefresh: () => void;
}

export const CoachAlertCenter: React.FC<CoachAlertCenterProps> = ({ alerts, onRefresh }) => {
    const handleMarkAsRead = async (id: string) => {
        await DispatcherEngine.markAsRead(id);
        onRefresh();
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-h-[500px] flex flex-col w-96">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[var(--soft-teal)]" />
                    <h3 className="font-black text-slate-900">رادار اتبات اآ</h3>
                </div>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">{alerts.length} تب جدد</span>
            </header>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <AnimatePresence>
                    {alerts.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold">ا جد أزات حاة </p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`p-4 rounded-2xl border flex gap-4 relative group transition-all ${alert.severity === 'critical'
                                        ? 'bg-rose-50 border-rose-100'
                                        : 'bg-amber-50 border-amber-100'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">تب ظا</span>
                                        <span className="text-[10px] font-bold text-slate-400">{new Date(alert.created_at).toLocaleTimeString("ar-EG")}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 leading-relaxed mb-3">
                                        {alert.message}
                                    </p>
                                    <button
                                        onClick={() => handleMarkAsRead(alert.id)}
                                        className="text-[10px] font-black text-[var(--soft-teal)] hover:text-[var(--soft-teal)] flex items-center gap-1 transition"
                                    >
                                        <Trash2 className="w-3 h-3" /> ت اتعا ع احاة
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


