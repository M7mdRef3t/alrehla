"use client";

import { ArrowLeft, BarChart3, Brain, Shield, Users, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "إدارة عملاءك من مكان واحد",
    desc: "تابع خرائط العلاقات والحدود لكل عميل في لوحة تحكم موحدة.",
  },
  {
    icon: Brain,
    title: "AI Triage — أولويات ذكية",
    desc: "الذكاء الاصطناعي يرتب عملاءك حسب من يحتاج تدخل فوري.",
  },
  {
    icon: BarChart3,
    title: "Trajectory Tracking",
    desc: "شوف تطور كل عميل بصرياً — مسار التحسن أو التراجع واضح.",
  },
  {
    icon: Zap,
    title: "تنبيهات استباقية",
    desc: "إشعار فوري عند حدوث تغيير أو أزمة في خريطة أي عميل.",
  },
  {
    icon: Shield,
    title: "خصوصية كاملة",
    desc: "كل عميل يتحكم في بياناته. أنت تشوف فقط ما شاركه معك.",
  },
];

const PRICING = {
  title: "Coach License",
  price: "$49",
  period: "/شهرياً",
  features: [
    "حتى 25 عميل نشط",
    "AI Triage + تنبيهات",
    "لوحة تحكم متقدمة",
    "أولوية في الدعم الفني",
    "تصدير تقارير PDF",
  ],
};

export default function CoachLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.15) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(45,212,191,0.1) 0%, transparent 60%), linear-gradient(180deg, #0f172a 0%, #020617 100%)",
          }}
        />

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-5 py-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-sm font-bold text-indigo-200 tracking-wide">
              للمعالجين والكوتشز
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-black leading-tight md:text-6xl">
            <span className="block text-slate-100">أدر عملاءك</span>
            <span className="text-teal-300">بدقة تحليلية غير مسبوقة</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
            دواير تعطيك رؤية شاملة لحالة كل عميل — خريطة العلاقات، الحدود، مسار
            التطور — في لوحة تحكم واحدة مدعومة بالذكاء الاصطناعي.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/201023050092?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%D8%8C%20%D8%B9%D9%86%D8%AF%D9%8A%20%D8%B3%D8%A4%D8%A7%D9%84%20%D8%B9%D9%86%20Coach%20License"
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-l from-indigo-500 to-teal-500 px-8 py-4 text-lg font-black text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/30"
            >
              تواصل بخصوص المسار المتقدم
              <ArrowLeft className="h-5 w-5" />
            </a>
            <a
              href="/coach"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              شوف لوحة التحكم
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-black md:text-3xl">
            كل ما تحتاجه لإدارة عملاءك
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-indigo-400/20 hover:bg-indigo-500/[0.04]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-black text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-lg">
          <div className="rounded-3xl border border-indigo-400/20 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-8 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-300">
              {PRICING.title}
            </p>
            <div className="mb-6">
              <span className="text-5xl font-black text-white">
                {PRICING.price}
              </span>
              <span className="text-lg text-slate-400">{PRICING.period}</span>
            </div>

            <ul className="mb-8 space-y-3 text-right">
              {PRICING.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="https://wa.me/201023050092?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20Coach%20License"
              className="block w-full rounded-2xl bg-indigo-500 py-4 text-center text-base font-black text-white transition hover:bg-indigo-400"
            >
              اسأل عن المسار المتقدم الآن
            </a>

            <p className="mt-4 text-xs text-slate-500">
              الدفع اليدوي متاح — InstaPay, Vodafone Cash, Etisalat Cash,
              تحويل بنكي, PayPal
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/8 bg-white/[0.02] p-8 text-center">
          <h2 className="mb-3 text-xl font-black">
            عندك أسئلة؟
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            تواصل معنا مباشرة وسنشرح لك كيف دواير ممكن يساعد عيادتك أو
            ممارستك.
          </p>
          <a
            href="https://wa.me/201023050092?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%86%D8%A7%20%D9%83%D9%88%D8%AA%D8%B4%20%D9%88%D8%AD%D8%A7%D8%A8%D8%A8%20%D8%A3%D8%B9%D8%B1%D9%81%20%D8%A3%D9%83%D8%AA%D8%B1%20%D8%B9%D9%86%20Coach%20License"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-teal-400/30 bg-teal-500/10 px-6 py-3 text-sm font-bold text-teal-200 transition hover:bg-teal-500/20"
          >
            تواصل عبر واتساب
          </a>
        </div>
      </section>
    </main>
  );
}
