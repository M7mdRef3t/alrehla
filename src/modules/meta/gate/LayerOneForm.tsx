import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Heart, 
  Briefcase, 
  UserCircle, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';

interface Props {
  name: string;
  phone: string;
  sourceArea: string;
  email: string;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isValid: boolean;
  onStepComplete?: (step: 'area' | 'teaser' | 'identity') => void;
}

const AREAS = [
  { id: 'family', label: 'العائلة', sub: 'الجذور والانتماء', icon: Users, color: 'emerald' },
  { id: 'partner', label: 'الشريك', sub: 'الظل والاحتواء', icon: Heart, color: 'rose' },
  { id: 'work', label: 'العمل', sub: 'المسرح والطموح', icon: Briefcase, color: 'blue' },
  { id: 'friend', label: 'صديق مقرب', sub: 'المرآة والصدق', icon: UserCircle, color: 'amber' },
];

const TEASERS: Record<string, string> = {
  family: "العيلة مش بس ناس عايشين معاك، دي 'التربة' اللي بتحدد شكل فروعك. لو الجذور مشدودة، الشجرة كلها هتميل.",
  partner: "علاقتك بالشريك هي أكتر مراية بتكشف عيوبك ومميزاتك في نفس الوقت. الهروب من المواجهة هو هروب من نفسك.",
  work: "المسرح المهني بيستهلك أكتر من تلت عمرك. لو الدوائر اللي هناك مش واضحة، طاقتك هتستنزف في صراعات وهمية.",
  friend: "الصديق الحقيقي هو اللي بيوريك 'حقيقتك' من غير فلاتر. اختيار الدائرة دي هو اللي بيحدد سرعة نموك."
};

export default function LayerOneForm({ 
  name, 
  phone, 
  sourceArea, 
  email, 
  onChange, 
  onSubmit, 
  isValid,
  onStepComplete 
}: Props) {
  const [internalStep, setInternalStep] = useState<'area' | 'teaser' | 'identity' | 'email'>(
    sourceArea ? 'teaser' : 'area'
  );
  const [isIndexing, setIsIndexing] = useState(false);

  const handleAreaSelect = (areaId: string) => {
    onChange('sourceArea', areaId);
    setInternalStep('teaser');
    onStepComplete?.('area');
  };

  const handleTeaserContinue = () => {
    setInternalStep('identity');
    onStepComplete?.('teaser');
  };

  const handleIdentityContinue = () => {
    if (!name || !phone) return;
    setIsIndexing(true);
    // Give a small delay to simulate "Sovereign Indexing" and prevent jitter
    setTimeout(() => {
      setInternalStep('email');
      setIsIndexing(false);
      onStepComplete?.('identity');
    }, 800);
  };

  return (
    <div className="w-full max-w-lg mx-auto relative z-10">
      <AnimatePresence mode="wait">
        {/* Step 1: Discovery - Area Selection */}
        {internalStep === 'area' && (
          <motion.div
            key="area"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-3 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-slate-100 leading-tight">
                أنهي مكان في حياتك محتاج <span className="text-emerald-400">وضوح</span> دلوقتي؟
              </h1>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                ابدأ باختيار الدايرة اللي شاغلة تفكيرك، وهنوريك "حقيقة" غالباً غايبة عنك.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleAreaSelect(area.id)}
                  className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-500 text-right"
                >
                  <area.icon className="w-8 h-8 mb-4 text-slate-400 group-hover:text-emerald-400 transition-colors ml-auto" />
                  <div className="font-black text-slate-200 group-hover:text-white transition-colors">{area.label}</div>
                  <div className="text-[10px] text-slate-500 group-hover:text-emerald-400/70 transition-colors">{area.sub}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Teaser - Value Delivery */}
        {internalStep === 'teaser' && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-8"
          >
            <div className="bg-slate-900/80 border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-12 h-12 text-emerald-400" />
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="text-xs font-black uppercase tracking-widest">رؤية الأوراكل</span>
                </div>
                
                <p className="text-xl md:text-2xl font-bold text-slate-100 leading-relaxed text-right" dir="rtl">
                  "{TEASERS[sourceArea] || "كل دايرة في حياتك ليها تأثير مباشر على سلامك النفسي."}"
                </p>

                <button
                  onClick={handleTeaserContinue}
                  className="w-full mt-4 flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black transition-all group/btn"
                >
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  <span>افتح خريطة علاقاتك الكاملة</span>
                </button>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              الخريطة الكاملة بتساعدك تدير طاقتك صح في الدايرة دي
            </p>
          </motion.div>
        )}

        {/* Step 3: Identity - Primary Info */}
        {internalStep === 'identity' && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">مين اللي بيسأل؟</h2>
              <p className="text-xs text-slate-400">سجل هويتك عشان نبدأ تحليل الدواير</p>
            </div>

            <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-right">الاسم</label>
                <input 
                  type="text"
                  placeholder="مثال: أحمد"
                  value={name}
                  onChange={(e) => onChange('name', e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500 transition-colors text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-right">رقم الواتساب</label>
                <input 
                  type="tel"
                  placeholder="+2010..."
                  value={phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleIdentityContinue}
                  disabled={!name || !phone || isIndexing}
                  className={`w-full p-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${(name && phone && !isIndexing) ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isIndexing ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  )}
                  {isIndexing ? 'جاري الحفظ..' : 'متابعة'}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setInternalStep('teaser')}
              className="w-full text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-bold uppercase tracking-widest"
            >
              ← رجوع للرؤية
            </button>
          </motion.div>
        )}

        {/* Step 4: Email - Final Submission */}
        {internalStep === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">آخر خطوة..</h2>
              <p className="text-xs text-slate-400">الإيميل اللي هتوصلك عليه الخريطة الكاملة</p>
            </div>

            <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-right">الإيميل</label>
                <input 
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={onSubmit}
                  disabled={!isValid}
                  className={`w-full p-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isValid ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isValid && <ShieldCheck className="w-5 h-5" />}
                  ابدأ الرحلة الآن
                </button>
              </div>
            </div>

            <button 
              onClick={() => setInternalStep('identity')}
              className="w-full text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-bold uppercase tracking-widest"
            >
              ← رجوع لتغيير الاسم/الرقم
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
