import type { FC } from "react";
import { useState } from "react";
import { Brain, Activity, Zap, Layers, Share2, MoreHorizontal } from "lucide-react";
import { ConsciousnessNetwork } from "./ConsciousnessNetwork";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { motion } from "framer-motion";
import type { OverviewStats } from "@/services/admin/adminTypes";

interface ConsciousnessMapProps {
  stats?: OverviewStats | null;
}

export const ConsciousnessMap: FC<ConsciousnessMapProps> = ({ stats }) => {
  const [activeLayer, setActiveLayer] = useState<"all" | "core" | "bridge">("all");

  const densityChange = stats?.globalPulse?.healing_velocity ? (stats.globalPulse.healing_velocity > 0 ? `+${(stats.globalPulse.healing_velocity * 10).toFixed(1)}%` : `${(stats.globalPulse.healing_velocity * 10).toFixed(1)}%`) : "+12%";
  const densityColor = stats?.globalPulse?.healing_velocity && stats.globalPulse.healing_velocity >= 0 ? "text-emerald-400" : "text-rose-400";
  
  const activeNodesCount = stats?.globalPulse ? Math.floor(stats.globalPulse.ai_workload_avg / 10) + 12 : 24;
  const coherenceScore = stats?.globalPulse?.global_phoenix_avg ? (stats.globalPulse.global_phoenix_avg / 10).toFixed(2) : "0.89";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-slate-200" dir="rtl">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-105 transition-transform">
              <Brain className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">أطلس الوعي</h3>
            <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              تحديث حي للمسارات العصبية
            </p>
          </div>
        </div>

        <div className="flex gap-8 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md">
          <div className="text-center relative group/stat flex flex-col items-center justify-center">
            <div className="absolute -top-1 -right-2">
              <AdminTooltip content="مدى تشابك وترابط العلاقات داخل الخريطة. الزيادة تعني أن المستخدمين يبنون علاقات حقيقية ومترابطة ببعضها." position="bottom" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">كثافة الخريطة</p>
            <p className="text-lg font-black text-white">متغيرة <span className={`text-[10px] ${densityColor} align-top`}>{densityChange}</span></p>
          </div>
          <div className="w-px bg-slate-800" />
          <div className="text-center relative group/stat flex flex-col items-center justify-center">
            <div className="absolute -top-1 -right-2">
              <AdminTooltip content="مؤشر يوضح نسبة الأشخاص الفريدين مقارنة بإجمالي الجلسات (مثال: 32 شخص من 37 جلسة). يعكس مدى تفاعل المستخدمين الفعليين." position="bottom" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">درجة الترابط</p>
            <p className="text-lg font-black text-teal-400">{coherenceScore}</p>
          </div>
          <div className="w-px bg-slate-800" />
          <div className="text-center relative group/stat flex flex-col items-center justify-center">
            <div className="absolute -top-1 -right-2">
              <AdminTooltip content="عدد العقد (الأشخاص) النشطة حالياً والتي يتم التفاعل معها أو تعديلها في الجلسات الحية." position="bottom" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">عقد نشطة</p>
            <p className="text-lg font-black text-amber-400">{activeNodesCount}</p>
          </div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="grid lg:grid-cols-4 gap-6">

        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="admin-glass-card p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4" />
              طبقات العرض
            </h4>
            <div className="space-y-2">
              {[
                { id: "all", label: "الكل (Global View)", count: activeNodesCount },
                { id: "core", label: "النواة (Core)", count: Math.floor(activeNodesCount * 0.4) },
                { id: "bridge", label: "الجسور (Bridges)", count: Math.floor(activeNodesCount * 0.6) }
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id as any)}
                  className={`w-full flex justify-between items-center p-3 rounded-xl border text-xs font-bold transition-all ${activeLayer === layer.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                >
                  <span>{layer.label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/20 text-white/50 text-[10px]">{layer.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-glass-card p-5 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              تنبيه نشاط
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stats?.awarenessGap?.primaryGap === "إدراك_قسوة_المسار" ? 
               "تم رصد زيادة في القسوة على الذات (إدراك قسوة المسار). يوصى بتفعيل رسائل التعاطف التلقائية." : 
               "تم رصد زيادة غير معتادة في نشاط العقد المحورية خلال الـ 24 ساعة الماضية."}
            </p>
          </div>
        </div>

        {/* The Network Canvas */}
        <div className="lg:col-span-3">
          <div className="relative group">
            <ConsciousnessNetwork activeLayer={activeLayer} stats={stats} />

            {/* Overlay Action Buttons */}
            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white backdrop-blur-md border border-white/10 hover:bg-slate-800" title="مشاركة اللقطة">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white backdrop-blur-md border border-white/10 hover:bg-slate-800" title="خيارات إضافية">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Zap className="w-6 h-6 text-amber-400" />,
            title: "أنماط ناشئة",
            desc: "النظام يحدد تركيزًا متزايدًا على عقد 'خريطة العائلة' (المرتبة #1) خلال الدورات المسائية.",
            color: "amber"
          },
          {
            icon: <Activity className="w-6 h-6 text-teal-400" />,
            title: "صحة العقد",
            desc: "الاحتفاظ العصبي عند 92% للمستخدمين مع >3 سجلات مزاج يدوية. نسبة الإشارة إلى الضوضاء مثالية.",
            color: "teal"
          },
          {
            icon: <Brain className="w-6 h-6 text-indigo-400" />,
            title: "محرك التنبؤ",
            desc: "متوقع ارتفاع في نشاط 'أرشيف الصداقة' بعد إطلاق الميزة القادمة في التحديث رقم 2.4.",
            color: "indigo"
          }
        ].map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className={`group relative admin-glass-card p-7 border-slate-800 bg-slate-950/40 space-y-4 rounded-3xl hover:bg-slate-900 transition-all overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 bg-${insight.color}-500/5 group-hover:bg-${insight.color}-500/10 transition-colors`} />
            <div className="relative z-10">
              <div className="mb-4 p-3 rounded-2xl bg-slate-900/50 w-fit border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                {insight.icon}
              </div>
              <p className={`text-xs font-bold uppercase tracking-widest text-${insight.color}-400 mb-2`}>{insight.title}</p>
              <p className="text-sm text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{insight.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
