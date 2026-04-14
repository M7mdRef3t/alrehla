import { memo, useState, useEffect, useMemo, useRef } from "react";
import { logger } from "@/services/logger";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, User, Mail, Phone, RefreshCw, 
  Edit2, Send, Check, AlertCircle, 
  ShieldCheck, Activity, ExternalLink, Copy,
  MessageCircle, Hash, ChevronDown, ChevronUp,
  MapPin, Clock, Info, Save, Zap, Brain, Sparkles, Wand2, RotateCcw, UserX
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { buildMarketingEmail } from "../../../../lib/marketing/emailTemplate";

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

interface CampaignLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leads: any[];
  onLeadUpdated: () => void;
  initialExpandedId?: string;
}

export function CampaignLeadsModal({ isOpen, onClose, title, leads, onLeadUpdated, initialExpandedId }: CampaignLeadsModalProps) {
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId || null);
  const [leadHistories, setLeadHistories] = useState<Record<string, { history: any[], routing: any[], loading: boolean }>>({});
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string, msg: string, isError?: boolean } | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [onlyMissingPhone, setOnlyMissingPhone] = useState(false);
  const [aiSummaries, setAiSummaries] = useState<Record<string, { summary: string, state: string, loading: boolean }>>({});
  const [validationStates, setValidationStates] = useState<Record<string, { valid: boolean, loading: boolean, reason?: string }>>({});
  const [pendingStatusChange, setPendingStatusChange] = useState<{leadId: string, status: string, amount: string} | null>(null);
  const [bouncingLeadId, setBouncingLeadId] = useState<string | null>(null);
  const loadingHistoryIds = useRef(new Set<string>());
  const historyCache = useRef(new Map<string, { history: any[]; routing: any[]; timestamp: number }>());
  const historyTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const summaryCache = useRef(new Map<string, { summary: string; state: string; timestamp: number }>());
  const validationCache = useRef(new Map<string, { valid: boolean; reason?: string; timestamp: number }>());

  // Clean state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialExpandedId) {
         setExpandedId(initialExpandedId);
      } else if (leads.length === 1) {
         setExpandedId(leads[0].id);
      } else {
         setExpandedId(null);
      }
      // Don't reset localSearchQuery here if we want to allow persistent search, 
      // but typically we want to clear it when opening a brand new view.
      setLocalSearchQuery(""); 
      setOnlyMissingPhone(false);
    }
  }, [isOpen, initialExpandedId]); // Deliberately omit `leads` to avoid bouncing when array changes reference

  // Auto-fetch history and routing for expanded leads
  useEffect(() => {
    if (isOpen && expandedId && !leadHistories[expandedId]) {
      const lead = leads.find(l => l.id === expandedId);
      if (!lead) return;
      const cached = historyCache.current.get(expandedId);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setLeadHistories(prev => ({
          ...prev,
          [expandedId]: { history: cached.history, routing: cached.routing, loading: false }
        }));
        return;
      }
      if (loadingHistoryIds.current.has(expandedId)) return;

      const timer = setTimeout(() => {
        loadingHistoryIds.current.add(expandedId);
        setLeadHistories(prev => ({ ...prev, [expandedId]: { history: [], routing: [], loading: true } }));
        fetch(`/api/admin/marketing-ops/lead?id=${expandedId}&email=${lead.email || ""}`, {
          headers: { authorization: `Bearer ${getBearerToken()}` }
        })
        .then(r => r.json())
        .then(data => {
          const nextState = data.ok
            ? { history: data.history ?? [], routing: data.routing ?? [], loading: false }
            : { history: [], routing: [], loading: false };
          historyCache.current.set(expandedId, { ...nextState, timestamp: Date.now() });
          setLeadHistories(prev => ({ ...prev, [expandedId]: nextState }));
        })
        .catch(() => {
          const nextState = { history: [], routing: [], loading: false };
          historyCache.current.set(expandedId, { ...nextState, timestamp: Date.now() });
          setLeadHistories(prev => ({ ...prev, [expandedId]: nextState }));
        })
        .finally(() => {
          loadingHistoryIds.current.delete(expandedId);
          historyTimers.current.delete(expandedId);
        });
      }, 250);

      historyTimers.current.set(expandedId, timer);
    }
  }, [isOpen, expandedId, leads]);

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
      showMsg(lead.id, "لا يوجد بريد إلكتروني", true);
      return;
    }

    const leadId = lead.id || lead.lead_id;
    const token = getBearerToken();

    // 1. Call the prepare-tracked-email API to get HTML with tracking pixel + click tracking
    let trackedHtml: string | null = null;
    let personalLink = `https://www.alrehla.app/go/${leadId}`;

    try {
      showMsg(lead.id, "⏳ جاري تحضير التصميم المُتتبع...");
      
      const prepareRes = await fetch("/api/admin/marketing-ops/prepare-tracked-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leadId,
          name: lead.name || undefined,
          email: lead.email,
        }),
      });

      const prepareData = await prepareRes.json();
      
      if (prepareData.ok && prepareData.html) {
        trackedHtml = prepareData.html;
        personalLink = prepareData.personalLink || personalLink;
        console.log("[ManualGmail] ✅ Tracked HTML prepared, trackingId:", prepareData.trackingId);
      } else {
        console.warn("[ManualGmail] Prepare API failed, falling back to untracked template:", prepareData.error);
      }
    } catch (err) {
      console.warn("[ManualGmail] Prepare API error, falling back to untracked template:", err);
    }

    // 2. Copy HTML to clipboard (tracked version if available, fallback to basic)
    try {
      const html = trackedHtml || buildMarketingEmail({ name: lead.name, personalLink });
      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([lead.name ? `أهلاً ${lead.name}...\n${personalLink}` : personalLink], { type: 'text/plain' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob });
      await navigator.clipboard.write([item]);
      
      if (trackedHtml) {
        showMsg(lead.id, "✨ التصميم المُتتبع اتنسخ! افتح الجميل ودوس Ctrl+V — الفتح والنقر هيتسجلوا تلقائياً 📡");
      } else {
        showMsg(lead.id, "✨ التصميم الاحترافي اتنسخ! افتح الجميل ودوس Ctrl+V (بست)");
      }
    } catch (err) {
      console.warn("Failed to auto-copy design:", err);
    }

    // 3. Open Gmail with a fallback plaintext body
    const greeting = lead.name ? `أهلاً ${lead.name.split(' ')[0]} 🌙،` : "أهلاً بك 🌙،";
    const body = `${greeting}\n\n(امسح الكلام ده واعمل Ctrl+V عشان تحط التصميم الاحترافي اللي اتنسخ حالا) ✨\n\n${personalLink}`;
    
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent("خطوتك الأولى في الرحلة تنتظرك ✦")}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");

    // 4. Optimistic UI update (prepare API already updated the DB)
    // If the prepare API succeeded, DB is already updated — just refresh UI
    if (trackedHtml) {
      showMsg(lead.id, "✅ تم إرسال يدوي مُتتبع عبر Gmail — Open + Click سيتم رصدهم تلقائياً 📡");
      setTimeout(() => { onLeadUpdated(); }, 500);
    } else {
      // Fallback: call the old mark_email_manual_sent action
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/admin/marketing-ops", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "mark_email_manual_sent", leadId: lead.id })
        });
        
        if (!res.ok) {
          showMsg(lead.id, `⚠️ Gmail فتح، لكن تسجيل الحالة فشل (${res.status})`, true);
        } else {
          showMsg(lead.id, "✅ تم إرسال يدوي عبر Gmail — الحالة اتحدثت (بدون تتبع فتح)");
          setTimeout(() => { onLeadUpdated(); }, 500);
        }
      } catch (err) {
        console.error("[ManualGmail] Network error:", err);
        showMsg(lead.id, "⚠️ Gmail فتح، لكن فيه مشكلة في تسجيل الحالة", true);
      }
    }
  };

  const handleTriggerBatch = async (lead: any) => {
    setResendingId(lead.id);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second max wait

      const res = await fetch("/api/admin/marketing-ops/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ 
          action: "resend_email", 
          email: lead.email 
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.ok) {
        if (data.method === 'sent_immediately') {
          showMsg(lead.id, "⚡ النبضة انطلقت فوراً ووصلت لـ " + (lead.name || "الروح") + "!");
        } else {
          showMsg(lead.id, "✅ تم تسجيل النبضة في طابور الإرسال.");
        }
        onLeadUpdated();
      } else {
        showMsg(lead.id, "معلش، النبضة وقفت: " + (data.error || "مشكلة في السيرفر"), true);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showMsg(lead.id, "النبضة لسه بتحاول توصل في الزحمة، استنى ثواني وهتسمع خبر ⏳");
        onLeadUpdated();
      } else {
        showMsg(lead.id, "فيه حاجة غلط حصلت في الاتصال.. جرب تاني", true);
      }
    } finally {
      setResendingId(null);
    }
  };

  const handleMarkBounced = async (lead: any) => {
    if (bouncingLeadId !== lead.id) {
      setBouncingLeadId(lead.id);
      return;
    }
    setBouncingLeadId(null);
    try {
      showMsg(lead.id, "⏳ جاري تحديث الحالة...");
      const res = await fetch("/api/admin/marketing-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ action: "mark_bounced", leadId: lead.id })
      });
      if (res.ok) {
        showMsg(lead.id, "🚫 تم تسجيل الارتداد بنجاح.");
        onLeadUpdated();
      } else {
        showMsg(lead.id, "⚠️ فشل تسجيل الارتداد.", true);
      }
    } catch (err) {
      showMsg(lead.id, "⚠️ حدث خطأ أثناء الاتصال.", true);
    }
  };

  const cancelBounce = () => setBouncingLeadId(null);

  const validateLeadEmail = async (lead: any) => {
    if (!lead.email) return;
    const cacheKey = `${lead.id}:${String(lead.email).toLowerCase().trim()}`;
    const cached = validationCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      setValidationStates(prev => ({
        ...prev,
        [lead.id]: { valid: cached.valid, loading: false, reason: cached.reason }
      }));
      return;
    }

    setValidationStates(prev => ({ ...prev, [lead.id]: { valid: false, loading: true } }));
    
    try {
      const res = await fetch("/api/admin/marketing-ops/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ email: lead.email })
      });
      const data = await res.json();
      if (data.ok) {
        validationCache.current.set(cacheKey, {
          valid: data.valid,
          reason: data.reason,
          timestamp: Date.now()
        });
        setValidationStates(prev => ({ 
          ...prev, 
          [lead.id]: { valid: data.valid, loading: false, reason: data.reason } 
        }));
      } else {
        validationCache.current.set(cacheKey, { valid: false, reason: "api_error", timestamp: Date.now() });
        setValidationStates(prev => ({ ...prev, [lead.id]: { valid: false, loading: false, reason: "api_error" } }));
      }
    } catch {
      validationCache.current.set(cacheKey, { valid: false, reason: "network_error", timestamp: Date.now() });
      setValidationStates(prev => ({ ...prev, [lead.id]: { valid: false, loading: false, reason: "network_error" } }));
    }
  };

  const handleSyncMeta = async (id: string) => {
    showMsg(id, "⏳ جاري استرجاع البيانات من Meta...");
    try {
      const res = await fetch("/api/admin/marketing-ops/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ action: "sync_with_meta", id })
      });
      const data = await res.json();
      if (data.ok) {
        showMsg(id, "✅ تم استرجاع البيانات بنجاح! رقم التليفون: " + (data.phone || "غير موجود في فيسبوك"));
        onLeadUpdated();
      } else {
        if (data.error === "no_meta_id_found" || data.error === "no_meta_id_in_metadata") {
           showMsg(id, "⚠️ مستحيل الاسترجاع: كود الـ Lead مش متسجل في الداتا القديمة دي.", true);
        } else {
           showMsg(id, "⚠️ فشل الاسترجاع: " + (data.error || "تأكد من الـ Token"), true);
        }
      }
    } catch {
      showMsg(id, "⚠️ فشل الاتصال بالسيرفر", true);
    }
  };


  const copyProfessionalTemplate = async (lead: any) => {
    try {
      const leadId = lead.id || lead.lead_id;
      const shortLink = `https://www.alrehla.app/go/${leadId}`;
      const html = buildMarketingEmail({ name: lead.name, personalLink: shortLink });
      
      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([lead.name ? `أهلاً ${lead.name}...\n${shortLink}` : shortLink], { type: 'text/plain' });
      
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([item]);
      showMsg(lead.id, "✨ تم نسخ التصميم اللامع! اذهب للـ Gmail واضغط Ctrl+V");
    } catch (err) {
      logger.error("Clipboard error:", err);
      showMsg(lead.id, "عفواً، المتصفح منع نسخ التصميم. جرب الطريقة اليدوية.", true);
    }
  };

  const toggleExpand = async (lead: any) => {
    if (expandedId === lead.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(lead.id);
    
    // Smooth scroll to the lead card after state updates
    setTimeout(() => {
      document.getElementById(`lead-card-${lead.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

  };

  const initiateStatusChange = (leadId: string, newStatus: string) => {
     const isPaidStatus = ["activated", "converted", "proof_received"].includes(newStatus);
     if (isPaidStatus) {
       setPendingStatusChange({ leadId, status: newStatus, amount: "" });
     } else {
       handleQuickStatusChange(leadId, newStatus, undefined);
     }
  };

  const confirmStatusChange = () => {
     if (!pendingStatusChange) return;
     const parsed = parseFloat(pendingStatusChange.amount);
     const amount_egp = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
     
     handleQuickStatusChange(pendingStatusChange.leadId, pendingStatusChange.status, amount_egp);
     setPendingStatusChange(null);
  };

  const handleQuickStatusChange = async (leadId: string, newStatus: string, amount_egp?: number) => {
     setIsSaving(true);
     try {
       const res = await fetch("/api/admin/marketing-ops/lead", {
         method: "PATCH",
         headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
         body: JSON.stringify({ id: leadId, status: newStatus, amount_egp })
       });
       const data = await res.json();
       if (data.ok) {
         showMsg(leadId, "تم تحديث الحالة");
         onLeadUpdated();
       } else {
         showMsg(leadId, "فشل تعديل الحالة: " + data.error, true);
       }
     } catch (err) {
       showMsg(leadId, "حدث خطأ في الاتصال", true);
     } finally {
       setIsSaving(false);
     }
  };

  const handleSaveNotes = async (leadId: string, note: string) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/marketing-ops/lead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ id: leadId, note })
      });
      const data = await res.json();
      if (data.ok) {
        showMsg(leadId, "تم حفظ الملاحظات");
        onLeadUpdated();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const pulseLead = async (lead: any) => {
    const cacheKey = `${lead.id}:${String(lead.email || "").toLowerCase().trim()}`;
    const cached = summaryCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      setAiSummaries(prev => ({ ...prev, [lead.id]: { summary: cached.summary, state: cached.state, loading: false } }));
      return;
    }

    setAiSummaries(prev => ({ ...prev, [lead.id]: { summary: "", state: "", loading: true } }));
    try {
      const res = await fetch(`/api/admin/marketing-ops/lead/summary?id=${lead.id}&email=${lead.email || ""}`, {
        headers: { authorization: `Bearer ${getBearerToken()}` }
      });
      const data = await res.json();
      if (data.ok) {
        summaryCache.current.set(cacheKey, {
          summary: data.summary,
          state: data.state,
          timestamp: Date.now()
        });
        setAiSummaries(prev => ({ ...prev, [lead.id]: { summary: data.summary, state: data.state, loading: false } }));
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      summaryCache.current.set(cacheKey, {
        summary: "الأوراكل مشوش حالياً. حاول مرة تانية.",
        state: "ERROR",
        timestamp: Date.now()
      });
      setAiSummaries(prev => ({ ...prev, [lead.id]: { summary: "الأوراكل مشوش حالياً. حاول مرة تانية.", state: "ERROR", loading: false } }));
    }
  };

  const isLeadMissingPhone = (lead: any) => {
    const metadataMissing = Boolean(lead?.metadata?.missing_phone);
    const normalizedPhone = String(lead?.phone_normalized ?? "").trim();
    return metadataMissing || !normalizedPhone;
  };

  const { missingPhoneCount, filteredLeads, conversionRate, sortedFilteredLeads, expandedIndex, hasNextGlobal, hasPrevGlobal } = useMemo(() => {
    const missingPhoneCount = leads.filter(isLeadMissingPhone).length;
    const query = localSearchQuery.toLowerCase();
    const filteredLeads = leads.filter((l) => {
      if (onlyMissingPhone && !isLeadMissingPhone(l)) return false;
      if (!query) return true;
      return (
        l.name?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.phone?.includes(query)
      );
    });
    const totalConverted = leads.filter((l) => l.has_converted).length;
    const conversionRate = leads.length > 0 ? Math.round((totalConverted / leads.length) * 100) : 0;
    const sortedFilteredLeads = [...filteredLeads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const expandedIndex = expandedId ? sortedFilteredLeads.findIndex((l: any) => l.id === expandedId) : -1;
    const hasNextGlobal = expandedIndex !== -1 && expandedIndex < sortedFilteredLeads.length - 1;
    const hasPrevGlobal = expandedIndex > 0;
    return { missingPhoneCount, filteredLeads, conversionRate, sortedFilteredLeads, expandedIndex, hasNextGlobal, hasPrevGlobal };
  }, [leads, localSearchQuery, onlyMissingPhone, expandedId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative w-full max-w-6xl bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Area */}
          <div className="relative p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent shrink-0">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
             
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <UsersIcon />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {title === "unattributed" || title === "undefined" ? "بدون حملة" : title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{leads.length} روح في قاعدة البيانات</span>
                         <div className="w-1 h-1 rounded-full bg-slate-700" />
                         <span className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest">مركز جذب الأرواح</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative group w-full md:w-64">
                     <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-emerald-400/50 group-focus-within:text-emerald-400 transition-colors">
                        <Hash className="w-4 h-4" />
                     </div>
                     <input
                       type="text"
                       placeholder="ابحث في هذه القائمة..."
                       value={localSearchQuery}
                       onChange={(e) => setLocalSearchQuery(e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                     />
                     <div className="mt-2 flex items-center justify-end gap-2">
                       <button
                         type="button"
                         onClick={() => setOnlyMissingPhone((v) => !v)}
                         className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                           onlyMissingPhone
                             ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                             : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                         }`}
                         title="فلتر الحالات اللي ناقصها رقم"
                       >
                         ناقص رقم ({missingPhoneCount})
                       </button>
                     </div>
                     {localSearchQuery && (
                       <button 
                         onClick={() => setLocalSearchQuery("")}
                         className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white transition-colors"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <AnimatePresence>
                     {expandedId && (
                       <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5" dir="ltr">
                          <button onClick={() => hasPrevGlobal && toggleExpand(sortedFilteredLeads[expandedIndex - 1])} disabled={!hasPrevGlobal} className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/5 hover:bg-emerald-500/20 active:bg-emerald-500/40 rounded-xl border border-white/10 transition-all text-slate-300 disabled:opacity-30 disabled:hover:bg-white/5" title="السابق (أحدث)">
                             <ChevronUp className="w-5 h-5" />
                          </button>
                          <button onClick={() => hasNextGlobal && toggleExpand(sortedFilteredLeads[expandedIndex + 1])} disabled={!hasNextGlobal} className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/5 hover:bg-emerald-500/20 active:bg-emerald-500/40 rounded-xl border border-white/10 transition-all text-slate-300 disabled:opacity-30 disabled:hover:bg-white/5" title="التالي (أقدم)">
                             <ChevronDown className="w-5 h-5" />
                          </button>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 px-5 text-center hidden sm:block">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">التحويل</div>
                      <div className="text-xl font-black text-emerald-400">{conversionRate}%</div>
                   </div>
                   <button
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-slate-400 hover:text-white shrink-0"
                   >
                     <X className="w-6 h-6" />
                   </button>
                </div>
             </div>
          </div>

          {/* Leads Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-black/20">
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <GhostIcon className="w-16 h-16 mb-4 text-slate-700" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">لا توجد أرواح تطابق بحثك.</p>
              </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                {sortedFilteredLeads.map((lead) => (
                    <MemoLeadCommandCard 
                      key={lead.id}
                    lead={lead}
                    isEditing={editingLeadId === lead.id}
                    isExpanded={expandedId === lead.id}
                    history={leadHistories[lead.id]}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onSave={() => handleSave(lead.id)}
                    onCancel={() => setEditingLeadId(null)}
                    onStartEdit={() => startEdit(lead)}
                    onToggleExpand={() => toggleExpand(lead)}
                    onResend={() => handleResend(lead)}
                    onStatusChange={(status: string) => initiateStatusChange(lead.id, status)}
                    onSaveNotes={(note: string) => handleSaveNotes(lead.id, note)}
                    onLeadUpdated={onLeadUpdated}
                    resending={resendingId === lead.id}
                    actionMessage={actionMessage && actionMessage.id === lead.id ? actionMessage : null}
                    isSaving={isSaving}
                    aiSummary={aiSummaries[lead.id]}
                    onPulse={() => pulseLead(lead)}
                    onTriggerBatch={() => handleTriggerBatch(lead)}
                    onCopyTemplate={() => copyProfessionalTemplate(lead)}
                    onMarkBounced={() => setBouncingLeadId(lead.id)}
                    isBouncePending={bouncingLeadId === lead.id}
                    onCancelBounce={() => setBouncingLeadId(null)}
                    onConfirmBounce={() => {
                      handleMarkBounced(lead);
                      setBouncingLeadId(null);
                    }}
                    onValidateEmail={() => validateLeadEmail(lead)}
                    validationState={validationStates[lead.id]}
                    onSyncMeta={() => handleSyncMeta(lead.id)}
                  />
                  ))}
                </div>
              )}
          </div>
        </motion.div>

        {/* Amount Input Modal */}
        {pendingStatusChange && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPendingStatusChange(null)} />
            <div className="relative bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full" dir="rtl">
              <h3 className="text-lg font-black text-white mb-2">إدخال المبلغ المدفوع</h3>
              <p className="text-xs text-slate-400 mb-6">الروح دي اتحولت لحالة مالية. أرجوك دخل المبلغ الفعلي اللي اتدفع بالجنيه المصري عشان الحسابات تظبط.</p>
              
              <div className="relative mb-6">
                <input 
                  type="number" 
                  value={pendingStatusChange.amount}
                  onChange={e => setPendingStatusChange({...pendingStatusChange, amount: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && confirmStatusChange()}
                  className="w-full bg-white/5 border border-emerald-500/30 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500 transition-all text-right"
                  placeholder="مثال: 500"
                  autoFocus
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">EGP</div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setPendingStatusChange(null)}
                  className="flex-1 py-3 text-slate-400 font-bold hover:bg-white/5 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmStatusChange}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  تأكيد المبلغ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatePresence>
  );
}

function LeadCommandCard({ 
  lead, isEditing, isExpanded, history, editForm, setEditForm, onSave, onCancel, onStartEdit, onToggleExpand, onResend, onStatusChange, onSaveNotes, onLeadUpdated, resending, actionMessage, isSaving, aiSummary, onPulse, onTriggerBatch, onCopyTemplate, onMarkBounced, onValidateEmail, validationState, hasNext, hasPrev, onNext, onPrev, onSyncMeta
}: any) {

  const getSourceLabel = (s: string) => {
    const labels: Record<string, string> = {
      website: "الموقع الإلكتروني",
      meta_instant_form: "نموذج فيسبوك (Lead Ads)",
      manual_import: "إدخال يدوي",
      whatsapp: "واتساب"
    };
    return labels[s] || s;
  };
  
  const leadPhone = lead.phone_normalized || "";
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const leadName = lead.name || "يا بطل";
  const WHATSAPP_TEMPLATES = [
    { label: "ترحيب", text: `أهلاً يا ${leadName}، نورت الرحلة - خريطة وعيك جاهزة ومستنياك تبدأ أول خطوة من هنا: ` },
    { label: "متابعة", text: `طمنا عليك يا ${leadName} - شفت إنك بدأت الرحلة بس لسه مخلصتش الخريطة، محتاج مساعدة في أي حاجة؟ ` },
    { label: "دعم", text: `أهلاً يا ${leadName}، لاحظت إن فيه ضغط في المرحلة الأخيرة من الخريطة، هل واجهت أي مشكلة تقنية؟ ` }
  ];

  const leadLink = `https://www.alrehla.app/go/${lead.id || lead.lead_id}`;
  const defaultWaLink = leadPhone ? `https://wa.me/${leadPhone.replace(/\+/g, "")}?text=${encodeURIComponent(WHATSAPP_TEMPLATES[activeTemplate].text + "\n\n" + leadLink)}` : null;
  const [localNote, setLocalNote] = useState(lead.note || "");
  const [isMarkingWa, setIsMarkingWa] = useState(false);
  const isWhatsAppMarked = Boolean(lead.metadata?.whatsapp_sent_at || lead.metadata?.whatsapp_sent || lead.metadata?.whatsapp_sent_manual);

  const onMarkWhatsApp = async () => {
    if (isMarkingWa || isWhatsAppMarked) return;
    setIsMarkingWa(true);
    try {
      const res = await fetch("/api/admin/marketing-ops/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ action: "mark_whatsapp", id: lead.id })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `request_failed_${res.status}`);
      }
      if (onLeadUpdated) {
        onLeadUpdated();
      }
    } catch {
      // بنسيب الحالة تتصحح مع أول refresh من السيرفر.
    } finally {
      setIsMarkingWa(false);
    }
  };

  const MARKETING_LEAD_STATUSES = [
    "new", "engaged", "payment_requested", "hot_activation_interrupted", 
    "proof_received", "activated", "lost"
  ];

  const getStatusLabel = (s: string) => {
    const labels: Record<string, string> = {
      new: "جديد",
      engaged: "مهتم",
      payment_requested: "طلب دفع",
      hot_activation_interrupted: "انقطع أثناء التفعيل",
      proof_received: "تم استلام الإيصال",
      activated: "تم التفعيل",
      lost: "مفقود"
    };
    return labels[s] || s;
  };

  const emailStatusLabel = (s: string) => {
    const m: Record<string, string> = {
      none: "صامت (لم يتم الإرسال)",
      pending: "في الانتظار",
      sent: "تم الإرسال ✔️",
      opened: "فتح الرسالة 👀",
      clicked: "تفاعل عالي ⚡",
      bounced: "بريد خاطئ (Bounce)",
      complained: "أبلغ عن سبام",
      unsubscribed: "إلغاء الاشتراك",
      simulated: "إرسال تجريبي",
    };
    return m[s] || s || "صامت";
  };

  return (
    <div className={`group relative bg-[#121214] border rounded-[1.75rem] transition-all duration-500 ${isExpanded ? 'border-emerald-500/40 shadow-2xl shadow-emerald-500/10 mb-4 mt-2' : 'border-white/[0.05] hover:border-emerald-500/20 shadow-none'}`} id={"lead-card-" + lead.id}>
      
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 z-30 flex items-center justify-center bg-[#0a0a0c]/95 backdrop-blur-md rounded-[1.75rem] border ${actionMessage.isError ? 'border-red-500/30 text-red-400' : 'border-emerald-500/30 text-emerald-400'}`}
          >
            <span className="font-black text-sm uppercase tracking-widest flex items-center gap-3">
              {actionMessage.isError ? <AlertCircle className="w-5 h-5"/> : <ShieldCheck className="w-5 h-5"/>}
              {actionMessage.msg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={`p-5 cursor-pointer relative z-10 transition-all ${isExpanded ? 'bg-white/[0.03] pr-12 pl-12' : ''}`}
        onClick={() => !isEditing && onToggleExpand()}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
          {/* Profile Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center relative overflow-hidden transition-all duration-500 ${lead.has_converted ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/[0.03] border border-white/5'}`}>
                {lead.has_converted && (
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 bg-emerald-500/20" />
                )}
                {lead.has_converted ? <ShieldCheck className="w-7 h-7 text-emerald-400 relative z-10" /> : <User className="w-7 h-7 text-slate-500 relative z-10" />}
            </div>
            
            <div className="min-w-0">
                {isEditing ? (
                  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="الاسم" />
                    <div className="flex gap-2">
                      <input type="text" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="البريد الإلكتروني" />
                      <input type="text" value={editForm.phone_normalized} onChange={e => setEditForm({ ...editForm, phone_normalized: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" placeholder="رقم الهاتف" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-white text-lg truncate max-w-[200px]">{lead.name || "روح مجهولة"}</h4>
                      {lead.has_converted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-400 border border-emerald-500/20 tracking-tighter">جندي النور</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 opacity-60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-slate-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{lead.email || "لا يوجد بريد"}</span>
                        <button 
                          onClick={onValidateEmail}
                          disabled={validationState?.loading}
                          className={`p-1 rounded-md transition-all ${
                            validationState?.valid ? 'text-emerald-400 bg-emerald-500/10' : 
                            validationState?.reason && !validationState.valid ? 'text-rose-400 bg-rose-500/10' :
                            'text-slate-500 hover:bg-white/5'
                          }`}
                          title={
                            validationState?.loading ? "جاري التحقق من النطاق (DNS)..." :
                            validationState?.valid ? "النطاق صالح وموجود (MX Verified) ✅" :
                            validationState?.reason === 'domain_not_found' ? "النطاق غير موجود أو خطأ في الكتابة ⚠️" :
                            validationState?.reason === 'no_mx_records' ? "هذا الموقع لا يمكنه استقبال إيميلات ⚠️" :
                            "تحقق من صحة النطاق تقنياً (Shield Check)"
                          }
                        >
                          {validationState?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        {lead.phone_normalized || "لا يوجد رقم"} <Phone className="w-3.5 h-3.5" />
                      </span>
                      {!lead.phone_normalized && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={onStartEdit}
                            className="px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black hover:bg-amber-500/20 transition-all"
                            title="إضافة رقم الهاتف يدويًا"
                          >
                            إضافة رقم
                          </button>
                          {(lead.source_type === 'meta_instant_form' || lead.metadata?.meta_lead_id || lead.metadata?.leadgen_id || (lead.metadata?.raw_fields && Object.keys(lead.metadata.raw_fields).length > 0)) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onSyncMeta(); }}
                              className="px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-black hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                              title="استرجاع الداتا من فيسبوك"
                            >
                              <RefreshCw className="w-3 h-3" /> جلب من Meta
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>

          {/* Engagement & Status */}
          <div className="flex flex-wrap items-center gap-6 lg:border-r lg:border-white/5 lg:pr-6">
            <EngagementMeter status={lead.email_status} />
            
            <div className="flex flex-col gap-1 items-start lg:items-end">
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">تاريخ الدخول</div>
                <div className="text-[11px] font-bold text-slate-400 font-mono">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ar })}
                </div>
            </div>
            
            <div className="hidden lg:flex items-center justify-center p-2 text-slate-600">
               {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>

          {/* Actions Zone */}
          <div className="flex items-center gap-2 lg:ml-auto" onClick={e => e.stopPropagation()}>
            {isEditing ? (
              <>
                <button onClick={onCancel} className="p-2 rounded-xl text-slate-500 hover:text-white transition-colors">إلغاء</button>
                <button onClick={onSave} disabled={isSaving} className="p-2 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-transform active:scale-95">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} حفظ
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/5 relative">
                  {defaultWaLink && (
                    <div className="relative">
                      <a
                        href={defaultWaLink}
                        target="_blank" rel="noopener noreferrer"
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-center active:scale-90 ${isWhatsAppMarked ?'text-emerald-400 bg-emerald-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                        onClick={() => onMarkWhatsApp()}
                        title="مراسلة واتساب"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                      {isWhatsAppMarked && (
                         <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#121214] flex items-center justify-center z-20" title={`تم الإرسال: ${lead.metadata?.whatsapp_sent_at ? new Date(lead.metadata.whatsapp_sent_at).toLocaleDateString('ar-EG') : 'الآن'}`}>
                            <Check className="w-2 h-2 text-white" />
                         </div>
                      )}
                    </div>
                  )}
                  {lead.phone_normalized && (
                    <a href={`tel:${lead.phone_normalized}`} className="p-2.5 rounded-xl text-sky-400 hover:bg-sky-400/10 transition-all active:scale-90" title="اتصال مباشر">
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                  <button onClick={onMarkBounced} className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90" title="تبليغ عن بريد مرتد (Bounce)">
                      <UserX className="w-5 h-5" />
                  </button>
                  <button onClick={onStartEdit} className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 transition-all active:scale-90" title="تعديل بيانات الروح">
                      <Edit2 className="w-5 h-5" />
                  </button>
                </div>
                
                <button 
                  onClick={onResend} 
                  disabled={resending || !lead.email}
                  className={`p-3.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-20 relative ${
                    lead.email_status && lead.email_status !== 'none' && lead.email_status !== 'pending'
                      ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                      : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white'
                  }`}
                  title={lead.email_status && lead.email_status !== 'none' ? `أُرسلت بالفعل (${emailStatusLabel(lead.email_status)}) - اضغط للإعادة` : "إرسال خطة التعافي الآن"}
                >
                  {resending ? <RefreshCw className="w-5 h-5 animate-spin" /> : 
                    lead.email_status && lead.email_status !== 'none' && lead.email_status !== 'pending'
                      ? <Check className="w-5 h-5" />
                      : <Send className="w-5 h-5" />
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Journey & History Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/40 overflow-hidden"
          >
            <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-10 text-right" dir="rtl">
              
              {/* UTM & Acquisition Info */}
              <div className="space-y-6">
                <h5 className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest justify-start">
                  <MapPin className="w-4 h-4" /> نبض المصدر (Origin Pulse)
                </h5>
                <div className="grid grid-cols-1 gap-3">
                  <DetailItem label="المصدر العام" value={getSourceLabel(lead.source_type)} />
                  <DetailItem label="الحملة" value={lead.campaign} />
                  <DetailItem label="المجموعة الإعلانية" value={lead.adset} />
                  <DetailItem label="الإعلان" value={lead.ad} />
                  {lead.utm && Object.entries(lead.utm).map(([k, v]: any) => (
                    <DetailItem key={k} label={`UTM ${k}`} value={String(v)} />
                  ))}
                </div>

                {/* AI Soul Pulse (The Oracle's Eye) */}
                <div className="pt-6 border-t border-white/5">
                   <div className="flex items-center justify-between mb-4">
                     <div className="p-1.5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
                        <Zap className="w-4 h-4" />
                     </div>
                     <h5 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">نبض الأوراكل AI</h5>
                   </div>
                   
                   <div className="bg-gradient-to-br from-fuchsia-500/10 via-purple-500/[0.02] to-transparent p-5 rounded-2xl border border-fuchsia-500/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-fuchsia-500/10 transition-colors" />
                      
                      {aiSummary?.loading ? (
                        <div className="flex items-center justify-center py-4 gap-3 text-xs text-fuchsia-300 font-bold">
                           جاري تحليل الذبذبات... <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                      ) : aiSummary?.summary ? (
                        <div className="space-y-4">
                           <div className="flex items-start gap-4">
                              <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border shrink-0 mt-1 ${
                                aiSummary.state === 'READY_FOR_CHANGE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                aiSummary.state === 'SKEPTIC' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30'
                              }`}>
                                {aiSummary.state}
                              </div>
                              <p className="text-xs text-fuchsia-100 font-bold leading-relaxed">{aiSummary.summary}</p>
                           </div>
                           <button 
                             onClick={onPulse}
                             className="text-[9px] font-black text-fuchsia-400/60 hover:text-fuchsia-400 flex items-center gap-1 transition-colors uppercase tracking-widest pl-2"
                           >
                              <RotateCcw className="w-3 h-3" /> تحديث التحليل
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                           <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px]">حلل رحلة هذه الروح لمعرفة دوافعها العميقة وكيفية التأثير عليها.</p>
                           <button 
                            onClick={onPulse}
                            className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-fuchsia-600/20"
                           >
                              <Wand2 className="w-3.5 h-3.5" /> استدعي الأوراكل
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="space-y-6">
                <h5 className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest justify-start">
                  <Clock className="w-4 h-4" /> جدول زمن الرحلة (Journey)
                </h5>
                <div className="relative pr-4 border-r border-white/5 space-y-6 min-h-[100px]">
                  {history?.loading ? (
                    <div className="flex items-center gap-3 text-xs text-slate-600 py-4 justify-end">
                      جاري استدعاء السجلات... <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  ) : history?.history?.length > 0 ? (
                    history.history.map((ev: any, idx: number) => (
                      <div key={idx} className="relative">
                         <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] border-2 border-[#121214]" />
                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                           {format(new Date(ev.created_at), "hh:mm aa", { locale: ar })}
                         </div>
                         <div className="text-xs text-white font-bold leading-tight">
                           {ev.payload?.step || ev.type}
                         </div>
                         <div className="text-[9px] text-slate-500 mt-0.5">
                           {format(new Date(ev.created_at), "dd MMMM", { locale: ar })}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 py-4 italic">لا يوجد مسار مسجل لهذه الروح بعد.</div>
                  )}
                </div>

                {/* Email Status Details */}
                <div className="pt-6 border-t border-white/5">
                   <h5 className="flex items-center gap-2 text-xs font-black text-sky-400 uppercase tracking-widest justify-start mb-4">
                     <Mail className="w-4 h-4" /> نبض الرسائل (Email Status)
                   </h5>
                   <div className="grid grid-cols-1 gap-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black ${
                        lead.email_status === 'clicked' ? 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400' :
                        lead.email_status === 'opened' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                        lead.email_status === 'sent' || lead.email_status === 'simulated' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        lead.email_status === 'bounced' || lead.email_status === 'complained' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-slate-800/50 border-white/5 text-slate-500'
                      }`}>
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {emailStatusLabel(lead.email_status || 'none')}
                      </div>
                      
                      {lead.email_status === 'pending' && (
                        <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] leading-relaxed flex flex-col gap-2">
                          <p className="text-amber-400/80 mb-1">
                            <strong>الروح في قائمة الانتظار:</strong> سيتم الإرسال الآلي بواسطة (Cron) قريباً. لتسريع الإجراء، اضغط الزر بالأسفل.
                          </p>
                          <button
                            onClick={onTriggerBatch}
                            disabled={resending}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {resending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            إرسال النبضة القادمة الآن ⚡
                          </button>
                        </div>
                      )}

                      {lead.sent_at && <DetailItem label="تاريخ الإرسال" value={format(new Date(lead.sent_at), "eeee, d MMMM yyyy (hh:mm aa)", { locale: ar })} />}
                      {lead.opened_at && <DetailItem label="تاريخ الفتح" value={format(new Date(lead.opened_at), "eeee, d MMMM yyyy (hh:mm aa)", { locale: ar })} />}
                      {lead.clicked_at && <DetailItem label="تاريخ التفاعل" value={format(new Date(lead.clicked_at), "eeee, d MMMM yyyy (hh:mm aa)", { locale: ar })} />}
                      {(!lead.email_status || lead.email_status === 'none') && (
                        <button
                          onClick={onResend}
                          disabled={!lead.email}
                          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 text-[11px] font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
                        >
                          <Mail className="w-4 h-4" />
                          SIGNAL: EMAIL — إرسال يدوي عبر Gmail
                        </button>
                      )}
                   </div>
                </div>
              </div>

              {/* Admin Controls & Notes */}
              <div className="space-y-6">
                <h5 className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest justify-start">
                  <Info className="w-4 h-4" /> غرفة العمليات (Controls)
                </h5>
                
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2 text-right">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">الحالة المتقدمة</label>
                        <select 
                          value={lead.status} 
                          onChange={(e) => onStatusChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer text-right"
                        >
                          {MARKETING_LEAD_STATUSES.map(s => (
                            <option key={s} value={s} className="bg-slate-900">{getStatusLabel(s)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">مصدر الروح</label>
                        <select 
                          value={lead.source_type} 
                          onChange={(e) => {
                            // We use the patch API for status change, can use it for source too if we add a handler or just use the same pattern
                            const newSource = e.target.value;
                            fetch("/api/admin/marketing-ops/lead", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
                              body: JSON.stringify({ id: lead.id, source_type: newSource })
                            }).then(() => onLeadUpdated());
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer text-right"
                        >
                          <option value="website" className="bg-slate-900">الموقع الإلكتروني</option>
                          <option value="meta_instant_form" className="bg-slate-900">نموذج فيسبوك (Lead Ads)</option>
                          <option value="manual_import" className="bg-slate-900">إدخال يدوي</option>
                          <option value="whatsapp" className="bg-slate-900">واتساب</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-2 text-right">
                     <label className="text-[10px] font-black text-slate-500 uppercase">ملاحظات خاصة</label>
                     <textarea 
                       value={localNote}
                       onChange={(e) => setLocalNote(e.target.value)}
                       rows={4}
                       placeholder="اكتب ملاحظاتك عن هذه الروح هنا..."
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none placeholder:text-slate-700 text-right"
                     />
                   </div>

                   <button 
                    onClick={() => onSaveNotes(localNote)}
                    disabled={isSaving}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     حفظ كافة التغييرات
                   </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MemoLeadCommandCard = memo(LeadCommandCard);

function EngagementMeter({ status }: { status: string }) {
  const steps = ["sent", "opened", "clicked"];
  const currentIdx = steps.indexOf(status);
  
  const getStatusColor = (idx: number) => {
    if (status === "bounced") return "bg-rose-500/40";
    if (status === "ignored") return "bg-slate-700/50";
    
    if (idx < currentIdx) return "bg-emerald-500";
    if (idx === currentIdx) {
        if (status === "clicked") return "bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.5)]";
        if (status === "opened") return "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]";
        return "bg-slate-400";
    }
    return "bg-slate-800";
  };

  const getLabel = () => {
    if (status === "unsubscribed") return "تم إلغاء الاشتراك";
    if (status === "bounced") return "بريد خاطئ (Bounce)";
    if (status === "ignored") return "صامت/تجاهل (Ignored) 😴";
    if (status === "clicked") return "تفاعل عالي (Clicked)";
    if (status === "opened") return "مهتم (Opened)";
    if (status === "sent") return "تم الاستدعاء (Sent)";
    if (status === "pending") return "في الانتظار";
    return "صامت";
  };

  return (
    <div className={`flex flex-col gap-2 min-w-[120px] ${status === 'ignored' || status === 'bounced' ? 'opacity-40' : ''}`}>
       <div className="flex items-center justify-between">
          <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">تفاعل الروح</span>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${
            status === 'clicked' ? 'text-fuchsia-400' : 
            status === 'bounced' ? 'text-rose-400' : 
            status === 'ignored' ? 'text-slate-500' :
            'text-slate-500'
          }`}>{getLabel()}</span>
       </div>
       <div className="flex gap-1">
          {[0, 1, 2].map(idx => (
            <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${getStatusColor(idx)}`} />
          ))}
       </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  if (!value || value === "undefined" || value === "null") return null;
  return (
    <div className="flex flex-col gap-0.5 text-right">
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
      <span className="text-[11px] font-bold text-slate-300 break-all">{value}</span>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GhostIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
        </svg>
    )
}
