"use client";

export function ActivationNextStepNotice() {
  return (
    <div className="rounded-[36px] border border-teal-500/20 bg-teal-400/5 p-6 text-center">
      <p className="text-sm font-black uppercase tracking-widest text-teal-300">الخطوة التالية</p>
      <p className="mt-2 text-base font-bold text-white">اختار طريقة الدفع اللي تناسبك من فوق</p>
      <p className="mt-1 text-sm text-slate-400">
        بعد ما تنسخ البيانات أو تفتح واتساب، هيظهر لك فورم إرسال الإثبات تلقائيًا.
      </p>
    </div>
  );
}
