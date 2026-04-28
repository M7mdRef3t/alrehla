"use client";

import { useState } from "react";
import { X, Zap, Loader2 } from "lucide-react";
import { safeGetSession } from "@/services/supabaseClient";

type Priority = "low" | "medium" | "high" | "critical";

type FormState = {
  title: string;
  description: string;
  source: string;
  priority: Priority;
  signal_source: string;
  business_goal: string;
  stage: string;
  facts: string;
  interpretations: string;
  confidence: number;
  tags: string;
};

const INITIAL: FormState = {
  title: "",
  description: "",
  source: "ops_insight",
  priority: "medium",
  signal_source: "",
  business_goal: "",
  stage: "Inbox",
  facts: "",
  interpretations: "",
  confidence: 50,
  tags: "",
};

type CaptureSignalModalProps = {
  onClose: () => void;
  onSuccess: (item: any) => void;
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
      const session = await safeGetSession();
      const token = session?.access_token ?? "";
      
      const payload = {
        ...form,
        facts: form.facts.split(",").map(s => s.trim()).filter(Boolean),
        interpretations: form.interpretations.split(",").map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/admin/discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      // The API returns the item directly
      onSuccess(data);
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
      <div className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-none">
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Title & Stage Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                العنوان *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="اسم الإشارة..."
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                المرحلة (Stage)
              </label>
              <select
                value={form.stage}
                onChange={(e) => set("stage", e.target.value)}
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 transition-colors"
              >
                <option value="Inbox">Inbox</option>
                <option value="Needs Evidence">Needs Evidence</option>
                <option value="Validated">Validated</option>
                <option value="Prioritized">Prioritized</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              الوصف *
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="ماذا لاحظت؟"
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

          {/* Confidence Row */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Confidence Level ({form.confidence}%)
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                form.confidence > 75 ? 'bg-emerald-500/20 text-emerald-400' :
                form.confidence > 40 ? 'bg-blue-500/20 text-blue-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {form.confidence > 75 ? 'High' : form.confidence > 40 ? 'Medium' : 'Low'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.confidence}
              onChange={(e) => set("confidence", parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Facts & Interpretations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Facts (مفصول بفصلة)
              </label>
              <textarea
                rows={2}
                value={form.facts}
                onChange={(e) => set("facts", e.target.value)}
                placeholder="حقيقة 1, حقيقة 2..."
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Interpretations (مفصول بفصلة)
              </label>
              <textarea
                rows={2}
                value={form.interpretations}
                onChange={(e) => set("interpretations", e.target.value)}
                placeholder="تفسير 1, تفسير 2..."
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Signal Source & Business Goal row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Signal Source
              </label>
              <input
                type="text"
                value={form.signal_source}
                onChange={(e) => set("signal_source", e.target.value)}
                placeholder="مثال: NPS comment"
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Business Goal
              </label>
              <input
                type="text"
                value={form.business_goal}
                onChange={(e) => set("business_goal", e.target.value)}
                placeholder="مثال: churn reduction"
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Tags (مفصول بفصلة)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="UI, Performance, Mobile..."
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
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-neutral-900 pb-2">
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
