"use client";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LiveTranscript — Real-time conversation transcript panel
 * ════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bot, User, Info } from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function LiveTranscript({ entries, isVisible, onToggle }: LiveTranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isVisible]);

  const roleIcon = (role: TranscriptEntry['role']) => {
    switch (role) {
      case 'agent': return <Bot className="w-3.5 h-3.5 text-teal-400" />;
      case 'user': return <User className="w-3.5 h-3.5 text-amber-400" />;
      case 'system': return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const roleBg = (role: TranscriptEntry['role']) => {
    switch (role) {
      case 'agent': return 'bg-teal-500/5 border-teal-500/20';
      case 'user': return 'bg-amber-500/5 border-amber-500/20';
      case 'system': return 'bg-white/5 border-white/10';
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-30 w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-lg"
        title={isVisible ? 'إخفاء المحادثة' : 'إظهار المحادثة'}
      >
        <MessageCircle className="w-5 h-5" />
        {entries.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-[9px] font-black text-slate-950 flex items-center justify-center">
            {entries.length > 99 ? '99+' : entries.length}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-6 z-30 w-80 max-h-[50vh] rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 tracking-wide">المحادثة الحية</span>
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px]">
              {entries.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6 font-medium">
                  ابدأ الكلام وسيظهر النص هنا...
                </p>
              )}

              {entries.map((entry, i) => (
                <motion.div
                  key={`${entry.timestamp}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-3 py-2 rounded-xl border ${roleBg(entry.role)} flex gap-2 items-start`}
                >
                  <div className="mt-0.5 shrink-0">
                    {roleIcon(entry.role)}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {entry.text}
                  </p>
                </motion.div>
              ))}

              <div ref={endRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
