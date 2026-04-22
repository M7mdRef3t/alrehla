import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, 
    CheckCircle, 
    Flag, 
    User, 
    CreditCard, 
    Search, 
    AlertCircle,
    RefreshCcw,
    ChevronRight,
    Smartphone,
    Mail,
    Zap
} from 'lucide-react';
import { 
    fetchPendingIntents, 
    approvePendingIntent, 
    flagPendingIntent,
    PendingIntent 
} from '@/services/adminApi';
import { useAuthState } from '@/domains/auth/store/auth.store';

export const PendingIntentsPanel: React.FC = () => {
    const [intents, setIntents] = useState<PendingIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actioningId, setActioningId] = useState<string | null>(null);
    const authUser = useAuthState((s) => s.user);

    const loadData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const data = await fetchPendingIntents();
            setIntents(data || []);
        } catch (err) {
            console.error('يا نهار أبيض! فشل في جلب النوايا:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(), 30000); // كل 30 ثانية
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (intent: PendingIntent) => {
        if (!authUser?.id) {
            alert('فين صلاحياتك يا بطل؟ لازم تكون أونر.');
            return;
        }
        
        if (!confirm(`هل أنت متأكد من تفعيل "مقعد التأسيس" لـ ${intent.userName}؟`)) return;

        setActioningId(intent.id);
        const success = await approvePendingIntent(intent.id, intent.userId, authUser.id);
        
        if (success) {
            // نحدث القائمة محلياً عشان السرعة
            setIntents(prev => prev.filter(i => i.id !== intent.id));
            console.log(`تم تفعيل الاشتراك لـ ${intent.userName} بنجاح. زي الفل!`);
        } else {
            alert('حصلت مشكلة في التفعيل. جرب تاني يا ريس.');
        }
        setActioningId(null);
    };

    const handleFlag = async (intent: PendingIntent) => {
        const reason = prompt('ليه عايز تعلم على النية دي؟ (السبب)', 'بيانات غير صحيحة');
        if (!reason) return;

        setActioningId(intent.id);
        const success = await flagPendingIntent(intent.id, reason);
        
        if (success) {
            setIntents(prev => prev.map(i => i.id === intent.id ? { ...i, status: 'flagged' } : i));
        } else {
            alert('فشل في التعليم على النية.');
        }
        setActioningId(null);
    };

    const filteredIntents = intents.filter(i => 
        i.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.userPhone?.includes(searchQuery) ||
        i.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !refreshing) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-orange-400 font-black animate-pulse uppercase tracking-widest text-xs">جاري سحب النوايا من الخزنة...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000" dir="rtl">
            {/* Header Area */}
            <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-1000" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tighter">
                        <div className="p-3.5 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)] group-hover:scale-110 transition-transform duration-500">
                            <Clock className="text-orange-400 w-7 h-7" />
                        </div>
                        نوايا العبور المعلقة
                    </h2>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-3 mr-16">تحويل الأرواح المترددة إلى مسافرين (CONVERSION RECOVERY)</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="ابحث بالاسم، الموبايل، الإيميل..." 
                            className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/30 transition-all font-sans"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="p-2.5 bg-slate-950/60 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all disabled:opacity-50 group"
                    >
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 backdrop-blur-3xl overflow-hidden shadow-2xl relative group/table">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-transparent to-rose-500/[0.02] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                
                {filteredIntents.length === 0 ? (
                    <div className="p-24 text-center flex flex-col items-center relative z-10">
                        <div className="w-20 h-20 bg-slate-950/60 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-inner group-hover/table:scale-110 transition-transform duration-700">
                            <Zap className="w-10 h-10 text-slate-700 group-hover:text-orange-500/40 transition-colors" />
                        </div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">لا يوجد نوايا معلقة حالياً. السيستم نظيف!</p>
                        <div className="mt-4 h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-orange-500/20"
                                animate={{ x: [-100, 100] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-slate-950/20">
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">المسافر</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">تفاصيل الدفع</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">التاريخ</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">الحالة</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">إجراءات سِيادية</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {filteredIntents.map((intent) => (
                                        <motion.tr 
                                            key={intent.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-all duration-500 shadow-2xl relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/5 transition-colors" />
                                                        <User className="w-6 h-6 relative z-10" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white mb-1 tracking-tight group-hover:text-orange-100 transition-colors">{intent.userName || 'مسافر مجهول'}</p>
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                                                                <Smartphone className="w-3 h-3 text-orange-500/50" /> {intent.userPhone || '-'}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                                                                <Mail className="w-3 h-3 text-cyan-500/50" /> {intent.userEmail || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                                                        <CreditCard className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white tabular-nums tracking-tighter">{intent.amount} <span className="text-[10px] text-slate-500">{intent.currency}</span></p>
                                                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-0.5">ID: {intent.id.split('-')[0]}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <p className="text-xs font-black text-slate-300 tabular-nums">
                                                        {new Date(intent.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-tighter mt-1 flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(intent.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                                                    intent.status === 'flagged' 
                                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${intent.status === 'flagged' ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`} />
                                                    {intent.status === 'flagged' ? 'محل شك' : 'في الانتظار'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button 
                                                        onClick={() => handleApprove(intent)}
                                                        disabled={actioningId === intent.id}
                                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl border border-emerald-400/20 shadow-lg shadow-emerald-900/20 transition-all duration-500 disabled:opacity-50 flex items-center gap-2 group/btn active:scale-95"
                                                    >
                                                        <CheckCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">تفعيل</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFlag(intent)}
                                                        disabled={actioningId === intent.id}
                                                        className="p-3 bg-slate-950/60 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all duration-500 disabled:opacity-50 group/flag"
                                                        title="تعليم كمشكوك فيه"
                                                    >
                                                        <Flag className="w-4 h-4 group-hover/flag:rotate-12 transition-transform" />
                                                    </button>
                                                    {intent.userPhone && (
                                                        <a 
                                                            href={`https://wa.me/${intent.userPhone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-500 flex items-center justify-center group/wa"
                                                            title="تواصل مباشر عبر واتساب"
                                                        >
                                                            <Smartphone className="w-4 h-4 group-hover/wa:scale-110 transition-transform" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Insight */}
                <div className="bg-slate-950/40 p-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        تفعيل المسافر يرسل رسالة تلقائية على واتساب لتأكيد الدخول.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-slate-400 font-mono">{filteredIntents.length} نية نشطة</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
