"use client";

import React, { useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { stripeService } from '../../services/stripeIntegration';
import { Shield, Zap, Target, Check, Sparkles } from 'lucide-react';
import { consumeEmotionalOffer, getEmotionalOffer } from '../../services/subscriptionManager';

export default function PricingPage() {
    const [isLoading, setIsLoading] = useState<'premium' | 'coach' | null>(null);
    const [offerConsumed, setOfferConsumed] = useState(false);
    const emotionalOffer = useMemo(() => getEmotionalOffer(), []);

    const handleSubscribe = async (tier: 'premium' | 'coach') => {
        setIsLoading(tier);

        // 1. Check Auth Step
        if (!supabase) {
            alert('خدمة التسجيل غير متوفرة حالياً.');
            setIsLoading(null);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // Redirect to login if not authenticated
        if (!user) {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/pricing' }
            });
            return;
        }

        // 2. Call our Integrated Stripe Service
        try {
            const data = await stripeService.createCheckoutSession({
                userId: user.id,
                tier: tier
            });

            if (data?.url) {
                window.location.href = data.url; // Redirect to Stripe
            } else {
                throw new Error("لم نتمكن من جلب صفحة الدفع");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("حدث خطأ أثناء الانتقال لصفحة الدفع. يرجى المحاولة لاحقاً.");
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center py-20 px-4 font-sans" dir="rtl">
            {emotionalOffer && !offerConsumed && (
                <div className="w-full max-w-4xl mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-right shadow-sm">
                    <p className="text-sm font-bold text-emerald-800 leading-tight">{emotionalOffer.title}</p>
                    <p className="text-sm text-emerald-700 mt-1 leading-[1.7]">{emotionalOffer.message}</p>
                    <button
                        type="button"
                        onClick={() => {
                            consumeEmotionalOffer();
                            setOfferConsumed(true);
                        }}
                        className="mt-3 rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        تم الاستلام
                    </button>
                </div>
            )}
            <div className="text-center max-w-2xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 mb-6 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold border border-indigo-100">
                    <Sparkles className="w-4 h-4" /> العودة للتوازن تبدأ بخطوة
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">استثمر في وعيك، ضاعف طاقتك</h1>
                <p className="text-lg text-gray-600 leading-[1.8]">
                    اختر الخطة التي تتناسب مع احتياجك. سواء كنت تصمم رحلة تعافيك الشخصية، أو تساعد عملائك على ذلك.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">

                {/* Plan A: Personal PRO */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">للاستخدام الشخصي (PRO)</h2>
                        <p className="text-gray-500 text-sm h-10 leading-[1.8]">ارسم خرائطك الذاتية وراقب تطور وعيك بشكل مستمر، دون قيود.</p>
                    </div>

                    <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-4xl font-black text-gray-900">$9</span>
                            <span className="text-gray-500 font-medium mb-1">/ شهرياً</span>
                        </div>
                        <div className="text-sm text-gray-400">يلغى الاشتراك في أي وقت</div>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1 text-gray-700">
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed"><strong>حفظ عدد لا محدود</strong> من خرائط دائرة التوازن</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed"><strong>المقارنة التاريخية:</strong> راقب كيف تتغير طاقتك بمرور الشهور</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">تحليل الذكاء الاصطناعي المعمق لاستنزاف الطاقة</span>
                        </li>
                    </ul>

                    <button
                        onClick={() => handleSubscribe('premium')}
                        disabled={isLoading === 'premium'}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg shadow-gray-900/20 flex items-center justify-center"
                    >
                        {isLoading === 'premium' ? 'جاري التحويل للبنك...' : 'استعد طاقتك الآن'}
                    </button>
                </div>

                {/* Plan B: Coach B2B */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-indigo-900/30 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="absolute top-6 left-6 bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                        للمعالجين والمدربين
                    </div>

                    <div className="mb-8 relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/20 text-indigo-200 rounded-2xl flex items-center justify-center mb-6 border border-indigo-400/20 backdrop-blur-sm">
                            <Target className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">رخصة المدرب (Practice)</h2>
                        <p className="text-indigo-200 text-sm h-10 leading-[1.8]">لوحة تحكم كاملة لإدارة عملائك ومتابعة تقدمهم ببيانات حقيقية.</p>
                    </div>

                    <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl relative z-10">
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-4xl font-black text-white">$49</span>
                            <span className="text-indigo-300 font-medium mb-1">/ شهرياً</span>
                        </div>
                        <div className="text-sm text-indigo-300">يشمل أول 10 مقاعد للعملاء</div>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1 text-indigo-100 relative z-10">
                        <li className="flex items-start gap-3">
                            <div className="rounded-full bg-indigo-500/30 p-1 shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div>
                            <span className="leading-relaxed"><strong>لوحة تحكم بانورامية:</strong> نظام فرز سريع (Triage) لحالات العملاء</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="rounded-full bg-indigo-500/30 p-1 shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div>
                            <span className="leading-relaxed">متابعة خرائط العملاء لحظياً (بموافقتهم)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="rounded-full bg-indigo-500/30 p-1 shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div>
                            <span className="leading-relaxed"><strong>نظام المقاعد القابل للتوسع:</strong> أضف عملاء أكثر بسعر مخفض متى شئت</span>
                        </li>
                    </ul>

                    <button
                        onClick={() => handleSubscribe('coach')}
                        disabled={isLoading === 'coach'}
                        className="w-full py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10 relative z-10 flex items-center justify-center"
                    >
                        {isLoading === 'coach' ? 'جاري التحويل للبنك...' : 'ابدأ تشغيل عيادتك الرقمية'}
                    </button>
                </div>

            </div>

            {/* Trust Footer */}
            <div className="mt-16 text-center text-sm text-gray-500 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> مدفوعات آمنة عبر Stripe</div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-2">إلغاء الاشتراك في أي وقت</div>
            </div>
        </div>
    );
}

// Temporary Lock icon component until full lucide import is fixed for it
function Lock(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
}
