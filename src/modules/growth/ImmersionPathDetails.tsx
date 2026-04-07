import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Combine, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useAppOverlayState } from "@/state/appOverlayState";

const IMMERSION_NODES = [
  {
    id: 1,
    title: "تحديد منابع النزيف",
    description: "رصد المثيرات الخارجية التي تفتح ثغرات للمنطقة المظلمة.",
    status: "completed",
    date: "أُنجزت"
  },
  {
    id: 2,
    title: "صدمة التفريغ",
    description: "فصل الاستجابة التلقائية بين المحفز والفعل المباشر.",
    status: "active",
    date: "الجارية حالياً"
  },
  {
    id: 3,
    title: "بروتوكول الإحلال",
    description: "زراعة عادات وعي بديهية مكان العادات النبضية السابقة.",
    status: "locked",
    date: "القادمة"
  },
  {
    id: 4,
    title: "المناعة المطلقة",
    description: "القدرة التامة على عبور المحفزات دون أي مقاومة أو استجابة ارتدادية.",
    status: "locked",
    date: "المرحلة النهائية"
  }
];

export function ImmersionPathDetails() {
  const closeOverlay = useAppOverlayState((s) => s.closeOverlay);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(15, 10, 5, 0.85)" }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-amber-900/40 bg-slate-900/90 shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 px-8 pt-8 pb-6 border-b border-amber-900/30 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative group">
              <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <Combine className="w-8 h-8 text-amber-500 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight flex items-center gap-3">
                مسار الديتوكس
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> جاري التطهير
                </span>
              </h1>
              <p className="text-amber-200/60 text-sm font-medium">الخريطة الحية لتفكيك العقد التدريجي وفق مؤشرات الاستقرار النفسي.</p>
            </div>
          </div>
          
          <button
            onClick={() => closeOverlay("immersionPath")}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-amber-900/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto relative pt-8">
            
            {/* Timeline Line */}
            <div className="absolute top-0 bottom-0 right-14 w-0.5 bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
               <motion.div 
                 className="absolute top-0 right-0 w-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                 initial={{ height: 0 }}
                 animate={{ height: "45%" }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
               />
            </div>
            
            <div className="space-y-12">
              {IMMERSION_NODES.map((node, i) => (
                <div 
                  key={node.id} 
                  className="relative flex items-start gap-8"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex-1 right-0 text-left pt-1"
                  >
                    <span className={`text-[10px] font-bold tracking-wider uppercase mb-1 block ${
                      node.status === 'completed' ? 'text-emerald-500' :
                      node.status === 'active' ? 'text-amber-500' : 'text-slate-500'
                    }`}>
                      {node.date}
                    </span>
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                       node.status === 'completed' ? 'bg-slate-800/50 border-emerald-500/20' :
                       node.status === 'active' ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' :
                       'bg-slate-900/40 border-slate-800/80 grayscale-[50%] opacity-60'
                    }`}>
                      <h3 className={`text-xl font-bold mb-2 flex items-center justify-between ${
                        node.status === 'active' ? 'text-amber-400' : 'text-white'
                      }`}>
                        {node.title}
                        {node.status === 'active' && hoveredNode === node.id && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-500/80 flex items-center gap-1 cursor-pointer hover:text-amber-400">
                            متابعة التفاصيل <ArrowLeft className="w-3 h-3" />
                          </motion.span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm">{node.description}</p>
                    </div>
                  </motion.div>
                  
                  {/* Timeline Node */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.15, type: "spring" }}
                    className="relative z-10 w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-slate-900 border-4 border-slate-800 mt-2"
                  >
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${
                      node.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                      node.status === 'active' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)] border border-amber-300 animate-pulse' :
                      'bg-slate-800'
                    }`}>
                      {node.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-slate-900" />}
                      {node.status === 'active' && <ShieldCheck className="w-5 h-5 text-slate-900" />}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex items-center justify-center">
              <button className="px-6 py-3 rounded-full bg-slate-800/80 text-slate-300 font-semibold border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-colors">
                مراجعة الأرشيف بالكامل
              </button>
            </div>
            
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

