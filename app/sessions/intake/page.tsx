'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import {
  useSessionIntake,
  SESSION_GOAL_OPTIONS,
  AGE_RANGES,
  PREVIOUS_SESSION_OPTIONS,
} from '@/domains/sessions';

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

  const handleSubmit = async () => {
    const success = await submitIntake();
    if (!success) {
      alert('عذراً، حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {step !== 'welcome' && step !== 'success' && (
          <button 
            onClick={goBack}
            className="flex items-center text-neutral-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            رجوع
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl"
            >
              <h1 className="text-3xl font-bold mb-4">مسار الجلسات</h1>
              <p className="text-neutral-300 leading-relaxed mb-6">
                لبدء طلب جلسة، ادخل على منصة الرحلة واملأ الخطوات التالية. بعد مراجعة البيانات، سيتم تحديد الخطوة المناسبة لك وتحليل ما إذا كانت الجلسة هي التدخل الأنسب لحالتك حالياً.
              </p>
              <div className="bg-neutral-800/50 rounded-lg p-4 mb-8 text-sm text-neutral-400 border border-neutral-700/50">
                <ShieldAlert className="w-5 h-5 mb-2 text-yellow-500" />
                <p>هذا المسار ليس للتعامل مع الأزمات الطارئة أو الحالات التي تتطلب تدخلاً طبياً أو نفسياً عاجلاً.</p>
              </div>
              <button 
                onClick={() => goNext('basic')}
                className="w-full py-4 bg-white text-black rounded-lg font-bold hover:bg-neutral-200 transition-colors flex justify-center items-center"
              >
                بدء تقديم الطلب
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </motion.div>
          )}

          {step === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
              dir="rtl"
            >
              <h2 className="text-2xl font-bold mb-6">البيانات الأساسية</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">الاسم الكامل</label>
                  <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">رقم الموبايل / الواتساب</label>
                    <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">البريد الإلكتروني (اختياري)</label>
                    <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">البلد</label>
                    <input type="text" value={formData.country} onChange={e => updateField('country', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">الفئة العمرية</label>
                    <select value={formData.ageRange} onChange={e => updateField('ageRange', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors">
                      <option value="">اختر..</option>
                      {AGE_RANGES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={() => goNext('reason')} disabled={!canProceedFromBasic} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-lg font-bold transition-colors">
                التالي
              </button>
            </motion.div>
          )}

          {step === 'reason' && (
            <motion.div
              key="reason"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
              dir="rtl"
            >
              <h2 className="text-2xl font-bold mb-6">سبب الطلب</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">حابب الجلسة تكون عن إيه؟</label>
                  <textarea value={formData.requestReason} onChange={e => updateField('requestReason', e.target.value)} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="اكتب براحتك..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">إيه اللي مخليك تطلب الجلسة دلوقتي بالتحديد؟</label>
                  <p className="text-xs text-neutral-500 mb-2">هذا السؤال يساعدنا في تقييم مدى استعجالية الموضوع.</p>
                  <textarea value={formData.urgencyReason} onChange={e => updateField('urgencyReason', e.target.value)} rows={2} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="لأن..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">إيه أكتر حاجة مضايقاك حالياً في الموضوع ده؟</label>
                  <textarea value={formData.biggestChallenge} onChange={e => updateField('biggestChallenge', e.target.value)} rows={2} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors"></textarea>
                </div>
              </div>
              <button onClick={() => goNext('context')} disabled={!canProceedFromReason} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-lg font-bold transition-colors">
                التالي
              </button>
            </motion.div>
          )}

          {step === 'context' && (
            <motion.div
              key="context"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
              dir="rtl"
            >
              <h2 className="text-2xl font-bold mb-6">سياق مختصر</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">هل أخدت جلسات من قبل؟</label>
                  <select value={formData.previousSessions} onChange={e => updateField('previousSessions', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors">
                    <option value="">اختر..</option>
                    {PREVIOUS_SESSION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">هل فيه شخص أو موقف محدد متعلق بالمشكلة؟</label>
                  <input type="text" value={formData.specificPersonOrSituation} onChange={e => updateField('specificPersonOrSituation', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="مثال: مديري، شريكي، قرار نقل..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">من 1 إلى 10، قد إيه الموضوع مأثر فيك حالياً؟</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="1" max="10" value={formData.impactScore} onChange={e => updateField('impactScore', parseInt(e.target.value))} className="w-full accent-white" />
                    <span className="text-xl font-bold">{formData.impactScore}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">الموضوع ده بقاله قد إيه تقريباً؟</label>
                  <input type="text" value={formData.durationOfProblem} onChange={e => updateField('durationOfProblem', e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-white transition-colors" placeholder="أيام / شهور / سنين" />
                </div>
              </div>
              <button onClick={() => goNext('safety')} disabled={!canProceedFromContext} className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-lg font-bold transition-colors">
                التالي
              </button>
            </motion.div>
          )}

          {step === 'safety' && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
              dir="rtl"
            >
              <h2 className="text-2xl font-bold mb-6 text-red-400">حدود التدخل (لأمانك أولاً)</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">هل تمر حالياً بأزمة شديدة جداً تمنعك من أداء يومك بشكل طبيعي؟ أو تشعر بأنك تحتاج دعماً طبياً/نفسياً عاجلاً؟</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => updateField('crisisFlag', true)}
                      className={`flex-1 py-3 border rounded-lg transition-colors ${formData.crisisFlag === true ? 'bg-red-900/50 border-red-500 text-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                    >
                      نعم
                    </button>
                    <button 
                      onClick={() => updateField('crisisFlag', false)}
                      className={`flex-1 py-3 border rounded-lg transition-colors ${formData.crisisFlag === false ? 'bg-white border-white text-black' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                    >
                      لا
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">إيه الهدف المبدئي اللي تتوقع توصل له من الجلسة؟</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SESSION_GOAL_OPTIONS.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => updateField('sessionGoalType', goal)}
                        className={`py-3 px-4 border rounded-lg text-sm transition-colors text-right ${formData.sessionGoalType === goal ? 'bg-neutral-800 border-white text-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {formData.crisisFlag && (
                <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-sm text-red-200">
                  يرجى العلم أن الجلسات لدينا مخصصة للتطوير والملاحة الحياتية وليست بديلاً عن العلاج النفسي أو التدخل الطبي العاجل. بإرسالك الطلب سنشير إلى ذلك لضمان تحويلك للجهة الأنسب إذا لزم الأمر.
                </div>
              )}

              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !canSubmitSafety} 
                className="w-full mt-8 py-4 bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 rounded-lg font-bold transition-colors flex justify-center items-center"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">جاري إرسال الطلب...</span>
                ) : (
                  'إرسال طلب الجلسة للمراجعة'
                )}
              </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">تم استلام طلبك بنجاح</h2>
              <p className="text-neutral-400 leading-relaxed mb-8">
                نقوم الآن بمراجعة بياناتك لفرز الطلب والتأكد من ملاءمة التدخل. 
                سنقوم بالتواصل معك قريباً لتحديد الخطوة التالية الأنسب لك بوضوح (سواء كانت استكمالاً للترتيبات، جلسة تحضيرية، أو توجيه لمسار آخر).
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
