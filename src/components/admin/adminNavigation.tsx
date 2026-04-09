import React from "react";
import {
  Activity,
  Compass,
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
  Flame,
  Rocket,
  Briefcase,
  BarChart3,
  MapPin,
  User,
  Mail,
  Route,
  Gavel,
} from "lucide-react";

export type AdminTab =
  | "sovereign"
  | "entity"
  | "exec-overview"
  | "growth-revenue"
  | "security-ops"
  | "consciousness-atlas"
  | "flow-dynamics"
  | "flow-map"
  | "map-registry"
  | "feedback-survey"
  | "feature-flags"
  | "ai-studio"
  | "ai-decisions"
  | "health-monitor"
  | "content"
  | "users-state"
  | "consciousness"
  | "consciousness-map"
  | "b2b-analytics"
  | "ai-simulator"
  | "ai-marketing"
  | "sales-enablement"
  | "dreams-matrix"
  | "crucible"
  | "digital-twin"
  | "fleet"
  | "seo-geo"
  | "repo-intel"
  | "war-room"
  | "dawayir-live"
  | "ad-analytics"
  | "expansion-hub"
  | "marketing-ops"
  | "mail-command"
  | "design-lab"
  | "governance-ledger"
  | "journey-paths";

export type NavGroup = {
  title: string;
  items: Array<{ id: AdminTab; label: string; icon: React.ReactNode }>;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "القيادة الإستراتيجية",
    items: [
      { id: "sovereign", label: "مركز السيادة الإدراكية", icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> },
      { id: "entity", label: "كيان الرحلة (DNA)", icon: <Brain className="h-4 w-4 text-teal-400" /> },
      { id: "governance-ledger", label: "سجل الحوكمة", icon: <Gavel className="h-4 w-4 text-purple-400" /> },
      { id: "design-lab", label: "مختبر التصميم الإدراكي", icon: <Palette className="h-4 w-4 text-pink-400" /> },
      { id: "exec-overview", label: "المركز التنفيذي", icon: <Activity className="h-4 w-4 text-emerald-400" /> },
      { id: "growth-revenue", label: "محرك النمو والمبيعات", icon: <TrendingUpFallback /> },
      { id: "war-room", label: "غرفة العمليات", icon: <ShieldCheck className="h-4 w-4 text-red-500" /> },
    ],
  },
  {
    title: "أمن النظام وإدارته",
    items: [
      { id: "security-ops", label: "أمن النظام", icon: <ShieldCheck className="h-4 w-4 text-indigo-400" /> },
      { id: "flow-dynamics", label: "ديناميكية المسار", icon: <Compass className="h-4 w-4 text-cyan-400" /> },
      { id: "health-monitor", label: "مراقب النبض", icon: <Activity className="h-4 w-4 text-cyan-400" /> },
      { id: "feature-flags", label: "مفاتيح النظام", icon: <Flag className="h-4 w-4" /> },
      { id: "fleet", label: "الأسطول", icon: <Rocket className="h-4 w-4 text-indigo-500" /> },
    ],
  },
  {
    title: "الذكاء الاصطناعي والوعي",
    items: [
      { id: "consciousness-atlas", label: "رادار الوعي", icon: <Workflow className="h-4 w-4 text-teal-400" /> },
      { id: "consciousness-map", label: "خريطة الإدراك", icon: <Workflow className="h-4 w-4" /> },
      { id: "ai-studio", label: "مختبر الذكاء", icon: <Brain className="h-4 w-4" /> },
      { id: "ai-decisions", label: "قرارات الوعي", icon: <Sparkles className="h-4 w-4 text-purple-400" /> },
      { id: "ai-simulator", label: "محاكي الذكاء", icon: <Terminal className="h-4 w-4 text-rose-400" /> },
      { id: "consciousness", label: "أرشيف الوعي", icon: <History className="h-4 w-4" /> },
    ],
  },
  {
    title: "المحتوى والمسارات",
    items: [
      { id: "flow-map", label: "خريطة الدواير", icon: <MapPin className="h-4 w-4" /> },
      { id: "journey-paths", label: "مسارات المستخدم", icon: <Route className="h-4 w-4 text-cyan-300" /> },
      { id: "map-registry", label: "دليل الخرائط", icon: <Compass className="h-4 w-4 text-emerald-400" /> },
      { id: "content", label: "مخزن المحتوى", icon: <Database className="h-4 w-4" /> },
      { id: "dreams-matrix", label: "مصفوفة الأهداف", icon: <Target className="h-4 w-4 text-teal-400" /> },
      { id: "crucible", label: "المختبر", icon: <Flame className="h-4 w-4 text-rose-500" /> },
    ],
  },
  {
    title: "مجتمع المسافرين",
    items: [
      { id: "users-state", label: "سجلات وبيانات الأعضاء", icon: <Users className="h-4 w-4" /> },
      { id: "digital-twin", label: "التوأم الرقمي", icon: <User className="h-4 w-4 text-indigo-400" /> },
      { id: "feedback-survey", label: "أصوات ونتائج الأعضاء", icon: <MessageSquare className="h-4 w-4 text-teal-400" /> },
      { id: "dawayir-live", label: "دواير لايف", icon: <Sparkles className="h-4 w-4 text-teal-300" /> },
    ],
  },
  {
    title: "التوسع التجاري",
    items: [
      { id: "expansion-hub", label: "إستراتيجية التوسع", icon: <Rocket className="h-4 w-4 text-rose-400" /> },
      { id: "b2b-analytics", label: "تحليلات B2B", icon: <ShieldCheck className="h-4 w-4 text-indigo-400" /> },
      { id: "sales-enablement", label: "تمكين النمو", icon: <Briefcase className="h-4 w-4 text-emerald-400" /> },
      { id: "marketing-ops", label: "رحلة الانتشار", icon: <Rocket className="h-4 w-4 text-rose-400" /> },
      { id: "mail-command", label: "قيادة البريد", icon: <Mail className="h-4 w-4 text-indigo-400" /> },
      { id: "ai-marketing", label: "تسويق الوعي", icon: <Sparkles className="h-4 w-4 text-amber-400" /> },
      { id: "ad-analytics", label: "تحليلات الإعلانات", icon: <BarChart3 className="h-4 w-4 text-cyan-400" /> },
      { id: "seo-geo", label: "SEO / GEO", icon: <Target className="h-4 w-4 text-emerald-400" /> },
      { id: "repo-intel", label: "ذكاء المستودع", icon: <Terminal className="h-4 w-4 text-teal-300" /> },
    ],
  },
];

function TrendingUpFallback() {
  return <Activity className="h-4 w-4 text-amber-400" />;
}

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const CLEAN_NAV_LABELS: Record<AdminTab, string> = {
  sovereign: "مركز السيادة الإدراكية",
  entity: "كيان الرحلة (DNA)",
  "governance-ledger": "سجل الحوكمة السيادي",
  "design-lab": "مختبر التصميم الإدراكي",
  "exec-overview": "المركز التنفيذي",
  "growth-revenue": "محرك النمو والمبيعات",
  "security-ops": "أمن النظام",
  "consciousness-atlas": "رادار الوعي",
  "flow-dynamics": "ديناميكية المسار",
  "war-room": "غرفة العمليات",
  "flow-map": "خريطة التدفق",
  "journey-paths": "مسارات المستخدم",
  "map-registry": "دليل الخرائط",
  "feedback-survey": "أصوات ونتائج الأعضاء",
  "feature-flags": "مفاتيح النظام",
  "ai-studio": "مختبر الذكاء",
  "ai-decisions": "قرارات الوعي",
  "health-monitor": "مراقب النبض",
  content: "مخزن المحتوى",
  "users-state": "سجلات وبيانات الأعضاء",
  consciousness: "أرشيف الوعي",
  "consciousness-map": "خريطة الإدراك",
  "b2b-analytics": "تحليلات B2B",
  "ai-simulator": "محاكي الذكاء",
  "ai-marketing": "تسويق الوعي",
  "sales-enablement": "تمكين النمو",
  "dreams-matrix": "مصفوفة الأهداف",
  crucible: "المختبر (Testing)",
  "digital-twin": "التوأم الرقمي",
  fleet: "الأسطول",
  "seo-geo": "SEO / GEO",
  "repo-intel": "ذكاء المستودع",
  "dawayir-live": "دواير لايف",
  "ad-analytics": "تحليلات الإعلانات",
  "marketing-ops": "رحلة الانتشار",
  "mail-command": "قيادة البريد",
  "expansion-hub": "إستراتيجية التوسع",
};

export const DEVELOPER_PLUS_TABS: AdminTab[] = ["feature-flags", "ai-studio", "users-state"];

export const NAV_TOOLTIPS: Record<AdminTab, string> = {
  sovereign: "المركز السيادي: نظرة شاملة وعلوية على حيوية النظام والعمليات الحساسة.",
  entity: "كيان الرحلة: استكشاف بصمة وأهداف المنصة والرسالة الأساسية.",
  "governance-ledger": "سجل الحوكمة: مراقبة العقل الاصطناعي والمصادقة على التحركات الاستراتيجية.",
  "design-lab": "مختبر التصميم الإدراكي: مساحة لإدارة الهوية البصرية والاتجاهات التصميمية وتجارب الواجهات.",
  "exec-overview": "المركز التنفيذي: نبض المنصة ومتابعة سريعة لأهم أرقام تفاعل المستخدمين.",
  "growth-revenue": "محرك النمو: دورة المبيعات والارتقاء بالعملاء وتتبع العوائد المالية.",
  "security-ops": "أمن النظام: حائط الصد وتتبع الهجمات وتأمين البيانات ضد السلبيات.",
  "consciousness-atlas": "رادار الوعي: خريطة شاملة لمسارات وعي المستخدمين وتوزيعهم النفسي.",
  "flow-dynamics": "ديناميكية المسار: تتبع تدفق الزيارات والاحتكاك في خطوات التسجيل والدفع.",
  "war-room": "غرفة العمليات: الإنذارات الحرجة والمشاكل التي تتطلب تدخلاً طارئاً.",
  "flow-map": "خريطة التدفق: الرؤية البصرية لشجرة المنصة ومسارات الذكاء الاصطناعي بالكامل.",
  "journey-paths": "مسارات المستخدم: لوحة تحكم لبناء وتعديل وإعادة ترتيب المسارات الكاملة مثل مسار الملاذ خطوة بخطوة.",
  "map-registry": "دليل الخرائط: شاشة تعرض المعمارية التقنية والتخطيطية لجميع الخرائط داخل المنصة بمساراتها الكلية.",
  "feedback-survey": "أصوات ونتائج الأعضاء: دمج لرسائل الزوار والاستبيانات المتقدمة.",
  "feature-flags": "مفاتيح النظام: التحكم اللحظي في تفعيل وإغلاق ميزات المنصة.",
  "ai-studio": "مختبر الذكاء: تلقين وتوجيه عقل الذكاء الاصطناعي وتعديل البرومبتات.",
  "ai-decisions": "قرارات الوعي: مراقبة وتحليل القرارات الخوارزمية مع المستخدمين.",
  "health-monitor": "مراقب النبض: متابعة أداء السيرفرات وسرعة استجابة المنصة فنياً.",
  content: "مخزن المحتوى: إدارة نصوص ومحتوى التطبيق التوضيحي بشكل مركزي.",
  "users-state": "سجلات الأعضاء: بيانات وتواريخ دخول وحالة المتغيرات المباشرة.",
  consciousness: "أرشيف الوعي: سجل تاريخي لكل محادثات الذكاء الاصطناعي والمواقف.",
  "consciousness-map": "خريطة الإدراك: الرؤية الهندسية لترابط المفاهيم المتقدمة داخل النظام.",
  "b2b-analytics": "تحليلات B2B: تحليل أداء الشركات والمؤسسات المشتركة كباقات.",
  "ai-simulator": "محاكي الذكاء: اختبار البرومبتات في بيئة معزولة لتجربة ردود الأفعال.",
  "ai-marketing": "تسويق الوعي: صناعة محتوى تسويقي وإعلانات باستخدام الذكاء التوليدي.",
  "sales-enablement": "تمكين النمو: أدوات ومقترحات استخراج مبيعات من قواعد البيانات الحالية.",
  "dreams-matrix": "مصفوفة الأهداف: بنك الأحلام والطموحات التي يسعى المستخدمون للوصول إليها.",
  crucible: "المختبر: بيئة تجارب واختبار للمحتوى الجديد والتقييم الداخلي.",
  "digital-twin": "التوأم الرقمي: خلق نسخة رقمية تحليلية من المستخدم وتوقع خطواته القادمة.",
  fleet: "الأسطول: إدارة حاويات السيرفرات والبنية التحتية البرمجية.",
  "seo-geo": "الوصول العالمي: تتبع الحضور العضوي في محركات البحث والمناطق الجغرافية.",
  "repo-intel": "ذكاء المستودع: نظرة مكشوفة لكود المنصة والتغييرات البرمجية من داخل اللوحة مباشرة.",
  "dawayir-live": "دواير لايف: مراقبة النشاط المباشر والتفاعل اللحظي واللقاءات الحية للزوار.",
  "ad-analytics": "تحليلات الإعلانات: حساب العائد من الإنفاق المباشر ونسب التحويل المؤكدة.",
  "marketing-ops": "رحلة الانتشار: حملات البريد الإلكتروني وإدارة الإشعارات والرسائل الترويجية.",
  "mail-command": "قيادة البريد: نظام بريد إلكتروني متكامل للإرسال والقوالب وتتبع الأداء.",
  "expansion-hub": "إستراتيجية التوسع: تحليل القوة الشرائية العالمية مقابل نقاط الألم النفسية لتحديد الأسواق المحتملة.",
};
