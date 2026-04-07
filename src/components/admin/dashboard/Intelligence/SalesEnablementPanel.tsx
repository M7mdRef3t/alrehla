import type { FC } from "react";
import { Briefcase, CheckCircle2, Target } from "lucide-react";
import { salesEnablementAssets } from "@/data/marketingContent";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

export const SalesEnablementPanel: FC = () => {
  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-amber-300" />
          <h2 className="text-xl font-black text-white">Sales Enablement</h2>
          <AdminTooltip content="ملفات وأدوات لتمكين فرق المبيعات أو المسوقين (B2B/B2C) من فهم قيمة المنصة والرد على الاعتراضات." position="left" />
        </div>
        <p className="text-sm text-slate-300">{salesEnablementAssets.oneLiner}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h3 className="mb-2 text-sm font-black text-rose-300">المشكلة</h3>
          <p className="text-sm text-slate-300">{salesEnablementAssets.problem}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h3 className="mb-2 text-sm font-black text-emerald-300">الحل</h3>
          <p className="text-sm text-slate-300">{salesEnablementAssets.solution}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-teal-300" />
          <h3 className="text-sm font-black text-white">الفئات المستهدفة</h3>
          <AdminTooltip content="من يستفيد من المنصة أكثر؟ (تحديد الدوافع لتخصيص الرسالة الإعلانية)." position="top" />
        </div>
        <div className="space-y-2">
          {salesEnablementAssets.audience.map((item) => (
            <p key={item} className="text-sm text-slate-300">
              - {item}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-indigo-300" />
          <h3 className="text-sm font-black text-white">Pitch Talking Points</h3>
          <AdminTooltip content="نقاط إقناع قوية أثناء المحادثات مع العملاء لتسريع قرار الشراء أو حجز الجلسة." position="top" />
        </div>
        <div className="space-y-2">
          {salesEnablementAssets.talkingPoints.map((point) => (
            <p key={point} className="text-sm text-slate-300">
              - {point}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
};
