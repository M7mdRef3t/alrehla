import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  sourceArea: string;
  email: string;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isValid: boolean;
}

export default function LayerOneForm({ sourceArea, email, onChange, onSubmit, isValid }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-8 relative z-10"
    >
      <div className="space-y-3 text-center">
        <h1 className="text-2xl md:text-3xl font-black text-slate-100 dark:text-slate-100">
          هناك شخص في دائرتك يسحبك أكثر مما تتصور.
        </h1>
        <p className="text-sm text-slate-400">
          الملاذ يفتح لك مساحة خاصة لرؤية دوائرك البشرية بعيدًا عن الضجيج والنصائح الجاهزة.
        </p>
      </div>

      <div className="space-y-5 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block text-right">
            أين تشعر بالتشويش أكثر هذه الأيام؟
          </label>
          <select 
            value={sourceArea}
            onChange={(e) => onChange('sourceArea', e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-colors text-right dir-rtl"
            dir="rtl"
          >
            <option value="" disabled>اختر الدائرة المعنية...</option>
            <option value="family">العائلة</option>
            <option value="partner">الشريك</option>
            <option value="work">العمل / الزملاء</option>
            <option value="friend">صديق مقرب</option>
          </select>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block text-right">
            بريد الدخول الخاص بك
          </label>
          <input 
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-colors text-left"
            dir="ltr"
          />
        </div>

        <button 
          onClick={onSubmit}
          disabled={!isValid}
          className={`w-full p-4 rounded-xl font-bold tracking-widest transition-all duration-300 ${isValid ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          ابدا الرحلة
        </button>
      </div>
    </motion.div>
  );
}
