"use client";

export function ActivationNextStepNotice() {
  return (
    <div className="rounded-[36px] border border-teal-500/20 bg-teal-400/5 p-6 text-center">
      <p className="text-sm font-black uppercase tracking-widest text-teal-300">الخطوة التالية</p>
      <p className="mt-2 text-base font-bold text-white">اختر وسيلة الدفع المناسبة من القائمة أعلاه</p>
      <p className="mt-1 text-sm text-slate-400">
        بعد نسخ بيانات الإيداع أو فتح واتسآب، سيظهر لك نموذج إرسال الإثبات تلقائيًا.
      </p>
    </div>
  );
}
