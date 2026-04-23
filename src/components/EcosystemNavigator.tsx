"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Map,
  Compass,
  CalendarDays,
  Wind,
  ChevronDown,
  Sparkles,
  Eye,
  BookOpen,
  Scale,
  Users,
  Brain,
  FileText,
  AlertTriangle,
  Flame,
  LayoutGrid,
  Bell,
  Gem,
  ScrollText,
  Droplets,
  TrendingUp,
  Mail,
  Moon,
  Handshake,
  Zap,
  Flag,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { RoutingEngine } from "@/services/RoutingEngine";
import { useMapState } from "@/modules/map/store/map.store";
import { useJourneyState } from "@/domains/journey/store/journey.store";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProductStatus = "active" | "locked" | "coming_soon" | "completed";

interface EcosystemProduct {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: ProductStatus;
  url?: string;
  color: string;
}

interface ProductCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  products: EcosystemProduct[];
}

// ─── Product Registry ────────────────────────────────────────────────────────

const ALL_PRODUCTS: EcosystemProduct[] = [
  // Exploration & Understanding
  { id: "alrehla",    name: "الرحلة",    description: "المركز الرئيسي والموزع الذكي",         icon: <Rocket className="w-4 h-4" />,      status: "active",      color: "#14b8a6", url: "/" },
  { id: "dawayir",   name: "دواير",     description: "أداة التشخيص وفهم الخريطة",           icon: <Map className="w-4 h-4" />,          status: "active",      color: "#f5a623", url: "/#dawayir" },
  { id: "ecosystem-hub", name: "مركز المنظومة", description: "لوحة قيادة كل أدوات الرحلة",    icon: <LayoutGrid className="w-4 h-4" />,    status: "active",      color: "#6366f1", url: "/#ecosystem-hub" },
  { id: "bawsala",   name: "بوصلة",     description: "كل قرار صعب — عنده بوصلة",            icon: <Compass className="w-4 h-4" />,      status: "active",      color: "#06b6d4", url: "/#bawsala" },
  { id: "maraya",    name: "مرايا",      description: "سرد تفاعلي يرى نمطك من الداخل",       icon: <Eye className="w-4 h-4" />,          status: "active",      color: "#a78bfa", url: "/#maraya" },
  { id: "observatory",name: "المرصد",   description: "الخريطة السلوكية — اكتشف أنماطك",     icon: <Eye className="w-4 h-4" />,          status: "active",      color: "#818cf8", url: "/#observatory" },
  { id: "kharita",   name: "خريطة",     description: "خريطة المنظومة البصرية",              icon: <Map className="w-4 h-4" />,          status: "active",      color: "#06b6d4", url: "/#kharita" },
  { id: "mirah",     name: "مرآة",      description: "شوف نفسك بعيون البيانات",             icon: <Eye className="w-4 h-4" />,          status: "active",      color: "#c084fc", url: "/#mirah" },
  { id: "baseera",   name: "بصيرة",     description: "لوحة الوعي الذاتي",                   icon: <Sparkles className="w-4 h-4" />,     status: "active",      color: "#06b6d4", url: "/#baseera" },
  { id: "taqrir",    name: "تقرير",     description: "بياناتك في صفحة واحدة",               icon: <FileText className="w-4 h-4" />,     status: "active",      color: "#06b6d4", url: "/#taqrir" },

  // Work & Execution
  { id: "masarat",   name: "مسارات",    description: "أداة التنفيذ والتحرك",                 icon: <Compass className="w-4 h-4" />,      status: "active",      color: "#10b981", url: "/#masarat" },
  { id: "wird",      name: "وِرد",      description: "كل يوم طقس — والطقس يبني العادة",      icon: <Flame className="w-4 h-4" />,        status: "active",      color: "#fbbf24", url: "/#wird" },
  { id: "warsha",    name: "ورشة",      description: "تحديات 7 أيام لبناء مهارة",            icon: <Flame className="w-4 h-4" />,        status: "active",      color: "#f97316", url: "/#warsha" },
  { id: "jisr",      name: "جسر",       description: "إصلاح العلاقات — حدّد · عبّر · افعل", icon: <Handshake className="w-4 h-4" />,    status: "active",      color: "#10b981", url: "/#jisr" },
  { id: "rifaq",     name: "رفاق",      description: "مساحة الرفاق والدعم في الطريق",        icon: <Users className="w-4 h-4" />,        status: "active",      color: "#22c55e", url: "/#rifaq" },
  { id: "murshid",   name: "مرشد",      description: "توجيه ذكي في لحظات الغموض",            icon: <Brain className="w-4 h-4" />,        status: "active",      color: "#8b5cf6", url: "/#murshid" },
  { id: "rafiq",     name: "رفيق",      description: "المرافق الذكي في الرحلة اليومية",       icon: <Compass className="w-4 h-4" />,      status: "active",      color: "#6366f1", url: "/#rafiq" },
  { id: "protocol",  name: "بروتوكول",  description: "خطة الفعل وقت التوتر والاختيار",        icon: <Zap className="w-4 h-4" />,          status: "active",      color: "#f59e0b", url: "/#protocol" },
  { id: "mithaq",    name: "ميثاق",     description: "عقد مع النفس",                         icon: <ScrollText className="w-4 h-4" />,   status: "active",      color: "#fbbf24", url: "/#mithaq" },
  { id: "sullam",    name: "سُلّم",      description: "سلالم النمو",                          icon: <TrendingUp className="w-4 h-4" />,   status: "active",      color: "#84cc16", url: "/#sullam" },
  { id: "raya",      name: "راية",       description: "رؤيتك طويلة المدى — 90 يوم",           icon: <Flag className="w-4 h-4" />,         status: "active",      color: "#6366f1", url: "/#raya" },
  { id: "bathra",    name: "بذرة",      description: "بذور العادات الصغيرة",                 icon: <Gem className="w-4 h-4" />,          status: "active",      color: "#10b981", url: "/#bathra" },
  { id: "sessions",  name: "جلسات",     description: "تدخلات عميقة وتوجيه",                 icon: <CalendarDays className="w-4 h-4" />, status: "active",      color: "#3b82f6", url: "/#session-intake" },
  { id: "session-console", name: "كونسول الجلسات", description: "تشغيل وإدارة الجلسات العميقة", icon: <LayoutGrid className="w-4 h-4" />, status: "active",      color: "#3b82f6", url: "/#session-console" },

  // Psychological Health
  { id: "atmosfera", name: "أتموسفيرا", description: "تنظيم الحالة والمشاعر",                icon: <Wind className="w-4 h-4" />,         status: "active",      color: "#8b5cf6", url: "/#atmosfera" },
  { id: "samt",      name: "صمت",       description: "تنفس واعي — هدوء في دقائق",            icon: <Wind className="w-4 h-4" />,         status: "active",      color: "#14b8a6", url: "/#samt" },
  { id: "khalwa",    name: "خلوة",      description: "وضع التركيز العميق — عزلة واعية",      icon: <Moon className="w-4 h-4" />,         status: "active",      color: "#8b5cf6", url: "/#khalwa" },
  { id: "nadhir",    name: "نذير",      description: "الدرع الأخير — تنفس وتأريض وخطة أمان", icon: <AlertTriangle className="w-4 h-4" />,status: "active",      color: "#ef4444", url: "/#nadhir" },
  { id: "qalb",      name: "قلب",       description: "صحة قلبك العاطفي — مؤشر موحّد",        icon: <Flame className="w-4 h-4" />,        status: "active",      color: "#ef4444", url: "/#qalb" },
  { id: "niyya",     name: "نية",       description: "توجيه اليوم قبل الحركة",                icon: <Sparkles className="w-4 h-4" />,     status: "active",      color: "#10b981", url: "/#niyya" },
  { id: "jathr",     name: "جذر",       description: "قيمك الجذرية تحت الاختيارات",           icon: <Gem className="w-4 h-4" />,          status: "active",      color: "#22c55e", url: "/#jathr" },
  { id: "ruya",      name: "رؤيا",      description: "دفتر الأحلام والإشارات الداخلية",        icon: <Moon className="w-4 h-4" />,         status: "active",      color: "#8b5cf6", url: "/#ruya" },
  { id: "kanz",      name: "كنز",       description: "بنك الحكمة الشخصية",                    icon: <Gem className="w-4 h-4" />,          status: "active",      color: "#f59e0b", url: "/#kanz" },
  { id: "tazkiya",   name: "تزكية",     description: "تطهير يومي — اعترف · سامح · اترك",     icon: <Gem className="w-4 h-4" />,          status: "active",      color: "#a78bfa", url: "/#tazkiya" },
  { id: "mizan",     name: "ميزان",     description: "قياس التقدم الحقيقي",                  icon: <Scale className="w-4 h-4" />,        status: "active",      color: "#10b981", url: "/#mizan" },

  // Memory & Documentation
  { id: "history-insights", name: "خزنة البصائر", description: "تاريخ بصائرك المحفوظة", icon: <BookOpen className="w-4 h-4" />, status: "active", color: "#a855f7", url: "/history" },
  { id: "markaz",    name: "المركز",     description: "مركز الأمر والقيادة الشخصية",          icon: <LayoutGrid className="w-4 h-4" />,    status: "active",      color: "#6366f1", url: "/#markaz" },
  { id: "sada",      name: "الصدى",      description: "رصد الإشارات والرؤى المتكررة",          icon: <Bell className="w-4 h-4" />,          status: "active",      color: "#06b6d4", url: "/#sada" },
  { id: "hafiz",     name: "حافظ",      description: "خزنة الذكريات — لحظاتك المحفوظة",      icon: <Gem className="w-4 h-4" />,          status: "active",      color: "#a855f7", url: "/#hafiz" },
  { id: "watheeqa",  name: "وثيقة",     description: "سجّل رحلتك يومياً",                   icon: <BookOpen className="w-4 h-4" />,     status: "active",      color: "#fb923c", url: "/#watheeqa" },
  { id: "sijil",     name: "سِجل",      description: "كل حركة في المنصة — موثّقة",           icon: <ScrollText className="w-4 h-4" />,   status: "active",      color: "#10b981", url: "/#sijil" },
  { id: "riwaya",    name: "رواية",     description: "رحلتك كقصة — من البداية لهنا",          icon: <BookOpen className="w-4 h-4" />,     status: "active",      color: "#fb923c", url: "/#riwaya" },
  { id: "athar",     name: "أثر",       description: "سجل حياتك في الرحلة",                  icon: <BookOpen className="w-4 h-4" />,     status: "active",      color: "#10b981", url: "/#athar" },
  { id: "naba",      name: "نبأ",       description: "رشفة يومية من الوعي",                   icon: <Droplets className="w-4 h-4" />,      status: "active",      color: "#06b6d4", url: "/#naba" },
  { id: "wasiyya",   name: "وصية",      description: "رسائل مختومة لنفسك المستقبلية",         icon: <Mail className="w-4 h-4" />,         status: "active",      color: "#fbbf24", url: "/#wasiyya" },
  { id: "risala",    name: "رسالة",     description: "رسائل ومعنى في محطات الطريق",           icon: <Mail className="w-4 h-4" />,         status: "active",      color: "#f59e0b", url: "/#risala" },
  { id: "shahada",   name: "شهادة",     description: "إثبات التحول والمعنى",                  icon: <FileText className="w-4 h-4" />,     status: "active",      color: "#14b8a6", url: "/#shahada" },
  { id: "yawmiyyat", name: "يوميّات",   description: "سجّل لحظات يومك — كل يوم قصة",         icon: <CalendarDays className="w-4 h-4" />, status: "active",      color: "#f59e0b", url: "/#yawmiyyat" },
  { id: "qinaa",     name: "قناع",       description: "اكشف الفجوة بين ذاتك وأقنعتك",       icon: <Eye className="w-4 h-4" />,          status: "active",      color: "#8b5cf6", url: "/#qinaa" },
];

// ─── Categories ─────────────────────────────────────────────────────────────

const CATEGORIES: ProductCategory[] = [
  {
    id: "explore",
    label: "الاستكشاف",
    emoji: "🧭",
    color: "#06b6d4",
    bgColor: "#0e3a4a",
    products: ALL_PRODUCTS.filter(p =>
      ["alrehla", "ecosystem-hub", "dawayir", "bawsala", "maraya", "observatory", "kharita", "mirah", "baseera", "taqrir"].includes(p.id)
    ),
  },
  {
    id: "work",
    label: "العمل",
    emoji: "⚡",
    color: "#10b981",
    bgColor: "#0a2e20",
    products: ALL_PRODUCTS.filter(p =>
      ["masarat", "wird", "warsha", "jisr", "rifaq", "murshid", "rafiq", "protocol", "mithaq", "sullam", "raya", "bathra", "sessions", "session-console"].includes(p.id)
    ),
  },
  {
    id: "health",
    label: "الصحة النفسية",
    emoji: "🧘",
    color: "#8b5cf6",
    bgColor: "#2a1b4a",
    products: ALL_PRODUCTS.filter(p =>
      ["atmosfera", "samt", "khalwa", "nadhir", "qalb", "niyya", "jathr", "ruya", "kanz", "tazkiya", "mizan", "qinaa"].includes(p.id)
    ),
  },
  {
    id: "history",
    label: "الذاكرة",
    emoji: "🏛️",
    color: "#a855f7",
    bgColor: "#2d1b4a",
    products: ALL_PRODUCTS.filter(p =>
      ["history-insights", "markaz", "sada", "hafiz", "watheeqa", "sijil", "riwaya", "athar", "naba", "wasiyya", "risala", "shahada", "yawmiyyat"].includes(p.id)
    ),
  },
];

// ─── Components ─────────────────────────────────────────────────────────────

const CategorySection: React.FC<{
  category: ProductCategory;
  onNavigate?: (url: string) => void;
  defaultOpen?: boolean;
}> = ({ category, onNavigate, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-right"
        style={{ color: category.color }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.emoji}</span>
          <span className="text-sm font-bold uppercase tracking-wide">
            {category.label}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-1 px-1 pb-2">
              {category.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    if (product.url && onNavigate) onNavigate(product.url);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-right group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `${product.color}20`,
                      color: product.color,
                    }}
                  >
                    {product.icon}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-bold text-white leading-tight truncate w-full">
                      {product.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight truncate w-full">
                      {product.description}
                    </span>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-600 mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const EcosystemNavigator: React.FC<{
  onNavigate?: (url: string) => void;
}> = ({ onNavigate }) => {
  const { ecosystemData } = useAuthState();
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const nextAction = React.useMemo(() => {
    return RoutingEngine.getNextBestAction(ecosystemData || undefined, {
      hasLocalMap: nodesCount > 0,
      hasCompletedBaseline: !!baselineCompletedAt
    });
  }, [ecosystemData, nodesCount, baselineCompletedAt]);

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const query = searchQuery.toLowerCase();
    return CATEGORIES.map(cat => ({
      ...cat,
      products: cat.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    })).filter(cat => cat.products.length > 0);
  }, [searchQuery]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <LayoutGrid className="w-6 h-6" />
        <AnimatePresence>
          {nextAction && !isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-950"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Navigator Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-[60] w-[320px] max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">المنظومة</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث عن أداة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {/* Smart Next Action */}
              {nextAction && !searchQuery && (
                <div className="mb-4 mx-2 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl -mr-12 -mt-12 transition-transform group-hover:scale-150" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        الخطوة التالية
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1 leading-snug">
                      {nextAction.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      {nextAction.description}
                    </p>

                    <button
                      onClick={() => {
                        if (onNavigate) {
                          let path = nextAction.targetPath;
                          if (path.startsWith('/onboarding') && !path.includes('force=')) {
                            path += (path.includes('?') ? '&' : '?') + 'force=1';
                          }
                          onNavigate(path);
                          setIsOpen(false);
                        }
                      }}
                      className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <span>{nextAction.ctaText}</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-1">
                {filteredCategories.map((cat, i) => (
                  <CategorySection
                    key={cat.id}
                    category={cat}
                    onNavigate={onNavigate}
                    defaultOpen={!searchQuery ? i === 0 : true}
                  />
                ))}
              </div>
            </div>

            {/* Footer Status */}
            <div className="p-3 bg-slate-950/30 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>متصل بالمنظومة</span>
                </div>
                <span>v2.4.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};
