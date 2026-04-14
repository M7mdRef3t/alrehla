import React from "react";
import { motion } from "framer-motion";
import { 
  Rocket, 
  Map, 
  Compass, 
  CalendarDays, 
  Wind,
  CheckCircle2,
  LockKeyhole,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { RoutingEngine } from "@/services/RoutingEngine";

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

const ECOSYSTEM_PRODUCTS: EcosystemProduct[] = [
  {
    id: "alrehla",
    name: "الرحلة",
    description: "المركز الرئيسي والموزع الذكي",
    icon: <Rocket className="w-5 h-5" />,
    status: "active",
    color: "var(--ds-color-brand-teal-500)",
    url: "/"
  },
  {
    id: "dawayir",
    name: "دواير",
    description: "أداة التشخيص وفهم الخريطة",
    icon: <Map className="w-5 h-5" />,
    status: "active",
    color: "#f5a623",
    url: "/#dawayir"
  },
  {
    id: "masarat",
    name: "مسارات",
    description: "أداة التنفيذ والتحرك",
    icon: <Compass className="w-5 h-5" />,
    status: "coming_soon",
    color: "#10b981",
    url: "/#masarat"
  },
  {
    id: "sessions",
    name: "جلسات",
    description: "تدخلات عميقة وتوجيه",
    icon: <CalendarDays className="w-5 h-5" />,
    status: "active", // assuming active based on sidebar items
    color: "#3b82f6",
    url: "/#session-intake"
  },
  {
    id: "atmosfera",
    name: "أتموسفيرا",
    description: "تنظيم الحالة والمشاعر",
    icon: <Wind className="w-5 h-5" />,
    status: "active",
    color: "#8b5cf6",
    url: "/#atmosfera"
  }
];

export const EcosystemNavigator: React.FC<{
  onNavigate?: (url: string) => void;
}> = ({ onNavigate }) => {
  const { ecosystemData } = useAuthState();
  const nextAction = React.useMemo(() => {
    return RoutingEngine.getNextBestAction(ecosystemData || undefined);
  }, [ecosystemData]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/5 dark:bg-[#0B0F19]/40 rounded-2xl border border-white/10 backdrop-blur-md relative overflow-hidden group">
      
      {/* Premium Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400/80">
          The Hub - المنظومة
        </span>
      </div>

      {nextAction && (
        <div className="mb-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
          
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              الخطوة المقترحة
            </span>
          </div>
          
          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
            {nextAction.title}
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
            {nextAction.description}
          </p>
          
          <button
            onClick={() => {
              if (onNavigate) onNavigate(nextAction.targetPath);
            }}
            className="w-full flex items-center justify-between bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors shadow-sm"
          >
            <span>{nextAction.ctaText}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5 z-10">
        {ECOSYSTEM_PRODUCTS.map((prod) => (
          <button
            key={prod.id}
            disabled={prod.status === "coming_soon" || prod.status === "locked"}
            onClick={() => {
              if (prod.url && onNavigate) onNavigate(prod.url);
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden border border-transparent ${
              prod.status === "active" 
                ? "hover:bg-white/10 hover:border-white/5 cursor-pointer" 
                : "opacity-60 cursor-not-allowed grayscale-[30%]"
            }`}
          >
            {prod.status === "active" && (
               <div 
                  className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: prod.color }}
                />
            )}
            
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
                style={{ 
                  backgroundColor: `${prod.color}20`,
                  color: prod.status === "locked" ? "#94a3b8" : prod.color
                }}
              >
                {prod.icon}
              </div>
              <div className="flex flex-col text-right items-start">
                <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                  {prod.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-white/50">
                  {prod.description}
                </span>
              </div>
            </div>

            <div className="shrink-0 ml-2">
               {prod.status === "active" && <CheckCircle2 className="w-4 h-4 text-teal-500/70" />}
               {prod.status === "locked" && <LockKeyhole className="w-4 h-4 text-slate-400/50" />}
               {prod.status === "coming_soon" && (
                 <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full border border-slate-700">
                   قريبًا
                 </span>
               )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
