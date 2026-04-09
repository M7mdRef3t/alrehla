'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Heart, Target, Zap, Waves } from 'lucide-react';

type PrepStep = 'welcome' | 'story' | 'attempts' | 'impact' | 'outcome' | 'emotions' | 'success';

interface PrepFormData {
  story: string;
  attemptsBefore: string;
  currentImpact: string[];
  desiredOutcome: string;
  dominantEmotions: string[];
}

export default function SessionPrepPage({ params }: { params: { requestId: string } }) {
  const [step, setStep] = useState<PrepStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('يا صديقي');
  
  const [formData, setFormData] = useState<PrepFormData>({
    story: '',
    attemptsBefore: '',
    currentImpact: [],
    desiredOutcome: '',
    dominantEmotions: []
  });

  const updateField = (field: keyof PrepFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'currentImpact' | 'dominantEmotions', item: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sessions/prep-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: params.requestId,
          prep: {
            story: formData.story,
            attempts_before: formData.attemptsBefore,
            current_impact: formData.currentImpact,
            desired_outcome: formData.desiredOutcome,
            dominant_emotions: formData.dominantEmotions
          }
        })
      });
      if (res.ok) setStep('success');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentImpactOptions = [
    'التركيز في الشغل',
    'العلاقات العائلية',
    'النوم والطاقة',
    'تقدير الذات',
    'التواصل مع الشريك',
    'الأداء اليومي'
  ];

  const emotionOptions = [
    'تيه / حيرة',
    'غضب مكتوم',
    'حزن / شجن',
    'ذنب / تقصير',
    'حماس حذر',
    'خوف من التغيير',
    'جمود / شلل تفكير'
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {step !== 'welcome' && step !== 'success' && (
          <div className="flex justify-between items-center mb-12">
             <button 
              onClick={() => {
                const order: PrepStep[] = ['welcome', 'story', 'attempts', 'impact', 'outcome', 'emotions'];
                const idx = order.indexOf(step);
                if (idx > 0) setStep(order[idx - 1]);
              }}
              className="flex items-center text-neutral-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              رجوع
            </button>
            <div className="h-1 flex-1 mx-4 bg-neutral-900 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${(['welcome', 'story', 'attempts', 'impact', 'outcome', 'emotions'].indexOf(step) / 5) * 100}%` }}
                />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Waves className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-6">مرحباً بك في الغطس العظيم</h1>
              <p className="text-neutral-400 text-lg leading-relaxed mb-10">
                لكي تكون الجلسة بأقصى فاعلية، نحتاج للنزول تحت السطح قليلاً. هذه الأسئلة ليست مجرد بيانات، بل هي بداية رحلة الوعي لما سيحدث في الجلسة.
              </p>
              <button 
                onClick={() => setStep('story')}
                className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all flex justify-center items-center group"
              >
                فلنبدأ الغطس
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 'story' && (
            <motion.div key="story" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
              <div className="mb-8">
                <span className="text-white/20 text-6xl font-black block mb-2">01</span>
                <h2 className="text-3xl font-bold mb-2">ما هي القصة الحقيقية؟</h2>
                <p className="text-neutral-500">احكي لي بالتفصيل، ما الذي يدور في ذهنك ولا يعرفه أحد غيرك عن هذا الموضوع؟</p>
              </div>
              <textarea 
                value={formData.story} 
                onChange={e => updateField('story', e.target.value)} 
                rows={8} 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-white transition-all"
                placeholder="ابدأ الكتابة هنا..."
              />
              <button onClick={() => setStep('attempts')} disabled={formData.story.length < 20} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                التالي
              </button>
            </motion.div>
          )}

          {step === 'attempts' && (
            <motion.div key="attempts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">02</span>
                    <h2 className="text-3xl font-bold mb-2">ماذا جربت من قبل؟</h2>
                    <p className="text-neutral-500">لماذا لم تنجح الحلول السابقة في نظرك؟</p>
                </div>
                <textarea 
                    value={formData.attemptsBefore} 
                    onChange={e => updateField('attemptsBefore', e.target.value)} 
                    rows={6} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-white transition-all"
                />
                <button onClick={() => setStep('impact')} disabled={!formData.attemptsBefore} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                    التالي
                </button>
            </motion.div>
          )}

          {step === 'impact' && (
            <motion.div key="impact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                 <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">03</span>
                    <h2 className="text-3xl font-bold mb-2">أين يقع التأثير؟</h2>
                    <p className="text-neutral-500">اختر الجوانب الأكثر تأثراً حالياً:</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {currentImpactOptions.map(opt => (
                        <button 
                            key={opt}
                            onClick={() => toggleArrayItem('currentImpact', opt)}
                            className={`p-4 border rounded-xl text-right transition-all ${formData.currentImpact.includes(opt) ? 'bg-white text-black border-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                <button onClick={() => setStep('outcome')} disabled={formData.currentImpact.length === 0} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                    التالي
                </button>
            </motion.div>
          )}

          {step === 'outcome' && (
            <motion.div key="outcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">04</span>
                    <h2 className="text-3xl font-bold mb-2">التغيير المنشود</h2>
                    <p className="text-neutral-500">ما هي اللحظة التي إذا حدثت في الجلسة ستقول أن "الرحلة تستحق"؟</p>
                </div>
                <textarea 
                    value={formData.desiredOutcome} 
                    onChange={e => updateField('desiredOutcome', e.target.value)} 
                    rows={4} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-white transition-all"
                />
                <button onClick={() => setStep('emotions')} disabled={!formData.desiredOutcome} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                    الخطوة الأخيرة
                </button>
            </motion.div>
          )}

          {step === 'emotions' && (
            <motion.div key="emotions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                 <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">05</span>
                    <h2 className="text-3xl font-bold mb-2">كيف تشعر الآن؟</h2>
                    <p className="text-neutral-500">صدقك مع مشاعرك هو أول طريق الملاحة:</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {emotionOptions.map(opt => (
                        <button 
                            key={opt}
                            onClick={() => toggleArrayItem('dominantEmotions', opt)}
                            className={`p-4 border rounded-xl text-right transition-all ${formData.dominantEmotions.includes(opt) ? 'bg-white text-black border-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                <button onClick={handleSubmit} disabled={isSubmitting || formData.dominantEmotions.length === 0} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all flex justify-center items-center">
                    {isSubmitting ? <span className="animate-pulse">جاري التحليل والغطس...</span> : 'أنهيت الاستعداد'}
                </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-3xl" dir="rtl">
               <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                 <Zap className="w-10 h-10" />
               </div>
               <h2 className="text-3xl font-bold mb-4">أنا مستعد الآن</h2>
               <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                 لقد انتهى الغطس الاستكشافي. تم تحديث ملفك بالمعطيات الجديدة، والآن سأقوم بتحليلها لكي أكون جاهزاً تماماً للقائنا.
               </p>
               <p className="text-sm text-neutral-500">اراك قريباً في الدائرة.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
