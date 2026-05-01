import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Plus,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Database,
  Search,
  Sparkles,
  User,
  Bot
} from "lucide-react";
import { useAdminState, type DebatedConcept, type ConceptStatus, type ConceptArgument } from "@/domains/admin/store/admin.store";

const STATUS_CONFIG: Record<ConceptStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  draft: { label: "مسودة", icon: <Clock className="w-4 h-4" />, color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/20" },
  debating: { label: "قيد النقاش", icon: <MessageSquare className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  validated: { label: "مُثبت علمياً", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-teal-400", bg: "bg-teal-400/10 border-teal-400/20" },
  rejected: { label: "مرفوض (وهم)", icon: <XCircle className="w-4 h-4" />, color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/20" }
};

export const ConceptsDebatePanel: React.FC = () => {
  const concepts = useAdminState((s) => s.debatedConcepts);
  const addConcept = useAdminState((s) => s.addConcept);
  const updateConceptStatus = useAdminState((s) => s.updateConceptStatus);
  const addConceptArgument = useAdminState((s) => s.addConceptArgument);
  
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newHypothesis, setNewHypothesis] = useState("");
  const [argumentText, setArgumentText] = useState("");
  
  const selectedConcept = concepts.find(c => c.id === selectedConceptId);

  const handleCreateConcept = () => {
    if (!newTitle.trim() || !newHypothesis.trim()) return;
    const newConcept: DebatedConcept = {
      id: `concept_${Date.now()}`,
      title: newTitle.trim(),
      hypothesis: newHypothesis.trim(),
      status: "draft",
      arguments: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    addConcept(newConcept);
    setIsCreating(false);
    setNewTitle("");
    setNewHypothesis("");
    setSelectedConceptId(newConcept.id);
  };

  const handleAddArgument = (author: ConceptArgument["author"] = "owner") => {
    if (!selectedConceptId || !argumentText.trim()) return;
    const arg: ConceptArgument = {
      id: `arg_${Date.now()}`,
      author,
      content: argumentText.trim(),
      timestamp: Date.now()
    };
    addConceptArgument(selectedConceptId, arg);
    setArgumentText("");
    
    // Auto-reply simulation for AI if owner posts
    if (author === "owner") {
      setTimeout(() => {
        addConceptArgument(selectedConceptId, {
          id: `arg_ai_${Date.now()}`,
          author: "ai",
          content: "بناءً على بروتوكول اختبار الحقيقة، هذا الادعاء يحتاج إلى جمع 5 عينات اختبار أعمى لتحديد ما إذا كان 'وهماً' أم ظاهرة قابلة للقياس.",
          timestamp: Date.now()
        });
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Brain className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">مختبر المفاهيم</h1>
            <p className="text-sm font-bold text-indigo-400/80 uppercase tracking-widest mt-1">
              مساحة اختبار الحقائق وفصل الإدراك عن الوهم
            </p>
          </div>
        </div>
        <button
          onClick={() => { setIsCreating(true); setSelectedConceptId(null); }}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>فرضية جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Concepts */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-4 flex-1 h-[600px] overflow-hidden flex flex-col">
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute right-3 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="ابحث في المفاهيم..."
                className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {concepts.length === 0 && !isCreating ? (
                <div className="text-center py-10 text-slate-500 text-sm">لا توجد مفاهيم بعد.</div>
              ) : (
                concepts.map((concept) => {
                  const statusInfo = STATUS_CONFIG[concept.status];
                  const isSelected = selectedConceptId === concept.id;
                  return (
                    <button
                      key={concept.id}
                      onClick={() => { setSelectedConceptId(concept.id); setIsCreating(false); }}
                      className={`w-full text-right p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                          : "bg-black/20 border-white/5 hover:bg-white/5"
                      }`}
                    >
                      <h3 className={`font-bold truncate ${isSelected ? "text-white" : "text-slate-300"}`}>{concept.title}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 w-fit ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(concept.updatedAt).toLocaleDateString("ar-EG")}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Debate Arena */}
        <div className="col-span-1 lg:col-span-2">
          {isCreating ? (
            <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-8 shadow-xl h-[600px] flex flex-col">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                طرح فرضية جديدة للنقاش
              </h2>
              
              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">عنوان المفهوم / الظاهرة</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: التخاطر أثناء الصمت"
                    className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">الفرضية (ما الذي نحاول إثباته أو نفيه؟)</label>
                  <textarea
                    value={newHypothesis}
                    onChange={(e) => setNewHypothesis(e.target.value)}
                    placeholder="اشرح الفرضية بوضوح لتكون قابلة للاختبار المعرفي..."
                    className="w-full h-32 bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateConcept}
                  disabled={!newTitle.trim() || !newHypothesis.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                >
                  حفظ وفتح ساحة النقاش
                </button>
              </div>
            </div>
          ) : selectedConcept ? (
            <div className="bg-slate-900/50 rounded-3xl border border-white/5 shadow-xl h-[600px] flex flex-col overflow-hidden">
              {/* Arena Header */}
              <div className="p-6 border-b border-white/5 bg-black/20">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-black text-white">{selectedConcept.title}</h2>
                  <select
                    value={selectedConcept.status}
                    onChange={(e) => updateConceptStatus(selectedConcept.id, e.target.value as ConceptStatus)}
                    className="bg-slate-800 border border-slate-700 text-sm font-bold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">مسودة</option>
                    <option value="debating">قيد النقاش</option>
                    <option value="validated">مُثبت علمياً</option>
                    <option value="rejected">مرفوض (وهم)</option>
                  </select>
                </div>
                <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                    <span className="text-indigo-400 font-bold ml-2">الفرضية:</span>
                    {selectedConcept.hypothesis}
                  </p>
                </div>
              </div>

              {/* Arguments Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                {selectedConcept.arguments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                    <MessageSquare className="w-10 h-10 opacity-20" />
                    <p className="text-sm">لم يبدأ النقاش بعد. اطرح أول دليل أو ملاحظة.</p>
                  </div>
                ) : (
                  selectedConcept.arguments.map((arg) => (
                    <div key={arg.id} className={`flex ${arg.author === "owner" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] flex flex-col gap-1 ${arg.author === "owner" ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 px-1">
                          {arg.author === "owner" ? (
                            <><span className="text-[10px] text-slate-400 font-bold uppercase">أنت</span><User className="w-3 h-3 text-slate-500" /></>
                          ) : arg.author === "ai" ? (
                            <><Bot className="w-3 h-3 text-indigo-400" /><span className="text-[10px] text-indigo-400 font-bold uppercase">الذكاء السيادي</span></>
                          ) : (
                            <><Database className="w-3 h-3 text-teal-400" /><span className="text-[10px] text-teal-400 font-bold uppercase">بيانات مرجعية</span></>
                          )}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          arg.author === "owner" 
                            ? "bg-slate-800 text-white rounded-tl-none border border-slate-700 shadow-md" 
                            : arg.author === "ai"
                              ? "bg-indigo-900/30 text-indigo-100 border border-indigo-500/30 rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                              : "bg-teal-900/20 text-teal-100 border border-teal-500/30 rounded-tr-none border-dashed"
                        }`}>
                          {arg.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-900/80 border-t border-white/5 backdrop-blur-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={argumentText}
                    onChange={(e) => setArgumentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddArgument("owner")}
                    placeholder="اكتب ردك أو دليلك هنا..."
                    className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => handleAddArgument("owner")}
                    disabled={!argumentText.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-3xl border border-white/5 shadow-xl h-[600px] flex flex-col items-center justify-center text-slate-500">
              <Brain className="w-16 h-16 opacity-20 mb-4" />
              <p>اختر مفهوماً من القائمة لفتح ساحة النقاش</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
