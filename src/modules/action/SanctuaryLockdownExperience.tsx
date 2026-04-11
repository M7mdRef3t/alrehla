import React, { useEffect, useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Wind } from "lucide-react";
import { useLockdownState } from "@/domains/admin/store/lockdown.store";
import { isDevMode } from "@/config/appEnv";

export const SanctuaryLockdownExperience: FC = () => {
   const isLockedDown = useLockdownState((s) => s.checkLockdownStatus());
   const liftLockdown = useLockdownState((s) => s.liftLockdown);
   const [phase, setPhase] = useState<"breatheIn" | "hold" | "breatheOut">("breatheIn");

   // Simple breathing animation cycle (4-7-8)
   useEffect(() => {
      if (!isLockedDown) return;
      
      const cycle = () => {
         setPhase("breatheIn");
         setTimeout(() => {
            setPhase("hold");
            setTimeout(() => {
               setPhase("breatheOut");
               setTimeout(cycle, 8000); // Exhale for 8s
            }, 7000); // Hold for 7s
         }, 4000); // Inhale for 4s
      };

      cycle();
   }, [isLockedDown]);

   if (!isLockedDown) return null;

   return (
      <AnimatePresence>
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-transparent"
         >
            {/* Minimalist Breathing Circle */}
            <motion.div 
               className="w-48 h-48 rounded-full border border-slate-800 flex items-center justify-center relative mb-16"
            >
               <motion.div 
                  animate={{ 
                     scale: phase === "breatheIn" || phase === "hold" ? 1.5 : 0.8,
                     opacity: phase === "hold" ? 0.8 : (phase === "breatheIn" ? 0.6 : 0.2)
                  }}
                  transition={{ 
                     duration: phase === "breatheIn" ? 4 : (phase === "hold" ? 7 : 8), 
                     ease: "easeInOut" 
                  }}
                  className="absolute inset-0 rounded-full bg-emerald-900/30 blur-2xl"
               />
               <Wind className="w-10 h-10 text-emerald-500/50 absolute" />
            </motion.div>

            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 2, duration: 2 }}
               className="text-center max-w-lg"
            >
               <div className="flex items-center justify-center gap-3 mb-6">
                  <ShieldAlert className="w-5 h-5 text-slate-500" />
                  <h1 className="text-sm tracking-[0.3em] uppercase text-slate-500 font-bold">صيام الملاذ القسري</h1>
               </div>
               
               <p className="text-2xl md:text-3xl font-black leading-[1.6] text-slate-300 mb-8">
                  محاولتك المستمرة للسيطرة هي ما يرهقك.
               </p>
               <p className="text-base text-slate-500 leading-relaxed mb-12">
                  اكتشف الملاذ تذبذباً حاداً في إدراكك مؤخراً. التوقف الآن هو الإنجاز. الملاذ يُغلق أبوابه لمدة ٢٤ ساعة ليجبرك على العيش في الخارج بعيداً عن وهم الإنتاجية والترتيب.
               </p>

               <p className="text-xs text-emerald-500/60 font-bold uppercase tracking-widest">
                  نراك غداً.
               </p>
            </motion.div>

            {/* Dev bypass hatch */}
            {isDevMode && (
               <button 
                  onClick={liftLockdown}
                  className="fixed bottom-4 right-4 text-[10px] text-slate-800 hover:text-slate-500 uppercase tracking-widest"
               >
                  Dev: Lift Lockdown
               </button>
            )}
         </motion.div>
      </AnimatePresence>
   );
};
