import type { FC } from "react";
import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, Power, PowerOff, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

interface PromoCode {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    max_uses: number | null;
    times_used: number;
    is_active: boolean;
    created_at: string;
}

export const PromoCodesPanel: FC = () => {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newCode, setNewCode] = useState("");
    const [newMaxUses, setNewMaxUses] = useState<string>("");
    const [createLoading, setCreateLoading] = useState(false);

    const loadCodes = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from("promo_codes")
            .select("*")
            .order("created_at", { ascending: false });
        if (!error && data) {
            setCodes(data as PromoCode[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCodes();
    }, []);

    const handleCreate = async () => {
        if (!newCode.trim() || !supabase) return;
        setCreateLoading(true);
        const codeValue = newCode.trim().toUpperCase();
        const maxUsesValue = newMaxUses ? parseInt(newMaxUses) : null;

        const { error } = await supabase.from("promo_codes").insert({
            code: codeValue,
            max_uses: maxUsesValue,
            discount_type: "vip_bypass",
            discount_value: 100
        });

        if (!error) {
            setNewCode("");
            setNewMaxUses("");
            loadCodes();
        } else {
            alert("حدث خطأ! قد يكون الكود موجوداً بالفعل.");
        }
        setCreateLoading(false);
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!supabase) return;
        setActionLoading(id);
        const { error } = await supabase
            .from("promo_codes")
            .update({ is_active: !currentStatus })
            .eq("id", id);
        
        if (!error) {
            setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
        }
        setActionLoading(null);
    };

    const deleteCode = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الكود تماماً؟") || !supabase) return;
        setActionLoading(id);
        const { error } = await supabase.from("promo_codes").delete().eq("id", id);
        if (!error) {
            setCodes(prev => prev.filter(c => c.id !== id));
        }
        setActionLoading(null);
    };

    return (
        <div className="admin-glass-card rounded-3xl p-6 border-indigo-500/20" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">أكواد الـ VIP (السحرية)</h3>
                        <p className="text-xs text-indigo-400/80 font-bold mt-1">تتبع الأكواد، إنشاء خصومات جديدة، ومراجعة الاستخدام.</p>
                    </div>
                </div>
                <button onClick={loadCodes} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800 text-indigo-400">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Create New Form */}
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-3">
                <input
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="كود جديد (التحويل لـ UPPERCASE)"
                    className="flex-1 bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                />
                <input
                    type="number"
                    value={newMaxUses}
                    onChange={e => setNewMaxUses(e.target.value)}
                    placeholder="عدد المرات (اختياري: غير محدود)"
                    className="w-full md:w-64 bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                />
                <button
                    onClick={handleCreate}
                    disabled={createLoading || !newCode.trim()}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm transition-all disabled:opacity-50 w-full md:w-auto justify-center"
                >
                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    إنشاء كود
                </button>
            </div>

            {/* Codes List */}
            {codes.length === 0 && !loading ? (
                <div className="text-center py-8 text-slate-500 text-sm font-bold bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">لا يوجد أكواد سحرية حالياً</div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {codes.map(code => (
                        <div key={code.id} className={`flex items-center justify-between p-4 rounded-xl border ${code.is_active ? 'bg-slate-900/50 border-indigo-500/20' : 'bg-slate-900/20 border-slate-800 opacity-60'} transition-all`}>
                            <div className="flex items-center gap-4">
                                <div className="text-base font-black text-white font-mono bg-black/50 px-3 py-1 rounded-lg border border-slate-800">{code.code}</div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-slate-400 font-bold">الاستخدام: <span className="text-indigo-400">{code.times_used}</span> {code.max_uses ? `/ ${code.max_uses}` : '(غير محدود)'}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{new Date(code.created_at).toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleStatus(code.id, code.is_active)}
                                    disabled={actionLoading === code.id}
                                    className={`p-2 rounded-lg transition-colors border ${code.is_active ? 'text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20'}`}
                                    title={code.is_active ? "تعطيل الكود" : "تفعيل الكود"}
                                >
                                    {actionLoading === code.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (code.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />)}
                                </button>
                                <button
                                    onClick={() => deleteCode(code.id)}
                                    disabled={actionLoading === code.id}
                                    className="p-2 rounded-lg text-rose-400 bg-rose-400/10 border border-rose-400/20 hover:bg-rose-400/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
