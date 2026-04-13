import type { FC } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2, Ticket, XCircle, ArrowRight, Loader2, Image as ImageIcon, Zap } from "lucide-react";
import { fetchOpenSupportTickets, resolveActivationTicket, rejectActivationTicket, type SupportTicketEntry } from "@/services/adminApi";
import { supabase } from "@/services/supabaseClient";

export const SupportTicketsPanel: FC = () => {
    const [tickets, setTickets] = useState<SupportTicketEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectingTicket, setRejectingTicket] = useState<SupportTicketEntry | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [activatingTicket, setActivatingTicket] = useState<SupportTicketEntry | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const [bypassEmailOrPhone, setBypassEmailOrPhone] = useState("");
    const [bypassLoading, setBypassLoading] = useState(false);
    const [bypassSuccess, setBypassSuccess] = useState(false);

    const showError = (msg: string) => {
        setLocalError(msg);
        setTimeout(() => setLocalError(null), 5000);
    };

    const loadTickets = async () => {
        setLoading(true);
        const data = await fetchOpenSupportTickets();
        if (data) setTickets(data);
        setLoading(false);
    };

    useEffect(() => {
        loadTickets();
        const interval = setInterval(loadTickets, 30_000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    const handleResolveClick = (ticket: SupportTicketEntry) => {
        const userId = typeof ticket.metadata?.user_id === "string" ? ticket.metadata.user_id : ticket.sessionId;
        const email = typeof ticket.metadata?.email === "string" ? ticket.metadata.email : null;
        const phone = typeof ticket.metadata?.phone === "string" ? ticket.metadata.phone : null;

        if (!userId && !email && !phone) {
            showError("لم يتم العثور على بيانات المستخدم (ID/Email/Phone). لا يمكن التفعيل.");
            return;
        }

        setActivatingTicket(ticket);
    };

    const submitResolve = async () => {
        if (!activatingTicket) return;
        const ticket = activatingTicket;
        const userId = typeof ticket.metadata?.user_id === "string" ? ticket.metadata.user_id : ticket.sessionId;
        const email = typeof ticket.metadata?.email === "string" ? ticket.metadata.email : null;
        const phone = typeof ticket.metadata?.phone === "string" ? ticket.metadata.phone : null;

        setActionLoading(ticket.id);
        const success = await resolveActivationTicket(ticket.id, userId || "", email, phone);
        if (success) {
            setTickets(prev => prev.filter(t => t.id !== ticket.id));
        } else {
            showError("حدث خطأ أثناء التفعيل.");
        }
        setActionLoading(null);
        setActivatingTicket(null);
    };

    const handleRejectClick = (ticket: SupportTicketEntry) => {
        setRejectingTicket(ticket);
        setRejectReason("");
    };

    const submitReject = async () => {
        if (!rejectingTicket) return;
        if (!rejectReason.trim()) {
            showError("يرجى إدخال سبب الرفض.");
            return;
        }
        setActionLoading(rejectingTicket.id);
        const success = await rejectActivationTicket(rejectingTicket.id, rejectReason);
        if (success) {
            setTickets(prev => prev.filter(t => t.id !== rejectingTicket.id));
        } else {
            showError("حدث خطأ أثناء الإلغاء.");
        }
        setActionLoading(null);
        setRejectingTicket(null);
        setRejectReason("");
    };

    const getImageUrl = (proofImage: any) => {
        if (!proofImage) return null;
        if (proofImage.data_url) return proofImage.data_url;
        if (proofImage.storage_bucket && proofImage.storage_path) {
            if (!supabase) return null;
            const { data } = supabase.storage.from(proofImage.storage_bucket).getPublicUrl(proofImage.storage_path);
            return data.publicUrl;
        }
        return null;
    };

    const handleBypassSubmit = async () => {
        if (!bypassEmailOrPhone.trim()) return;
        setBypassLoading(true);
        setLocalError(null);
        setBypassSuccess(false);
        try {
            const isEmail = bypassEmailOrPhone.includes("@");
            const payload = {
                code: "DAWAYIR-VIP", // Local admin bypass relying on the master default, if changed in env they can use the promo box
                email: isEmail ? bypassEmailOrPhone.trim() : "",
                phone: !isEmail ? bypassEmailOrPhone.trim() : ""
            };
            const res = await fetch("/api/checkout/vip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setBypassSuccess(true);
                setBypassEmailOrPhone("");
                setTimeout(() => setBypassSuccess(false), 3000);
            } else {
                showError(data.message || "فشل التفعيل السريع. هل كود الإدارة صحيح؟");
            }
        } catch (e) {
            showError("خطأ في الاتصال");
        } finally {
            setBypassLoading(false);
        }
    };

    return (
        <div className="admin-glass-card rounded-3xl p-6 border-emerald-500/20 relative" dir="rtl">
            {localError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-500/90 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center gap-2 z-50 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                    <XCircle className="w-4 h-4" />
                    {localError}
                </div>
            )}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Ticket className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">بوابة العبور (طلبات التفعيل)</h3>
                        <p className="text-xs text-emerald-400/80 font-bold mt-1">تذاكر الدفع اليدوي — اتأكد من الوصل وفتح الطريق للمسافر</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">{tickets.length} طلبات مستنية</span>
                </div>
            </div>

            {/* Direct Admin Bypass */}
            <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-teal-400">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm font-black uppercase">تسريع التفعيل:</span>
                </div>
                <input
                    type="text"
                    value={bypassEmailOrPhone}
                    onChange={e => setBypassEmailOrPhone(e.target.value)}
                    placeholder="إيميل أو هاتف المستخدم..."
                    className="flex-1 bg-black/50 border border-teal-500/30 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
                />
                <button
                    onClick={() => handleBypassSubmit()}
                    disabled={bypassLoading || !bypassEmailOrPhone.trim()}
                    className="px-6 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-sm transition-all disabled:opacity-50"
                >
                    {bypassLoading ? "..." : (bypassSuccess ? "تم بنجاح!" : "تفعيل فوري")}
                </button>
            </div>

            {loading && tickets.length === 0 ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/30">
                    <CheckCircle2 className="w-8 h-8 mb-2 opacity-50 text-emerald-500" />
                    <p className="text-sm font-bold uppercase tracking-widest">لا توجد طلبات معلقة</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {tickets.map(ticket => {
                        const meta = ticket.metadata || {};
                        const proofImage = meta.proof_image;
                        const imageUrl = getImageUrl(proofImage);
                        const isActionable = actionLoading === ticket.id;

                        return (
                            <div key={ticket.id} className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/50" />
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white">{ticket.title}</span>
                                                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1" dir="ltr">{ticket.id}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800 font-mono" dir="ltr">
                                            {ticket.message.split('\n').map((line, i) => (
                                                <div key={i}>{line}</div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {imageUrl && (
                                        <div className="shrink-0 lg:w-48 xl:w-64">
                                            <a href={imageUrl} target="_blank" rel="noreferrer" className="block relative group-hover:ring-2 ring-emerald-500/50 rounded-xl overflow-hidden transition-all bg-slate-900 aspect-video lg:aspect-auto h-full min-h-[100px] flex items-center justify-center border border-slate-800">
                                                <img src={imageUrl} alt="Proof" className="object-cover w-full h-full max-h-40" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <ImageIcon className="w-6 h-6 text-white" />
                                                </div>
                                            </a>
                                        </div>
                                    )}

                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800/80 justify-end flex items-center gap-3">
                                    <button
                                        disabled={!!actionLoading}
                                        onClick={() => handleRejectClick(ticket)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        إلغاء (رفض)
                                    </button>
                                    <button
                                        disabled={!!actionLoading}
                                        onClick={() => handleResolveClick(ticket)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50"
                                    >
                                        {isActionable ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        تفعيل وصرف المبيعات
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {rejectingTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
                    <div className="bg-[#0B0F19] border border-rose-500/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(244,63,94,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-rose-500/50" />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <XCircle className="w-5 h-5 text-rose-400" />
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tighter">ليه هنرفض؟</h3>
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-4 font-bold">
                            الرحلة مش هتبدأ للشخص ده.. قولي إيه اللي ناقص عشان نكون صريحين معاه.
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="مثال: الإيصال مش واضح، أو المبلغ مش كامل..."
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all min-h-[100px] mb-6 custom-scrollbar resize-none font-medium"
                            autoFocus
                        />

                        <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                            <button
                                onClick={() => setRejectingTicket(null)}
                                disabled={!!actionLoading}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                تراجع
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={!!actionLoading || !rejectReason.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-900 bg-rose-400 hover:bg-rose-300 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50"
                            >
                                {actionLoading === rejectingTicket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                تأكيد الإلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activatingTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
                    <div className="bg-[#0B0F19] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(52,211,153,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/50" />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tighter">تأكيد التفعيل والصرف</h3>
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-6 font-bold leading-relaxed">
                            هل أنت متأكد من تفعيل هذا البطل؟ 
                            بمجرد التأكيد سيتم تفعيل حسابه مباشرة في المنصة، وسيتم إرسال إشارة الشراء بنجاح <span className="text-emerald-400">لـ Meta Ads</span>.
                        </p>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                            <button
                                onClick={() => setActivatingTicket(null)}
                                disabled={!!actionLoading}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                تراجع
                            </button>
                            <button
                                onClick={submitResolve}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50"
                            >
                                {actionLoading === activatingTicket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                تأكيد التفعيل
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
