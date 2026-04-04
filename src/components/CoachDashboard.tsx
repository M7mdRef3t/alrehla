import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Users, Link2, KeyRound, BrainCircuit, X, Flame, Loader2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import { useEffect, useCallback } from "react";

interface PatientStats {
    id: string;
    name: string;
    tei: number;
    burnoutDays: number | null;
    status: "safe" | "warning" | "critical";
    lastActive: string;
}

interface PatientStats {
    id: string;
    name: string;
    tei: number;
    burnoutDays: number | null;
    status: "safe" | "warning" | "critical";
    lastActive: string;
}

interface InviteCode {
    code: string;
    used: boolean;
    createdAt: string;
}

export const CoachDashboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<"patients" | "invites">("patients");
    const [patients, setPatients] = useState<PatientStats[]>([]);
    const [invites, setInvites] = useState<InviteCode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!isOpen || !supabase) return;
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setIsLoading(false);
                return;
            }

            const coachId = session.user.id;

            // Fetch Patients
            // Right now, TEI and Burnout aren't explicitly simple fields, so we will generate them based on the patient's record if present
            // In a full production app, TEI would be calculated via edge function or a materialized view.
            const { data: patientData, error: patientError } = await supabase
                .from('profiles')
                .select('id, full_name, last_seen')
                .eq('coach_id', coachId);

            if (patientData && !patientError) {
                const mappedPatients: PatientStats[] = patientData.map(p => {
                    // Mocking the complex calculations for TEI for now, just to show UI
                    const mockTei = Math.floor(Math.random() * 100);
                    return {
                        id: p.id,
                        name: p.full_name || "مستخدم مجهول",
                        tei: mockTei,
                        burnoutDays: mockTei > 80 ? 3 : (mockTei > 50 ? 15 : null),
                        status: mockTei > 80 ? 'critical' : (mockTei > 50 ? 'warning' : 'safe'),
                        lastActive: p.last_seen ? new Date(p.last_seen).toLocaleDateString('ar-EG') : 'غير متوفر'
                    };
                });
                setPatients(mappedPatients);
            }

            // Fetch Invites
            const { data: inviteData, error: inviteError } = await supabase
                .from('coach_invites')
                .select('code, used, created_at')
                .eq('coach_id', coachId)
                .order('created_at', { ascending: false });

            if (inviteData && !inviteError) {
                setInvites(inviteData.map(i => ({
                    code: i.code,
                    used: i.used,
                    createdAt: new Date(i.created_at).toISOString().split("T")[0]
                })));
            }
        } catch (err) {
            console.error("Error loading coach data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const generateInvite = async () => {
        if (!supabase) return;
        setIsLoading(true);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const code = "DWYR-COACH-" + Array.from({ length: 4 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { error } = await supabase.from('coach_invites').insert({
                code: code,
                coach_id: session.user.id
            });

            if (!error) {
                setInvites(prev => [{ code, used: false, createdAt: new Date().toISOString().split("T")[0] }, ...prev]);
            } else {
                console.error("Invite generation failed:", error);
                alert("تعذر توليد الكود. حاول مرة أخرى.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">بوابة المعالجين (B2B Portal)</h2>
                            <p className="text-xs text-slate-400">تابع تقدم عملائك وأصدر أكواد دعوة خاصة</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b border-slate-700 bg-slate-800/30">
                    <button
                        className={`flex-1 p-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "patients" ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"}`}
                        onClick={() => setActiveTab("patients")}
                    >
                        المرضى الحاليين ({patients.length})
                    </button>
                    <button
                        className={`flex-1 p-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "invites" ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"}`}
                        onClick={() => setActiveTab("invites")}
                    >
                        أكواد الدعوة
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    {activeTab === "patients" ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Users /></div>
                                    <div><p className="text-xs text-slate-400">إجمالي الحالات</p><p className="text-2xl font-black text-white">{patients.length}</p></div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400"><Flame /></div>
                                    <div><p className="text-xs text-slate-400">حالات حرجة</p><p className="text-2xl font-black text-white">{patients.filter(m => m.status === 'critical').length}</p></div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"><Activity /></div>
                                    <div><p className="text-xs text-slate-400">متوسط TEI</p><p className="text-2xl font-black text-white">{patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.tei, 0) / patients.length) : 0}</p></div>
                                </div>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-700/50 text-slate-300">
                                        <tr>
                                            <th className="p-4 font-semibold">المستخدم</th>
                                            <th className="p-4 font-semibold">معامل الفوضى (TEI)</th>
                                            <th className="p-4 font-semibold">توقعات الاحتراق</th>
                                            <th className="p-4 font-semibold">حالة التدخل</th>
                                            <th className="p-4 font-semibold">آخر تفاعل</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50 text-slate-300">
                                        {patients.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                                    لا يوجد أشخاص مرتبطين بحسابك كمعالج بعد. قم بإنشاء وإرسال أكواد دعوة.
                                                </td>
                                            </tr>
                                        ) : patients.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-4 font-bold text-white flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${p.status === 'critical' ? 'bg-rose-500 animate-pulse' : p.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                    {p.name}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span>{p.tei}/100</span>
                                                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                            <div className={`h-full ${p.tei > 80 ? 'bg-rose-500' : p.tei > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p.tei}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">{p.burnoutDays ? `${p.burnoutDays} يوم` : "آمن"}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.status === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : p.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                        {p.status === 'critical' ? 'تدخل فوراً' : p.status === 'warning' ? 'يحتاج متابعة' : 'مستقر'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-400">{p.lastActive}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6 text-center mb-8">
                                <KeyRound className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-white mb-2">أكواد الدعوة الخاصة</h3>
                                <p className="text-sm text-indigo-200 mb-6">
                                    اصدر أكواداً لمرضاك لربط حساباتهم بك، ومنحهم فترة تجريبية مفتوحة للنسخة Pro مدفوعة من رصيدك.
                                </p>
                                <button
                                    onClick={generateInvite}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                                    {isLoading ? "جاري التوليد..." : "توليد كود جديد"}
                                </button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-white mb-4">الأكواد المُصدرة ({invites.length})</h4>
                                {invites.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 border border-slate-700 border-dashed rounded-xl">
                                        لم تقم بإصدار أي أكواد بعد.
                                    </div>
                                ) : invites.map(inv => (
                                    <div key={inv.code} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${inv.used ? 'bg-slate-600' : 'bg-green-500 animate-pulse'}`} />
                                            <div>
                                                <p className="font-mono text-lg text-white tracking-widest select-all">{inv.code}</p>
                                                <p className="text-xs text-slate-400">صدر في: {inv.createdAt}</p>
                                            </div>
                                        </div>
                                        <div>
                                            {inv.used ? (
                                                <span className="px-3 py-1 bg-slate-700 text-slate-400 text-xs rounded-md">مُستخدم</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs rounded-md font-bold">متاح للربط</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
