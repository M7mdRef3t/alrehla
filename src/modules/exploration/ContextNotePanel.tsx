/**
 * ContextNotePanel
 * لوحة ملاحظات مرتبطة بعقدة محددة في خريطة العلاقات.
 * تظهر عند تحديد عقدة وتتيح تدوين أفكار وربطها بالسياق.
 * - يدعم حذف الملاحظات الفردية
 * - يحفظ في localStorage
 */
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Save, X, Clock, BookOpen, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface NoteEntry {
  id: string;
  text: string;
  timestamp: number;
  nodeLabel: string;
}

const STORAGE_KEY = "alrehla_context_notes";

function loadNotes(): Record<string, NoteEntry[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, NoteEntry[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch { /* ignore */ }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

interface ContextNotePanelProps {
  nodeId: string | null;
  nodeLabel: string;
  onClose: () => void;
}

export const ContextNotePanel = memo(function ContextNotePanel({
  nodeId,
  nodeLabel,
  onClose,
}: ContextNotePanelProps) {
  const [draft, setDraft] = useState("");
  const [allNotes, setAllNotes] = useState<Record<string, NoteEntry[]>>(loadNotes);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const nodeNotes = nodeId ? (allNotes[nodeId] ?? []) : [];

  // Reset draft when node changes
  useEffect(() => {
    setDraft("");
    setShowHistory(false);
    const t = setTimeout(() => textareaRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, [nodeId]);

  const handleSave = useCallback(() => {
    if (!draft.trim() || !nodeId) return;

    const entry: NoteEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: draft.trim(),
      timestamp: Date.now(),
      nodeLabel,
    };

    const updated = {
      ...allNotes,
      [nodeId]: [entry, ...(allNotes[nodeId] ?? [])],
    };
    setAllNotes(updated);
    saveNotes(updated);
    setDraft("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [draft, nodeId, nodeLabel, allNotes]);

  const handleDelete = useCallback((noteId: string) => {
    if (!nodeId) return;
    setDeletingId(noteId);
    // Short delay for exit animation
    setTimeout(() => {
      const updated = {
        ...allNotes,
        [nodeId]: (allNotes[nodeId] ?? []).filter((n) => n.id !== noteId),
      };
      setAllNotes(updated);
      saveNotes(updated);
      setDeletingId(null);
    }, 250);
  }, [nodeId, allNotes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  if (!nodeId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(45, 212, 191, 0.15)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <Pencil className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-teal-400/70 uppercase">
              ملاحظة
            </p>
            <p className="text-xs font-semibold text-white leading-none">
              {nodeLabel}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Textarea */}
      <div className="px-4 pt-3 pb-2">
            <textarea
              id="context-note-panel"
              name="contextNotePanel"
              ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب ملاحظتك هنا... (Ctrl+Enter للحفظ)"
          rows={3}
          className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600
                     resize-none outline-none leading-relaxed"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <Clock className="w-3 h-3" />
          <span>Ctrl+Enter</span>
        </div>
        <button
          onClick={handleSave}
          disabled={!draft.trim()}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            saved
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : draft.trim()
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30"
              : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
          }`}
        >
          <Save className="w-3 h-3" />
          {saved ? "تم الحفظ ✓" : "حفظ"}
        </button>
      </div>

      {/* Previous Notes Toggle */}
      {nodeNotes.length > 0 && (
        <>
          <div className="border-t border-white/[0.05]">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>ملاحظاتك السابقة ({nodeNotes.length})</span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  <AnimatePresence initial={false}>
                    {nodeNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`group relative p-3 rounded-xl border space-y-1 transition-colors ${
                          deletingId === note.id
                            ? "bg-red-500/5 border-red-500/20"
                            : "bg-white/[0.03] border-white/[0.05] hover:border-white/10"
                        }`}
                      >
                        <p className="text-xs text-slate-300 leading-relaxed pl-5">
                          {note.text}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {formatTime(note.timestamp)}
                        </p>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center
                                     text-slate-700 hover:text-red-400 hover:bg-red-500/10
                                     opacity-0 group-hover:opacity-100 transition-all"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
});


