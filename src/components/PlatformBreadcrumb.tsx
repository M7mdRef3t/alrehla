import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Home } from "lucide-react";

export interface BreadcrumbItem {
  id: string;
  label: string;
}

interface PlatformBreadcrumbProps {
  /** مسار التنقل — كل عنصر له id ولو اتضغط يتنقل */
  items: BreadcrumbItem[];
  /** دالة التنقل عند الضغط على عنصر في المسار */
  onNavigate?: (id: string) => void;
  className?: string;
}

/**
 * PlatformBreadcrumb
 * شريط مسار التنقل — يظهر فوق الصفحة ويختفي في الـ landing
 * يدعم RTL ويستخدم framer-motion لأنيميشن سلس.
 */
export const PlatformBreadcrumb = memo(function PlatformBreadcrumb({
  items,
  onNavigate,
  className = "",
}: PlatformBreadcrumbProps) {
  // لو مسار واحد فقط (landing) ما نعرضه
  if (!items || items.length <= 1) return null;

  return (
    <AnimatePresence>
      <motion.nav
        key={items.map((i) => i.id).join("/")}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-label="مسار التنقل"
        dir="rtl"
        className={`flex items-center gap-1 text-sm text-slate-400 ${className}`}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <span key={item.id} className="flex items-center gap-1">
              {/* الفاصل */}
              {!isFirst && (
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}

              {isLast ? (
                /* العنصر النشط — لا يُنقر */
                <span className="text-white font-medium flex items-center gap-1">
                  {isFirst && <Home className="w-3.5 h-3.5" />}
                  {item.label}
                </span>
              ) : (
                /* عناصر قابلة للنقر */
                <button
                  type="button"
                  onClick={() => onNavigate?.(item.id)}
                  className="flex items-center gap-1 hover:text-white transition-colors rounded px-1 py-0.5
                             hover:bg-white/[0.06] active:scale-95"
                >
                  {isFirst && <Home className="w-3.5 h-3.5" />}
                  {item.label}
                </button>
              )}
            </span>
          );
        })}
      </motion.nav>
    </AnimatePresence>
  );
});

// ── Helper: توليد مسار Breadcrumb من اسم الشاشة ──
export function buildBreadcrumb(screen: string): BreadcrumbItem[] {
  const screenLabels: Record<string, string> = {
    landing:          "الرئيسية",
    tools:            "الأدوات",
    stories:          "قصص النجاح",
    about:            "لماذا الرحلة؟",
    settings:         "الإعدادات",
    guided:           "الرحلة الموجّهة",
    mission:          "المهمة",
    "oracle-dashboard": "لوحة الأوراكل",
    "guilt-court":    "محكمة الذنب",
    diplomacy:        "الدبلوماسية",
    armory:           "المستودع",
    enterprise:       "المؤسسة",
  };

  if (!screen || screen === "landing") {
    return [{ id: "landing", label: "الرئيسية" }];
  }

  return [
    { id: "landing", label: "الرئيسية" },
    { id: screen, label: screenLabels[screen] ?? screen },
  ];
}
