"use client";

/**
 * Group Pulse Room - Live group counseling room.
 * Glassmorphism UI adapted to the current Dawayir Live product.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  Globe2,
  HandHelping,
  Home,
  Mic,
  MicOff,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
  Video,
  Volume2,
} from "lucide-react";
import { assignUrl } from "../../services/navigation";

type Participant = {
  name: string;
  status: string;
  avatar: string;
  glow: string;
};

const PARTICIPANTS: Participant[] = [
  { name: "Karim A.", status: "Speaking", avatar: "KA", glow: "ring-cyan-300/70" },
  { name: "Laila R.", status: "Listening", avatar: "LR", glow: "ring-violet-300/70" },
  { name: "Omar K.", status: "Hand raised", avatar: "OK", glow: "ring-emerald-300/70" },
  { name: "Sara W.", status: "Translated", avatar: "SW", glow: "ring-sky-300/70" },
];

const PULSE = [
  { emoji: "😊", label: "Calm", height: "58%" },
  { emoji: "💡", label: "Insight", height: "82%" },
  { emoji: "💙", label: "Support", height: "44%" },
  { emoji: "🙏", label: "Trust", height: "71%" },
  { emoji: "🫶", label: "Connection", height: "94%" },
];

const CHAT = [
  {
    author: "Karim A.",
    time: "14:20",
    text: "كيف نوازن بين ضغط العمل والهدوء قبل النوم؟",
  },
  {
    author: "Dr. Sarah Al-Farsi",
    time: "14:22",
    text: "لنبدأ بخطوة صغيرة: 3 دقائق تنفّس ثم سؤال واحد واضح عن أكثر ما يرهقك اليوم.",
  },
  {
    author: "Me",
    time: "14:25",
    text: "الجزء الأصعب عندي هو التوقف عن التفكير بعد انتهاء الجلسة.",
  },
];

export const GroupPulseRoom: React.FC = () => {
  const activeCount = useMemo(() => PARTICIPANTS.length + 24, []);

  return (
    <div className="min-h-screen bg-[#040814] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 lg:px-6 lg:py-5">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => assignUrl("/")}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Home className="h-3.5 w-3.5" />
            الرئيسية
          </button>
          <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
          <button
            type="button"
            onClick={() => assignUrl("/dawayir-live")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
          >
            Dawayir Live
          </button>
          <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
          <button
            type="button"
            onClick={() => assignUrl("/coach?tab=dawayir-live")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
          >
            لوحة المدرب
          </button>
          <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100">
            الجلسات الجماعية المباشرة
          </span>
        </nav>

        <header className="mb-4 flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
              <Users className="h-7 w-7 text-cyan-200" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-white shadow-[0_0_24px_rgba(244,63,94,0.35)]">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  LIVE
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200">
                  Dr. Sarah Al-Farsi
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white lg:text-3xl">
                جلسات الاستشارة الجماعية المباشرة
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                مساحة جلسة حية متوافقة مع Dawayir Live: حضور متفاعل، نبض عاطفي، ودردشة مباشرة مع أدوات تحكم سريعة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">128 Watching</span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">
              Translated: Arabic / English
            </span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-sky-100">
              End-to-end encrypted
            </span>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.72fr]">
          <section className="flex min-h-0 flex-col gap-4">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
              <div className="absolute inset-0 opacity-35">
                <div className="pulse-grid absolute inset-0" />
              </div>

              <div className="relative z-10 flex h-[540px] flex-col p-4 lg:h-[620px] lg:p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-rose-400/20 bg-rose-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-rose-100">
                    Live Session
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-sm text-slate-200">
                    Group Alpha-9
                  </span>
                </div>

                <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07111f]/70">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_25%),radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_40%)]" />
                  <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white">
                      <span className="h-2 w-2 rounded-full bg-white" />
                      LIVE
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-slate-100">
                      د. سارة الفارس
                    </span>
                  </div>

                  <div className="absolute right-4 bottom-4 z-10 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-slate-100 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-cyan-200">
                      <Video className="h-4 w-4" />
                      <span className="font-semibold">128 Watching</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">جلسة مباشرة مع ترجمة فورية وتجربة جماعية آمنة</p>
                  </div>

                  <div className="relative flex h-[280px] w-[280px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[0_0_90px_rgba(34,211,238,0.08)]">
                    <div className="absolute inset-7 rounded-full border border-cyan-300/10 bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_55%)]" />
                    <div className="absolute inset-10 rounded-full border border-violet-300/15 bg-[radial-gradient(circle,rgba(168,85,247,0.12),transparent_48%)]" />
                    <motion.div
                      animate={{ scale: [0.96, 1.02, 0.96], opacity: [0.88, 1, 0.88] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-40 w-28 items-center justify-center"
                    >
                      <div className="h-40 w-24 rounded-[3rem] bg-gradient-to-b from-white/85 via-cyan-100/70 to-slate-200/30 shadow-[0_0_45px_rgba(255,255,255,0.16)]" />
                    </motion.div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-slate-100">
                      بثّ حي متواصل
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Audience</h2>
                    <p className="text-xs text-slate-500">{activeCount} participants active</p>
                  </div>
                  <Users className="h-5 w-5 text-cyan-200" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {PARTICIPANTS.map((participant) => (
                    <div key={participant.name} className="flex min-w-[96px] flex-1 flex-col items-center gap-2">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/15 bg-white/8 text-sm font-black text-white ring-2 ${participant.glow}`}>
                        {participant.avatar}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-slate-100">{participant.name}</div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">{participant.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Quick Actions</h2>
                    <p className="text-xs text-slate-500">Audio, camera, speaking request, and leave</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-200" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
                    <Mic className="h-5 w-5 text-slate-100" />
                  </button>
                  <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
                    <Camera className="h-5 w-5 text-slate-100" />
                  </button>
                  <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 transition-colors hover:bg-cyan-300/15">
                    <HandHelping className="h-5 w-5 text-cyan-100" />
                  </button>
                  <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
                    <Volume2 className="h-5 w-5 text-slate-100" />
                  </button>
                  <button type="button" className="ml-auto rounded-2xl border border-rose-400/30 bg-rose-500/15 px-5 py-4 text-sm font-bold text-rose-100 transition-colors hover:bg-rose-500/20">
                    مغادرة الجلسة
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-4 xl:max-w-[480px]">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Emotional Pulse</h2>
                  <p className="text-xs text-slate-500">Live reaction summary</p>
                </div>
                <Globe2 className="h-5 w-5 text-violet-200" />
              </div>
              <div className="flex h-48 items-end gap-3 rounded-[1.4rem] border border-white/5 bg-black/25 p-4">
                {PULSE.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end justify-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: item.height }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full max-w-[64px] rounded-t-[1.3rem] bg-gradient-to-t from-violet-300/60 via-cyan-200/75 to-cyan-100/90 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
                      />
                    </div>
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[11px] text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Group Discussion</h2>
                  <p className="text-xs text-slate-500">Public, moderated, translated</p>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
                  Public
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-auto pr-1">
                {CHAT.map((message, index) => (
                  <div key={`${message.author}-${index}`} className={`rounded-[1.4rem] border border-white/10 px-4 py-3 ${index === 1 ? "ml-6 bg-cyan-300/10" : "bg-black/20"}`}>
                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{message.author}</span>
                      <span>{message.time}</span>
                    </div>
                    <p className="text-sm leading-7 text-slate-100">{message.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/25 p-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-cyan-200" />
                  <input
                    type="text"
                    readOnly
                    value="Ask a question or share a thought"
                    className="w-full bg-transparent text-sm text-slate-400 outline-none"
                  />
                  <button type="button" className="rounded-full bg-cyan-300/15 p-2 text-cyan-100 transition-colors hover:bg-cyan-300/25">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Reactions</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Share Resource</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};
