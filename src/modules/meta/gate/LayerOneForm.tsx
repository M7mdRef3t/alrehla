import React from 'react';
import { motion } from 'framer-motion';
import { useAdminState } from "@/domains/admin/store/admin.store";
import {
  getRelationshipWeatherEntryHref,
  getRelationshipWeatherPath
} from "@/utils/relationshipWeatherJourney";

interface Props {
  sourceArea: string;
  email: string;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isValid: boolean;
}

export default function LayerOneForm({ sourceArea, email, onChange, onSubmit, isValid }: Props) {
  const weatherPath = useAdminState((state) => {
    const path = getRelationshipWeatherPath(state.journeyPaths);
    return path?.isActive ? path : null;
  });
  const weatherEntryHref = getRelationshipWeatherEntryHref(weatherPath);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto space-y-8 relative z-10"
    >
      <div className="space-y-3 text-center">
        <h1 className="text-2xl md:text-3xl font-black text-slate-100 dark:text-slate-100 leading-tight">
          الدوائر اللي حواليك هي اللي بتشكل واقعك.. تفتكر أنهي دايرة محتاجة مجهر دلوقتي؟
        </h1>
        <p className="text-sm text-slate-400">
          الملاذ بيفتح لك مساحة خاصة لرؤية "حقيقة" علاقاتك بعيدًا عن المجاملات والتشويش.
        </p>
      </div>

      <div className="space-y-5 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block text-right">
            أنهي مكان في حياتك محتاج وضوح دلوقتي؟
          </label>
          <select 
            value={sourceArea}
            onChange={(e) => onChange('sourceArea', e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-colors text-right dir-rtl appearance-none"
            dir="rtl"
          >
            <option value="" disabled>اختر الدائرة المعنية...</option>
            <option value="family">العائلة (الجذور)</option>
            <option value="partner">الشريك (الظل)</option>
            <option value="work">العمل / الزملاء (المسرح)</option>
            <option value="friend">صديق مقرب (المرآة)</option>
          </select>
        </div>

        <div className="space-y-2">
           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block text-right">
            فين نقدر نبعتلك خريطة رحلتك؟ (الإيميل)
          </label>
          <input 
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-colors text-left font-mono"
            dir="ltr"
          />
        </div>

        <div className="space-y-4">
          <button 
            onClick={onSubmit}
            disabled={!isValid}
            className={`w-full p-4 rounded-xl font-black uppercase tracking-widest transition-all duration-500 ${isValid ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            ابدأ الاكتشاف الآن
          </button>
          
          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 opacity-60">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=alrehla${i}`} alt="traveler" className="w-full h-full object-cover grayscale" />
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400">انضم لـ +١٢٠٠ مسافر بدأوا الرحلة</p>
          </div>
        </div>
      </div>

      {/* Free Tool CTA — Weather Diagnostic */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-widest font-bold">مش جاهز تسجّل دلوقتي؟</p>
        <a
          href={weatherEntryHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-slate-800 hover:decoration-emerald-400"
        >
          🌦️ جرّب تشخيص "طقس علاقاتك" مجاناً (٩٠ ثانية)
        </a>
      </div>

    </motion.div>
  );
}
