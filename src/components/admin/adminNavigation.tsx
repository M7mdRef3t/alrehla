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
    title: "القيادة السيادية",
    items: [
      { id: "sovereign", label: "المركز السيادي", icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> },
      { id: "exec-overview", label: "المركز التنفيذي", icon: <Activity className="h-4 w-4 text-emerald-400" /> },
      { id: "governance-ledger", label: "سجل الحوكمة", icon: <Gavel className="h-4 w-4 text-purple-400" /> },
      { id: "war-room", label: "غرفة العمليات", icon: <ShieldCheck className="h-4 w-4 text-red-500" /> },
    ],
  },
  {
    title: "بنية الرحلة ومساراتها",
    items: [
      { id: "entity", label: "كيان الرحلة (DNA)", icon: <Brain className="h-4 w-4 text-teal-400" /> },
      { id: "design-lab", label: "مختبر التصميم", icon: <Palette className="h-4 w-4 text-pink-400" /> },
      { id: "session-os", label: "غرفة الجلسات", icon: <MessageSquare className="h-4 w-4 text-teal-300" /> },
      { id: "flow-map", label: "الخرائط والمسارات", icon: <MapPin className="h-4 w-4 text-cyan-300" /> },
      { id: "content", label: "مخزن المحتوى", icon: <Database className="h-4 w-4 text-amber-300" /> },
      { id: "ops-docs", label: "مكتبة التشغيل", icon: <LibraryBig className="h-4 w-4 text-slate-300" /> },
    ],
  },
  {
    title: "الذكاء والوعي",
    items: [
      { id: "consciousness-atlas", label: "رادار الإدراك", icon: <Workflow className="h-4 w-4 text-teal-400" /> },
      { id: "ai-studio", label: "مختبر الذكاء (AI Lab)", icon: <Brain className="h-4 w-4 text-purple-400" /> },
      { id: "consciousness", label: "أرشيف الوعي", icon: <History className="h-4 w-4 text-slate-400" /> },
      { id: "dreams-matrix", label: "مصفوفة الأحلام", icon: <Target className="h-4 w-4 text-teal-400" /> },
    ],
  },
  {
    title: "مجتمع المسافرين",
    items: [
      { id: "users-state", label: "التوائم الرقمية (الأعضاء)", icon: <Users className="h-4 w-4 text-indigo-400" /> },
      { id: "support-tickets", label: "بوابات العبور (الدعم)", icon: <MessageSquare className="h-4 w-4 text-rose-400" /> },
      { id: "feedback-survey", label: "أصوات المسافرين", icon: <MessageSquare className="h-4 w-4 text-teal-400" /> },
      { id: "dawayir-live", label: "دواير لايف", icon: <Sparkles className="h-4 w-4 text-teal-300" /> },
    ],
  },
  {
    title: "محركات التوسع",
    items: [
      { id: "growth-revenue", label: "ديناميكية التوسع المالي", icon: <TrendingUpFallback /> },
      { id: "marketing-ops", label: "رحلة الانتشار", icon: <Rocket className="h-4 w-4 text-rose-400" /> },
      { id: "sovereign-funnel", label: "مسار التحويل (Funnel)", icon: <Filter className="h-4 w-4 text-emerald-400" /> },
      { id: "seo-geo", label: "رادار الوصول العالمي", icon: <Target className="h-4 w-4 text-emerald-400" /> },
      { id: "expansion-hub", label: "إستراتيجية الأسواق", icon: <Rocket className="h-4 w-4 text-amber-400" /> },
    ],
  },
  {
    title: "حيوية النظام",
    items: [
      { id: "health-monitor", label: "مراقب النبض", icon: <Activity className="h-4 w-4 text-cyan-400" /> },
      { id: "security-ops", label: "درع النظام", icon: <ShieldCheck className="h-4 w-4 text-indigo-400" /> },
      { id: "feature-flags", label: "مفاتيح المسار", icon: <Flag className="h-4 w-4 text-amber-500" /> },
      { id: "fleet", label: "أسطول الخوادم", icon: <Rocket className="h-4 w-4 text-indigo-500" /> },
      { id: "repo-intel", label: "جينات المستودع (Repo)", icon: <Terminal className="h-4 w-4 text-teal-300" /> },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const CLEAN_NAV_LABELS: Record<AdminTab, string> = {
  sovereign: "المركز السيادي",
  entity: "كيان الرحلة (DNA)",
  "governance-ledger": "سجل الحوكمة",
  "design-lab": "مختبر التصميم",
  "exec-overview": "المركز التنفيذي",
  "growth-revenue": "ديناميكية التوسع المالي",
  "security-ops": "درع النظام",
  "consciousness-atlas": "رادار الإدراك",
  "war-room": "غرفة العمليات",
  "flow-map": "الخرائط والمسارات",
  "ops-docs": "مكتبة التشغيل",
  "feedback-survey": "أصوات المسافرين",
  "feature-flags": "مفاتيح المسار",
  "ai-studio": "مختبر الذكاء (AI Lab)",
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
  "sovereign-funnel": "مسار التحويل السيادي (Funnel)",
};

export const DEVELOPER_PLUS_TABS: AdminTab[] = ["feature-flags", "ai-studio", "users-state"];

export const NAV_TOOLTIPS: Record<AdminTab, string> = {
  sovereign: "المركز السيادي: نظرة شاملة وعليا على حيوية النظام والعمليات الحساسة.",
  entity: "كيان الرحلة: استكشاف بصمة المنصة ورسالتها وأهدافها الأساسية.",
  "governance-ledger": "سجل الحوكمة: متابعة قرارات الذكاء الاصطناعي والمصادقة على التحركات الاستراتيجية.",
  "design-lab": "مختبر التصميم: مساحة لإدارة الهوية البصرية واتجاهات التصميم وتجارب الواجهات.",
  "exec-overview": "المركز التنفيذي: نبض المنصة ومتابعة سريعة لأهم أرقام تفاعل المستخدمين.",
  "growth-revenue": "ديناميكية التوسع: الإيرادات، التسويق، والتحويلات التجارية.",
  "security-ops": "درع النظام: الأمن، الحماية، ومراقبة الإشارات الحساسة.",
  "consciousness-atlas": "رادار الإدراك: خريطة شاملة لمسارات وعي المستخدمين وحالتهم النفسية.",
  "war-room": "غرفة العمليات: الإنذارات الحرجة والمشاكل التي تحتاج تدخلًا سريعًا.",
  "flow-map": "الخرائط والمسارات: رؤية بصرية لمسار المستخدم والأنظمة المتصلة به.",
  "ops-docs": "مكتبة التشغيل: مرجع عملي للوثائق التشغيلية والخرائط والمصفوفات.",
  "feedback-survey": "أصوات المسافرين: دمج لرسائل الزوار والاستبيانات وردود الفعل.",
  "feature-flags": "مفاتيح المسار: التحكم اللحظي في تشغيل وإيقاف الميزات.",
  "ai-studio": "مختبر الذكاء: ضبط البرومبتات، محاكاة القرارات، ومراجعة أداء الذكاء.",
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
  "sovereign-funnel": "مسار التحويل السيادي: تحليل السقوط والنجاح داخل Funnel المنصة.",
};
