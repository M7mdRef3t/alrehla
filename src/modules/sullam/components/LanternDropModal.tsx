"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GrowthArea, AREA_META } from "../store/sullam.store";
import { lanternsService } from "../../../services/lanterns.service";

export function LanternDropModal({ 
  area, 
  onClose, 
  onSuccess 
}: { 
  area: GrowthArea, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    const lantern = await lanternsService.leaveLantern(area, content);
    setSubmitting(false);
    if (lantern) {
      onSuccess();
    } else {
      // In a full implementation, handle error state via toast
      alert("حدث خطأ أثناء ترك القنديل، حاول مرة أخرى.");
    }
  };

  const meta = AREA_META[area];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 opacity-10" 
            style={{ backgroundColor: meta.color }} 
          />

          <div className="text-center mb-6 relative z-10">
            <span className="text-5xl mb-3 block opacity-90">{meta.emoji}</span>
            <h3 className="text-2xl font-bold text-white/90 mb-2">إرث العبور</h3>
            <p className="text-sm text-white/60 leading-relaxed dir-rtl">
              تجاوزتَ عقبة أسقطت الكثيرين في المسار {meta.label}. قبل أن تمضي للأمام، هل تترك 'قنديلاً' ينير الطريق لمن سيقف هنا غداً وتائهاً كما كنت أنت؟
            </p>
          </div>

          <div className="relative z-10 mb-6">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="اكتب خلاصة تجربتك أو كلمة تطمئن من سيقرأها..."
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 dir-rtl outline-none focus:border-amber-500/50 transition-colors resize-none min-h-[120px]"
            />
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="py-3 px-4 rounded-xl font-bold bg-amber-500 text-neutral-900 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "يتم ترك الأثر..." : "اترك القنديل 🏮"}
            </motion.button>
            
            <button
              onClick={onClose}
              disabled={submitting}
              className="py-3 px-4 rounded-xl font-bold text-white/50 hover:text-white/80 transition-colors"
            >
              تجاوز الآن
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
