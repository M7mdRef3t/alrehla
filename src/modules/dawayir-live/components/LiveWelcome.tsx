'use client';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LiveWelcome — Cinematic Entry Screen for Dawayir Live
 * ════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Play, ArrowLeft, Sparkles } from 'lucide-react';

interface LiveWelcomeProps {
  onStartSession: () => void;
  onBack?: () => void;
  isConnecting: boolean;
}

export default function LiveWelcome({ onStartSession, onBack, isConnecting }: LiveWelcomeProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-app overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-amber-500/3 blur-[80px]" />
        <div className="absolute bottom-[15%] left-[25%] w-[250px] h-[250px] rounded-full bg-indigo-500/3 blur-[80px]" />
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 right-6 p-2 text-app-muted-foreground hover:text-app-foreground transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center px-6 max-w-lg"
      >
        {/* Logo / Identity */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="mx-auto w-20 h-20 rounded-full border border-teal-500/20 bg-teal-500/5 flex items-center justify-center mb-6 relative">
            <Sparkles className="w-8 h-8 text-teal-400" />
            <div className="absolute inset-0 rounded-full border border-teal-500/10 animate-ping opacity-30" />
          </div>

          <h1 className="text-4xl font-black text-app-foreground tracking-tight mb-3" dir="rtl">
            دواير لايف
          </h1>
          <p className="text-app-muted-foreground text-sm font-medium leading-relaxed" dir="rtl">
            المرآة المعرفية الحية — اتكلم وشوف عقلك بيتغير قدامك
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
          dir="rtl"
        >
          {[
            { icon: '🎤', text: 'صوت حي' },
            { icon: '🧠', text: 'تحليل فوري' },
            { icon: '🎯', text: 'دوائر ذكية' },
          ].map((feat) => (
            <div
              key={feat.text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-bg-accent border border-app-border text-xs font-bold text-app-foreground"
            >
              <span>{feat.icon}</span>
              <span>{feat.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            onClick={onStartSession}
            disabled={isConnecting}
            className="group relative px-10 py-4 bg-teal-500 text-white dark:text-slate-950 rounded-2xl font-black text-base shadow-lg shadow-teal-500/20 hover:bg-teal-400 hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center gap-3 mx-auto"
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950 rounded-full animate-spin" />
                <span>جاري الاتصال...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>ابدأ جلسة حية</span>
                <Play className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>

          <p className="text-[10px] text-app-muted-foreground/60 mt-4 tracking-wider">
            يتطلب إذن المايكروفون • الحوار بالعربية المصرية
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
