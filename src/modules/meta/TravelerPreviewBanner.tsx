import { motion, AnimatePresence } from "framer-motion";
import { Eye, ShieldCheck, X } from "lucide-react";
import { useAuthState } from "@/domains/auth/store/auth.store";

export function TravelerPreviewBanner() {
  const roleOverride = useAuthState((s) => s.roleOverride);
  const setRoleOverride = useAuthState((s) => s.setRoleOverride);

  const isViewingAsUser = roleOverride === "user";

  return (
    <AnimatePresence>
      {isViewingAsUser && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-2 text-xs md:text-sm font-medium shadow-md shadow-amber-900/10 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(20,20,20,0.95), rgba(30,30,20,0.95))",
            borderBottom: "1px solid rgba(245,158,11,0.2)",
            color: "#e2e8f0"
          }}
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>
              أنت الآن في <strong className="text-amber-500">وضع معاينة المسافر</strong>. هكذا تظهر المنصة للمستخدم.
            </span>
          </div>
          
          <button
            onClick={() => setRoleOverride(null)}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md transition-colors border border-amber-500/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">العودة للوحة الأونر</span>
            <span className="sm:hidden">خروج</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
