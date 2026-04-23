import React from "react";
import {
  Activity,
  Flag,
  Brain,
  Database,
  Users,
  History,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Palette,
  Workflow,
  Terminal,
  Target,
  Rocket,
  MapPin,
  Gavel,
  LibraryBig,
  Filter,
} from "lucide-react";

export type AdminTab =
  | "sovereign"
  | "entity"
  | "exec-overview"
  | "growth-revenue"
  | "security-ops"
  | "consciousness-atlas"
  | "flow-map"
  | "feedback-survey"
  | "feature-flags"
  | "ai-studio"
  | "health-monitor"
  | "content"
  | "users-state"
  | "consciousness"
  | "dreams-matrix"
  | "fleet"
  | "seo-geo"
  | "repo-intel"
  | "war-room"
  | "dawayir-live"
  | "expansion-hub"
  | "marketing-ops"
  | "design-lab"
  | "governance-ledger"
  | "ops-docs"
  | "session-os"
  | "support-tickets"
  | "sovereign-funnel";

export type NavGroup = {
  title: string;
  items: Array<{ id: AdminTab; label: string; icon: React.ReactNode }>;
};

function TrendingUpFallback() {
  return <Activity className="h-4 w-4 text-amber-400" />;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "المركز السيادي (Alpha)",
    items: [
      { id: "sovereign", label: "القيادة والنبض الاستباقي", icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> },
    ],
  },
  {
    title: "محرك التوسع والنمو",
    items: [
      { id: "growth-revenue", label: "التوسع المالي والانتشار", icon: <TrendingUpFallback /> },
    ],
  },
  {
    title: "خريطة الإدراك (Nexus)",
    items: [
      { id: "consciousness-atlas", label: "نبض المسافرين والتوائم", icon: <Workflow className="h-4 w-4 text-teal-400" /> },
    ],
  },
  {
    title: "مختبر الذكاء والجينات",
    items: [
      { id: "ai-studio", label: "عقل المنصة (AI Lab)", icon: <Brain className="h-4 w-4 text-purple-400" /> },
    ],
  },
  {
    title: "غرفة العمليات والدعم",
    items: [
      { id: "war-room", label: "الدرع وإدارة الأزمات", icon: <Target className="h-4 w-4 text-red-500" /> },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const CLEAN_NAV_LABELS: Record<AdminTab, string> = {
  sovereign: "القيادة والنبض الاستباقي",
  entity: "كيان الرحلة (DNA)",
  "governance-ledger": "سجل الحوكمة",
  "design-lab": "مختبر التصميم",
  "exec-overview": "المركز التنفيذي",
  "growth-revenue": "التوسع المالي والانتشار",
  "security-ops": "درع النظام",
  "consciousness-atlas": "نبض المسافرين والتوائم",
  "war-room": "الدرع وإدارة الأزمات",
  "flow-map": "الخرائط والمسارات",
  "ops-docs": "مكتبة التشغيل",
  "feedback-survey": "أصوات المسافرين",
  "feature-flags": "مفاتيح المسار",
  "ai-studio": "عقل المنصة (AI Lab)",
  "health-monitor": "مراقب النبض",
  content: "مخزن المحتوى",
  "users-state": "التوائم الرقمية (الأعضاء)",
  consciousness: "أرشيف الوعي",
  "dreams-matrix": "مصفوفة الأحلام",
  fleet: "أسطول الخوادم",
  "seo-geo": "رادار الوصول العالمي",
  "repo-intel": "جينات المستودع (Repo)",
  "dawayir-live": "دواير لايف",
  "marketing-ops": "رحلة الانتشار",
  "expansion-hub": "إستراتيجية الأسواق",
  "session-os": "غرفة الجلسات",
  "support-tickets": "بوابات العبور (الدعم)",
  "sovereign-funnel": "مسار التحويل المتقدم (Funnel)",
};

export const DEVELOPER_PLUS_TABS: AdminTab[] = ["ai-studio"];

export const NAV_TOOLTIPS: Record<AdminTab, string> = {
  sovereign: "المركز الرئيسي: القصة الكاملة، السرد الاستباقي، ونبض النظام العاطفي.",
  entity: "كيان الرحلة: استكشاف بصمة المنصة ورسالتها وأهدافها الأساسية.",
  "governance-ledger": "سجل الحوكمة: متابعة قرارات الذكاء الاصطناعي والمصادقة على التحركات الاستراتيجية.",
  "design-lab": "مختبر التصميم: مساحة لإدارة الهوية البصرية واتجاهات التصميم وتجارب الواجهات.",
  "exec-overview": "المركز التنفيذي: نبض المنصة ومتابعة سريعة لأهم أرقام تفاعل المستخدمين.",
  "growth-revenue": "التوسع المالي: كل ما يتعلق بزيادة الانتشار، التحويلات، والحملات المالية في مسار واحد.",
  "security-ops": "درع النظام: الأمن، الحماية، ومراقبة الإشارات الحساسة.",
  "consciousness-atlas": "الخريطة الحقيقية لرحلات المسافرين ومتابعة توائمهم الرقمية.",
  "war-room": "غرفة العمليات: إدارة الأزمات، الدعم الفوري، والإنذارات الأمنية.",
  "flow-map": "الخرائط والمسارات: رؤية بصرية لمسار المستخدم والأنظمة المتصلة به.",
  "ops-docs": "مكتبة التشغيل: مرجع عملي للوثائق التشغيلية والخرائط والمصفوفات.",
  "feedback-survey": "أصوات المسافرين: دمج لرسائل الزوار والاستبيانات وردود الفعل.",
  "feature-flags": "مفاتيح المسار: التحكم اللحظي في تشغيل وإيقاف الميزات.",
  "ai-studio": "مختبر الذكاء: غرفة التحكم في الـ DNA وهندسة البرومبتات والمحتوى المركزي.",
  "health-monitor": "مراقب النبض: متابعة الأداء التقني وصحة البنية.",
  content: "مخزن المحتوى: إدارة النصوص والمحتوى المركزي للمنصة.",
  "users-state": "التوائم الرقمية: متابعة الأعضاء وحالاتهم وبياناتهم الحية.",
  consciousness: "أرشيف الوعي: سجل تاريخي لتفاعلات الذكاء والقرارات.",
  "dreams-matrix": "مصفوفة الأحلام: بنك الأحلام والطموحات والمسارات المرتبطة بها.",
  fleet: "أسطول الخوادم: إدارة البنية التحتية والأنظمة المتصلة.",
  "seo-geo": "رادار الوصول العالمي: تتبع الحضور العضوي جغرافيًا ومحركيًا.",
  "repo-intel": "جينات المستودع: نظرة مباشرة على الكود والتغييرات البرمجية.",
  "dawayir-live": "دواير لايف: متابعة النشاط المباشر والتفاعل اللحظي.",
  "marketing-ops": "رحلة الانتشار: الحملات، البريد، وصناعة المحتوى الإعلاني.",
  "expansion-hub": "إستراتيجية الأسواق: تحليل فرص التوسع التجاري والأسواق المحتملة.",
  "session-os": "غرفة الجلسات: تتبع الجلسات النفسية والكوتشينج من الطلب حتى التوثيق.",
  "support-tickets": "بوابات العبور: مراجعة التحويلات اليدوية وتذاكر الدعم والتفعيل.",
  "sovereign-funnel": "مسار التحويل المتقدم: تحليل السقوط والنجاح داخل Funnel المنصة.",
};
