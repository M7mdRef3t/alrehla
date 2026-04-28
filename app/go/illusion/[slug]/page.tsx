'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BIAS_SCIENCE, type ScienceNote } from '@/data/scienceBehindBias';
import { initAnalytics, trackLandingView } from '@/services/analytics';

/* ═══════════════════════════════════════════════════════
   صفحة اكتشاف الوهم — Smart Illusion Landing
   "شفت الفيديو؟ دلوقتي خلينا نشوف إنت فين من الوهم ده."
   ═══════════════════════════════════════════════════════ */

// Slug → biasType mapping
const SLUG_MAP: Record<string, string> = {
  'sunk-cost': 'sunk_cost',
  'confirmation': 'confirmation',
  'familiarity': 'familiarity',
  'illusion-of-control': 'illusion_of_control',
  'optimism': 'optimism',
  'status-quo': 'status_quo',
  'blind-spot': 'blind_spot',
};

// Quick assessment questions per bias
const QUESTIONS: Record<string, { q: string; weight: number }[]> = {
  sunk_cost: [
    { q: 'هل فيه حاجة بتكمل فيها بس عشان "خسرت كتير"؟', weight: 1 },
    { q: 'هل حسيت إن الانسحاب = اعتراف بالفشل؟', weight: 1 },
    { q: 'هل قولت قبل كده "مقدرش أسيب دلوقتي — ضيعت سنين"؟', weight: 1 },
  ],
  confirmation: [
    { q: 'هل بتدور على أدلة تثبت إن قرارك صح بدل ما تختبره؟', weight: 1 },
    { q: 'هل لما حد ينتقد حاجة في حياتك بتحس إنه "مش فاهم"؟', weight: 1 },
    { q: 'هل بتتجاهل الأخبار أو المعلومات اللي مبتعجبكش؟', weight: 1 },
  ],
  familiarity: [
    { q: 'هل فيه شخص مش بيضيفلك حاجة بس صعب تتخيل حياتك بدونه؟', weight: 1 },
    { q: 'هل بتحس إن "العادة" هي اللي ماسكاك مش "الحب"؟', weight: 1 },
    { q: 'هل جربت تبعد وحسيت بفراغ مش حزن حقيقي؟', weight: 1 },
  ],
  illusion_of_control: [
    { q: 'هل بتحاول تغيّر حد وبتفشل — وبعدين بتحاول تاني؟', weight: 1 },
    { q: 'هل حسيت إنك "المسؤول" عن إصلاح علاقة مكسورة؟', weight: 1 },
    { q: 'هل بتقول "لو عملت كذا، الموضوع هيتصلح"؟', weight: 1 },
  ],
  optimism: [
    { q: 'هل بتقول "هيتغير" بدون ما يكون فيه دليل على التغيير؟', weight: 1 },
    { q: 'هل بتقلل من احتمال إن الأمور ممكن تتدهور؟', weight: 1 },
    { q: 'هل بتتجاهل التحذيرات وبتركز على "الجانب الإيجابي" بس؟', weight: 1 },
  ],
  status_quo: [
    { q: 'هل عندك حاجة عايز تغيرها من زمان بس مش بتتحرك؟', weight: 1 },
    { q: 'هل قولت قبل كده "أحسن من اللاشيء"؟', weight: 1 },
    { q: 'هل فكرة التغيير نفسها بتوترك حتى لو التغيير أحسن؟', weight: 1 },
  ],
  blind_spot: [
    { q: 'هل بتشوف مشاكل الناس التانية بوضوح بس مش شايف مشاكلك؟', weight: 1 },
    { q: 'هل حد قالك حاجة عنك ورفضتها — وبعد وقت اكتشفت إنها صح؟', weight: 1 },
    { q: 'هل بتفتكر إنك "موضوعي" أكتر من أغلب الناس؟', weight: 1 },
  ],
};

function IllusionContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const [stage, setStage] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null]);
  const [currentQ, setCurrentQ] = useState(0);
  const [mounted, setMounted] = useState(false);

  const biasKey = SLUG_MAP[slug];
  const biasData: ScienceNote | undefined = biasKey ? (BIAS_SCIENCE as any)[biasKey] : undefined;
  const questions = biasKey ? QUESTIONS[biasKey] || [] : [];

  useEffect(() => {
    setMounted(true);
    initAnalytics();
    const p: Record<string, string> = { content_name: 'illusion_landing', illusion: slug };
    searchParams?.forEach((v, k) => { if (k.startsWith('utm_') || k === 'fbclid') p[k] = v; });
    trackLandingView(p);
  }, [slug, searchParams]);

  if (!mounted) return null;

  if (!biasData) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <div className="text-center p-8">
          <p className="text-2xl text-white font-black mb-4">الوهم ده مش موجود بعد 🤔</p>
          <p className="text-slate-400 text-sm mb-6">ممكن يكون الرابط غلط أو الوهم لسه مش متسجل.</p>
          <button onClick={() => router.push('/gate')} className="px-8 py-3 bg-teal-500 text-black font-black rounded-2xl">ابدأ رحلتك</button>
        </div>
      </main>
    );
  }

  const score = answers.filter(a => a === true).length;
  const percentage = Math.round((score / 3) * 100);
  const level = percentage >= 67 ? { label: 'متأثر بقوة', color: '#f43f5e', emoji: '🔴', msg: 'الوهم ده مسيطر عليك. محتاج تبدأ تشتغل عليه.' }
    : percentage >= 34 ? { label: 'متأثر جزئياً', color: '#f59e0b', emoji: '🟡', msg: 'عندك وعي جزئي بالوهم لكن لسه بيأثر على قراراتك.' }
    : { label: 'واعي', color: '#34d399', emoji: '🟢', msg: 'عندك وعي كويس بالوهم ده. استمر في التفكير النقدي.' };

  const handleAnswer = (yes: boolean) => {
    const updated = [...answers];
    updated[currentQ] = yes;
    setAnswers(updated);
    if (currentQ < 2) setCurrentQ(currentQ + 1);
    else setStage('result');
  };

  const handleCTA = () => {
    const p = new URLSearchParams(searchParams?.toString() || '');
    p.set('utm_source', 'content_studio');
    p.set('utm_medium', 'illusion_landing');
    p.set('utm_campaign', slug);
    p.set('utm_content', `score_${percentage}`);
    router.push(`/gate?${p.toString()}`);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden" dir="rtl"
      style={{ background: 'linear-gradient(160deg, #0a0a1a 0%, #1a103d 40%, #0d1117 100%)' }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 500, height: 500, border: '1px solid rgba(139,92,246,0.15)' }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 300, height: 300, border: '1px solid rgba(6,182,212,0.2)' }}
          animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      </div>

      {/* Card */}
      <motion.div className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>

        <div className="rounded-3xl overflow-hidden p-8 text-center"
          style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>

          <AnimatePresence mode="wait">
            {/* ─── INTRO ─── */}
            {stage === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-300">لحظة اكتشاف</span>
                </div>

                <h1 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">
                  شفت الفيديو؟
                </h1>
                <h2 className="text-lg font-black mb-4">
                  <span className="bg-gradient-to-l from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    {biasData.titleAr}
                  </span>
                </h2>

                <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-xs mx-auto">
                  {biasData.userFriendlyInsight}
                </p>

                <div className="px-4 py-3 rounded-xl mb-6 text-right" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <p className="text-xs text-violet-300 leading-relaxed font-bold">{biasData.relatedAyah}</p>
                  <p className="text-[10px] text-slate-500 mt-1 text-left font-mono">{biasData.ayahReference}</p>
                </div>

                <button onClick={() => setStage('quiz')}
                  className="w-full py-4 rounded-2xl font-black text-white text-base"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0d9488)', boxShadow: '0 8px 30px rgba(124,58,237,0.3)' }}>
                  اكتشف — إنت فين من الوهم ده؟ 🔍
                </button>

                <p className="text-[10px] text-slate-600 mt-4">🔬 {biasData.researcher} · {biasData.institution} · {biasData.year}</p>
              </motion.div>
            )}

            {/* ─── QUIZ ─── */}
            {stage === 'quiz' && (
              <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-[10px] text-slate-500 font-mono mb-4 uppercase tracking-wider">
                  سؤال {currentQ + 1} من 3
                </p>
                <div className="flex gap-1 mb-6 justify-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`h-1 w-12 rounded-full transition-all ${i <= currentQ ? 'bg-violet-500' : 'bg-white/10'}`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p key={currentQ} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="text-base font-bold text-white mb-8 leading-relaxed min-h-[60px]">
                    {questions[currentQ]?.q}
                  </motion.p>
                </AnimatePresence>

                <div className="flex gap-3">
                  <button onClick={() => handleAnswer(true)}
                    className="flex-1 py-4 rounded-2xl font-black text-white bg-rose-500/20 border border-rose-500/20 hover:bg-rose-500/30 transition-all text-sm">
                    أيوه 😔
                  </button>
                  <button onClick={() => handleAnswer(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-white bg-emerald-500/20 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all text-sm">
                    لأ 😌
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── RESULT ─── */}
            {stage === 'result' && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-5xl mb-4">{level.emoji}</div>
                <h2 className="text-2xl font-black text-white mb-2">{level.label}</h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">{level.msg}</p>

                {/* Score Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500">مدى تأثير الوهم عليك</span>
                    <span style={{ color: level.color }}>{percentage}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: level.color }} />
                  </div>
                </div>

                <div className="px-4 py-3 rounded-xl mb-6 text-right" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                  <p className="text-xs text-cyan-300 leading-relaxed">
                    {biasData.connectionExplanation}
                  </p>
                </div>

                <button onClick={handleCTA}
                  className="w-full py-4 rounded-2xl font-black text-white text-base mb-3"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #0d9488)', boxShadow: '0 8px 30px rgba(124,58,237,0.3)' }}>
                  ابدأ رحلتك — فك نفسك من الوهم ده 🗺️
                </button>

                <button onClick={() => { setStage('intro'); setAnswers([null, null, null]); setCurrentQ(0); }}
                  className="text-xs text-slate-500 hover:text-white transition-colors font-bold">
                  أعد الاختبار
                </button>

                <p className="text-[10px] text-slate-600 mt-6">🔒 خصوصية كاملة — بدون أسماء أو بيانات شخصية</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}

export default function IllusionLandingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: '#0a0a1a' }} />}>
      <IllusionContent />
    </Suspense>
  );
}
