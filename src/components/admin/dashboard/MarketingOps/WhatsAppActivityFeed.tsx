import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowDownLeft, ArrowUpRight, Zap, Info, ShieldAlert, User, Clock, ExternalLink, Brain, Bot } from 'lucide-react';

interface WhatsAppEvent {
  id: string;
  created_at: string;
<<<<<<< HEAD
  phone: string;
  message_text: string;
  direction: 'inbound' | 'outbound';
  intent: string;
  status_assigned: string;
  metadata: any;
=======
  from_phone: string;
  to_phone: string;
  message_body: string;
  direction: 'inbound' | 'outbound';
  intent_detected: string;
  raw_payload: any;
>>>>>>> feat/sovereign-final-stabilization
  lead_id: string | null;
  marketing_leads: {
    name: string;
    status: string;
    campaign?: string;
    source?: string;
    ad?: string;
  } | null;
}

interface WhatsAppActivityFeedProps {
  onOpenWhatsapp?: (
    leadId: string, 
    phone: string, 
    name: string, 
    oracleAdvice?: string, 
    leadGrade?: string,
    campaign?: string,
    source?: string
  ) => void;
}

export const WhatsAppActivityFeed: React.FC<WhatsAppActivityFeedProps> = ({ onOpenWhatsapp }) => {
  const [events, setEvents] = useState<WhatsAppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const getIntentColor = (intent: string) => {
    switch (intent) {
<<<<<<< HEAD
      case 'payment_requested': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'info_requested': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'support_needed': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'generic': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'spam': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/5 border-white/5';
=======
      case 'payment_requested': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'info_requested': return 'text-sky-300 bg-sky-500/10 border-sky-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(14,165,233,0.2)]';
      case 'support_needed': return 'text-amber-300 bg-amber-500/10 border-amber-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'generic': return 'text-slate-300 bg-slate-500/10 border-slate-500/30 backdrop-blur-md';
      case 'spam': return 'text-rose-300 bg-rose-500/10 border-rose-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(244,63,94,0.2)]';
      default: return 'text-slate-400 bg-white/5 border-white/10 backdrop-blur-md';
>>>>>>> feat/sovereign-final-stabilization
    }
  };

  const getIntentLabel = (intent: string) => {
    switch (intent) {
      case 'payment_requested': return 'طلب حجز/دفع';
      case 'info_requested': return 'استفسار عن الخدمة';
      case 'support_needed': return 'دعم فني';
      case 'generic': return 'رسالة عامة';
      case 'spam': return 'سبام';
      default: return intent || 'غير معروف';
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">آخر التفاعلات اللحظية</h3>
        <button 
          onClick={() => fetchEvents()} 
          className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1 rounded-full transition-all border border-white/5"
        >
          تحديث الآن
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950/20 border border-white/5">
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
          <AnimatePresence initial={false}>
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs italic">
                لا توجد أحداث واتساب مسجلة حالياً
              </div>
            ) : (
              events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    if (onOpenWhatsapp && event.lead_id) {
                      onOpenWhatsapp(
                        event.lead_id, 
<<<<<<< HEAD
                        event.phone, 
                        event.marketing_leads?.name || event.phone,
                        event.metadata?.oracle_strategy?.suggestion,
                        event.metadata?.oracle_grade, // Assuming grade might be in metadata
=======
                        event.direction === 'inbound' ? event.from_phone : event.to_phone, 
                        event.marketing_leads?.name || (event.direction === 'inbound' ? event.from_phone : event.to_phone),
                        event.raw_payload?.oracle_strategy?.suggestion,
                        event.raw_payload?.oracle_grade,
>>>>>>> feat/sovereign-final-stabilization
                        event.marketing_leads?.campaign,
                        event.marketing_leads?.source
                      );
                    }
                  }}
                  className={`group relative p-4 mb-2 rounded-2xl border transition-all duration-300 hover:bg-white/[0.02] ${
<<<<<<< HEAD
                    event.lead_id ? 'cursor-pointer' : ''
=======
                    event.lead_id ? '' : ''
>>>>>>> feat/sovereign-final-stabilization
                  } ${
                    event.direction === 'inbound' ? 'border-white/5 bg-slate-900/40' : 'border-indigo-500/10 bg-indigo-500/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Direction Icon */}
                    <div className={`mt-1 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
                      event.direction === 'inbound' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                      {event.direction === 'inbound' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white truncate max-w-[150px]">
<<<<<<< HEAD
                            {event.marketing_leads?.name || event.phone}
                          </span>
                          {event.intent && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getIntentColor(event.intent)}`}>
                              {getIntentLabel(event.intent)}
=======
                            {event.marketing_leads?.name || (event.direction === 'inbound' ? event.from_phone : event.to_phone)}
                          </span>
                          {event.intent_detected && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getIntentColor(event.intent_detected)}`}>
                              {getIntentLabel(event.intent_detected)}
>>>>>>> feat/sovereign-final-stabilization
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(event.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed break-words">
<<<<<<< HEAD
                        {event.message_text}
                      </p>

                      {/* CTWA / Referral Badge */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.metadata?.referral && (
                          <div className="text-[10px] bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded-lg border border-fuchsia-500/20 flex items-center gap-2 w-fit">
                            <Zap className="w-3 h-3" />
                            <span>مصدر إعلاني: {event.metadata.referral.headline || event.metadata.referral.source_id}</span>
=======
                        {event.message_body}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.raw_payload?.referral && (
                          <div className="text-[10px] bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded-lg border border-fuchsia-500/20 flex items-center gap-2 w-fit">
                            <Zap className="w-3 h-3" />
                            <span>مصدر إعلاني: {event.raw_payload.referral.headline || event.raw_payload.referral.source_id}</span>
>>>>>>> feat/sovereign-final-stabilization
                          </div>
                        )}
                        {event.marketing_leads?.campaign && (
                          <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-2 w-fit">
                            <ShieldAlert className="w-3 h-3 opacity-50" />
                            <span>حملة: {event.marketing_leads.campaign}</span>
                          </div>
                        )}
                        {event.marketing_leads?.source && (
                          <div className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-1 rounded-lg border border-white/5 flex items-center gap-2 w-fit">
                            <ExternalLink className="w-3 h-3" />
                            <span>المصدر: {event.marketing_leads.source}</span>
                          </div>
                        )}
                      </div>

<<<<<<< HEAD
                      {/* Oracle Strategy Relay (New) */}
                      {event.direction === 'inbound' && event.metadata?.oracle_strategy && (
                        <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group/oracle">
                          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/oracle:scale-110 transition-transform">
                            <Brain className="w-8 h-8 text-indigo-400" />
                          </div>
                          <div className="flex items-start gap-2 relative z-10">
                            <Bot className="w-4 h-4 text-indigo-400 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">تحليل الاستراتيجية (عين الصقر)</p>
                              <p className="text-[11px] text-slate-300 leading-relaxed italic">
                                "{event.metadata.oracle_strategy.suggestion}"
                              </p>
                              <p className="text-[8px] text-indigo-400/70 font-bold uppercase">
                                السبب: {event.metadata.oracle_strategy.reasoning}
                              </p>
                            </div>
=======
                      {/* Oracle Strategy Relay (Compact) */}
                      {event.direction === 'inbound' && event.raw_payload?.oracle_strategy && (
                        <div className="mt-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-colors relative overflow-hidden group/oracle flex gap-2 items-start">
                          <Brain className="w-3.5 h-3.5 text-indigo-400 mt-1 shrink-0 opacity-70 group-hover/oracle:opacity-100 transition-opacity" />
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-slate-300 font-medium">
                              "{event.raw_payload.oracle_strategy.suggestion}"
                            </p>
                            <p className="text-[9px] text-indigo-400/80">
                              <span className="font-bold opacity-70">التحليل:</span> {event.raw_payload.oracle_strategy.reasoning}
                            </p>
>>>>>>> feat/sovereign-final-stabilization
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-[10px] text-center text-slate-600 italic">
        * يتم تحديث هذه القائمة تلقائياً كل 30 ثانية لرصد حركة السيادة.
      </div>
    </div>
  );
};
