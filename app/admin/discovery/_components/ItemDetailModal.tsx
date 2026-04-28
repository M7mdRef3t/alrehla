"use client";

import { useState } from "react";
import { X, Save, Trash2, Loader2, Plus, Minus, Hash, AlertCircle, Quote, ClipboardList } from "lucide-react";
import { DiscoveryItem, DiscoveryStage } from "@/types/discovery";
import { safeGetSession } from "@/services/supabaseClient";

type ItemDetailModalProps = {
  item: DiscoveryItem;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DiscoveryItem>) => void;
  onDelete?: (id: string) => void;
};

export default function ItemDetailModal({ item, onClose, onUpdate, onDelete }: ItemDetailModalProps) {
  const [form, setForm] = useState<DiscoveryItem>({ 
    ...item,
    facts: item.facts || [],
    interpretations: item.interpretations || [],
    tags: item.tags || [],
    confidence: item.confidence ?? 50
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof DiscoveryItem>(key: K, val: DiscoveryItem[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const session = await safeGetSession();
      const token = session?.access_token ?? "";
      
      const { id, created_at: _, updated_at: __, ...updates } = form;
      
      const res = await fetch("/api/admin/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const updateList = (key: 'facts' | 'interpretations' | 'tags' | 'evidence', idx: number, val: string) => {
    const list = [...(form[key] || [])] as string[];
    list[idx] = val;
    set(key, list);
  };

  const addToList = (key: 'facts' | 'interpretations' | 'tags' | 'evidence') => {
    const list = [...(form[key] || [])] as string[];
    set(key, [...list, ""]);
  };

  const removeFromList = (key: 'facts' | 'interpretations' | 'tags' | 'evidence', idx: number) => {
    const list = (form[key] || []).filter((_, i) => i !== idx);
    set(key, list);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="ltr">
      <div 
        className="w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-12 rounded-full ${(form.confidence ?? 50) > 75 ? 'bg-emerald-500' : (form.confidence ?? 50) > 40 ? 'bg-blue-500' : 'bg-amber-500'} shadow-[0_0_15px_rgba(168,85,247,0.2)]`} />
            <div>
              <input 
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="text-2xl font-black text-white bg-transparent border-none outline-none focus:ring-0 p-0 w-full mb-1"
              />
              <div className="flex items-center gap-2">
                <select 
                  value={form.stage}
                  onChange={(e) => set("stage", e.target.value as DiscoveryStage)}
                  className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 outline-none"
                >
                  <option value="Inbox">Inbox</option>
                  <option value="Needs Evidence">Needs Evidence</option>
                  <option value="Validated">Validated</option>
                  <option value="Prioritized">Prioritized</option>
                  <option value="In Delivery">In Delivery</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Dropped">Dropped</option>
                </select>
                <span className="text-[10px] text-neutral-600 font-mono">ID: {form.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Main Description */}
          <section>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">
              <Quote className="w-3 h-3" /> Description & Observation
            </label>
            <textarea 
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full bg-neutral-800/40 border border-white/5 rounded-2xl px-6 py-4 text-[15px] text-neutral-200 leading-relaxed focus:outline-none focus:border-purple-500/40 transition-all resize-none min-h-[120px]"
              placeholder="What did you see?"
            />
          </section>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-8">
            <section>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Confidence ({form.confidence ?? 50}%)</label>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${(form.confidence ?? 50) > 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {(form.confidence ?? 50) > 75 ? 'High Certainty' : 'Research Required'}
                </span>
              </div>
              <input 
                type="range"
                min="0" max="100" step="5"
                value={form.confidence ?? 50}
                onChange={(e) => set("confidence", parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </section>
            <section>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Priority Level</label>
              <select 
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as any)}
                className="w-full bg-neutral-800/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/40 transition-all"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Path</option>
              </select>
            </section>
          </div>

          {/* Discovery Analysis: Facts & Interpretations */}
          <div className="grid grid-cols-2 gap-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <ClipboardList className="w-3 h-3 text-cyan-400" /> Facts
                </label>
                <button onClick={() => addToList('facts')} className="p-1 hover:bg-white/10 rounded text-cyan-400"><Plus className="w-3 h-3" /></button>
              </div>
              <div className="space-y-2">
                {form.facts?.map((fact, idx) => (
                  <div key={idx} className="flex gap-2 group">
                    <input 
                      value={fact} 
                      onChange={(e) => updateList('facts', idx, e.target.value)}
                      className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-neutral-300 focus:border-cyan-500/30 outline-none"
                    />
                    <button onClick={() => removeFromList('facts', idx)} className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400"><Minus className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <Quote className="w-3 h-3 text-purple-400" /> Interpretations
                </label>
                <button onClick={() => addToList('interpretations')} className="p-1 hover:bg-white/10 rounded text-purple-400"><Plus className="w-3 h-3" /></button>
              </div>
              <div className="space-y-2">
                {form.interpretations?.map((interp, idx) => (
                  <div key={idx} className="flex gap-2 group">
                    <input 
                      value={interp} 
                      onChange={(e) => updateList('interpretations', idx, e.target.value)}
                      className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-neutral-300 focus:border-purple-500/30 outline-none"
                    />
                    <button onClick={() => removeFromList('interpretations', idx)} className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400"><Minus className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Strategic Context */}
          <section className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-8 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-2">Strategic Resonance</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-600">Business Goal</label>
                <input 
                  value={form.business_goal || ""} 
                  onChange={(e) => set("business_goal", e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:border-purple-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-600">Signal Source</label>
                <input 
                  value={form.signal_source || ""} 
                  onChange={(e) => set("signal_source", e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:border-purple-500/20 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">
              <Hash className="w-3 h-3" /> Taxonomy & Tags
            </label>
            <div className="flex flex-wrap gap-2 p-4 bg-black/20 border border-white/5 rounded-2xl min-h-[60px]">
              {form.tags?.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-neutral-800 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-neutral-400">
                  <input 
                    value={tag} 
                    onChange={(e) => updateList('tags', idx, e.target.value)}
                    className="bg-transparent border-none outline-none w-16"
                  />
                  <button onClick={() => removeFromList('tags', idx)} className="hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                </div>
              ))}
              <button onClick={() => addToList('tags')} className="flex items-center gap-1 px-3 py-1 rounded-lg border border-dashed border-white/10 text-[10px] text-neutral-500 hover:text-white hover:border-white/20 transition-all">
                <Plus className="w-3 h-3" /> Add Tag
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <button 
            onClick={() => { if(confirm("Are you sure?")) onDelete?.(form.id); }}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-neutral-600 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Signal
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 px-10 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-900/40 active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Syncing..." : "Commit Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
