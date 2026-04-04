import type { FC } from "react";
import { useMemo, useState } from "react";
import { X, MessageCircle } from "lucide-react";

export interface FeedbackSubmission {
  category: "general" | "bug" | "idea";
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FeedbackSubmission) => Promise<void> | void;
}

export const FeedbackModal: FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [category, setCategory] = useState<FeedbackSubmission["category"]>("general");
  const [rating, setRating] = useState<FeedbackSubmission["rating"]>(4);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = useMemo(() => message.trim().length >= 8 && !sending, [message, sending]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">شاركنا رأيك</h3>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          ملاحظتك تساعدنا نحسّن التجربة. اكتب أي مشكلة أو اقتراح واضح.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setCategory("general")}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${category === "general" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}
          >
            ملاحظة عامة
          </button>
          <button
            type="button"
            onClick={() => setCategory("bug")}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${category === "bug" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-600"}`}
          >
            مشكلة
          </button>
          <button
            type="button"
            onClick={() => setCategory("idea")}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${category === "idea" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600"}`}
          >
            اقتراح
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">تقييمك السريع</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v as FeedbackSubmission["rating"])}
                className={`w-8 h-8 rounded-full text-xs font-bold border ${rating >= v ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-500"}`}
                aria-label={`تقييم ${v}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <textarea
          id="feedback-message"
          name="feedbackMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={1200}
          placeholder="اكتب ملاحظتك هنا..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="mt-1 text-[11px] text-slate-500">{message.length}/1200</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return;
              setSending(true);
              try {
                await onSubmit({
                  category,
                  rating,
                  message: message.trim()
                });
                setSent(true);
                setMessage("");
              } finally {
                setSending(false);
              }
            }}
            className="flex-1 rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "جاري الإرسال..." : sent ? "تم الإرسال" : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
};

