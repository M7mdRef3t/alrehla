import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileStack,
  Flag,
  Layers3,
  ShieldAlert,
  Sparkles,
  UserCog,
  Workflow,
  LibraryBig,
} from "lucide-react";
import { createCurrentUrl, getSearch, pushUrl, subscribePopstate } from "@/services/navigation";

type DocEntry = {
  id: string;
  title: string;
  badge: string;
  icon: typeof BookOpen;
  purpose: string;
  whenToUse: string[];
  outputs: string[];
  docPath: string;
};

export const OPS_DOCS: DocEntry[] = [
  {
    id: "inventory",
    title: "Platform Inventory",
    badge: "Inventory",
    icon: FileStack,
    purpose: "حصر كامل للـ routes، الـ APIs، الشاشات، المكونات، الـ stores، الـ services، والـ utilities.",
    whenToUse: [
      "عند onboarding لأي شخص جديد على المشروع",
      "قبل إضافة feature كبيرة",
      "عند البحث عن duplication أو مكون موجود مسبقًا",
    ],
    outputs: ["عدّ شامل للبنية", "مرجع سريع للملفات", "نقطة بداية للـ Discovery Pass"],
    docPath: "docs/platform-inventory.md",
  },
  {
    id: "functional-map",
    title: "Platform Functional Map",
    badge: "Architecture",
    icon: Layers3,
    purpose: "خريطة وظيفية للمنصة كمناطق تشغيلية ومسارات مترابطة، وليس مجرد ملفات.",
    whenToUse: [
      "عند فهم مساحة منتج كاملة",
      "عند ربط route جديدة بالمنظومة الحالية",
      "عند التفكير في إعادة هيكلة منطقية",
    ],
    outputs: ["فهم المساحات الأساسية", "ربط flows بالمناطق", "فهم العمود الفقري للمنتج"],
    docPath: "docs/platform-functional-map.md",
  },
  {
    id: "route-matrix",
    title: "Route To Service Matrix",
    badge: "Routing",
    icon: Workflow,
    purpose: "ربط كل route أو surface رئيسية بالمكوّن المضيف، الـ stores، والـ services المحركة.",
    whenToUse: [
      "عند debugging شاشة أو route",
      "قبل تعديل service تؤثر على route محددة",
      "عند تتبع نقطة الكسر بين UI وstate وservice",
    ],
    outputs: ["خريطة route-to-state", "خريطة route-to-service", "تسريع التحقيق في الأعطال"],
    docPath: "docs/route-to-service-matrix.md",
  },
  {
    id: "ownership",
    title: "Screen Ownership Map",
    badge: "Ownership",
    icon: UserCog,
    purpose: "تصنيف الشاشات حسب المالك الوظيفي، الوضع (`user/dev/owner`) والـ surface (`route/app-shell`).",
    whenToUse: [
      "قبل تعديل شاشة للمستخدم النهائي",
      "عند الشك هل الشاشة تخص user أم owner",
      "عند مراجعة فصل البيئات والسطوح",
    ],
    outputs: ["تقليل الخلط بين user/dev/owner", "تحديد surface الصحيحة", "تحديد flow التابعة لها الشاشة"],
    docPath: "docs/screen-ownership-map.md",
  },
  {
    id: "feature-flags",
    title: "Feature Flag Matrix",
    badge: "Flags",
    icon: Flag,
    purpose: "مرجع كامل للـ flags: وضعها الافتراضي، مجموعتها، وهل هي Revenue-First أو Beta.",
    whenToUse: [
      "قبل فتح أو غلق feature",
      "عند التحقيق في سبب ظهور/اختفاء ميزة",
      "قبل أي release للمستخدم النهائي",
    ],
    outputs: ["وضوح الوصول", "تفسير Revenue Mode", "تفسير Beta وGod Mode"],
    docPath: "docs/feature-flag-matrix.md",
  },
  {
    id: "critical-flows",
    title: "Critical Flows Checklist",
    badge: "QA",
    icon: ClipboardCheck,
    purpose: "قوائم تحقق للرحلات الحرجة: sanctuary، weather، dawayir live، maraya، الأدمن، والتنقل.",
    whenToUse: [
      "بعد تعديل في رحلة أساسية",
      "قبل release",
      "عند التحقق السريع من regression",
    ],
    outputs: ["Happy path واضح", "Edge cases معروفة", "Failure signals معروفة"],
    docPath: "docs/critical-flows-checklist.md",
  },
  {
    id: "triage",
    title: "Incident Triage Playbook",
    badge: "Incidents",
    icon: ShieldAlert,
    purpose: "دليل استجابة سريعة للحوادث: كيف نصنف العطل ومن أين نبدأ التحقيق.",
    whenToUse: [
      "عند ظهور bug حرجة",
      "عند route أو journey مكسورة",
      "عند الحاجة لتحديد السبب بسرعة",
    ],
    outputs: ["خطوات أول 5 دقائق", "symptom-based triage", "جداول state/storage-first"],
    docPath: "docs/incident-triage-playbook.md",
  },
  {
    id: "release",
    title: "Release Readiness Checklist",
    badge: "Release",
    icon: Sparkles,
    purpose: "قائمة الجاهزية قبل الإطلاق: build، journeys، flags، admin، navigation، performance.",
    whenToUse: [
      "قبل أي نشر",
      "قبل freeze نسخة مهمة",
      "قبل فتح features جديدة للمستخدم النهائي",
    ],
    outputs: ["Go/No-Go واضح", "حد أدنى للنشر", "Owner verification pass"],
    docPath: "docs/release-readiness-checklist.md",
  },
  {
    id: "post-release",
    title: "Post-Release Verification",
    badge: "Post Release",
    icon: BookOpen,
    purpose: "التحقق بعد النشر للتأكد أن النسخة تعمل فعليًا في أول 10 دقائق وأول ساعة وأول 24 ساعة.",
    whenToUse: [
      "بعد أي release مباشرة",
      "بعد تشغيل feature جديدة للمستخدم",
      "بعد تغييرات تمس routes أو journeys",
    ],
    outputs: ["Immediate pass", "warning signs", "rollback heuristics"],
    docPath: "docs/post-release-verification-checklist.md",
  },
  {
    id: "owner-manual",
    title: "Owner Ops Manual",
    badge: "Ops",
    icon: UserCog,
    purpose: "دليل التشغيل اليومي للأونر: ماذا يراجع، كيف يدير المسارات، وكيف يتعامل مع incidents والـ releases.",
    whenToUse: [
      "كمصدر تشغيل يومي",
      "عند اتخاذ قرار product سريع",
      "عند مراجعة المنصة أسبوعيًا",
    ],
    outputs: ["روتين واضح", "Decision framework", "Operating rules"],
    docPath: "docs/owner-ops-manual.md",
  },
  {
    id: "weekly-review",
    title: "Weekly Owner Review",
    badge: "Weekly",
    icon: ClipboardCheck,
    purpose: "قالب أسبوعي لمراجعة صحة المنصة، المسارات، الانحرافات، وأولويات الأسبوع القادم.",
    whenToUse: [
      "مرة أسبوعيًا",
      "بعد أسبوع مليء بالتعديلات",
      "قبل تحديد أولويات sprint جديدة",
    ],
    outputs: ["Snapshot أسبوعي", "Top 3 priorities", "قرارات لا نفعلها الأسبوع القادم"],
    docPath: "docs/weekly-owner-review-template.md",
  },
];

const getDocIdFromLocation = (): string | null => {
  const params = new URLSearchParams(getSearch());
  const docId = params.get("opsDoc");
  return OPS_DOCS.some((doc) => doc.id === docId) ? docId : null;
};

const getPathSlugFromLocation = (): string | null => {
  const params = new URLSearchParams(getSearch());
  const pathSlug = params.get("opsPath");
  return pathSlug && pathSlug.trim().length > 0 ? pathSlug : null;
};

const PLAYBOOKS = [
  {
    title: "قبل أي تعديل كبير",
    steps: [
      "ابدأ بـ Platform Inventory وFunctional Map.",
      "راجع Screen Ownership Map لتحديد هل التغيير user أم owner أم dev.",
      "افتح Route To Service Matrix لتحديد نقطة الدخول التقنية.",
    ],
  },
  {
    title: "قبل أي Release",
    steps: [
      "راجع Release Readiness Checklist.",
      "نفّذ Critical Flows Checklist على الرحلات الأربع الأساسية.",
      "مر مرورًا سريعًا على Feature Flag Matrix.",
    ],
  },
  {
    title: "بعد أي Release",
    steps: [
      "نفّذ Post-Release Verification فورًا.",
      "راقب الرحلات الأساسية وأي route حرجة.",
      "لو ظهر عطل، انتقل مباشرة إلى Incident Triage Playbook.",
    ],
  },
];

export default function OpsDocsPanel() {
  const [selectedDocId, setSelectedDocId] = useState<string>(getDocIdFromLocation() ?? OPS_DOCS[0]?.id ?? "inventory");
  const [linkedPathSlug, setLinkedPathSlug] = useState<string | null>(getPathSlugFromLocation());

  useEffect(() => {
    const syncFromLocation = () => {
      setSelectedDocId(getDocIdFromLocation() ?? OPS_DOCS[0]?.id ?? "inventory");
      setLinkedPathSlug(getPathSlugFromLocation());
    };

    syncFromLocation();
    return subscribePopstate(syncFromLocation);
  }, []);

  const selectedDoc = useMemo(
    () => OPS_DOCS.find((doc) => doc.id === selectedDocId) ?? OPS_DOCS[0],
    [selectedDocId]
  );

  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId);
    const url = createCurrentUrl();
    if (!url) return;
    url.searchParams.set("tab", "ops-docs");
    url.searchParams.set("opsDoc", docId);
    if (linkedPathSlug) {
      url.searchParams.set("opsPath", linkedPathSlug);
    }
    pushUrl(url);
  };

  const totalDocs = OPS_DOCS.length;
  const journeyFocusedDocs = OPS_DOCS.filter((doc) =>
    ["critical-flows", "route-matrix", "functional-map", "owner-manual"].includes(doc.id)
  ).length;

  return (
    <div className="space-y-8" dir="rtl">
      <section className="rounded-[2rem] border border-cyan-500/20 bg-[#0B1120] px-6 py-7 shadow-[0_30px_100px_rgba(8,145,178,0.12)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
              <LibraryBig className="h-3.5 w-3.5" />
              Ops Knowledge Hub
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">مكتبة التشغيل</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                هذه الشاشة تنقل حزمة التوثيق التشغيلية من ملفات `docs` إلى داخل لوحة التحكم نفسها، بحيث تبقى
                الخرائط، المصفوفات، الـ checklists، وأدلة التشغيل حاضرة أثناء اتخاذ القرار.
              </p>
              {linkedPathSlug && (
                <div className="mt-3 inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-black text-amber-300">
                  مرتبط الآن بالمسار: {linkedPathSlug}
                </div>
              )}
            </div>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">إجمالي المراجع</p>
              <p className="mt-2 text-3xl font-black text-white">{totalDocs}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">مراجع مسارية</p>
              <p className="mt-2 text-3xl font-black text-cyan-300">{journeyFocusedDocs}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-[#07101d] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.35)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">فهرس التشغيل</h3>
              <p className="text-xs text-slate-400">اختر أي مرجع لتعرف متى يُستخدم وما الذي يخرجه.</p>
            </div>
            <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
              Live Reference
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {OPS_DOCS.map((doc) => {
              const Icon = doc.icon;
              const isActive = selectedDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`rounded-2xl border p-4 text-right transition-all ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_18px_40px_rgba(8,145,178,0.14)]"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                          {doc.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">{doc.title}</h4>
                      <p className="text-xs leading-6 text-slate-400">{doc.purpose}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-[#08111f] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.35)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">{selectedDoc.title}</h3>
              <p className="text-xs text-slate-400">الملف المرجعي: <span className="font-mono text-cyan-300">{selectedDoc.docPath}</span></p>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
              {selectedDoc.badge}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">الغرض</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{selectedDoc.purpose}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">متى تستخدمه</p>
              <div className="mt-3 space-y-2">
                {selectedDoc.whenToUse.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">ما الذي يخرجه</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedDoc.outputs.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {PLAYBOOKS.map((playbook) => (
          <div
            key={playbook.title}
            className="rounded-[1.75rem] border border-slate-800 bg-[#08101c] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-white">{playbook.title}</h3>
            </div>
            <div className="space-y-2">
              {playbook.steps.map((step) => (
                <div key={step} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm leading-6 text-slate-200">
                  {step}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
