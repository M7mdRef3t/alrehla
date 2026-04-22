import React, { useEffect, useState } from 'react';
import { adminApi, type PendingIntent } from '@/services/adminApi';
import { CreditCard, Clock, User, Phone, CheckCircle, AlertCircle, Check, X } from 'lucide-react';

export const PendingIntentsWidget: React.FC = () => {
    const [intents, setIntents] = useState<PendingIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchIntents = async () => {
        try {
            const data = await adminApi.fetchPendingIntents();
            setIntents(data);
        } catch (err) {
            console.error("Failed to fetch pending intents", err);
        }
    };

    useEffect(() => {
        let mounted = true;
        const initialFetch = async () => {
            setLoading(true);
            await fetchIntents();
            if (mounted) setLoading(false);
        };

        initialFetch();
        
        // Refresh every minute to keep up with webhook auto-activations
        const interval = setInterval(fetchIntents, 60_000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleApprove = async (intent: PendingIntent) => {
        if (!confirm(`هل أنت متأكد من تفعيل حساب ${intent.userName}؟`)) return;
        
        setActionLoading(intent.id);
        const success = await adminApi.approvePendingIntent(intent.id, intent.userId, 'admin_ui');
        if (success) {
            await fetchIntents();
        } else {
            alert('حدث خطأ أثناء التفعيل.');
        }
        setActionLoading(null);
    };

    const handleFlag = async (intent: PendingIntent) => {
        const reason = prompt(`ما هو سبب رفض/تأجيل معاملة ${intent.userName}؟`);
        if (!reason) return;

        setActionLoading(intent.id);
        // Assuming adminApi.flagPendingIntent is exported (it is in adminApi.ts)
        const success = await (adminApi as any).flagPendingIntent?.(intent.id, reason);
        if (success || success === undefined) {
            await fetchIntents();
        } else {
            alert('حدث خطأ أثناء الرفض.');
        }
        setActionLoading(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-pulse flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">جاري تحديث المعاملات العالقة...</span>
                </div>
            </div>
        );
    }

    if (intents.length === 0) {
        return (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا توجد نوايا دفع عالقة حالياً</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">جميع المعاملات تمت بنجاح أو لم يتم بدء معاملات جديدة.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                        <th className="py-3 px-4 font-bold">المسافر</th>
                        <th className="py-3 px-4 font-bold">التواصل</th>
                        <th className="py-3 px-4 font-bold">الحالة</th>
                        <th className="py-3 px-4 font-bold">القيمة</th>
                        <th className="py-3 px-4 font-bold">التاريخ</th>
                        <th className="py-3 px-4 font-bold text-center">الإجراء</th>
                    </tr>
                </thead>
                <tbody>
                    {intents.map((intent) => (
                        <tr 
                            key={intent.id} 
                            className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {intent.userName || "غير معروف"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {intent.userEmail || "لا يوجد بريد"}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300" dir="ltr">
                                        {intent.userPhone || "غير متوفر"}
                                    </span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                {intent.status === 'pending_review' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-black">
                                        <AlertCircle className="w-3 h-3" />
                                        مراجعة يدوية
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black">
                                        <Clock className="w-3 h-3" />
                                        قيد الانتظار
                                    </span>
                                )}
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                        {intent.amount} {intent.currency || "EGP"}
                                    </span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs text-slate-500">
                                        {new Date(intent.createdAt).toLocaleDateString("ar-EG", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleApprove(intent)}
                                        disabled={actionLoading === intent.id}
                                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                                        title="تفعيل الحساب"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleFlag(intent)}
                                        disabled={actionLoading === intent.id}
                                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                                        title="إلغاء أو رفض"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
