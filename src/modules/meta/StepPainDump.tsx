'use client';

import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, ArrowRight } from "lucide-react";

interface StepPainDumpProps {
  onNext: (text: string) => void;
  onSkip: () => void;
}

export const StepPainDump: FC<StepPainDumpProps> = ({ onNext, onSkip }) => {
  const [text, setText] = useState("");

  const handleNext = () => {
    onNext(text);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-center">
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: "linear-gradient(135deg, rgba(0,240,255,0.12), rgba(124,58,237,0.12))",
            border: "1.5px solid rgba(0,240,255,0.25)",
            animation: "ob-icon-breathe 3s ease-in-out infinite",
          }}
        >
          <MessageSquare className="w-9 h-9 text-teal-400" />
          <div className="absolute inset-0 rounded-full border border-teal-400/20 animate-ping opacity-20" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-wide">إيه اللي شاغل بالك دلوقتي؟</h2>
        <p className="text-sm text-slate-300 leading-relaxed px-4">
          فضفض بكلمتين عن اللي شاغل بالك أو مأثّر على طاقتك دلوقتي.. كلامك بيفضل بينك وبين نفسك ومحدش بيشوفه غيرك.
        </p>
      </div>

      <div className="relative group p-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب اللي حاسس بيه هنا.."
          className="w-full h-40 rounded-3xl p-5 text-sm text-right bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-teal-400 focus:bg-white/[0.05] transition-all resize-none shadow-inner"
          dir="rtl"
        />
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 opacity-50">
          <Sparkles className="w-3 h-3 text-teal-400" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">مساحة آمنة</span>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleNext}
          disabled={text.trim().length < 5}
          className="w-full rounded-2xl py-4 bg-teal-400 text-slate-950 font-extrabold ob-btn-tap transition-all shadow-[0_4px_20px_rgba(45,212,191,0.3)] disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            يلا نبدأ <ArrowRight className="w-4 h-4 rotate-180" />
          </span>
        </button>
        <button onClick={onSkip} className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold tracking-widest">تخطي الفضفضة</button>
      </div>
    </div>
  );
};
