import React from "react";
import {
  Activity,
  Flag,
  Brain,
  Database,
  Users,
  History,
  Zap,
  Zap as Sparkles,
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
  Trophy,
  Mail,
  Globe,
  Cpu,
} from "lucide-react";

export type AdminTab =
  | "command"
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
  | "success-stories"
  | "command-funnel"
  | "people-hub"
  | "growth-hub"
  | "markaz"
  | "concepts-debate"
  | "mohamed-refaat";

export type NavGroup = {
  title: string;
  items: Array<{ id: AdminTab; label: string; icon: React.ReactNode }>;
};

function TrendingUpFallback() {
  return <Activity className="h-4 w-4 text-amber-400" />;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "مركز القيادة (Alpha)",
    items: [
      { id: "mohamed-refaat", label: "مساحة محمد رفعت", icon: <ShieldCheck className="h-4 w-4 text-teal-400" /> },
      { id: "command", label: "غرفة القيادة", icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> },
      { id: "exec-overview", label: "نبض الإبداع والمنظومة", icon: <Sparkles className="h-4 w-4 text-rose-400" /> },
      { id: "markaz", label: "برج حورس (نداء الحق)", icon: <Target className="h-4 w-4 text-emerald-400" /> },
      { id: "flow-map", label: "خريطة التدفق الحي", icon: <Workflow className="h-4 w-4 text-sky-400" /> },
      { id: "dawayir-live", label: "دوائر لايف (Live)", icon: <Zap className="h-4 w-4 text-amber-400" /> },
    ],
  },
  {
    title: "محرك التوسع والنمو",
    items: [
      { id: "growth-hub", label: "رادار التوسع والنمو", icon: <Rocket className="h-4 w-4 text-rose-500" /> },
    ],
  },
  {
    title: "خريطة الإدراك (Nexus)",
    items: [
      { id: "consciousness-atlas", label: "أطلس الوعي والتوائم", icon: <Activity className="h-4 w-4 text-teal-400" /> },
      { id: "people-hub", label: "مركز المسافرين والوعي", icon: <Users className="h-4 w-4 text-rose-400" /> },
    ],
  },
  {
    title: "مختبر الذكاء والجينات",
    items: [
      { id: "ai-studio", label: "عقل المنصة (AI Lab)", icon: <Brain className="h-4 w-4 text-purple-400" /> },
      { id: "concepts-debate", label: "مختبر المفاهيم", icon: <Brain className="h-4 w-4 text-indigo-400" /> },
    ],
  },
  {
    title: "المحتوى والتشغيل",
    items: [
      { id: "content", label: "مخزن المحتوى", icon: <LibraryBig className="h-4 w-4 text-sky-400" /> },
      { id: "ops-docs", label: "مكتبة التشغيل", icon: <Filter className="h-4 w-4 text-slate-400" /> },
    ],
  },
  {
    title: "بنية القيادة",
    items: [
      { id: "entity", label: "كيان الرحلة (DNA)", icon: <MapPin className="h-4 w-4 text-rose-400" /> },
      { id: "design-lab", label: "مختبر التصميم", icon: <Palette className="h-4 w-4 text-violet-400" /> },
      { id: "governance-ledger", label: "سجل الحوكمة", icon: <Gavel className="h-4 w-4 text-amber-400" /> },
      { id: "feature-flags", label: "مفاتيح المسار", icon: <Flag className="h-4 w-4 text-teal-400" /> },
    ],
  },
  {
    title: "غرفة العمليات والدعم",
    items: [
      { id: "war-room", label: "الدرع وإدارة الأزمات", icon: <Target className="h-4 w-4 text-red-500" /> },
      { id: "support-tickets", label: "بوابات العبور (الدعم)", icon: <Mail className="h-4 w-4 text-sky-400" /> },
    ],
  },
  {
    title: "المحركات التحتية (Core)",
    items: [
      { id: "health-monitor", label: "رصد صحة المنظومة", icon: <Activity className="h-4 w-4 text-emerald-400" /> },
      { id: "seo-geo", label: "رادار الانتشار (SEO/Geo)", icon: <Globe className="h-4 w-4 text-rose-400" /> },
      { id: "session-os", label: "نظام التشغيل (Session OS)", icon: <Cpu className="h-4 w-4 text-slate-400" /> },
    ],
  },
];


export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const CLEAN_NAV_LABELS: Record<AdminTab, string> = {
  command: "غرفة القيادة",
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
  "success-stories": "سجل حكايات الانتصار",
  "command-funnel": "مسار التحويل المتقدم (Funnel)",
  "growth-hub": "رادار التوسع والنمو",
  "people-hub": "مركز المسافرين والوعي",
  "markaz": "برج حورس (المركز التنفيذي)",
  "concepts-debate": "مختبر المفاهيم",
  "mohamed-refaat": "مساحة محمد رفعت",
};

export const DEVELOPER_PLUS_TABS: AdminTab[] = ["ai-studio"];

export const NAV_TOOLTIPS: Record<AdminTab, string> = {
  command: "المركز الرئيسي: القصة الكاملة، السرد الاستباقي، ونبض النظام العاطفي.",
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
  "success-stories": "سجل حكايات الانتصار: إدارة القصص الملهمة والدليل الاجتماعي للمنصة.",
  "command-funnel": "مسار التحويل المتقدم: تحليل السقوط والنجاح داخل Funnel المنصة.",
  "growth-hub": "محرك التوسع: رادار شامل للنمو، الإيرادات، قصص النجاح، وحملات الانتشار.",
  "people-hub": "مركز المسافرين: إدارة شاملة للمسافرين، نبض الوعي، وأرشيف الإدراك الجماعي.",
  "markaz": "برج حورس: غرفة العمليات التنفيذية لنداء الحق والتدخلات المباشرة مع المسافرين.",
  "concepts-debate": "مختبر المفاهيم: مساحة مخصصة للنقاش المعرفي والعلمي حول مفاهيم المنصة واختبارها عبر البيانات.",
  "mohamed-refaat": "مساحة محمد رفعت: مساحة التفكير، الأهداف، والإدارة الشاملة بناءً على المبادئ الأولى.",
};
