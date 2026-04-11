"use client";

const TRUST_ITEMS = [
  {
    icon: "🔒",
    title: "بياناتك في أمان تام",
    body: "لا نحتفظ ببيانات بطاقتك. التحويل يدوي ومباشر بيننا وبينك.",
  },
  {
    icon: "⚡",
    title: "تفعيل سريع",
    body: "فور استلام الإثبات، تتم المراجعة خلال ساعات — ليس أياماً.",
  },
  {
    icon: "🤝",
    title: "دعم بشري حقيقي",
    body: "ليس روبوتاً. أي استفسار؟ يصلك رد من الفريق مباشرةً.",
  },
] as const;

export function ActivationTrustSection() {
  return (
    <div className="flex flex-wrap justify-center gap-4 py-2">
      {TRUST_ITEMS.map((item) => (
        <div
          key={item.title}
          className="flex min-w-[200px] flex-1 items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/50 px-5 py-4 backdrop-blur-sm transition-colors hover:border-white/10"
        >
          <span className="text-2xl">{item.icon}</span>
          <div>
            <p className="text-sm font-black text-white">{item.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-400">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
