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
  Workflow,
  Terminal,
  Target,
  Flame,
  Rocket,
  Briefcase,
  BarChart3,
  ClipboardList,
  TrendingUp,
  MapPin,
  User,
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
  | "feedback-survey" // Merged
  | "feature-flags"
  | "ai-studio"
  | "ai-decisions"
  | "health-monitor"
  | "content"
  | "users-state" // Merged
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
  | "marketing-ops";

export type NavGroup = {
  title: string;
  items: Array<{ id: AdminTab; label: string; icon: React.ReactNode }>;
};

// Extracted and Pruned NAV GROUPS
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "القيادة الإستراتيجية",
    items: [
      { id: "sovereign", label: "مركز السيادة الإدراكية", icon: <ShieldCheck className="w-4 h-4 text-amber-500" /> },
      { id: "entity", label: "كيان الرحلة (DNA)", icon: <Brain className="w-4 h-4 text-teal-400" /> },
      { id: "exec-overview", label: "المركز التنفيذي", icon: <Activity className="w-4 h-4 text-emerald-400" /> },
      { id: "growth-revenue", label: "محرك النمو والمبيعات", icon: <TrendingUp className="w-4 h-4 text-amber-400" /> },
      { id: "war-room", label: "غرفة العمليات", icon: <ShieldCheck className="w-4 h-4 text-red-500" /> },
    ]
  },
  {
    title: "أمن النظام وإدارته",
    items: [
      { id: "security-ops", label: "أمن النظام", icon: <ShieldCheck className="w-4 h-4 text-indigo-400" /> },
      { id: "flow-dynamics", label: "ديناميكية المسار", icon: <Compass className="w-4 h-4 text-cyan-400" /> },
      { id: "health-monitor", label: "مراقب النبض", icon: <Activity className="w-4 h-4 text-cyan-400" /> },
      { id: "feature-flags", label: "مفاتيح النظام", icon: <Flag className="w-4 h-4" /> },
      { id: "fleet", label: "الأسطول", icon: <Rocket className="w-4 h-4 text-indigo-500" /> },
    ]
  },
  {
    title: "الذكاء الاصطناعي والوعي",
    items: [
      { id: "consciousness-atlas", label: "رادار الوعي", icon: <Workflow className="w-4 h-4 text-teal-400" /> },
      { id: "consciousness-map", label: "خريطة الإدراك", icon: <Workflow className="w-4 h-4" /> },
      { id: "ai-studio", label: "مختبر الذكاء", icon: <Brain className="w-4 h-4" /> },
      { id: "ai-decisions", label: "قرارات الوعي", icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
      { id: "ai-simulator", label: "محاكي الذكاء", icon: <Terminal className="w-4 h-4 text-rose-400" /> },
      { id: "consciousness", label: "أرشيف الوعي", icon: <History className="w-4 h-4" /> },
    ]
  },
  {
    title: "المحتوى والمسارات",
    items: [
      { id: "flow-map", label: "خريطة الدواير", icon: <MapPin className="w-4 h-4" /> },
      { id: "map-registry", label: "دليل الخرائط", icon: <Compass className="w-4 h-4 text-emerald-400" /> },
      { id: "content", label: "مخزن المحتوى", icon: <Database className="w-4 h-4" /> },
      { id: "dreams-matrix", label: "مصفوفة الأهداف", icon: <Target className="w-4 h-4 text-teal-400" /> },
      { id: "crucible", label: "المختبر", icon: <Flame className="w-4 h-4 text-rose-500" /> },
    ]
  },
  {
    title: "مجتمع المسافرين",
    items: [
      { id: "users-state", label: "سجلات وبيانات الأعضاء", icon: <Users className="w-4 h-4" /> }, // Merged
      { id: "digital-twin", label: "التوأم الرقمي", icon: <User className="w-4 h-4 text-indigo-400" /> },
      { id: "feedback-survey", label: "أصوات ونتائج الأعضاء", icon: <MessageSquare className="w-4 h-4 text-teal-400" /> }, // Merged
      { id: "dawayir-live", label: "دواير لايف", icon: <Sparkles className="w-4 h-4 text-teal-300" /> },
    ]
  },
  {
    title: "التوسع التجاري",
    items: [
      { id: "b2b-analytics", label: "تحليلات B2B", icon: <ShieldCheck className="w-4 h-4" /> },
      { id: "sales-enablement", label: "تمكين النمو", icon: <Briefcase className="w-4 h-4 text-emerald-400" /> },
      { id: "marketing-ops", label: "إدارة الانتشار", icon: <Rocket className="w-4 h-4 text-rose-400" /> },
      { id: "ai-marketing", label: "تسويق الوعي", icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
      { id: "ad-analytics", label: "تحليلات الإعلانات", icon: <BarChart3 className="w-4 h-4 text-cyan-400" /> },
      { id: "seo-geo", label: "SEO / GEO", icon: <Target className="w-4 h-4 text-emerald-400" /> },
      { id: "repo-intel", label: "ذكاء المستودع", icon: <Terminal className="w-4 h-4 text-teal-300" /> },
    ]
  }
];

export const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export const CLEAN_NAV_LABELS: Record<AdminTab, string> = {
  entity: "كيان الرحلة (DNA)",
  "exec-overview": "المركز التنفيذي",
  "growth-revenue": "محرك النمو والمبيعات",
  "security-ops": "أمن النظام",
  "consciousness-atlas": "رادار الوعي",
  "flow-dynamics": "ديناميكية المسار",
  "war-room": "غرفة العمليات",
  "flow-map": "خريطة التدفق",
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
  "marketing-ops": "إدارة الانتشار",
  sovereign: "مركز السيادة الإدراكية"
};

export const DEVELOPER_PLUS_TABS: AdminTab[] = ["feature-flags", "ai-studio", "users-state"];

export const NAV_TOOLTIPS: Record<AdminTab, string> = {
  sovereign: "المركز السيادي: نظرة شاملة وعلوية على حيوية النظام والعمليات الحساسة.",
  entity: "كيان الرحلة: استكشاف بصمة وأهداف المنصة والرسالة الأساسية.",
  "exec-overview": "المركز التنفيذي: نبض المنصة ومتابعة سريعة لأهم أرقام تفاعل المستخدمين.",
  "growth-revenue": "محرك النمو: دورة المبيعات، الارتقاء بالعملاء، وتتبع العوائد المالية.",
  "security-ops": "أمن النظام: حائط الصد، تتبع الهجمات، وتأمين البيانات ضد السلبيات.",
  "consciousness-atlas": "رادار الوعي: خريطة شاملة لمسارات وعي المستخدمين وتوزيعهم النفسي.",
  "flow-dynamics": "ديناميكية المسار: تتبع تدفق الزيارات والاحتكاك في خطوات التسجيل والدفع.",
  "war-room": "غرفة العمليات: الإنذارات الحرجة والمشاكل التي تتطلب تدخلاً طارئاً.",
  "flow-map": "خريطة التدفق: الرؤية البصرية لشجرة المنصة ومسارات الذكاء الاصطناعي بالكامل.",
  "map-registry": "دليل الخرائط: شاشة تعرض المعمارية التقنية والتخطيطية لجميع الخرائط داخل المنصة بمساراتها الكلية.",
  "feedback-survey": "أصوات ونتائج الأعضاء: دمج لرسائل الزوار والاستبيانات المتقدمة.",
  "feature-flags": "مفاتيح النظام: التحكم اللحظي في تفعيل وإغلاق ميزات المنصة (Feature Flags).",
  "ai-studio": "مختبر الذكاء: تلقين وتوجيه عقل الذكاء الاصطناعي وتعديل الـ Prompts.",
  "ai-decisions": "قرارات الوعي: مراقبة وتحليل القرارات الخوارزمية مع المستخدمين.",
  "health-monitor": "مراقب النبض: متابعة أداء السيرفرات وسرعة استجابة المنصة فنياً.",
  content: "مخزن المحتوى: إدارة نصوص ومحتوى التطبيق التوضيحي بشكل مركزي.",
  "users-state": "سجلات الأعضاء: بيانات، تواريخ دخول، وحالة المتغيرات المباشرة.",
  consciousness: "أرشيف الوعي: سجل تاريخي لكل محادثات الذكاء الاصطناعي والمواقف.",
  "consciousness-map": "خريطة الإدراك: الرؤية الهندسية لترابط المفاهيم المتقدمة داخل النظام.",
  "b2b-analytics": "تحليلات B2B: تحليل أداء الشركات والمؤسسات المشتركة كباقات.",
  "ai-simulator": "محاكي الذكاء: اختبار الـ Prompts في بيئة معزولة لتجربة ردود الأفعال المستندة.",
  "ai-marketing": "تسويق الوعي: صناعة محتوى تسويقي وإعلانات بضغطة زر باستخدام الذكاء التوليدي.",
  "sales-enablement": "تمكين النمو: أدوات ومقترحات استخراج مبيعات من قواعد البيانات الحالية.",
  "dreams-matrix": "مصفوفة الأهداف: بنك الأحلام والطموحات التي يسعى المستخدمون للوصول إليها.",
  crucible: "المختبر: بيئة تجارب (A/B Testing) وابتكار للمحتوى الجديد والتقييم الداخلي.",
  "digital-twin": "التوأم الرقمي: خلق ونسخ رقمية تحليلية من المستخدم وتوقع خطواته القادمة.",
  fleet: "الأسطول: إدارة حاويات السيرفرات والبنية التحتية البرمجية.",
  "seo-geo": "الوصول العالمي: تتبع الحضور العضوي في محركات البحث والمناطق الجغرافية.",
  "repo-intel": "ذكاء المستودع: نظرة مكشوفة لكود المنصة والتغيرات البرمجية من داخل اللوحة مباشرة.",
  "dawayir-live": "دواير لايف: مراقبة النشاط المباشر والتفاعل اللحظي واللقاءات الحية للزوار.",
  "ad-analytics": "تحليلات الإعلانات: حساب العائد من الإنفاق المباشر ونسب التحويل المؤكدة.",
  "marketing-ops": "إدارة الانتشار: حملات البريد الإلكتروني، إدارة الإشعارات، والرسائل الترويجية."
};
