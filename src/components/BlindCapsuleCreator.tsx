import React, { useState, type FC } from "react";
import { X, Send, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBlindCapsuleState } from "../state/blindCapsuleState";
import { useToastState } from "../state/toastState";

interface BlindCapsuleCreatorProps {
   isOpen: boolean;
   onClose: () => void;
}

export const BlindCapsuleCreator: FC<BlindCapsuleCreatorProps> = ({ isOpen, onClose }) => {
   const [message, setMessage] = useState("");
   const createCapsule = useBlindCapsuleState((s) => s.createCapsule);

   const handleSave = () => {
      if (message.trim().length < 10) {
         useToastState.getState().showToast("اكتب شيئاً كافياً لنسختك المنهكة لتستند عليه.", "error");
         return;
      }
      createCapsule(message);
      useToastState.getState().showToast("تم إحكام إغلاق الكبسولة. لن تراها مجدداً إلا وقت الطوارئ الحقيقية.", "success");
      setMessage("");
      onClose();
   };

   return (
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               {/* Ambient blurring */}
               <motion.div
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  className="absolute inset-0 bg-slate-950/60"
                  onClick={onClose}
               />

               <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-lg bg-emerald-950/40 border border-emerald-900 shadow-2xl rounded-3xl overflow-hidden p-6 md:p-8 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                           <Lock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-emerald-100">الكبسولة العمياء</h2>
                           <p className="text-xs text-emerald-400/70 font-bold">لا تُفتح إلا في الانهيار الكبير</p>
                        </div>
                     </div>
                     <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 text-emerald-500/50 hover:text-emerald-300 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <p className="text-sm font-medium text-emerald-100/80 mb-6 leading-relaxed">
                     أنت الآن في وضع هادئ وإدراكك منتظم. اكتب رسالة لنفسك لتقرأها في يوم عصيب ومربك. <strong>بمجرد الإرسال، سيتم تشفيرها وإخفائها كلياً من النظام. المنصة وحدها ستعرف متى تحتاجها وستفجرها في وجهك.</strong>
                  </p>

                  <textarea
                     id="blind-capsule-message"
                     name="blindCapsuleMessage"
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     placeholder="ذكر نفسك بحقيقتك المنسية وقت الخوف..."
                     className="w-full h-40 bg-black/40 border border-emerald-900/50 rounded-2xl p-4 text-emerald-50 placeholder:text-emerald-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none mb-6 custom-scrollbar"
                  />

                  <div className="flex justify-end gap-3">
                     <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-transparent text-emerald-500 hover:text-emerald-300 transition-colors">
                        إلغاء
                     </button>
                     <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                        <Send className="w-4 h-4" />
                        <span>اختم الكبسولة الآن</span>
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
   );
};
