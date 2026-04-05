"use client";

const TRUST_ITEMS = [
  {
    icon: "🔒",
    title: "بياناتك أمان",
    body: "مش بنخزن كارت الائتمان ولا بنشارك بياناتك. التحويل اليدوي يعني إنت بتتعامل معنا مباشرة."
  },
  {
    icon: "⚡",
    title: "تفعيل سريع",
    body: "لما نستلم الإثبات، التفعيل بيتم خلال ساعات في التغطية. مش أيام."
  },
  {
    icon: "🤝",
    title: "دعم حقيقي",
    body: "مش بوت ولا ردود آلية. في حاجة؟ بتكلم الفريق مباشرة على واتساب."
  }
] as const;

export function ActivationTrustSection() {
  return (
    <section className="rounded-[36px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-slate-500">لماذا رحلة دواير؟</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-center">
            <p className="text-3xl">{item.icon}</p>
            <p className="mt-3 text-sm font-black text-white">{item.title}</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
