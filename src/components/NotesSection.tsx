import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, X } from "lucide-react";
import type { PersonNote } from "../modules/map/mapTypes";
import { useAppContentString } from "../hooks/useAppContentString";

interface NotesSectionProps {
  personLabel: string;
  notes: PersonNote[];
  onAddNote: (text: string, comment?: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NotesSection: FC<NotesSectionProps> = ({
  personLabel,
  notes,
  onAddNote,
  onDeleteNote
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteComment, setNewNoteComment] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const noteCommentPlaceholder = useAppContentString(
    "note_comment_placeholder",
    "مثال: لأني ده يدخلني في جسمه وبتحبس جوا وبشوف العالم من خلاله...",
    { page: "notes" }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      onAddNote(
        newNoteText.trim(),
        newNoteComment.trim() || undefined
      );
      setNewNoteText("");
      setNewNoteComment("");
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewNoteText("");
    setNewNoteComment("");
    setIsAdding(false);
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          ملاحظات شخصية
        </h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-full bg-teal-600 text-white p-2 hover:bg-teal-700 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            title="إضافة ملاحظة جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            onSubmit={handleSubmit}
            className="mb-4 p-4 bg-teal-50 border-2 border-teal-200 rounded-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3">
              <label htmlFor="note-text" className="block text-sm font-medium text-slate-700 mb-2 text-right">
                الملاحظة الرئيسية <span className="text-red-500">*</span>
              </label>
              <textarea
                id="note-text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={`مثال: هو اللي يفهم نفسه بنفسه مش أنا اللي أفهمه`}
                className="w-full border border-teal-300 rounded-lg px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
                dir="rtl"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="note-comment" className="block text-sm font-medium text-slate-700 mb-2 text-right">
                تعليق إضافي (اختياري)
              </label>
              <textarea
                id="note-comment"
                value={newNoteComment}
                onChange={(e) => setNewNoteComment(e.target.value)}
                placeholder={noteCommentPlaceholder}
                className="w-full border border-teal-300 rounded-lg px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
                dir="rtl"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full bg-gray-100 px-5 py-2 text-sm text-gray-700 font-medium hover:bg-gray-200 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="rounded-full bg-teal-600 text-white px-5 py-2 text-sm font-semibold shadow-sm hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                حفظ
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لسه مفيش ملاحظات عن {personLabel}</p>
            <p className="text-xs mt-1">اضغط على + لإضافة أول ملاحظة</p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              className="p-4 bg-white border border-gray-200 rounded-xl text-right relative group hover:border-teal-300 transition-colors duration-150"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              layout
            >
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDeleteNote(note.id)}
                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600 active:scale-95 transition-all duration-150 z-10"
                title="حذف الملاحظة"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
              </button>

              {/* Main Note Text */}
              <p className="text-base text-slate-900 leading-relaxed font-medium mb-2">
                "{note.text}"
              </p>

              {/* Comment (if exists) */}
              {note.comment && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    {expandedNoteId === note.id ? "إخفاء" : "عرض"} التعليق
                    <motion.span
                      animate={{ rotate: expandedNoteId === note.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {expandedNoteId === note.id && (
                      <motion.p
                        className="text-sm text-gray-600 leading-relaxed mt-2 italic"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {note.comment}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(note.timestamp).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
};
