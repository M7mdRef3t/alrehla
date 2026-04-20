import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection } from './HeroSection';

const VARIANTS = [
  { id: 'main', name: 'Sovereign (Crystal Clear)', Component: HeroSection, desc: 'النسخة الصافية السيادية - تركيز عالي' },
];

export const HeroExhibition: React.FC = () => {
  const [activeId, setActiveId] = useState('main');
  const activeVariant = VARIANTS.find(v => v.id === activeId) || VARIANTS[0];

  // Dummy props for demonstration
  const dummyProps = {
    onStartJourney: () => alert('تم بدء الرحلة من المختبر'),
    mirrorName: '',
    setMirrorName: () => {},
    pulseCount: 1240,
    trustPoints: ['أمان سيادي', 'توافق نفسي', 'خصوصية مطلقة'],
    ctaJourney: 'ابدأ تجربتك الآن',
    secondaryCta: 'استكشف المحاكاة',
  };

  return (
    <div className="hero-exhibition-container relative w-full min-h-screen bg-[#02040a] overflow-hidden">
      {/* Control Panel Overlays */}
      <div className="fixed top-24 right-8 z-[100] flex flex-col gap-4 w-72">
        <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-cyan-400 font-black text-lg mb-2 tracking-tighter">مختبر المعماري</h2>
          <p className="text-slate-400 text-xs mb-6 font-medium">استعرض نسخ الهيرو وبدل بينها حياً</p>
          
          <div className="flex flex-col gap-2">
            {VARIANTS.map(variant => (
              <button
                key={variant.id}
                onClick={() => setActiveId(variant.id)}
                className={`text-right px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm flex flex-col ${
                  activeId === variant.id 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                    : 'text-slate-500 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{variant.name}</span>
                <span className="text-[10px] opacity-60 font-medium">{variant.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>تشفير الملفات: UTF-8</span>
            <span>الحالة: سليم</span>
          </div>
        </div>
      </div>

      {/* Render Active Hero */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <activeVariant.Component {...dummyProps} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
