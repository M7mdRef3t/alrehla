import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppOverlayState } from "../state/appOverlayState";
import { useMapState } from "../state/mapState";

export default function EgoDeathProtocol() {
  const { flags, closeOverlay } = useAppOverlayState();
  const isOpen = flags.egoDeath;
  const nodes = useMapState((s) => s.nodes);

  const [progress, setProgress] = useState(0);
  const [isBurning, setIsBurning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
       setProgress(0);
       setIsBurning(false);
       setIsComplete(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePointerDown = () => {
    if (isComplete) return;
    setIsBurning(true);
    let currentProgress = progress;
    holdTimerRef.current = setInterval(() => {
        currentProgress += 1;
        if (currentProgress >= 100) {
           currentProgress = 100;
           clearInterval(holdTimerRef.current!);
           triggerHardDelete();
        }
        setProgress(currentProgress);
    }, 40);
  };

  const handlePointerUp = () => {
    if (isComplete) return;
    setIsBurning(false);
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    // Rapid cool down if they let go
    const coolDown = setInterval(() => {
        setProgress(prev => {
           if (prev <= 0) {
              clearInterval(coolDown);
              return 0;
           }
           return prev - 8;
        });
    }, 30);
  };

  const triggerHardDelete = () => {
      setIsComplete(true);
      useMapState.getState().resetMap();
      
      setTimeout(() => {
          closeOverlay("egoDeath");
      }, 4000);
  };

  const handleClose = () => {
    if (!isComplete) closeOverlay("egoDeath");
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black overflow-hidden" 
        dir="rtl"
      >
        {/* Extreme Noise / Chaos Background that accelerates with progress */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', filter: `contrast(${1 + progress/50}) brightness(${0.5 + progress/100})` }} />

        {isComplete ? (
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 2, ease: "easeOut" }}
             className="absolute inset-0 flex items-center justify-center bg-white"
           >
              <h1 className="text-4xl tracking-widest text-black font-light text-center">
                 أنت الآن تولد من جديد <br/>
                 <span className="text-sm tracking-normal text-black/50 mt-4 block">صفحة بيضاء. مساحة صامتة. لا ماضي يحكمك.</span>
              </h1>
           </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center justify-center text-center space-y-12 h-full"
            style={{ 
              x: isBurning ? Math.sin(progress) * (progress/10) : 0, 
              y: isBurning ? Math.cos(progress) * (progress/10) : 0 
            }}
          >
            {/* The nodes being sucked into the center */}
            <div className="relative w-64 h-64 border border-red-500/10 rounded-full flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-red-900/30 blur-sm" />
                 <motion.div 
                    className="absolute inset-0 rounded-full bg-red-600 blur-[80px]"
                    style={{ opacity: progress / 100, scale: 0.5 + (progress / 100) }}
                 />
                 <h2 className="text-5xl font-black text-red-500 tracking-tighter mix-blend-color-dodge drop-shadow-2xl z-20">
                    {nodes.length}
                    <span className="text-lg block text-red-500/50 mt-2 font-normal">عقدة متراكمة</span>
                 </h2>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                 حفل التخلي والجحيم (Ego Death)
              </h1>
              <p className="text-lg text-red-200/60 leading-relaxed font-light px-8">
                 هذا الخيار النهائي سيقوم بحرق ومسح كامل دوائرك وعقدك وملاحظاتك. ستتلاشى كل البيانات بصورة قاطعة لا رجعة فيها (Hard Delete). <strong className="text-white">هل أنت مستعد للتخلي عن ماضيك لتعيش حاضرك؟</strong>
              </p>
            </div>

            <div className="w-full max-w-sm mt-8 relative">
               <button
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="w-full relative h-20 rounded-full overflow-hidden bg-black border border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.2)] flex items-center justify-center group select-none touch-none"
               >
                  <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-900 to-red-500"
                      style={{ width: `${progress}%` }}
                  />
                  <span className="relative z-10 text-xl font-bold text-white tracking-widest group-hover:text-red-100 transition-colors pointer-events-none">
                     {isBurning ? "احترق..." : "الضغط للحرق التام"}
                  </span>
               </button>
               <p className="text-center text-xs text-red-500/40 mt-4 leading-loose tracking-widest">
                  HARD DELETE PERMANENT PROTOCOL
               </p>
            </div>

            <button
               onClick={handleClose}
               className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors p-4"
            >
               تراجع (احتفظ بالفوضى)
            </button>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
