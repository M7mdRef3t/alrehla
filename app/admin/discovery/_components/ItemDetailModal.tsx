"use client";

import { useState } from "react";
import { X, Save, Trash2, Loader2, Star, Plus, Minus } from "lucide-react";
import { DiscoveryItem } from "@/types/discovery";
import { runtimeEnv } from "@/config/runtimeEnv";

type ItemDetailModalProps = {
  item: DiscoveryItem;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DiscoveryItem>) => void;
  onDelete?: (id: string) => void;
};

export default function ItemDetailModal({ item, onClose, onUpdate, onDelete }: ItemDetailModalProps) {
  const [form, setForm] = useState<DiscoveryItem>({ ...item });
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof DiscoveryItem>(key: K, val: DiscoveryItem[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const adminCode = runtimeEnv.adminCode ?? "";
      const { id, created_at: _, updated_at: __, ...updates } = form;
      
      const res = await fetch("/api/admin/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminCode}`,
        },
        body: JSON.stringify({ id, updates }),
      });

      if (!res.ok) throw new Error("Failed to save changes.");
      
      onUpdate(id, updates);
      onClose();
    } catch (err) {
      console.error("Error saving item:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addEvidence = () => {
    const ev = form.evidence || [];
    set("evidence", [...ev, ""]);
  };

  const updateEvidence = (idx: number, val: string) => {
    const ev = [...(form.evidence || [])];
    ev[idx] = val;
    set("evidence", ev);
  };

  const removeEvidence = (idx: number) => {
    const ev = (form.evidence || []).filter((_, i) => i !== idx);
    set("evidence", ev);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="ltr">
      <div 
        className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h3 className="text-xl font-bold text-white leading-tight">{form.title}</h3>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">{form.stage} — {form.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Main Info Section */}
          <section className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Description</label>
              <textarea 
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50 transition-all resize-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Confidence Level</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => set("confidence", lvl)}
                      className={`p-2 rounded-xl border transition-all ${
                        (form.confidence || 0) >= lvl 
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-400" 
                          : "bg-neutral-800 border-white/5 text-neutral-600 hover:text-neutral-400"
                      }`}
                    >
                      <Star className={`w-5 h-5 ${ (form.confidence || 0) >= lvl ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Priority</label>
                <select 
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value as DiscoveryItem["priority"])}
                  className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50"
                  dir="ltr"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </section>

          {/* Strategic Context */}
          <section className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Strategic Context</h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2">Business Goal</label>
                <input 
                  type="text" 
                  value={form.business_goal || ""} 
                  onChange={(e) => set("business_goal", e.target.value)}
                  placeholder="e.g. Increase conversion"
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2">Signal Source</label>
                <input 
                  type="text" 
                  value={form.signal_source || ""} 
                  onChange={(e) => set("signal_source", e.target.value)}
                  placeholder="e.g. Hotjar session #423"
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2">Hypothesis</label>
              <textarea 
                value={form.hypothesis || ""} 
                onChange={(e) => set("hypothesis", e.target.value)}
                placeholder="If we build X, then Y will happen because Z..."
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/30 resize-none"
                rows={2}
              />
            </div>
          </section>

          {/* Evidence List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">Documented Evidence</label>
              <button 
                onClick={addEvidence}
                className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase h-6 px-3 rounded-full bg-purple-500/10 border border-purple-500/20"
              >
                <Plus className="w-3 h-3" /> Add Link/Proof
              </button>
            </div>
            
            <div className="space-y-2">
              {(form.evidence || []).map((ev, idx) => (
                <div key={idx} className="flex gap-2 group">
                  <input 
                    type="text" 
                    value={ev} 
                    onChange={(e) => updateEvidence(idx, e.target.value)}
                    placeholder="URL or specific observation..."
                    className="flex-1 bg-neutral-800/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-400 focus:outline-none focus:border-purple-500/30"
                  />
                  <button 
                    onClick={() => removeEvidence(idx)}
                    className="p-3 text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(form.evidence || []).length === 0 && (
                <p className="text-xs text-neutral-600 italic">No evidence linked yet. This signal is currently anecdotal.</p>
              )}
            </div>
          </section>

          {/* Next Steps */}
          <section>
             <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Defined Next Step</label>
             <input 
              type="text" 
              value={form.next_step || ""} 
              onChange={(e) => set("next_step", e.target.value)}
              placeholder="What is the immediate action?"
              className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-teal-300 font-bold focus:outline-none focus:border-teal-500/50"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="text-rose-500/80">
            {onDelete && (
                <button 
                    onClick={() => { if(confirm("Are you sure?")) onDelete(form.id); }}
                    className="flex items-center gap-2 text-xs font-bold hover:text-rose-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> Delete Signal
                </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-neutral-500 hover:text-white transition-all"
            >
              Discard Changes
            </button>
            <button 
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/40 active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
