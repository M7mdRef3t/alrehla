import React, { useEffect, useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArchiveRestore, Check, Sparkles } from "lucide-react";
import { useBlindCapsuleState } from "../state/blindCapsuleState";
import { useAppOverlayState } from "../state/appOverlayState";

export const BlindCapsuleOpener: FC = () => {
   const isOpen = useAppOverlayState((s) => s.flags.blindCapsuleOpener);
   const closeOverlay = () => useAppOverlayState.getState().setOverlay("blindCapsuleOpener", false);
   
   const sealedCapsules = useBlindCapsuleState((s) => s.getSealedCapsules());
   const unlockCapsule = useBlindCapsuleState((s) => s.unlockCapsule);

   const [activeCapsule, setActiveCapsule] = useState<{ id: string, message: string } | null>(null);
   const [phase, setPhase] = useState<"summoning" | "reading" | "done">("summoning");

   useEffect(() => {
      if (isOpen && sealedCapsules.length > 0) {
         const capsuleToOpen = sealedCapsules[0];
         setActiveCapsule(capsuleToOpen);
         // Auto-unlock
         unlockCapsule(capsuleToOpen.id);
         setPhase("summoning");

         // Dramatic unsealing effect timing
         setTimeout(() => {
            setPhase("reading");
         }, 3000);
      } else if (isOpen && sealedCapsules.length === 0) {
         // Failsafe: if somehow opened without capsules, just close
         useAppOverlayState.getState().setOverlay("blindCapsuleOpener", false);
      }
   }, [isOpen, sealedCapsules, unlockCapsule]);

   if (!isOpen || !activeCapsule) return null;

   return (
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
               {/* Pitch Black Backdrop to simulate entering a void */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black"
               />

               {phase === "summoning" && (
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                     transition={{ duration: 2, ease: "easeInOut" }}
                     className="relative z-10 flex flex-col items-center text-center max-w-sm"
                  >
                     <ArchiveRestore className="w-16 h-16 text-emerald-500/50 mb-6 animate-pulse" />
                     <h2 className="text-2xl font-black text-white tracking-widest mb-4">يتم فك الختم</h2>
                     <p className="text-sm font-medium text-slate-400 leading-relaxed">
                        هناك رسالة مخبأة من نسختك السابقة في فترة الهدوء التام. كنت تعلم أن هذه اللحظة من الفوضى ستأتي.
                     </p>
                  </motion.div>
               )}

               {phase === "reading" && (
                  <motion.div 
                     initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                     animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[3rem] shadow-[0_0_100px_rgba(52,211,153,0.15)] flex flex-col items-center text-center"
                  >
                     <Sparkles className="w-8 h-8 text-emerald-400 mb-6" />
                     <p className="text-xs text-emerald-500/80 font-bold tracking-[0.2em] uppercase mb-8">
                        رسالة من النسخة الهادئة
                     </p>
                     
                     <p className="text-2xl md:text-3xl font-black text-slate-100 leading-[1.8] mb-12">
                        "{activeCapsule.message}"
                     </p>

                     <button
                        onClick={() => {
                           setPhase("done");
                           setTimeout(closeOverlay, 500);
                        }}
                        className="px-8 py-4 bg-white hover:bg-slate-200 text-black rounded-full font-bold transition-all active:scale-95 flex items-center gap-3"
                     >
                        <Check className="w-5 h-5" /> لقد فهمت الرسالة
                     </button>
                  </motion.div>
               )}
            </div>
         )}
      </AnimatePresence>
   );
};
