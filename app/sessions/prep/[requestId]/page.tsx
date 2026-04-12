'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Zap, Waves } from 'lucide-react';

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
  const [formData, setFormData] = useState<PrepFormData>({
    story: '',
    attemptsBefore: '',
    currentImpact: [],
    desiredOutcome: '',
    dominantEmotions: []
  });

  const updateField = (field: keyof PrepFormData, value: string | string[]) => {
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
    'Ø§Ù„ØªØ±ÙƒÙŠØ² ÙÙŠ Ø§Ù„Ø´ØºÙ„',
    'Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¹Ø§Ø¦Ù„ÙŠØ©',
    'Ø§Ù„Ù†ÙˆÙ… ÙˆØ§Ù„Ø·Ø§Ù‚Ø©',
    'ØªÙ‚Ø¯ÙŠØ± Ø§Ù„Ø°Ø§Øª',
    'Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø´Ø±ÙŠÙƒ',
    'Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„ÙŠÙˆÙ…ÙŠ'
  ];

  const emotionOptions = [
    'ØªÙŠÙ‡ / Ø­ÙŠØ±Ø©',
    'ØºØ¶Ø¨ Ù…ÙƒØªÙˆÙ…',
    'Ø­Ø²Ù† / Ø´Ø¬Ù†',
    'Ø°Ù†Ø¨ / ØªÙ‚ØµÙŠØ±',
    'Ø­Ù…Ø§Ø³ Ø­Ø°Ø±',
    'Ø®ÙˆÙ Ù…Ù† Ø§Ù„ØªØºÙŠÙŠØ±',
    'Ø¬Ù…ÙˆØ¯ / Ø´Ù„Ù„ ØªÙÙƒÙŠØ±'
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
              Ø±Ø¬ÙˆØ¹
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
              <h1 className="text-4xl font-bold mb-6">Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ø§Ù„ØºØ·Ø³ Ø§Ù„Ø¹Ø¸ÙŠÙ…</h1>
              <p className="text-neutral-400 text-lg leading-relaxed mb-10">
                Ù„ÙƒÙŠ ØªÙƒÙˆÙ† Ø§Ù„Ø¬Ù„Ø³Ø© Ø¨Ø£Ù‚ØµÙ‰ ÙØ§Ø¹Ù„ÙŠØ©ØŒ Ù†Ø­ØªØ§Ø¬ Ù„Ù„Ù†Ø²ÙˆÙ„ ØªØ­Øª Ø§Ù„Ø³Ø·Ø­ Ù‚Ù„ÙŠÙ„Ø§Ù‹. Ù‡Ø°Ù‡ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ù„ÙŠØ³Øª Ù…Ø¬Ø±Ø¯ Ø¨ÙŠØ§Ù†Ø§ØªØŒ Ø¨Ù„ Ù‡ÙŠ Ø¨Ø¯Ø§ÙŠØ© Ø±Ø­Ù„Ø© Ø§Ù„ÙˆØ¹ÙŠ Ù„Ù…Ø§ Ø³ÙŠØ­Ø¯Ø« ÙÙŠ Ø§Ù„Ø¬Ù„Ø³Ø©.
              </p>
              <button 
                onClick={() => setStep('story')}
                className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all flex justify-center items-center group"
              >
                ÙÙ„Ù†Ø¨Ø¯Ø£ Ø§Ù„ØºØ·Ø³
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 'story' && (
            <motion.div key="story" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
              <div className="mb-8">
                <span className="text-white/20 text-6xl font-black block mb-2">01</span>
                <h2 className="text-3xl font-bold mb-2">Ù…Ø§ Ù‡ÙŠ Ø§Ù„Ù‚ØµØ© Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ©ØŸ</h2>
                <p className="text-neutral-500">Ø§Ø­ÙƒÙŠ Ù„ÙŠ Ø¨Ø§Ù„ØªÙØµÙŠÙ„ØŒ Ù…Ø§ Ø§Ù„Ø°ÙŠ ÙŠØ¯ÙˆØ± ÙÙŠ Ø°Ù‡Ù†Ùƒ ÙˆÙ„Ø§ ÙŠØ¹Ø±ÙÙ‡ Ø£Ø­Ø¯ ØºÙŠØ±Ùƒ Ø¹Ù† Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹ØŸ</p>
              </div>
              <textarea 
                value={formData.story} 
                onChange={e => updateField('story', e.target.value)} 
                rows={8} 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-white transition-all"
                placeholder="Ø§Ø¨Ø¯Ø£ Ø§Ù„ÙƒØªØ§Ø¨Ø© Ù‡Ù†Ø§..."
              />
              <button onClick={() => setStep('attempts')} disabled={formData.story.length < 20} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                Ø§Ù„ØªØ§Ù„ÙŠ
              </button>
            </motion.div>
          )}

          {step === 'attempts' && (
            <motion.div key="attempts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">02</span>
                    <h2 className="text-3xl font-bold mb-2">Ù…Ø§Ø°Ø§ Ø¬Ø±Ø¨Øª Ù…Ù† Ù‚Ø¨Ù„ØŸ</h2>
                    <p className="text-neutral-500">Ù„Ù…Ø§Ø°Ø§ Ù„Ù… ØªÙ†Ø¬Ø­ Ø§Ù„Ø­Ù„ÙˆÙ„ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© ÙÙŠ Ù†Ø¸Ø±ÙƒØŸ</p>
                </div>
                <textarea 
                    value={formData.attemptsBefore} 
                    onChange={e => updateField('attemptsBefore', e.target.value)} 
                    rows={6} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-white transition-all"
                />
                <button onClick={() => setStep('impact')} disabled={!formData.attemptsBefore} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                    Ø§Ù„ØªØ§Ù„ÙŠ
                </button>
            </motion.div>
          )}

          {step === 'impact' && (
            <motion.div key="impact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                 <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">03</span>
                    <h2 className="text-3xl font-bold mb-2">Ø£ÙŠÙ† ÙŠÙ‚Ø¹ Ø§Ù„ØªØ£Ø«ÙŠØ±ØŸ</h2>
                    <p className="text-neutral-500">Ø§Ø®ØªØ± Ø§Ù„Ø¬ÙˆØ§Ù†Ø¨ Ø§Ù„Ø£ÙƒØ«Ø± ØªØ£Ø«Ø±Ø§Ù‹ Ø­Ø§Ù„ÙŠØ§Ù‹:</p>
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
                    Ø§Ù„ØªØ§Ù„ÙŠ
                </button>
            </motion.div>
          )}

          {step === 'outcome' && (
            <motion.div key="outcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">04</span>
                    <h2 className="text-3xl font-bold mb-2">Ø§Ù„ØªØºÙŠÙŠØ± Ø§Ù„Ù…Ù†Ø´ÙˆØ¯</h2>
                    <p className="text-neutral-500">Ù…Ø§ Ù‡ÙŠ Ø§Ù„Ù„Ø­Ø¸Ø© Ø§Ù„ØªÙŠ Ø¥Ø°Ø§ Ø­Ø¯Ø«Øª ÙÙŠ Ø§Ù„Ø¬Ù„Ø³Ø© Ø³ØªÙ‚ÙˆÙ„ Ø£Ù† "Ø§Ù„Ø±Ø­Ù„Ø© ØªØ³ØªØ­Ù‚"ØŸ</p>
                </div>
                <textarea 
                    value={formData.desiredOutcome} 
                    onChange={e => updateField('desiredOutcome', e.target.value)} 
                    rows={4} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xl text-white focus:outline-none focus:border-white transition-all"
                />
                <button onClick={() => setStep('emotions')} disabled={!formData.desiredOutcome} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-xl font-bold transition-all">
                    Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø£Ø®ÙŠØ±Ø©
                </button>
            </motion.div>
          )}

          {step === 'emotions' && (
            <motion.div key="emotions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} dir="rtl">
                 <div className="mb-8">
                    <span className="text-white/20 text-6xl font-black block mb-2">05</span>
                    <h2 className="text-3xl font-bold mb-2">ÙƒÙŠÙ ØªØ´Ø¹Ø± Ø§Ù„Ø¢Ù†ØŸ</h2>
                    <p className="text-neutral-500">ØµØ¯Ù‚Ùƒ Ù…Ø¹ Ù…Ø´Ø§Ø¹Ø±Ùƒ Ù‡Ùˆ Ø£ÙˆÙ„ Ø·Ø±ÙŠÙ‚ Ø§Ù„Ù…Ù„Ø§Ø­Ø©:</p>
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
                    {isSubmitting ? <span className="animate-pulse">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù„ÙŠÙ„ ÙˆØ§Ù„ØºØ·Ø³...</span> : 'Ø£Ù†Ù‡ÙŠØª Ø§Ù„Ø§Ø³ØªØ¹Ø¯Ø§Ø¯'}
                </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-3xl" dir="rtl">
               <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                 <Zap className="w-10 h-10" />
               </div>
               <h2 className="text-3xl font-bold mb-4">Ø£Ù†Ø§ Ù…Ø³ØªØ¹Ø¯ Ø§Ù„Ø¢Ù†</h2>
               <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                 Ù„Ù‚Ø¯ Ø§Ù†ØªÙ‡Ù‰ Ø§Ù„ØºØ·Ø³ Ø§Ù„Ø§Ø³ØªÙƒØ´Ø§ÙÙŠ. ØªÙ… ØªØ­Ø¯ÙŠØ« Ù…Ù„ÙÙƒ Ø¨Ø§Ù„Ù…Ø¹Ø·ÙŠØ§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©ØŒ ÙˆØ§Ù„Ø¢Ù† Ø³Ø£Ù‚ÙˆÙ… Ø¨ØªØ­Ù„ÙŠÙ„Ù‡Ø§ Ù„ÙƒÙŠ Ø£ÙƒÙˆÙ† Ø¬Ø§Ù‡Ø²Ø§Ù‹ ØªÙ…Ø§Ù…Ø§Ù‹ Ù„Ù„Ù‚Ø§Ø¦Ù†Ø§.
               </p>
               <p className="text-sm text-neutral-500">Ø§Ø±Ø§Ùƒ Ù‚Ø±ÙŠØ¨Ø§Ù‹ ÙÙŠ Ø§Ù„Ø¯Ø§Ø¦Ø±Ø©.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

