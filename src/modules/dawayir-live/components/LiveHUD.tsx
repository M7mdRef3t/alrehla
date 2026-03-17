"use client";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * LiveHUD — Heads-Up Display controls for the live session
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Mic toggle, session status, cognitive metrics bar, end session button.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Activity, Gauge, Zap } from 'lucide-react';
import type { CognitiveMetrics, SessionStatus, JourneyStage } from '../types';

interface LiveHUDProps {
  status: SessionStatus;
  isMicActive: boolean;
  isAgentSpeaking: boolean;
  metrics: CognitiveMetrics;
  journeyStage: JourneyStage;
  onToggleMic: () => void;
  onEndSession: () => void;
}

const stageLabels: Record<JourneyStage, string> = {
  Overwhelmed: '🌊 مرحلة الثقل',
  Focus: '🎯 مرحلة التركيز',
  Clarity: '✨ مرحلة الوضوح',
};

function MetricBar({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <div className="flex-1 min-w-[60px]">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            animate={{ width: `${Math.round(value * 100)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-bold w-8 text-left">{Math.round(value * 100)}%</span>
    </div>
  );
}

export default function LiveHUD({
  status,
  isMicActive,
  isAgentSpeaking,
  metrics,
  journeyStage,
  onToggleMic,
  onEndSession,
}: LiveHUDProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="mx-auto max-w-3xl px-4 pt-4 flex flex-col gap-3">
        {/* Top bar */}
        <div className="pointer-events-auto flex items-center justify-between">
          {/* Journey stage badge */}
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-black text-slate-300" dir="rtl">
            {stageLabels[journeyStage]}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isAgentSpeaking && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-[10px] font-black text-teal-400">بتتكلم</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* End session */}
            <button
              onClick={onEndSession}
              className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
              title="إنهاء الجلسة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics bar */}
        <div className="pointer-events-auto px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-xl flex gap-4" dir="rtl">
          <MetricBar
            label="التوازن"
            value={metrics.equilibriumScore}
            icon={<Activity className="w-3 h-3" />}
            color="#00CED1"
          />
          <MetricBar
            label="الحمل"
            value={metrics.overloadIndex}
            icon={<Gauge className="w-3 h-3" />}
            color="#FF6347"
          />
          <MetricBar
            label="الوضوح"
            value={Math.max(0, metrics.clarityDelta + 0.5)}
            icon={<Zap className="w-3 h-3" />}
            color="#FFD700"
          />
        </div>
      </div>

      {/* Mic FAB */}
      <div className="pointer-events-auto fixed bottom-6 right-6 z-40">
        <button
          onClick={onToggleMic}
          disabled={status !== 'connected'}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isMicActive
              ? 'bg-teal-500 text-slate-950 shadow-teal-500/30 scale-110'
              : 'bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isMicActive ? <Mic className="w-7 h-7" /> : <MicOff className="w-6 h-6" />}

          {/* Recording ring */}
          {isMicActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-teal-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
