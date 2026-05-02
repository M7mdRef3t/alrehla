import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Maximize2 } from "lucide-react";
import { therapeuticVoice } from "@/services/voiceSynthesis";

interface KineticVideoEngineProps {
  script: string;
  title: string;
  onClose: () => void;
}

export const KineticVideoEngine: React.FC<KineticVideoEngineProps> = ({ script, title, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<{ text: string; id: number }[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const synth = window.speechSynthesis;

  useEffect(() => {
    // Split script into words and remove empty spaces
    const scriptWords = script.split(/\\s+/).filter(w => w.length > 0).map((w, i) => ({ text: w, id: i }));
    setWords(scriptWords);
    
    return () => {
      synth.cancel();
    };
  }, [script, synth]);

  const togglePlay = () => {
    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
    } else {
      if (synth.paused) {
        synth.resume();
        setIsPlaying(true);
      } else {
        startEngine();
      }
    }
  };

  const startEngine = () => {
    synth.cancel();
    setActiveWordIndex(-1);

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "ar-EG";
    utterance.pitch = 0.8; 
    utterance.rate = 0.85;

    const voices = synth.getVoices();
    const arabicVoices = voices.filter(v => v.lang.startsWith("ar"));
    if (arabicVoices.length > 0) utterance.voice = arabicVoices[0];

    // Listen to word boundaries to sync text
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        // Find which word corresponds to this charIndex
        let currentLen = 0;
        for (let i = 0; i < words.length; i++) {
          if (charIndex >= currentLen && charIndex <= currentLen + words[i].text.length + 1) {
            setActiveWordIndex(i);
            break;
          }
          currentLen += words[i].text.length + 1; // +1 for space
        }
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveWordIndex(words.length - 1);
    };

    synth.speak(utterance);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Group words into lines for better kinetic display (4 words per line approx)
  const renderKineticText = () => {
    const CHUNK_SIZE = 4;
    const currentChunkIndex = Math.floor(Math.max(0, activeWordIndex) / CHUNK_SIZE);
    
    const chunkStart = currentChunkIndex * CHUNK_SIZE;
    const chunkEnd = chunkStart + CHUNK_SIZE;
    const currentWords = words.slice(chunkStart, chunkEnd);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChunkIndex}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap justify-center gap-x-4 gap-y-6 text-center max-w-2xl px-8"
          dir="rtl"
        >
          {currentWords.map((word, idx) => {
            const actualIndex = chunkStart + idx;
            const isActive = actualIndex === activeWordIndex;
            const isPassed = actualIndex < activeWordIndex;
            
            return (
              <motion.span
                key={actualIndex}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  color: isActive ? "#ffffff" : isPassed ? "#94a3b8" : "#475569",
                  textShadow: isActive ? "0 0 40px rgba(255,255,255,0.8)" : "none"
                }}
                transition={{ duration: 0.2 }}
                className="text-5xl md:text-7xl font-black tracking-tight"
              >
                {word.text}
              </motion.span>
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-4 md:p-10">
      <div 
        ref={containerRef}
        className="relative w-full max-w-[400px] aspect-[9/16] bg-slate-950 rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.2)] flex flex-col"
      >
        {/* Cinematic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 opacity-50">
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <Maximize2 className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold tracking-widest uppercase text-white/50">{title}</span>
        </div>

        {/* Main Content (Kinetic Text) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          {words.length === 0 ? (
            <span className="text-slate-500 font-bold">جاري تجهيز النص...</span>
          ) : activeWordIndex === -1 && !isPlaying ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Play className="w-8 h-8 text-indigo-400 translate-x-1" />
              </div>
              <p className="text-slate-400 font-bold">جاهز للرندرة</p>
              <p className="text-[10px] text-slate-600 max-w-[200px] mx-auto">اضغط Play واستخدم مسجل الشاشة (Screen Record) لحفظ الفيديو بجودة عالية.</p>
            </div>
          ) : (
            renderKineticText()
          )}
        </div>

        {/* Controls */}
        <div className="relative z-10 p-8 flex flex-col items-center gap-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: `${(Math.max(0, activeWordIndex) / (words.length - 1)) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
