"use client";

import { useState } from "react";
import { X, Zap, Loader2 } from "lucide-react";
import { runtimeEnv } from "@/config/runtimeEnv";

type Priority = "low" | "medium" | "high" | "critical";

type FormState = {
  title: string;
  description: string;
  source: string;
  priority: Priority;
  signal_source: string;
  business_goal: string;
};

const INITIAL: FormState = {
  title: "",
  description: "",
  source: "ops_insight",
  priority: "medium",
  signal_source: "",
  business_goal: "",
};

type CaptureSignalModalProps = {
  onClose: () => void;
  onSuccess: (item: unknown) => void;
};

export default function CaptureSignalModal({ onClose, onSuccess }: CaptureSignalModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("العنوان والوصف مطلوبان.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const adminCode = runtimeEnv.adminCode ?? "";
      const res = await fetch("/api/admin/discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminCode}`,
        },
        body: JSON.stringify({
          ...form,
          stage: "Inbox",
          facts: [],
          interpretations: [],
          tags: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      onSuccess(data.item);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحفظ. حاول تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-purple-400">
            <Zap className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Capture Signal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              العنوان *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="اسم الإشارة أو الملاحظة..."
              className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              الوصف *
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="ماذا لاحظت؟ ما السياق؟"
              className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
            />
          </div>

          {/* Source + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                المصدر
              </label>
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 transition-colors"
              >
                <option value="ops_insight">Ops Insight</option>
                <option value="user_signal">User Signal</option>
                <option value="direct_feedback">Direct Feedback</option>
                <option value="market_research">Market Research</option>
                <option value="competitor_intel">Competitor Intel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                الأولوية
              </label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Signal Source */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Signal Source (اختياري)
            </label>
            <input
              type="text"
              value={form.signal_source}
              onChange={(e) => set("signal_source", e.target.value)}
              placeholder="مثال: مستخدم A، Hotjar session، NPS comment"
              className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Business Goal */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Business Goal (اختياري)
            </label>
            <input
              type="text"
              value={form.business_goal}
              onChange={(e) => set("business_goal", e.target.value)}
              placeholder="مثال: زيادة conversion، تقليل churn"
              className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-medium text-neutral-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "جاري الحفظ..." : "احفظ الإشارة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
