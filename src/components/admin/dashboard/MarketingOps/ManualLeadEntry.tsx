'use client';

import { useState, useEffect } from "react";
import { 
  Phone, 
  UserPlus, 
  Loader2, 
  PlusCircle,
  StickyNote,
  ExternalLink,
  Code2,
  Copy,
  CheckCheck
} from "lucide-react";
import type { MarketingLeadPayload } from "@/types/marketingLead";

interface ManualLeadEntryProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const BOOKMARKLET_CODE = `javascript:(function(){
  try {
    var rawText = document.querySelector('#main header') ? document.querySelector('#main header').innerText : '';
    var match = rawText.replace(/[\\s-]/g,'').match(/\\+?\\d{10,15}/);
    var defaultPhone = match ? match[0] : '';
    var phone = prompt("🧭 تسجيل عميل لـ الرحلة\\nرقم الهاتف:", defaultPhone);
    if(!phone) return;
    var notes = prompt("ملاحظات (اختياري):", "Lead من واتساب مباشر");
    var url = 'https://www.alrehla.app/admin?tab=marketing-ops&add_lead_flag=1&phone=' + encodeURIComponent(phone) + '&note=' + encodeURIComponent(notes || '');
    window.open(url, '_blank');
  } catch(e) {
    alert("افتح شات العميل الأول في واتساب ويب!");
  }
})();`.trim();

export function ManualLeadEntry({ onSuccess, onError }: ManualLeadEntryProps) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Auto-fill from URL params (from Bookmarklet)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add_lead_flag") === "1") {
        const p = params.get("phone");
        const n = params.get("note");
        if (p) setPhone(p);
        if (n) setNote(n);
        // Clean URL to avoid infinite re-fills
        window.history.replaceState({}, '', '/admin?tab=marketing-ops');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      onError("يرجى إدخال رقم الهاتف");
      return;
    }

    setLoading(true);

    try {
      const payload: MarketingLeadPayload = {
        phone: normalizedPhone,
        note: note.trim(),
        status: "payment_requested",
        source: "whatsapp_manual",
        sourceType: "website",
      };

      const response = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ok) {
        onSuccess("تم تسجيل المهتم بنجاح ✅ — الحالة: طلب دفع");
        setPhone("");
        setNote("");
      } else {
        onError(data.error || "فشل تسجيل المهتم");
      }
    } catch (err) {
      onError("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-xl group hover:border-indigo-500/40 transition-all">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
          <PlusCircle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">إضافة مهتم يدويًا</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">سجل رقم واتساب فوراً وخليه في وضع "طلب دفع"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group/field">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 group-focus-within/field:text-indigo-400 transition-colors">
            <Phone className="w-4 h-4" />
          </div>
          <input
            type="tel"
            placeholder="رقم الهاتف (مثل: 01123...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
            dir="ltr"
          />
        </div>

        <div className="relative group/field">
          <div className="absolute top-3.5 right-4 flex items-start pointer-events-none text-slate-500 group-focus-within/field:text-indigo-400 transition-colors">
            <StickyNote className="w-4 h-4" />
          </div>
          <textarea
            placeholder="ملاحظات (اختياري)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
          <span>تسجيل المهتم الآن</span>
        </button>
      </form>

      {/* Bookmarklet Tool Expansion */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <button 
          onClick={() => setShowBookmarklet(!showBookmarklet)}
          className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5" />
          {showBookmarklet ? "إخفاء أداة واتساب السريعة" : "هل تستخدم WhatsApp Web؟ جرب الأداة السريعة"}
        </button>

        {showBookmarklet && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-white">أداة الـ Bookmark:</strong> زرار بتضيفه في متصفحك، وأنت فاتح واتساب بتدوس عليه بيسجل الرقم فوراً في السيستم عندك من غير ما تفتح لوحة التحكم.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
                    setCopiedBookmarklet(true);
                    setTimeout(() => setCopiedBookmarklet(false), 3000);
                    onSuccess("تم نسخ الكود! ضيفه في الـ Bookmarks عندك");
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black border border-indigo-500/20 transition-all active:scale-95"
              >
                {copiedBookmarklet ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedBookmarklet ? "تم النسخ!" : "نسخ كود الأداة"}
              </button>
              <a 
                href="https://web.whatsapp.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold border border-white/10 transition-all"
              >
                فتح واتساب
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            
            <div className="text-[9px] text-slate-600 space-y-1 pr-1">
              <p>1. دوس <strong className="text-indigo-400">Ctrl + D</strong> (أو Command + D) وإنت فاتح أي صفحة.</p>
              <p>2. دوس More (أداة التعديل) عشان تعدل البوك مارك.</p>
              <p>3. سمّيه <strong className="text-white">"صائد العملاء 🎯"</strong>.</p>
              <p>4. امسح اللينك اللي مكتوب، واعمل Paste للكود اللي نسخته.</p>
              <p className="mt-2 text-emerald-400 font-bold text-xs pt-1 border-t border-white/5">
                دلوقتي وإنت بتكلم أي عميل على <strong className="text-white">واتساب ويب</strong>.. دوس عالزرار من شريط فوق.. هيسحب رقمه ويفتحلك الشاشة دي جاهزة على الحفظ!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
