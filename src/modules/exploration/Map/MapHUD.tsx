import React, { type FC, useMemo } from "react";
import { motion } from "framer-motion";
import { useMapState } from "@/modules/map/store/map.store";
import { useLayoutState } from "@/modules/map/store/layout.store";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧭 MAP HUD — لوحة قياس الخريطة
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * المكون ده بيجيب الـ "أدوات" والبطاقات اللي كانت في الهيرو للخريطة الحقيقية.
 * بيستخدم بيانات المالك الفعلية عشان يعرض مستوى البصيرة ومناطق الضباب.
 */

export const MapHUD: FC = () => {
  const nodes = useMapState((s) => s.nodes);
  const feelingResults = useMapState((s) => s.feelingResults);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const layoutMode = useLayoutState((s) => s.mode);

  // ─── Metrics Calculation ───────────────────────────────────────────────────
  
  // 1. مستوى البصيرة (Insight Level)
  // بنحسبه كمتوسط لنتايج المشاعر لو موجودة، أو قيمة افتراضية ذكية
  const insightLevel = useMemo(() => {
    if (!feelingResults) return 65; // Baseline if no check-in
    const { body, time, energy, money, space } = feelingResults;
    const avg = (body + time + energy + money + space) / 5;
    return Math.round(avg);
  }, [feelingResults]);

  // 2. مناطق الضباب (Mist Areas / Drain)
  // بنعد الأشخاص اللي في المدار الأحمر أو اللي عندهم استنزاف عالي
  const mistCount = useMemo(() => {
    return nodes.filter(n => n.ring === "red" || (n.analysis?.score && n.analysis.score >= 5)).length;
  }, [nodes]);

  // 3. عدد المستعيدين (Simulated Pulse)
  const pulseCount = useMemo(() => 1240 + Math.floor(Math.random() * 50), []);

  if (layoutMode === "conversation") return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 1. Insight Card (Top Right) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-24 md:top-32 right-4 md:right-8 p-5 rounded-3xl glass-premium pointer-events-auto min-w-[160px] shadow-2xl"
        style={{
          background: "rgba(20, 30, 50, 0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[#a8bfcc] mb-2">
          مستوى بصيرتك
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-tajawal)" }}>{insightLevel}</span>
          <span className="text-xs font-bold text-white/50">/ ١٠٠</span>
        </div>
        <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${insightLevel}%` }}
            className="h-full bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.5)]"
          />
        </div>
      </motion.div>

      {/* 2. Mist Card (Bottom Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-28 md:bottom-32 left-4 md:left-8 p-5 rounded-3xl glass-premium pointer-events-auto min-w-[160px] shadow-2xl"
        style={{
          background: "rgba(20, 30, 50, 0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] mb-2">
          مناطق الضباب
        </p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-tajawal)" }}>{mistCount}</span>
          <span className="text-[11px] font-bold text-white/50">مصادر الخداع</span>
        </div>
        <div className="flex gap-2 mt-3">
          {Array.from({ length: Math.min(mistCount, 5) }).map((_, i) => (
            <motion.div 
              key={i}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"
              style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)" }}
            />
          ))}
          {mistCount > 5 && <span className="text-[10px] text-white/30 font-bold">+{mistCount - 5}</span>}
          {mistCount === 0 && <span className="text-[10px] text-[#00f0ff] font-bold">الرؤية واضحة</span>}
        </div>
      </motion.div>

      {/* 3. Legend (Center Bottom) */}
      {!isMobile && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-8 px-8 py-3 rounded-full pointer-events-auto shadow-2xl"
          style={{ 
            background: "rgba(20, 30, 50, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {[
            { color: "#00f0ff", label: "توازن" },
            { color: "#f59e0b", label: "تشتت" },
            { color: "#ef4444", label: "استنزاف" }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
              <span className="text-[11px] font-black text-[#a8bfcc] tracking-widest uppercase">{item.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* 4. Pulse Badge (Top Center, moved down to avoid header) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-28 md:top-32 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 rounded-full pointer-events-auto"
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(239, 68, 68, 0.3)"
        }}
      >
        <motion.div 
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-[#ef4444]"
          style={{ boxShadow: "0 0 12px #ef4444" }}
        />
        <span className="text-[11px] font-black text-[#a8bfcc] uppercase tracking-widest">
          {pulseCount.toLocaleString()} مسافر يستعيدون نبضهم الآن
        </span>
      </motion.div>
    </div>
  );
};
