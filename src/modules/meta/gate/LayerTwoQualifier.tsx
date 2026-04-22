import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackGateEventPixelOnly } from '@/lib/analytics/eventTracker';

interface Props {
  onComplete: (q1: string, q2: string, q3: string) => void;
  sessionId?: string;
}

export default function LayerTwoQualifier({ onComplete, sessionId }: Props) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });

  // Track Q1 View on Mount
  React.useEffect(() => {
    if (sessionId) {
      trackGateEventPixelOnly('Gate_Q1_Viewed', { external_id: sessionId }, `${sessionId}-q1-viewed`);
    }
  }, [sessionId]);

  const handleSelect = (question: 'q1'|'q2'|'q3', value: string) => {
    // Tracking per-question answers for dropout diagnosis
    if (sessionId) {
      trackGateEventPixelOnly(`Gate_${question.toUpperCase()}_Answered`, { 
        external_id: sessionId,
        answer: value 
      }, `${sessionId}-${question}-answered`);
    }

    setAnswers(prev => ({ ...prev, [question]: value }));
    setTimeout(() => {
      if (step < 3) {
        setStep(step + 1);
        if (sessionId) {
          trackGateEventPixelOnly(`Gate_Q${step + 1}_Viewed`, { external_id: sessionId }, `${sessionId}-q${step + 1}-viewed`);
        }
      } else {
        onComplete(answers.q1 || (question === 'q1' ? value : ''), 
                   answers.q2 || (question === 'q2' ? value : ''), 
                   question === 'q3' ? value : answers.q3);
      }
    }, 400); // short delay for selection feedback
  };

  const OptionBtn = ({ label, value, qKey }: { label: string, value: string, qKey: 'q1'|'q2'|'q3' }) => (
    <button
      onClick={() => handleSelect(qKey, value)}
      className="w-full p-4 rounded-xl text-right bg-slate-900 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all font-medium text-slate-200"
    >
      {label}
    </button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md mx-auto space-y-6 relative z-10"
      dir="rtl"
    >
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-xl font-bold text-emerald-400">بدأت الرحلة بنجاح.</h2>
        <p className="text-slate-400 text-sm">بقيت خطوة قصيرة قبل بدء المسح.</p>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden min-h-[300px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="q1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="font-black text-slate-100 mb-4 text-lg">إيه أكتر "حمل تقيل" شايله في دوائرك دلوقتي؟</h3>
              <div className="space-y-3">
                <OptionBtn qKey="q1" value="compliments" label='تكلفة "المجاملة" اللي مابتخلصش' />
                <OptionBtn qKey="q1" value="guilt" label="الإحساس الدائم بالذنب والتقصير" />
                <OptionBtn qKey="q1" value="confusion" label="الغموض.. مابقتش عارف مين معايا ومين عليا" />
                <OptionBtn qKey="q1" value="pattern" label="تكرار نفس خيبة الأمل مع ناس مختلفة" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="q2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="font-black text-slate-100 mb-4 text-lg">محتاج توصل لإيه في نهاية المسح ده؟</h3>
              <div className="space-y-3">
                <OptionBtn qKey="q2" value="clarity" label="خريطة واضحة لكل اللي بيحصل حواليا" />
                <OptionBtn qKey="q2" value="sorting" label="أعرف مين يستحق مكانه في دايرتي ومين لأ" />
                <OptionBtn qKey="q2" value="decision" label='قرار شجاع بخصوص "شخص محدد" تعبني' />
                <OptionBtn qKey="q2" value="understand_drain" label="أفهم ليه طاقتي بتخلص بمجرد ما بتعامل معاهم" />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="q3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="font-black text-slate-100 mb-4 text-lg">الوضوح مش دايماً مريح.. هل أنت مستعد تواجه "الحقيقة"؟</h3>
              <div className="space-y-3">
                <OptionBtn qKey="q3" value="yes" label="أيوة، أنا جاهز أشوف الصورة كاملة" />
                <OptionBtn qKey="q3" value="somewhat" label="إلى حد ما.. بس محتاج حد يوجهني" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
