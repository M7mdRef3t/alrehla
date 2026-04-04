import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Copy, Check, Shield, Briefcase, Link2, Loader2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import {
    registerAsCoach,
    addClient,
    getClients,
    isCoach,
    getMyShareCode,
    getShareWithCoachText,
    B2B_ROLE_LABELS,
    B2B_FEATURES,
    type B2BRole,
} from "../services/b2bService";

/* 
   B2B PORTAL  بابة اتشات اعاج
    */

type B2BView = "landing" | "coach_register" | "coach_dashboard" | "client_share" | "join_coach";

export const B2BPortal: FC = () => {
    const [view, setView] = useState<B2BView>("landing");
    const [copied, setCopied] = useState(false);
    const [clientCode, setClientCode] = useState("");
    const [clientAlias, setClientAlias] = useState("");
    const [addSuccess, setAddSuccess] = useState(false);

    // Coach registration form
    const [coachName, setCoachName] = useState("");
    const [coachRole, setCoachRole] = useState<B2BRole>("coach");
    const [coachSpec, setCoachSpec] = useState("");

    const [shareCode, setShareCode] = useState("");
    const [clients, setClients] = useState<Array<{ clientCode: string; clientAlias: string }>>([]);

    // Join coach
    const [inviteCode, setInviteCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinMessage, setJoinMessage] = useState({ text: "", type: "" });


    useEffect(() => {
        const init = async () => {
            const coachStatus = await isCoach();
            setView(coachStatus ? "coach_dashboard" : "landing");

            const code = await getMyShareCode();
            setShareCode(code);

            if (coachStatus) {
                const clientList = await getClients();
                setClients(clientList);
            }
        };
        init();
    }, []);

    const handleCopyShareCode = async () => {
        try {
            const text = await getShareWithCoachText();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* noop */ }
    };

    const handleRegisterCoach = async () => {
        if (!coachName.trim()) return;
        const success = await registerAsCoach(coachName, coachRole, coachSpec);
        if (success) {
            setView("coach_dashboard");
        }
    };

    const handleAddClient = async () => {
        if (!clientCode.trim() || !clientAlias.trim()) return;
        const success = await addClient(clientCode.trim(), clientAlias.trim());
        if (success) {
            setAddSuccess(true);
            setClientCode("");
            setClientAlias("");
            const updated = await getClients();
            setClients(updated);
            setTimeout(() => setAddSuccess(false), 2000);
        }
    };

    const handleJoinCoach = async () => {
        if (!inviteCode.trim() || !supabase) return;
        setIsJoining(true);
        setJoinMessage({ text: "", type: "" });
        try {
            // 1. Validate Invite Code
            const { data: inviteData, error: inviteError } = await supabase
                .from('coach_invites')
                .select('*')
                .eq('code', inviteCode.trim())
                .eq('used', false)
                .single();

            if (inviteError || !inviteData) {
                setJoinMessage({ text: "الكود غير صحيح أو مستخدم مسبقاً", type: "error" });
                setIsJoining(false);
                return;
            }

            // 2. Add coach_id to profile and set code to used
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setJoinMessage({ text: "يجب تسجيل الدخول أولاً", type: "error" });
                setIsJoining(false);
                return;
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ coach_id: inviteData.coach_id })
                .eq('id', session.user.id);

            if (profileError) {
                setJoinMessage({ text: "فشل في تحديث الحساب", type: "error" });
                setIsJoining(false);
                return;
            }

            await supabase
                .from('coach_invites')
                .update({ used: true, used_by: session.user.id })
                .eq('code', inviteData.code);

            setJoinMessage({ text: "تم ربط الحساب بنجاح!", type: "success" });
            setInviteCode("");
            setTimeout(() => setView("landing"), 2000);
        } catch {
            setJoinMessage({ text: "حدث خطأ غير متوقع", type: "error" });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto" dir="rtl">
            <AnimatePresence mode="wait">

                {/* Landing */}
                {view === "landing" && (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--soft-teal)]/20 flex items-center justify-center mx-auto mb-3">
                                <Briefcase className="w-7 h-7 text-[var(--soft-teal)]" />
                            </div>
                            <h1 className="text-xl font-black text-white">بابة احترف</h1>
                            <p className="text-sm text-slate-400 mt-1">تشات اعاج افس</p>
                        </div>

                        {/* Features */}
                        <div className="rounded-2xl p-4 mb-4"
                            style={{
                                background: "rgba(99,102,241,0.08)",
                                border: "1px solid rgba(99,102,241,0.2)",
                            }}>
                            <p className="text-xs font-bold text-[var(--soft-teal)] mb-3 uppercase tracking-wider">ا تحص ع</p>
                            <div className="space-y-2">
                                {B2B_FEATURES.map((f) => (
                                    <div key={f} className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-[var(--soft-teal)] shrink-0" />
                                        <span className="text-sm text-slate-300">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="space-y-3">
                            <motion.button
                                onClick={() => setView("coach_register")}
                                className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Briefcase className="w-4 h-4" />
                                أا تش / عاج  سج
                            </motion.button>

                            <motion.button
                                onClick={() => setView("client_share")}
                                className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "#94a3b8",
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Users className="w-4 h-4" />
                                أط اعاج أ تابع (شارك دك)
                            </motion.button>

                            <motion.button
                                onClick={() => setView("join_coach")}
                                className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2"
                                style={{
                                    background: "rgba(16, 185, 129, 0.1)",
                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                    color: "#34d399",
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link2 className="w-4 h-4" />
                                لدي كود دعوة من معالج (ربط حسابي)
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Coach Registration */}
                {view === "coach_register" && (
                    <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setView("landing")}
                            className="flex items-center gap-1.5 text-slate-400 text-sm mb-4 hover:text-white transition-colors"
                        >
                            رجع
                        </button>
                        <h2 className="text-lg font-bold text-white mb-4">تسج حترف</h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 mb-1.5 block">اس</label>
                                <input
                                    id="b2b-coach-name"
                                    name="b2bCoachName"
                                    value={coachName}
                                    onChange={(e) => setCoachName(e.target.value)}
                                    placeholder="د. أحد حد"
                                    className="w-full rounded-xl p-3 text-sm text-white outline-none"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1.5 block">در</label>
                                <div className="flex gap-2">
                                    {(Object.keys(B2B_ROLE_LABELS) as B2BRole[]).map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setCoachRole(role)}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                                            style={{
                                                background: coachRole === role ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                                                border: `1px solid ${coachRole === role ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                                                color: coachRole === role ? "#818cf8" : "#64748b",
                                            }}
                                        >
                                            {B2B_ROLE_LABELS[role]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1.5 block">تخصص (اختار)</label>
                                <input
                                    id="b2b-coach-spec"
                                    name="b2bCoachSpec"
                                    value={coachSpec}
                                    onChange={(e) => setCoachSpec(e.target.value)}
                                    placeholder="عاات  تطر ذات..."
                                    className="w-full rounded-xl p-3 text-sm text-white outline-none"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                />
                            </div>

                            <motion.button
                                onClick={handleRegisterCoach}
                                disabled={!coachName.trim()}
                                className="w-full py-3.5 rounded-2xl font-bold text-white mt-2"
                                style={{
                                    background: coachName.trim()
                                        ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                                        : "rgba(99,102,241,0.2)",
                                }}
                                whileHover={coachName.trim() ? { scale: 1.02 } : {}}
                                whileTap={coachName.trim() ? { scale: 0.98 } : {}}
                            >
                                تسج فتح حة اتح
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Coach Dashboard */}
                {view === "coach_dashboard" && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">حة تح اتش</h2>
                            <div className="px-2.5 py-1 rounded-full text-xs font-bold"
                                style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                                {clients.length} ع
                            </div>
                        </div>

                        {/* Add client */}
                        <div className="rounded-2xl p-4 mb-4"
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}>
                            <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5" />
                                إضافة ع جدد
                            </p>
                            <div className="space-y-2">
                                <input
                                    id="b2b-client-code"
                                    name="b2bClientCode"
                                    value={clientCode}
                                    onChange={(e) => setClientCode(e.target.value)}
                                    placeholder="د اع (B2B-XXXXXX)"
                                    className="w-full rounded-xl p-2.5 text-sm text-white outline-none font-mono"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                />
                                <input
                                    id="b2b-client-alias"
                                    name="b2bClientAlias"
                                    value={clientAlias}
                                    onChange={(e) => setClientAlias(e.target.value)}
                                    placeholder="اس ستعار (خصصة)"
                                    className="w-full rounded-xl p-2.5 text-sm text-white outline-none"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                />
                                <motion.button
                                    onClick={handleAddClient}
                                    disabled={!clientCode.trim() || !clientAlias.trim()}
                                    className="w-full py-2.5 rounded-xl font-bold text-sm"
                                    style={{
                                        background: addSuccess
                                            ? "rgba(52,211,153,0.2)"
                                            : "rgba(99,102,241,0.2)",
                                        border: `1px solid ${addSuccess ? "rgba(52,211,153,0.4)" : "rgba(99,102,241,0.3)"}`,
                                        color: addSuccess ? "#34d399" : "#818cf8",
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {addSuccess ? " ت اإضافة!" : "إضافة ع"}
                                </motion.button>
                            </div>
                        </div>

                        {/* Clients list */}
                        {clients.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 mb-2">عاؤ</p>
                                {clients.map((c) => (
                                    <div key={c.clientCode}
                                        className="flex items-center justify-between p-3 rounded-xl"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                        }}>
                                        <div>
                                            <p className="text-sm font-bold text-white">{c.clientAlias}</p>
                                            <p className="text-xs text-slate-500 font-mono">{c.clientCode}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-xs text-slate-400">شط</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-600">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">ا جد عاء بعد</p>
                                <p className="text-xs mt-1">اطب  عائ شارة د ع</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Client Share Code */}
                {view === "client_share" && (
                    <motion.div
                        key="client"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setView("landing")}
                            className="flex items-center gap-1.5 text-slate-400 text-sm mb-4 hover:text-white transition-colors"
                        >
                            رجع
                        </button>

                        <h2 className="text-lg font-bold text-white mb-2">د تابعة</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            شار ذا اد ع تش أ عاج. تح  تابعة تد اعا فط  بد تفاص شخصة.
                        </p>

                        {/* Code display */}
                        <div className="p-5 rounded-2xl mb-4 text-center"
                            style={{
                                background: "rgba(99,102,241,0.1)",
                                border: "1px solid rgba(99,102,241,0.25)",
                            }}>
                            <p className="text-xs text-[var(--soft-teal)] mb-2 font-bold">د اشخص</p>
                            <p className="text-3xl font-black text-white tracking-widest font-mono">{shareCode}</p>
                        </div>

                        {/* Privacy note */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl mb-4"
                            style={{
                                background: "rgba(52,211,153,0.08)",
                                border: "1px solid rgba(52,211,153,0.2)",
                            }}>
                            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-300">
                                اتش ر فط: عدد اأا اشطة ست اتد اعا عدد احدد اُضافة.
                                ا ر اأساء أ اتفاص اشخصة.
                            </p>
                        </div>

                        <motion.button
                            onClick={handleCopyShareCode}
                            className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                            style={{
                                background: copied
                                    ? "linear-gradient(135deg, #059669, #047857)"
                                    : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "ت اسخ!" : "سخ اد رساة اشارة"}
                        </motion.button>
                    </motion.div>
                )}

                {/* Join Coach using Invite Code */}
                {view === "join_coach" && (
                    <motion.div
                        key="join_coach"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setView("landing")}
                            className="flex items-center gap-1.5 text-slate-400 text-sm mb-4 hover:text-white transition-colors"
                        >
                            رجع للبوابة
                        </button>
                        <h2 className="text-lg font-bold text-white mb-4">الانضمام لمعالج محترف</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            أدخل كود الدعوة المكون من 15 حرف والذي حصلت عليه من معالجك النفسي أو مدربك الخاص.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <input
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="DWYR-COACH-XXXX"
                                    className="w-full rounded-xl p-4 text-center text-xl font-mono text-white outline-none tracking-widest placeholder:text-slate-600 focus:bg-white/5"
                                    style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                />
                            </div>

                            {joinMessage.text && (
                                <div className={`p-3 rounded-lg text-sm text-center font-bold ${joinMessage.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {joinMessage.text}
                                </div>
                            )}

                            <motion.button
                                onClick={handleJoinCoach}
                                disabled={isJoining || inviteCode.length < 15}
                                className="w-full py-3.5 rounded-2xl font-bold text-white mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{
                                    background: inviteCode.length >= 15
                                        ? "linear-gradient(135deg, #059669, #047857)"
                                        : "rgba(52,211,153,0.1)",
                                }}
                                whileHover={inviteCode.length >= 15 && !isJoining ? { scale: 1.02 } : {}}
                                whileTap={inviteCode.length >= 15 && !isJoining ? { scale: 0.98 } : {}}
                            >
                                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : "ربط الحساب بالمعالج"}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};



