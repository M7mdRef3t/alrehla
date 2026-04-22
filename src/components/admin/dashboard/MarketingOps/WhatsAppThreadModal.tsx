import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, RefreshCw, Send, AlertCircle, Bot, Check, CheckCheck, Clock, Brain, Sparkles } from "lucide-react";
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { useToastState } from '@/modules/map/dawayirIndex';

interface WhatsAppEvent {
  id: string;
  whatsapp_message_id: string;
  from_phone: string;
  to_phone: string;
  message_body: string;
  message_type: string;
  direction: "inbound" | "outbound";

  created_at: string;
  intent_detected?: string;
  metadata?: {
    [key: string]: any;
  };
  raw_payload: {
    oracle_strategy?: {
      suggestion: string;
      reasoning: string;
    };
    [key: string]: any;
  };
}

interface WhatsAppThreadModalProps {
  leadId: string | null;
  phone: string | null;
  name: string | null;
  onClose: () => void;
  oracleAdvice?: string;
  leadGrade?: string;
  campaign?: string;
  adSource?: string;
}

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

const QUICK_REPLIES = [
  "يا هلا بيك في الرحلة.. قولي إيه اللي شاغل بالك دلوقتي ومحتاج تفهمه؟",
  "الخطة بتقول إننا محتاجين مكالمة تكتيكية 5 دقائق نصفي فيها الأمور.. إيه رأيك؟",
  "الأوركال شايف إن 'جلسة التقييم' هي الخطوة الجاية المناسبة ليك.. تحب نحجز؟",
  "انطلق وفعل حسابك من هنا عشان تبدأ الرحلة بجد: https://alrehla.app/activation"
];

export function WhatsAppThreadModal({ 
  leadId, phone, name, onClose, oracleAdvice, leadGrade, campaign, adSource 
}: WhatsAppThreadModalProps) {
  const [events, setEvents] = useState<WhatsAppEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showToast = useToastState((s) => s.showToast);

  const fetchEvents = async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing-ops/lead/${leadId}/whatsapp`, {
        headers: { authorization: `Bearer ${getBearerToken()}` },
      });
      if (!res.ok) throw new Error("فشل في تحميل التايم لاين");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e: any) {
      setError("مش عارفين نحمل المحادثات دلوقتي..");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchEvents();
  }, [leadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const insertQuickReply = (text: string) => {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
  };

  if (!leadId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl admin-glass-card flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-slate-900/40 relative z-10 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  {name || "مسافر جديد"}
                  {leadGrade && (
                     <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[8px] font-black border border-indigo-500/20">GRADE {leadGrade}</span>
                  )}
                </h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80 flex items-center gap-2">
                  <span>{phone || "رقم مجهول"}</span>
                  <span className="opacity-40">•</span>
                  <span>WhatsApp Cloud</span>
                  {campaign && (
                    <span className="px-1.5 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-[8px]">
                      {campaign.replace(/_/g, ' ')}
                    </span>
                  )}
                  {adSource && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px]">
                      {adSource}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchEvents}
                disabled={loading}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Oracle Advice Overlay */}
          {oracleAdvice && (
            <div className="bg-indigo-500/10 border-b border-indigo-500/10 p-4 relative shrink-0">
               <div className="absolute top-2 left-4 opacity-5"><Brain className="w-8 h-8 text-indigo-400" /></div>
               <div className="flex items-start gap-3">
                  <Bot className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">توجيه عين الصقر</p>
                     <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{oracleAdvice}"</p>
                  </div>
               </div>
            </div>
          )}

          {/* Chat Window */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10 space-y-4" ref={scrollRef}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-rose-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            ) : events.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500">
                <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">مفيش محادثات مسجلة هنا</p>
              </div>
            ) : (
              events.map((ev) => {
                const isOutbound = ev.direction === "outbound";
                const time = new Date(ev.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={ev.id} className="space-y-2">
                    <div className={`flex ${isOutbound ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-2xl p-3 relative ${
                        isOutbound 
                          ? "bg-slate-800 text-slate-200 rounded-tr-sm border border-white/5" 
                          : "bg-emerald-600 text-white rounded-tl-sm shadow-[0_4px_15px_rgba(5,150,105,0.3)]"
                      }`}>
                        {ev.intent_detected && (
                          <div className="absolute -top-3 right-2 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[8px] font-black tracking-wider flex items-center gap-1 shadow-md">
                            <Bot className="w-2 h-2" />
                            {ev.intent_detected}
                          </div>
                        )}
                        
                        {ev.message_type === "template" && (
                          <span className="text-[9px] uppercase font-black tracking-widest text-[#2bd7af] mb-1 block">Template Message</span>
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{ev.message_body || "رسالة ميديا أو قالب مسجل"}</p>
                        
                        <div className="flex items-center justify-end gap-1 mt-1.5 opacity-60">
                          <span className="text-[10px] font-bold">{time}</span>
                          {isOutbound && (
                            <CheckCheck className="w-3 h-3 text-[#2bd7af]" /> 
                          )}
                        </div>
                      </div>
                    </div>

                    {!isOutbound && ev.raw_payload?.oracle_strategy && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mr-8 ml-auto max-w-[80%] p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-5"><Brain className="w-12 h-12" /></div>
                        <div className="flex items-start gap-3 relative z-10">
                          <Bot className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">تحليل الأوركال للرسالة</span>
                              <button 
                                onClick={() => insertQuickReply(ev.raw_payload?.oracle_strategy?.suggestion || "")}
                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-[9px] font-black text-indigo-200 transition-all border border-indigo-500/30"
                              >
                                <Sparkles className="w-3 h-3" />
                                استخدم الرد المقترح
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                              <span className="text-indigo-400/80">التحليل:</span> {ev.raw_payload.oracle_strategy.reasoning}
                            </p>
                            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                               <p className="text-[11px] text-emerald-400 leading-relaxed font-bold italic">
                                 "{ev.raw_payload.oracle_strategy.suggestion}"
                               </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
            {loading && events.length === 0 && (
              <div className="flex justify-center p-4">
                <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Quick Replies Area */}
          <div className="px-4 py-2 border-t border-white/5 bg-slate-900/30 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 shrink-0">
             {QUICK_REPLIES.map((reply, idx) => (
                <button 
                  key={idx}
                  onClick={() => insertQuickReply(reply)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                >
                  {reply.length > 35 ? reply.substring(0, 35) + "..." : reply}
                </button>
             ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900/60 border-t border-white/10 relative z-10 backdrop-blur-md shrink-0">
             <form 
               onSubmit={async (e) => {
                 e.preventDefault();
                 const form = e.currentTarget;
                 const input = form.elements.namedItem("message") as HTMLInputElement;
                 const text = input.value.trim();
                 if (!text || loading) return;

                 setLoading(true);
                 try {
                   const res = await fetch(`/api/admin/marketing-ops/lead/${leadId}/whatsapp`, {
                     method: "POST",
                     headers: { 
                       "Content-Type": "application/json",
                       authorization: `Bearer ${getBearerToken()}` 
                     },
                     body: JSON.stringify({ message: text }),
                   });
                   const data = await res.json();
                   
                   if (!res.ok) {
                     if (data.isWindowClosed) {
                       showToast("النافذة مقفولة: لازم العميل يبعت رسالة الأول عشان تعرف ترد.", "warning");
                     } else {
                       showToast(`فشلت المهمة: ${data.error || "خطأ غير معروف"}`, "error");
                     }
                   } else {
                     input.value = "";
                     await fetchEvents();
                     showToast("تم إرسال الرسالة بنجاح", "success");
                   }
                 } catch (err) {
                   showToast("السيرفر مش مجمع.. جرب تاني", "error");
                 } finally {
                   setLoading(false);
                 }
               }}
               className="flex items-center px-4 py-2 bg-black/50 border border-white/10 rounded-xl focus-within:border-emerald-500/50 transition-all"
             >
               <input 
                 ref={inputRef}
                 name="message"
                 type="text" 
                 placeholder="اكتب ردك هنا وتوكل على الله..." 
                 className="flex-1 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none"
                 autoComplete="off"
               />
               <button 
                 type="submit"
                 disabled={loading}
                 className="p-2 text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-30"
               >
                 {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
               </button>
             </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
