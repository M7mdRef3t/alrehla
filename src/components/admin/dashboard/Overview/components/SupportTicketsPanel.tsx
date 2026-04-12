import type { FC } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2, Ticket, XCircle, ArrowRight, Loader2, Image as ImageIcon } from "lucide-react";
import { fetchOpenSupportTickets, resolveActivationTicket, rejectActivationTicket, type SupportTicketEntry } from "@/services/adminApi";
import { supabase } from "@/services/supabaseClient";

export const SupportTicketsPanel: FC = () => {
    const [tickets, setTickets] = useState<SupportTicketEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    const handleResolve = async (ticket: SupportTicketEntry) => {
        const userId = typeof ticket.metadata?.user_id === "string" ? ticket.metadata.user_id : ticket.sessionId;
        const email = typeof ticket.metadata?.email === "string" ? ticket.metadata.email : null;
        const phone = typeof ticket.metadata?.phone === "string" ? ticket.metadata.phone : null;

        if (!userId && !email && !phone) {
            alert("No user ID, email, or phone found on this ticket. Cannot activate.");
            return;
        }

        if (confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† ØªÙØ¹ÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø·Ù„ØŸ (Ø³ÙŠØªÙ… ØªÙØ¹ÙŠÙ„ Ø­Ø³Ø§Ø¨Ù‡ØŒ ÙˆØ¥ØµØ¯Ø§Ø± Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ù„Ù€ Meta)")) {
            setActionLoading(ticket.id);
            // Pass empty string for userId if null, or just let it pass it as null if signature allows.
            const success = await resolveActivationTicket(ticket.id, userId || "", email, phone);
            if (success) {
                setTickets(prev => prev.filter(t => t.id !== ticket.id));
            } else {
                alert("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªÙØ¹ÙŠÙ„.");
            }
            setActionLoading(null);
        }
    };

    const handleReject = async (ticket: SupportTicketEntry) => {
        const reason = prompt("Ù…Ø§ Ù‡Ùˆ Ø³Ø¨Ø¨ Ø§Ù„Ø±ÙØ¶ØŸ (Ø³ÙŠØªÙ… ØºÙ„Ù‚ Ø§Ù„ØªØ°ÙƒØ±Ø© Ø¨Ø¯ÙˆÙ† ØªÙØ¹ÙŠÙ„)");
        if (reason !== null) {
            setActionLoading(ticket.id);
            const success = await rejectActivationTicket(ticket.id, reason);
            if (success) {
                setTickets(prev => prev.filter(t => t.id !== ticket.id));
            } else {
                alert("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¥Ù„ØºØ§Ø¡.");
            }
            setActionLoading(null);
        }
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

    return (
        <div className="admin-glass-card rounded-3xl p-6 border-emerald-500/20 relative" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Ticket className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Ø¥ÙŠØ¯Ø§Ø¹Ø§Øª Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±</h3>
                        <p className="text-xs text-emerald-400/80 font-bold mt-1">ØªØ°Ø§ÙƒØ± Ø§Ù„Ø¯ÙØ¹ Ø§Ù„ÙŠØ¯ÙˆÙŠ (Activation Source of Truth)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">{tickets.length} Ø·Ù„Ø¨Ø§Øª</span>
                </div>
            </div>

            {loading && tickets.length === 0 ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/30">
                    <CheckCircle2 className="w-8 h-8 mb-2 opacity-50 text-emerald-500" />
                    <p className="text-sm font-bold uppercase tracking-widest">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©</p>
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
                                        onClick={() => handleReject(ticket)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø·Ù„Ø¨
                                    </button>
                                    <button
                                        disabled={!!actionLoading}
                                        onClick={() => handleResolve(ticket)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50"
                                    >
                                        {isActionable ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        ØªÙØ¹ÙŠÙ„ ÙˆØµØ±Ù Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
