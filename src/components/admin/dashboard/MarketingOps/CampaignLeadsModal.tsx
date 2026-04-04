import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, CalendarDays, Key, RefreshCw, Edit2, Send, Check, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminState } from "../../../../state/adminState";
import { getAuthToken } from "../../../../state/authState";

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

interface CampaignLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leads: any[];
  onLeadUpdated: () => void;
}

export function CampaignLeadsModal({ isOpen, onClose, title, leads, onLeadUpdated }: CampaignLeadsModalProps) {
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string, msg: string, isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const showMsg = (id: string, msg: string, isError = false) => {
    setActionMessage({ id, msg, isError });
    setTimeout(() => {
      setActionMessage(prev => prev?.id === id ? null : prev);
    }, 4000);
  };

  const startEdit = (lead: any) => {
    setEditingLeadId(lead.id);
    setEditForm({
      name: lead.name || "",
      phone_normalized: lead.phone_normalized || "",
      email: lead.email || "",
    });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/marketing-ops/lead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ id, ...editForm })
      });
      const data = await res.json();
      if (data.ok) {
        showMsg(id, "تم التعديل بنجاح");
        setEditingLeadId(null);
        onLeadUpdated();
      } else {
        showMsg(id, "فشل التعديل: " + data.error, true);
      }
    } catch {
      showMsg(id, "حدث خطأ غير متوقع", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResend = async (lead: any) => {
    if (!lead.email) {
      showMsg(lead.id, "لا يوجد بريد إلكتروني لإعادة الإرسال", true);
      return;
    }
    setResendingId(lead.id);
    try {
      const res = await fetch("/api/admin/marketing-ops/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ action: "resend_email", email: lead.email })
      });
      const data = await res.json();
      if (data.ok) {
        showMsg(lead.id, "تم الجدولة لإعادة الإرسال");
        onLeadUpdated();
      } else {
        showMsg(lead.id, "فشل إعادة الإرسال", true);
      }
    } catch {
      showMsg(lead.id, "حدث خطأ غير متوقع", true);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <UsersIcon />
                <span>{title === "unattributed" || title === "undefined" ? "بدون حملة" : title}</span>
              </h2>
              <p className="text-sm text-emerald-400 mt-1">يوجد {leads.length} روح مسجلة ضمن هذا النطاق.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">لا توجد داتا مسجلة هنا.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.08] transition-colors relative overflow-hidden">
                    
                    <AnimatePresence>
                      {actionMessage && actionMessage.id === lead.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-xl border ${actionMessage.isError ? 'border-red-500/50 text-red-400' : 'border-emerald-500/50 text-emerald-400'}`}
                        >
                          <span className="font-bold flex items-center gap-2">
                            {actionMessage.isError ? <AlertCircle className="w-4 h-4"/> : <Check className="w-4 h-4"/>}
                            {actionMessage.msg}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {editingLeadId === lead.id ? (
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="الاسم" className="bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400" />
                        <input type="text" value={editForm.phone_normalized} onChange={e => setEditForm({ ...editForm, phone_normalized: e.target.value })} placeholder="رقم الهاتف" className="bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400" dir="ltr" />
                        <input type="text" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="البريد الإلكتروني" className="bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400" dir="ltr" />
                        <div className="sm:col-span-3 flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingLeadId(null)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">إلغاء</button>
                          <button onClick={() => handleSave(lead.id)} disabled={isSaving} className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2">
                            {isSaving ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>} حفظ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-md">{lead.name || "مستخدم مجهول"}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {lead.email}
                                </span>
                              )}
                              {lead.phone_normalized && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {lead.phone_normalized}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <EmailStatusBadge status={lead.email_status} />
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300">
                              <Key className="w-3 h-3" /> {lead.source_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ar })}
                            </span>
                            
                            <div className="w-px h-3 bg-white/10" />
                            
                            <button onClick={() => startEdit(lead)} className="text-slate-400 hover:text-emerald-400 transition-colors p-1" title="تعديل البيانات">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleResend(lead)} 
                              disabled={resendingId === lead.id || !lead.email}
                              className="text-slate-400 hover:text-sky-400 disabled:opacity-30 transition-colors p-1" 
                              title={lead.email ? "إعادة إرسال إيميل النداء" : "لا يوجد إيميل"}
                            >
                              {resendingId === lead.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function EmailStatusBadge({ status }: { status: string }) {
  if (!status || status === "none") return null;

  const styles: Record<string, { label: string; style: string }> = {
    unsubscribed: { label: "ألغى الاشتراك", style: "bg-red-500/10 text-red-400 border-red-500/20" },
    bounced: { label: "تعذر الإرسال", style: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    clicked: { label: "متفاعل (ضغط)", style: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
    opened: { label: "قرأ الرسالة", style: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    sent: { label: "تم الإرسال", style: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    pending: { label: "في الانتظار", style: "bg-slate-800 text-slate-500 border-slate-700" }
  };

  const config = styles[status];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border ${config.style}`}>
      {config.label}
    </span>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
