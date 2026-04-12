'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import {
  useSessionIntake,
  SESSION_GOAL_OPTIONS,
  COUNTRIES,
  PREVIOUS_SESSION_OPTIONS,
  COUNTRY_DIAL_CODES,
} from '@/domains/sessions';
import { SovereignReceiver } from '@/components/providers/SovereignReceiver';

export default function SessionIntakeFlow() {
  const {
    step,
    formData,
    isSubmitting,
    updateField,
    goBack,
    goNext,
    submitIntake,
    canProceedFromBasic,
    canProceedFromReason,
    canProceedFromContext,
    canSubmitSafety,
  } = useSessionIntake();

  const [birthParts, setBirthParts] = React.useState(() => {
    const [year = '', month = '', day = ''] = formData.birthDate.split('-');
    return { day, month, year };
  });
  const birthDayRef = React.useRef<HTMLInputElement | null>(null);
  const birthMonthRef = React.useRef<HTMLInputElement | null>(null);
  const birthYearRef = React.useRef<HTMLInputElement | null>(null);
  const phoneInputRef = React.useRef<HTMLInputElement | null>(null);

  const selectBirthField = (ref: React.RefObject<HTMLInputElement | null>) => {
    requestAnimationFrame(() => {
      const input = ref.current;
      if (!input) return;
      input.setSelectionRange(0, input.value.length);
    });
  };

  React.useEffect(() => {
    const [year = '', month = '', day = ''] = formData.birthDate.split('-');
    setBirthParts({ day, month, year });
  }, [formData.birthDate]);

  const currentDialCode = COUNTRY_DIAL_CODES[formData.country] || '';
  const displayedPhone = React.useMemo(() => {
    if (!currentDialCode) return formData.phone;
    return formData.phone.replace(new RegExp(`^${currentDialCode.replace('+', '\\+')}\\s*`), '');
  }, [currentDialCode, formData.phone]);

  const updateBirthDate = (part: 'day' | 'month' | 'year', value: string) => {
    setBirthParts((prev) => {
      const next = { ...prev, [part]: value };
      const hasAllParts = Boolean(next.day && next.month && next.year);

      updateField(
        'birthDate',
        hasAllParts ? `${next.year}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}` : ''
      );

      if (part === 'day' && value.length === 2) {
        birthMonthRef.current?.focus();
        selectBirthField(birthMonthRef);
      } else if (part === 'month' && value.length === 2) {
        birthYearRef.current?.focus();
        selectBirthField(birthYearRef);
      }

      return next;
    });
  };

  const handleBirthKeyDown = (part: 'day' | 'month' | 'year', event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;

    const value = event.currentTarget.value;
    if (value) return;

    if (part === 'month') {
      birthDayRef.current?.focus();
      selectBirthField(birthDayRef);
    } else if (part === 'year') {
      birthMonthRef.current?.focus();
      selectBirthField(birthMonthRef);
    }
  };

  const updateCountryAndDialCode = (countryCode: string) => {
    const dialCode = COUNTRY_DIAL_CODES[countryCode];
    const currentPhone = formData.phone.trim();
    const normalizedPhone = currentPhone.replace(/^(\+\d{1,4}\s*)?/, '');

    updateField('country', countryCode);

    if (!dialCode) return;

    if (!currentPhone) {
      updateField('phone', `${dialCode} `);
      return;
    }

    if (/^\+\d{1,4}\b/.test(currentPhone)) {
      updateField('phone', `${dialCode} ${normalizedPhone}`.trimEnd());
    }
  };

  const handlePhoneFocus = () => {
    requestAnimationFrame(() => {
      const input = phoneInputRef.current;
      if (!input) return;
      input.setSelectionRange(0, input.value.length);
    });
  };

  const handlePhoneKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    if (event.currentTarget.value) return;

    if (currentDialCode) {
      updateField('phone', currentDialCode);
    }
  };

  const handleSubmit = async () => {
    const success = await submitIntake();
    if (!success) {
      alert('عذراً، حدث خطأ في ربط البيانات مع الأنظمة الأساسية. يرجى المحاولة مرة أخرى.');
    }
  };

  // 🎨 Step-specific atmosphere
  const atmosfera: Record<string, string> = {
    welcome: 'from-blue-900/40 via-slate-950 to-black',
    basic: 'from-slate-900/40 via-slate-950 to-black',
    reason: 'from-purple-900/30 via-slate-950 to-black',
    context: 'from-indigo-900/30 via-slate-950 to-black',
    safety: 'from-red-950/40 via-slate-950 to-black',
    success: 'from-emerald-900/40 via-slate-950 to-black',
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-black text-slate-100 transition-colors duration-1000 font-sans`}>
      {/* 🌌 Cinematic Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${atmosfera[step] || atmosfera.welcome} transition-all duration-1000`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.05)_0%,transparent_70%)]" />
      
      {/* 📡 Sovereign Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 opacity-40">
        <div className={`h-1.5 w-1.5 rounded-full ${isSubmitting ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'}`} />
        <span className="text-[10px] uppercase tracking-widest terminal-text font-mono">
          {isSubmitting ? 'UPLOADING_DATA' : 'LINK_ESTABLISHED'}
        </span>
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col px-6 py-12 md:py-20">
        <SovereignReceiver />

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center space-y-8 flex-1 justify-center"
            >
              <div className="h-24 w-24 rounded-full bg-gradient-to-b from-teal-400/20 to-transparent p-px">
                <div className="h-full w-full rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-teal-400/20">
                  <div className="h-12 w-12 rounded-full border-2 border-teal-400/50 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                  بروتوكول بدء الجلسة
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed max-w-sm mx-auto">
                  أهلاً بك في نظام 'الرحلة'. قبل ما نبدأ الجلسة، محتاجين نعمل 'تزامن' سريع (Synchronization) عشان نضمن إننا بنتحرك في الاتجاه الصح.
                </p>
              </div>

              <button
                onClick={() => goNext('basic')}
                className="group relative flex items-center gap-3 px-8 py-4 bg-teal-500 text-black font-bold rounded-2xl hover:bg-teal-400 transition-all duration-300"
              >
                بدء التزامن
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="pt-8 space-y-2">
                <p className="text-[10px] text-slate-500 terminal-text font-mono">
                  IDENTITY: SYSTEM_ARCHITECT | STATUS: WAITING_FOR_SYNC
                </p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-1 w-1 rounded-full bg-teal-500/20 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'basic' && (
            <motion.div
              key="basic_info"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden my-auto"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">بيانات المسافر</h2>
                  <p className="text-sm text-slate-400">مين اللي بيقود الرحلة دي النهاردة؟</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1">الاسم الكامل</label>
                    <input
                      type="text"
                      placeholder="عايز أناديك بإيه؟"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white placeholder:text-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1">رقم التواصل</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.country}
                        onChange={(e) => updateCountryAndDialCode(e.target.value)}
                        className="bg-white/[0.05] border border-white/5 outline-none p-4 rounded-xl text-white w-24 text-center cursor-pointer appearance-none"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.value} value={c.value} className="bg-slate-900">
                            {c.label} {COUNTRY_DIAL_CODES[c.value]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        ref={phoneInputRef}
                        placeholder="رقم الموبايل"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="flex-1 bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white placeholder:text-slate-600 transition-all text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1 font-mono">تاريخ الميلاد (اختياري)</label>
                    <div className="grid grid-cols-3 gap-3" dir="ltr">
                      <input
                        ref={birthDayRef}
                        type="text"
                        placeholder="DD"
                        maxLength={2}
                        value={birthParts.day}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBirthParts(p => ({ ...p, day: val }));
                          if (val.length === 2) birthMonthRef.current?.focus();
                        }}
                        onFocus={() => selectBirthField(birthDayRef)}
                        className="bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white text-center"
                      />
                      <input
                        ref={birthMonthRef}
                        type="text"
                        placeholder="MM"
                        maxLength={2}
                        value={birthParts.month}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBirthParts(p => ({ ...p, month: val }));
                          if (val.length === 2) birthYearRef.current?.focus();
                        }}
                        onFocus={() => selectBirthField(birthMonthRef)}
                        className="bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white text-center"
                      />
                      <input
                        ref={birthYearRef}
                        type="text"
                        placeholder="YYYY"
                        maxLength={4}
                        value={birthParts.year}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBirthParts(p => ({ ...p, year: val }));
                        }}
                        onFocus={() => selectBirthField(birthYearRef)}
                        className="bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => goBack()} className="p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <button
                    disabled={!canProceedFromBasic}
                    onClick={() => {
                        const date = `${birthParts.year}-${birthParts.month.padStart(2, '0')}-${birthParts.day.padStart(2, '0')}`;
                        if (birthParts.year) updateField('birthDate', date);
                        goNext('reason');
                    }}
                    className="flex-1 bg-white text-black font-bold p-4 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                  >
                    تأكيد الإحداثيات
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'reason' && (
            <motion.div
              key="reason"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] space-y-8 my-auto"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">تحليل الاحتياج</h2>
                <p className="text-sm text-slate-400">إيه اللي خلاك تضغط على زرار 'طلب الجلسة' في اللحظة دي؟</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1">الموضوع الأساسي</label>
                  <textarea
                    placeholder="احكي لنا باختصار إيه اللي بيدور في عقلك..."
                    value={formData.requestReason}
                    onChange={(e) => updateField('requestReason', e.target.value)}
                    rows={4}
                    className="w-full bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white placeholder:text-slate-600 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1">درجة الإلحاح</label>
                  <textarea
                    placeholder="ليه محتاج الجلسة دي دلوقتي تحديداً؟"
                    value={formData.urgencyReason}
                    onChange={(e) => updateField('urgencyReason', e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white placeholder:text-slate-600 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => goBack()} className="p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <button
                  disabled={!canProceedFromReason}
                  onClick={() => goNext('context')}
                  className="flex-1 bg-white text-black font-bold p-4 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  تحليل العمق
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'context' && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] space-y-8 my-auto"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">الخلفية التاريخية</h2>
                <p className="text-sm text-slate-400">محتاجين نفهم مسار الموضوع ده بدأ منين ووصل لفين.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1">هل جربت جلسات قبل كدة؟</label>
                  <div className="grid grid-cols-1 gap-2">
                    {PREVIOUS_SESSION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField('previousSessions', opt.value)}
                        className={`p-4 rounded-xl text-right transition-all border ${
                          formData.previousSessions === opt.value 
                          ? 'bg-teal-500/20 border-teal-500 text-teal-400' 
                          : 'bg-white/[0.05] border-white/5 text-slate-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-right" dir="rtl">
                  <label className="text-[10px] uppercase tracking-widest text-teal-500 font-bold px-1 font-mono">بقالك قد إيه في الحالة دي؟</label>
                  <input
                    type="text"
                    placeholder="مثلاً: شهر، سنة، أو من زمان..."
                    value={formData.durationOfProblem}
                    onChange={(e) => updateField('durationOfProblem', e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/5 focus:border-teal-500/50 outline-none p-4 rounded-xl text-white placeholder:text-slate-600 transition-all text-right"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => goBack()} className="p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <button
                  disabled={!canProceedFromContext}
                  onClick={() => goNext('safety')}
                  className="flex-1 bg-white text-black font-bold p-4 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  بروتوكول الأمان
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'safety' && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-950/20 backdrop-blur-2xl border border-red-500/20 p-8 rounded-[32px] space-y-8 shadow-[0_0_50px_rgba(239,68,68,0.1)] my-auto"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-red-400">تأمين الرحلة</h2>
                  <p className="text-sm text-slate-500">مهمتنا الأولى هي ضمان سلامتك.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white">هل توجد أفكار للتخلص من الحياة؟</span>
                    <p className="text-[10px] text-slate-500">ده سؤال روتيني ضروري للأمان.</p>
                  </div>
                  <button
                    onClick={() => updateField('crisisFlag', !formData.crisisFlag)}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.crisisFlag ? 'bg-red-500' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.crisisFlag ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-2 text-right" dir="rtl">
                  <label className="text-[10px] uppercase tracking-widest text-red-400 font-bold px-1">هدفك من الجلسة</label>
                  <div className="grid grid-cols-1 gap-2">
                    {SESSION_GOAL_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateField('sessionGoalType', opt)}
                        className={`p-4 rounded-xl text-right transition-all border ${
                          formData.sessionGoalType === opt 
                          ? 'bg-red-500/20 border-red-500 text-red-400' 
                          : 'bg-white/[0.05] border-white/5 text-slate-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => goBack()} className="p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <button
                  disabled={!canSubmitSafety || isSubmitting}
                  onClick={() => handleSubmit()}
                  className="flex-1 bg-red-500 text-white font-bold p-4 rounded-xl hover:bg-red-600 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'جاري الرفع...' : 'إنهاء طلب الرحلة'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-8 flex-1 justify-center"
            >
              <div className="h-32 w-32 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="bg-emerald-500 text-black p-4 rounded-full"
                >
                  <ChevronRight className="w-12 h-12 -rotate-90" />
                </motion.div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">تم استلام البيانات بنجاح</h2>
                <p className="text-lg text-slate-400 leading-relaxed max-w-sm">
                  دلوقتي نظام 'الرحلة' بدأ يحلل بياناتك. هيتواصل معاك 'رفيق من الفريق' قريب جداً عشان نحدد ميعاد الانطلاق.
                </p>
              </div>

              <div className="pt-8 w-full max-w-xs space-y-4">
                 <button
                   onClick={() => window.location.href = '/'}
                   className="w-full bg-white text-black font-bold p-4 rounded-xl hover:bg-slate-200 transition-all"
                 >
                   العودة للمسار الأساسي
                 </button>
                 <p className="text-[10px] text-slate-500 terminal-text font-mono">TRANSMISSION_COMPLETE | COMPLIANCE_CODE: 200</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
