import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Heart,
  Users,
  TrendingUp,
  Zap,
  Target,
  ShieldCheck,
  ChevronLeft,
  Lock,
  Clock3,
  CreditCard,
  CircleHelp,
  Activity,
  Layers,
  Brain,
  Cpu,
  Eye,
  HardDrive
} from "lucide-react";
import { LiveStatusBar } from "../shared/LiveStatusBar";
import type { LiveMetrics } from "../../architecture/landingLiveData";
import { isUserMode } from "../../config/appEnv";
import { Badge, Button, Card } from "../UI";
import { contentMarketingTracks } from "../../data/marketingContent";

const TRUST_ITEMS = [
  {
    title: "Ø®ØµØµØ© Ø§Ø©",
    body: " ØªÙØ¹Ø±Ø¶ ØµØª Ø¹Ø§ ØªØ¨Ø¯Ø£ Ø¨Ø¯ Ø´Ù ØªÙØ§Øµ Ø§Ø­Ø³Ø§Ø³Ø©  Ø£ Ø¯Ø©.",
    icon: Lock
  },
  {
    title: "Ø¨Ø¯ Ø¨Ø·Ø§Ø©",
    body: "Ø§Ø¯Ø® Ø§Ø£ Ø¬Ø§ Ø¨Ø§Ø§. Ø§ Ø¬Ø¯ Ø·Ø¨ Ø¯ÙØ¹ Ø¨ Ø£ ØªØ± Ø¥ Ø§Øª Ø§ØªØ¬Ø±Ø¨Ø© ØªØ§Ø³Ø¨.",
    icon: CreditCard
  },
  {
    title: "Ø£  3 Ø¯Ø§Ø¦",
    body: "Ø§Ø¨Ø¯Ø¡ Øµ Ø¹Ø· Ø£ Ø±Ø§Ø¡Ø© Ø§Ø¶Ø­Ø© Ø¨Ø³Ø±Ø¹Ø© Ø¨Ø¯ Ø¬Ø© Ø·Ø©  Ø§Ø´Ø±Ø­.",
    icon: Clock3
  },
  {
    title: " ÙØ·Ø¨   Ø´Ø¡",
    body: " ØªØ­ØªØ§Ø¬ Ø¥ ØªØ§Ø¨Ø© ØªØ§Ø±Ø® Ø§Ø§ Ø£ ØªØ¨Ø±Ø± Ø´Ø§Ø¹Ø± Ø¨ Ø£ ØªØ­Øµ Ø¹ Ø£ Ø®Ø·Ø©.",
    icon: CircleHelp
  }
] as const;

const PREVIEW_METRICS = [
  { val: "3 Ø¯Ø§Ø¦", label: "Ø­Øª Ø£ Ø±Ø§Ø¡Ø© Ø§Ø¶Ø­Ø©", icon: Clock3, color: "text-teal-400" },
  { val: "Ø¨Ø¯ Ø¨Ø·Ø§Ø©", label: "Ø¨Ø¯Ø§Ø© Ø§ØªØ¬Ø±Ø¨Ø©", icon: CreditCard, color: "text-[var(--soft-teal)]" },
  { val: "Ø®ØµØµØ© Ø§Ø©", label: "Ù Ø£ Ø¬Ø³Ø©", icon: ShieldCheck, color: "text-rose-400" }
] as const;

export const ProblemFirstSection: FC<{
  stagger: Variants;
  item: Variants;
  data: { title: string; points: string[]; closing: string };
  onShowExample: () => void;
}> = ({ stagger, item, data, onShowExample }) => {
  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
        <motion.h2 variants={item} className="text-2xl md:text-4xl font-black text-white mb-8 leading-tight">
          {data.title}
        </motion.h2>
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {data.points.map((point, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group"
            >
              <Card className="rounded-2xl border-white/5 bg-white/5 p-6 flex items-center justify-center text-sm font-bold text-slate-200 transition-all hover:bg-white/10">
                {point}
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.p variants={item} className="text-lg md:text-xl font-black text-rose-300 mb-8 max-w-[40ch] mx-auto">
          {data.closing}
        </motion.p>
        <div className="flex justify-center">
          <motion.div variants={item}>
            <Button
            variant="secondary"
            size="md"
            onClick={onShowExample}
            className="border-rose-400/30 bg-rose-500/10 text-sm font-black text-rose-200 hover:bg-rose-500/20 transition-all active:scale-95"
          >
            [ Ø´Ù Ø«Ø§ ]
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export const StartJourneyStepsSection: FC<{ stagger: Variants; item: Variants }> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div
      variants={item}
      className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8"
    >
      <div className="mb-6 text-center">
        <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-teal-300">Ù ØªØ¨Ø¯Ø£</p>
        <h2 className="text-2xl font-black text-white sm:text-3xl">Ø§Ø°Ø§ Ø­Ø¯Ø« Ø¨Ø¹Ø¯ Ø§Ø¶ØºØ· Ø¹ Ø§Ø¨Ø¯Ø£</h2>
        <p className="mx-auto mt-3 max-w-[44ch] text-sm leading-7 text-slate-300">
          Ø«Ø§Ø« Ø®Ø·Ø§Øª Ø¨Ø§Ø´Ø±Ø© Øª  Ø§ØªØ±Ø¯Ø¯ Ø¥ Ø£ Ø±Ø¤Ø© Ø§Ø¶Ø­Ø© Ø§ Ø³ØªØ²Ù Ø§Ø¢.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            step: "1",
            title: "ØªÙØªØ­ Ø¨Ø§Ø¨Ø© Ø¶Ø¨Ø· Ø§Ø¨ØµØ©",
            body: "ØªØ¯Ø®  Ø·Ø© Ø¨Ø¯Ø§Ø© ØµØ±Ø© Ø¨Ø¯ ÙØ± Ø· Ø£ ØªØ³Ø¬ Ø±.",
            icon: Target
          },
          {
            step: "2",
            title: "ØªØ­Ø¯Ø¯ Ø£ Ø§Ø¶ØºØ· Ø§Ø­",
            body: "ØªØ®ØªØ§Ø± Ø§ Ø³Øª Ø§Ø¢ ØªØ¨Ø¯Ø£ Ø§Ø®Ø±Ø·Ø©  Ø§Ø¹ Ø§Ø­Ø§ Ø§  ØµÙ Ø¹Ø§.",
            icon: TrendingUp
          },
          {
            step: "3",
            title: "ØªØ£Ø®Ø° Ø£ Ø®Ø·Ø© Ø§Ø¶Ø­Ø©",
            body: "ØªØ­Øµ Ø¹ Ø§ØªØ¬Ø§ Ø£ Ø®Ø·Ø©  ØªÙØ°Ø§ ÙØ±Ø§ Ø¨Ø¯ ØµØ§Ø¦Ø­ ÙØ¶ÙØ§Ø¶Ø©.",
            icon: ChevronLeft
          }
        ].map(({ step, title, body, icon: Icon }) => (
          <motion.div
            key={step}
            variants={item}
            className="group"
          >
            <Card className="rounded-2xl border-white/10 bg-slate-950/40 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-sm font-black text-teal-300">
                  {step}
                </span>
                <Icon className="h-5 w-5 text-teal-300" />
              </div>
              <h3 className="mb-2 text-lg font-black text-white">{title}</h3>
              <p className="text-sm leading-7 text-slate-300">{body}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </motion.section>
);

export const TrustSignalsSection: FC<{ stagger: Variants; item: Variants }> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="mb-6 text-center">
      <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-teal-300">Ø¹Ø§ØµØ± Ø§Ø«Ø©</p>
      <h2 className="text-2xl font-black text-white sm:text-3xl"> Ø§ ØªØ­ØªØ§Ø¬ Ø¹Ø±ÙØª Ø¨ Ø§Ø¨Ø¯Ø¡</h2>
    </motion.div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TRUST_ITEMS.map(({ title, body, icon: Icon }) => (
        <motion.div
          key={title}
          variants={item}
          className="group"
        >
          <Card className="rounded-2xl border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-black text-white">{title}</h3>
            <p className="text-sm leading-7 text-slate-300">{body}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

interface FeatureShowcaseSectionProps {
  stagger: Variants;
  item: Variants;
  onExploreAll?: () => void;
  onOpenRadar?: () => void;
  onOpenCourt?: () => void;
  onOpenPlaybooks?: () => void;
}

export const FeatureShowcaseSection: FC<FeatureShowcaseSectionProps> = ({
  stagger,
  item,
  onExploreAll: _onExploreAll,
  onOpenRadar,
  onOpenCourt,
  onOpenPlaybooks: _onOpenPlaybooks
}) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="mb-10 px-2 text-center leading-tight">
      <Badge className="mb-3 inline-flex items-center gap-2 border-teal-500/30 bg-teal-500/10 px-3 py-1">
        <Target className="h-3 w-3 text-teal-400" />
        <span className="text-xs font-black uppercase tracking-widest text-teal-300">Ø£Ø¯ÙˆØ§Øª Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„ØªÙˆØ§Ø²Ù†</span>
      </Badge>
      <h2 className="mb-3 text-2xl font-black leading-tight text-white sm:text-3xl">Ø£Ø¯ÙˆØ§Øª Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø³ÙŠØ§Ø¯Ø©</h2>
      <p className="mx-auto max-w-[45ch] text-sm leading-relaxed text-slate-300">
        Ø£Ø¯ÙˆØ§Øª Ø¹Ù…Ù„ÙŠØ© ØªØ³Ø§Ø¹Ø¯Ùƒ ØªÙÙ‡Ù… Ø¥Ø´Ø§Ø±Ø§ØªÙƒ Ø¨Ø³Ø±Ø¹Ø©ØŒ ÙˆØªØ­ÙˆÙ‘Ù„Ù‡Ø§ Ø¥Ù„Ù‰ Ø®Ø·ÙˆØ© ÙˆØ§Ø¶Ø­Ø© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªÙ†ÙÙŠØ°.
      </p>
    </motion.div>

    <div className="relative">
      <div className="pointer-events-none absolute left-0 right-0 top-[140px] z-0 hidden h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent lg:block" />
      <div className="relative z-10 -mx-5 flex snap-x gap-6 overflow-x-auto px-5 pb-8 no-scrollbar">
        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(45,212,191,0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Activity className="h-32 w-32 text-teal-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/20 text-xs font-black text-teal-400">1</span>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Ø±Ø§Ø¯Ø§Ø± Ø§Ù„ÙˆØ¹ÙŠ</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">Ù…Ø³Ø­ Ø³Ø±ÙŠØ¹ (Pulse)</h3>
            <p className="text-sm leading-[1.8] text-slate-300">Ø§Ù„ØªÙ‚Ø§Ø· Ø¥Ø´Ø§Ø±Ø§ØªÙƒ Ø®Ù„Ø§Ù„ Ø£Ù‚Ù„ Ù…Ù† 5 Ø«ÙˆØ§Ù†ÙØŒ Ø«Ù… ØªØ­ÙˆÙŠÙ„Ù‡Ø§ Ø¥Ù„Ù‰ Ù…Ø¤Ø´Ø±Ø§Øª ÙˆØ§Ø¶Ø­Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©.</p>
          </div>
          <div className="relative flex h-32 w-full items-center justify-center rounded-2xl border border-teal-500/10 bg-teal-900/10 transition-colors group-hover:border-teal-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.2)_0%,transparent_70%)] opacity-50" />
            <div className="w-16 h-16 rounded-full border border-teal-400/30 animate-ping absolute" />
            <div className="w-24 h-24 rounded-full border border-teal-400/20 absolute" />
            <Activity className="w-8 h-8 text-teal-300 z-10" />
          </div>
          <Button
            onClick={onOpenRadar}
            variant="primary"
            size="md"
            className="mt-3 w-full rounded-xl text-xs font-black text-slate-950 transition-all hover:bg-teal-400 active:scale-95"
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Ø¬Ø±Ù‘Ø¨ Ù…Ø³Ø­ Ø§Ù„ÙˆØ¹ÙŠ Ø§Ù„Ø¢Ù†
          </Button>
        </motion.div>

        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Users className="h-32 w-32 text-[var(--soft-teal)]" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--soft-teal)] bg-[var(--soft-teal)]/20 text-xs font-black text-[var(--soft-teal)]">2</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--soft-teal)]">Ù†Ø¸Ø§Ù… Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªØ£Ø«ÙŠØ± Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠ</h3>
            <p className="text-sm leading-[1.8] text-slate-300">ØµÙ†Ù‘Ù Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø¥Ù„Ù‰ Ø¯ÙˆØ§Ø¦Ø± (Ù‚Ø±Ø¨ØŒ Ø­Ø¯ÙˆØ¯ØŒ Ø­Ø°Ø±) Ù„ØªØ¹Ø±Ù Ø£ÙŠÙ† ÙŠØªØ³Ø±Ø¨ Ø§Ù„Ø¬Ù‡Ø¯ ÙˆØ£ÙŠÙ† ÙŠØªØ¹Ø§ÙÙ‰.</p>
          </div>
          <div className="flex h-32 w-full items-center justify-center gap-1 rounded-2xl border border-[var(--soft-teal)] bg-[var(--soft-teal)]/10 overflow-hidden relative">
            <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[var(--soft-teal)]/40 animate-[spin_10s_linear_infinite]" />
            <div className="absolute w-12 h-12 rounded-full border-2 border-[var(--soft-teal)]/60 animate-[spin_15s_linear_infinite_reverse]" />
            <Users className="w-6 h-6 text-[var(--soft-teal)]" />
          </div>
          <div className="text-center text-xs font-medium text-[var(--soft-teal)] border border-[var(--soft-teal)]/20 bg-[var(--soft-teal)]/10 py-2 rounded-xl mt-3">Ø´Ø§Ù‡Ø¯ Ø£Ù†Ù…Ø§Ø· Ø§Ù„Ø§Ø³ØªÙ†Ø²Ø§Ù Ø§Ù„Ù…ØªÙƒØ±Ø±Ø©</div>
        </motion.div>

        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Zap className="h-32 w-32 text-amber-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-xs font-black text-amber-400">3</span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ù…Ø¹Ø²Ø²</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">Ø¨ÙˆØµÙ„Ø© Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ (AI)</h3>
            <p className="text-sm leading-[1.8] text-slate-300">ØªØ­Ù„ÙŠÙ„ Ù‡Ø§Ø¯Ø¦ ÙŠÙ‚Ø¯Ù‘Ù… Ù„Ùƒ Ø§Ù„ØªÙØ³ÙŠØ± Ø§Ù„Ø£Ù‚Ø±Ø¨ Ù„Ø­Ø§Ù„ØªÙƒ (Ù‚Ø±Ø¨/Ø­Ø¯ÙˆØ¯/Ø­Ø°Ø±) Ù…Ø¹ Ø®Ø·ÙˆØ© Ø£ÙˆÙ„Ù‰ Ø¹Ù…Ù„ÙŠØ©.</p>
          </div>
          <div className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border border-amber-500/10 bg-amber-900/10">
            <span className="text-xs font-black uppercase text-amber-400/80 tracking-[0.2em] mb-2 border border-amber-500/30 px-2 py-0.5 rounded">Ù‚Ø±Ø§Ø± ÙˆØ§Ø¹Ù</span>
            <p className="text-sm font-bold text-amber-300 max-w-[80%] text-center">"Ù‚Ø³Ù‘Ù… Ø§Ù„Ø¶ØºØ· Ø¥Ù„Ù‰ Ø®Ø·ÙˆØ© ÙˆØ§Ø­Ø¯Ø© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªÙ†ÙÙŠØ° Ø§Ù„Ø¢Ù†."</p>
          </div>
          <Button
            onClick={onOpenCourt}
            variant="secondary"
            size="md"
            className="mt-3 rounded-xl border-amber-500/30 bg-amber-500/10 text-xs font-black text-amber-300 transition-all hover:bg-amber-500/20"
          >
            ÙØ¹Ù‘Ù„ Ø§Ù„Ø¨ÙˆØµÙ„Ø© Ø§Ù„Ø¢Ù†
          </Button>
        </motion.div>
      </div>
    </div>
  </motion.section>
);

export const MetricsSection: FC<{
  stagger: Variants;
  item: Variants;
  metricsState: { data: LiveMetrics; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" };
  liveEnabled: boolean;
}> = ({ stagger, item, metricsState, liveEnabled }) => {
  const isFallback = metricsState.mode === "fallback";
  const showModeBadge = !isUserMode;
  const cards = useMemo(
    () =>
    (liveEnabled && !isFallback
      ? [
        {
          val: metricsState.data.activeUnits30d.toLocaleString("ar-EG"),
          label: "Ø¬Ø³Ø§Øª Ø¨Ø¯Ø£Øª Ø®Ø§ 30 ",
          icon: Users,
          color: "text-teal-400"
        },
        {
          val: `${metricsState.data.retentionRate30d.toLocaleString("ar-EG")}%`,
          label: "Ø§Ø³ØªØ±Ø§Ø± Ø¨Ø¹Ø¯ Ø§Ø¨Ø¯Ø§Ø© Ø§Ø£",
          icon: TrendingUp,
          color: "text-[var(--soft-teal)]"
        },
        {
          val: metricsState.data.activity24h.toLocaleString("ar-EG"),
          label: "Ø´Ø§Ø· Ø¢Ø®Ø± 24 Ø³Ø§Ø¹Ø©",
          icon: Zap,
          color: "text-rose-400"
        }
      ]
      : PREVIEW_METRICS),
    [isFallback, liveEnabled, metricsState.data]
  );

  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div
        className="relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12"
        style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-teal-500/50 to-transparent opacity-30" />
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <LiveStatusBar
              title={liveEnabled ? "Ø¤Ø´Ø±Ø§Øª Ø§Ø¨Ø¯Ø§Ø©" : "Ø¹Ø§Ø© Ø§Ø¨Ø¯Ø§Ø©"}
              mode={metricsState.mode}
              isLoading={metricsState.isLoading && liveEnabled}
              lastUpdatedAt={metricsState.lastUpdatedAt}
              showModeBadge={showModeBadge}
            />
            <Badge className="mt-3 inline-flex items-center border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-100">
              {liveEnabled ? "Ø£Ø±Ø§ Ø­Ø©  Ø§ØµØ©" : "Preview Ø«Ø§Ø¨Øª Ø­Ø¸Ø© Ø§Ø¥Ø§Ø¹ Ø§Ø£"}
            </Badge>
            <h3 className="mt-4 mb-4 text-2xl font-black leading-tight text-white sm:text-3xl">Ø§ØµÙØ­Ø© Ø§ ØªØ¨Ø¹  ØºØ¶Ø§ Ø¨ Ø¨Ø¯Ø§Ø© Ø§Ø¶Ø­Ø©</h3>
            <p className="mb-8 text-sm leading-relaxed text-slate-300">
              Ø¨Ø¯ Øª ØºØ± Ø¬Ø§Ø²Ø© Ø£ Ø¥Ø´Ø§Ø±Ø§Øª Ø§ØµØ© ØªØ¹Ø±Ø¶ Ø§ØµÙØ­Ø© Ø§Ø¢ Ø§  Ø§Ø³ØªØ®Ø¯ ÙØ¹Ø§: Ø³Ø±Ø¹Ø© Ø§Ø¨Ø¯Ø¡ Ø§Ø®ØµØµØ© Ø§ Ø§Ø° Ø³Ø³Ø¨  Ø£ Ø¶ØºØ· Ø¹ Ø²Ø± Ø§Ø¨Ø¯Ø§Ø©.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-slate-800">
                    <Heart className="h-5 w-5 text-slate-300" />
                  </div>
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-teal-500 text-xs font-black text-slate-950">
                  Ø«Ø©
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(metricsState.isLoading && liveEnabled ? cards.map((s) => ({ ...s, val: "..." })) : cards).map((s, i) => (
              <motion.div
                key={i}
                className="group"
                variants={item}
              >
                <Card className="flex items-center gap-6 rounded-2xl border-white/5 bg-white/5 p-6 transition-all hover:translate-x-[-8px] hover:bg-white/10 rtl:hover:translate-x-[8px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/50 transition-colors">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white sm:text-3xl">
                    {metricsState.isLoading && liveEnabled ? <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" /> : s.val}
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-200">{s.label}</p>
                </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export const HowItWorksSection: FC<{
  stagger: Variants;
  item: Variants;
  data: { title: string; subtitle: string; steps: { title: string; body: string }[] };
}> = ({ stagger, item, data }) => {
  const icons = [Activity, Layers, Brain];
  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-white mb-3">{data.title}</h2>
        <p className="text-sm text-slate-200 font-bold uppercase tracking-widest">{data.subtitle}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {data.steps.map((step, i) => {
          const Icon = icons[i] || Brain;
          return (
            <motion.div
              key={i}
              variants={item}
              className="group"
            >
              <Card className="relative overflow-hidden rounded-3xl border-white/5 bg-white/[0.03] p-8 transition-all hover:bg-white/[0.06]">
                <div className="absolute -right-4 -top-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]">
                  <Icon size={120} />
                </div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
                  <Icon size={28} />
                </div>
                <h3 className="mb-4 text-xl font-black text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-200">{step.body}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export const FinalReadinessSection: FC<{
  stagger: Variants;
  item: Variants;
  lastGoalLabel?: string | null;
  badgePulse?: boolean;
  LastGoalIcon?: FC<{ className?: string }>;
}> = ({ stagger, item, lastGoalLabel, badgePulse, LastGoalIcon }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div
      variants={item}
      className="rounded-[2rem] border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent p-8 text-center sm:p-10"
    >
      <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-teal-300">Ø¬Ø§Ø²Ø© Ø§Ø¨Ø¯Ø¡</p>
      <h2 className="mb-3 text-2xl font-black text-white sm:text-3xl">Ø§Ø¶Ø­ Ø§Ø°Ø§ Ø¨Ø¹Ø¯. Ø§Ø¶Ø­ Ø§Ø°Ø§ ØªØ¨Ø¯Ø£ Ø§Ø¢.</h2>
      <p className="mx-auto max-w-[44ch] text-sm leading-7 text-slate-200">
        Ø§ØµÙØ­Ø© Ø£ØµØ¨Ø­Øª ØªØ´Ø±Ø­ Ø§Ø¨Ø¯Ø§Ø© Ø¨Ø¶Ø­ ØªØªØ± Ø§Ø²Ø§Øª Ø§Øª  Ø­ ØªØ§ ØªØ­Øª ØªØ­ Ø§Ø£Ø± Ø¨Ø¯ Ø£ ØªØ¶Ø¹ Ø§Ø³ØªØ®Ø¯ Ø£Ø§ Ø±Ø³Ø§Ø¦ Øµ Ø£ Ø¹Ø¯ Ø¬Ø§Ø²Ø©.
      </p>
      {lastGoalLabel && (
        <Badge className="mt-5 inline-flex items-center gap-2 border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100">
          {LastGoalIcon ? <LastGoalIcon className={badgePulse ? "h-4 w-4 text-teal-300" : "h-4 w-4 text-slate-300"} /> : null}
          <span>Ø¢Ø®Ø± Ø© Ø­ÙØ¸Ø©: {lastGoalLabel}</span>
        </Badge>
      )}
    </motion.div>
  </motion.section>
);

export const SystemOverclockSection: FC<{
  stagger: Variants;
  item: Variants;
}> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-10%" }}
  >
    <div className="mb-10 text-center">
      <Badge className="inline-flex items-center gap-2 border-amber-500/30 bg-amber-500/10 px-4 py-1.5 mb-4">
        <Cpu className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
          ÙˆØ¶Ø¹ Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ù…ØªÙ‚Ø¯Ù… Ù†Ø´Ø·
        </span>
      </Badge>
      <h2 className="text-3xl font-black text-white mb-3">ØºØ±ÙØ© Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©</h2>
      <p className="text-sm text-slate-300 max-w-[50ch] mx-auto">
        Ø¨Ø§ Ø¥ System Architect Ø¯ Ø¸Ø±Ø© Ø¹ Ø§Ø­Ø±Ø§Øª Ø§ØµØ§ØªØ© Ø§ Ø¨ØªØ´ Ø¹ "Ø¯Ø§Ø±" Ø¯Øª.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          title: "Ø­Ø± Ø§Ø£Ø«Ø± (Impact)",
          desc: "Ø´ØºØ§ Ø¨Ø­ Ø§Ø±Ø§Ø¨Ø· Ø¨ Ø§Ø£ÙØ¹Ø§ Ø§Ø²Ø§Ø¬ Ù Ø§Ø®ÙØ©.",
          icon: Brain,
          stat: "Ù†Ø´Ø· ÙˆÙŠÙÙ‚ÙŠÙ‘ÙÙ…",
          color: "text-teal-400",
          bg: "bg-teal-500/5",
          border: "border-teal-500/20"
        },
        {
          title: "Ø³Øª Ø§ÙØ¶ (Entropy)",
          desc: "Ø¨Ø±Ø§Ø¨ ØªØ°Ø¨Ø°Ø¨ Ø´Ø§Ø¹Ø± Ø¹Ø´Ø§ ÙØ¹ 'Ø¶Ø¹ Ø§Ø§Ø­ØªØ§Ø¡'  Ø²Ø§Ø¯Øª.",
          icon: Activity,
          stat: "ÙÙˆØ¶Ù‰ ØªØ­Øª Ø§Ù„Ø³ÙŠØ·Ø±Ø©",
          color: "text-amber-400",
          bg: "bg-amber-500/5",
          border: "border-amber-500/20"
        },
        {
          title: "Ø¸Ø§ Ø§Ø±Ø§Ø§ (Mirror)",
          desc: "Ø¨Ø±Øª Ø§Ø§Ø¬Ø© Ø¨Ø§Ø§Ø¹ (Ø´Ù Ø§ØªØ§Ø¶Ø§Øª Ø§Ø´Ø¹Ø±Ø©).",
          icon: Eye,
          stat: "Ø¬Ø§Ù‡Ø² Ù„Ù„Ù…ÙˆØ§Ø¬Ù‡Ø©",
          color: "text-rose-400",
          bg: "bg-rose-500/5",
          border: "border-rose-500/20"
        },
        {
          title: "Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© ÙƒØ£Ø¯Ø§Ø© ØªØ¹Ø§ÙÙ",
          desc: "ÙˆØ§Ø¬Ù‡Ø© ØªØªÙƒÙŠÙ‘Ù Ù…Ø¹ Ø­Ø§Ù„ØªÙƒ Ù„Ø­Ø¸Ø© Ø¨Ù„Ø­Ø¸Ø© ÙˆØªØ¹Ø±Ø¶ Ø§Ù„Ù…Ø³Ø§Ø± Ø¨ØµØ±ÙŠÙ‹Ø§ Ø¨Ø·Ø±ÙŠÙ‚Ø© Ø£ÙˆØ¶Ø­.",
          icon: Layers,
          stat: "Ù„ÙˆØ­Ø© Ø¥Ø¯Ø±Ø§ÙƒÙŠØ© Ø­ÙŠÙ‘Ø©",
          color: "text-indigo-400",
          bg: "bg-indigo-500/5",
          border: "border-indigo-500/20"
        }
      ].map((sys, idx) => (
        <motion.div
          key={idx}
          variants={item}
        >
          <Card className={`relative overflow-hidden rounded-3xl border ${sys.border} ${sys.bg} p-6 transition-all hover:scale-[1.02]`}>
          <div className="mb-4 flex items-center justify-between">
            <div className={`p-2 rounded-xl bg-white/5 ${sys.color}`}>
              <sys.icon size={20} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sys.border} ${sys.color}`}>
              {sys.stat}
            </span>
          </div>
          <h3 className="text-sm font-black text-white mb-2">{sys.title}</h3>
          <p className="text-sm leading-relaxed text-slate-300">{sys.desc}</p>
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12">
            <sys.icon size={100} />
          </div>
          </Card>
        </motion.div>
      ))}
    </div>

    <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex items-center gap-4 mb-4">
        <HardDrive className="h-4 w-4 text-slate-300" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Ù…Ù„Ø§Ù…Ø­ Ù‚Ø§Ø¯Ù…Ø© (Ù…Ø±Ø§Ø­Ù„ Ù‚ÙŠØ¯ Ø§Ù„Ø¨Ù†Ø§Ø¡)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Ø§Ù„ÙˆØ§Ù‚Ø¹ Ø§Ù„Ù…Ø­ÙŠØ·", "Ø®Ø²Ù†Ø© Ø§Ù„ÙƒØ¨Ø³ÙˆÙ„Ø© Ø§Ù„Ø²Ù…Ù†ÙŠØ©", "ØªØºØ°ÙŠØ© Ø±Ø§Ø¬Ø¹Ø© Ù‡ÙˆÙ„ÙˆØ¬Ø±Ø§ÙÙŠØ©", "Ù…Ø­Ø§ÙƒØ§Ø© Ø§Ù„Ø£Ø·Ù„Ø³ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ", "ØªØ±ØªÙŠØ¨ Ø§Ù„Ù†Ø¨Ø¶ Ø§Ù„Ø¬Ù…Ø¹ÙŠ"].map((p, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-xs text-slate-300 font-bold italic">
            {"//"} {p} {"->"} Ø¬Ø§Ù‡Ø² Ù„Ù„Ø±Ø¨Ø·
          </span>
        ))}
      </div>
    </div>
  </motion.section>
);

export const ContentMarketingSection: FC<{
  stagger: Variants;
  item: Variants;
}> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="mb-8 text-center">
      <Badge className="mb-3 inline-flex items-center gap-2 border-emerald-400/30 bg-emerald-500/10 px-3 py-1">
        <TrendingUp className="h-3 w-3 text-emerald-300" />
        <span className="text-xs font-black uppercase tracking-widest text-emerald-200">Ø®Ø§Ø±Ø·Ø© Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø­Ù„Ø©</span>
      </Badge>
      <h2 className="text-2xl font-black text-white sm:text-3xl">Ø§Ù„Ø®Ø·Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ù„ØªØ³ÙˆÙŠÙ‚ Ø¨Ø§Ù„Ù…Ø­ØªÙˆÙ‰</h2>
      <p className="mx-auto mt-2 max-w-[48ch] text-sm text-slate-300">
        Ù…Ø³Ø§Ø± Ù…Ø­ØªÙˆÙ‰ Ø¹Ù…Ù„ÙŠ Ù„Ù…Ø¯Ø© 6 Ø£Ø³Ø§Ø¨ÙŠØ¹ ÙŠØ±Ø¨Ø· Ø§Ù„ÙˆØ¹ÙŠ Ø¨Ø§Ù„ØªØ­ÙˆÙŠÙ„ ÙˆÙŠØ®Ø¯Ù… Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©.
      </p>
    </motion.div>

    <div className="grid gap-3 md:grid-cols-2">
      {contentMarketingTracks.map((track) => (
        <motion.div key={`${track.week}-${track.topic}`} variants={item}>
          <Card className="rounded-2xl border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-black text-emerald-300">
                Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ {track.week}
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-300">{track.objective}</span>
            </div>
            <h3 className="text-sm font-black text-white">{track.topic}</h3>
            <p className="mt-1 text-xs text-slate-300">{track.channel}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </motion.section>
);


