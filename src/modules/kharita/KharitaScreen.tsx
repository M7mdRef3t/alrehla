/**
 * خريطة — Kharita Screen
 * Visual Ecosystem Map — see all your tools, their status, and connections at a glance
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, Compass, Heart, BookOpen, Wind, Target, Moon, TreePine, Flame, Star, Zap, Shield, Eye, Users, Brain, Scale, Bell, Gem, ScrollText, Droplets, TrendingUp, Handshake } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*              ECOSYSTEM DATA                */
/* ═══════════════════════════════════════════ */

interface EcoTool {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: "core" | "soul" | "social" | "insight" | "daily";
  description: string;
  screen: string;
}

const CATEGORY_META = {
  core:    { label: "الأساس",   color: "#14b8a6", emoji: "🏛️" },
  soul:    { label: "الروح",    color: "#8b5cf6", emoji: "✨" },
  social:  { label: "العلاقات", color: "#ec4899", emoji: "💞" },
  insight: { label: "البصيرة",  color: "#f59e0b", emoji: "👁️" },
  daily:   { label: "اليومي",   color: "#06b6d4", emoji: "📅" },
} as const;

const ECOSYSTEM: EcoTool[] = [
  // Core
  { id: "bawsala",   name: "بوصلة",   emoji: "🧭", color: "#14b8a6", category: "core",    description: "البوصلة الداخلية",      screen: "compass" },
  { id: "masarat",   name: "مسارات",   emoji: "🗺️", color: "#6366f1", category: "core",    description: "خرائط التحول",          screen: "masarat" },
  { id: "tazkiya",   name: "تزكية",    emoji: "🌿", color: "#10b981", category: "core",    description: "تطهير النفس",           screen: "tazkiya" },
  { id: "protocol",  name: "بروتوكول", emoji: "⚡", color: "#f59e0b", category: "core",    description: "خطة الفعل",             screen: "protocol" },
  { id: "rafiq",     name: "رفيق",     emoji: "🧭", color: "#6366f1", category: "core",    description: "المرافق الذكي",         screen: "rafiq" },
  // Soul
  { id: "qalb",      name: "قلب",      emoji: "❤️", color: "#ef4444", category: "soul",    description: "صحة القلب العاطفي",     screen: "qalb" },
  { id: "samt",      name: "صمت",      emoji: "🤫", color: "#06b6d4", category: "soul",    description: "تنفس واعي",             screen: "samt" },
  { id: "ruya",      name: "رؤيا",     emoji: "🔮", color: "#8b5cf6", category: "soul",    description: "مفكرة الأحلام",         screen: "ruya" },
  { id: "niyya",     name: "نية",      emoji: "🎯", color: "#10b981", category: "soul",    description: "نية اليوم",             screen: "niyya" },
  { id: "jathr",     name: "جذر",      emoji: "🧬", color: "#22c55e", category: "soul",    description: "القيم الجذرية",         screen: "jathr" },
  { id: "kanz",      name: "كنز",      emoji: "🪙", color: "#f59e0b", category: "soul",    description: "بنك الحكمة",            screen: "kanz" },
  // Social
  { id: "jisr",      name: "جسر",      emoji: "🌉", color: "#ec4899", category: "social",  description: "الجسور العلائقية",      screen: "jisr" },
  { id: "dawayir",   name: "دوائر",    emoji: "⭕", color: "#8b5cf6", category: "social",  description: "خريطة العلاقات",        screen: "dawayir" },
  { id: "muhadatha", name: "محادثة",   emoji: "💬", color: "#06b6d4", category: "social",  description: "محادثات ذكية",          screen: "muhadatha" },
  // Insight
  { id: "dhakira",   name: "ذاكرة",    emoji: "🧠", color: "#6366f1", category: "insight", description: "الذاكرة الجمعية",       screen: "dhakira" },
  { id: "athar",     name: "أثر",      emoji: "📜", color: "#f59e0b", category: "insight", description: "سجل الحياة",           screen: "athar" },
  { id: "mawazin",   name: "موازين",   emoji: "⚖️", color: "#64748b", category: "insight", description: "ميزان الحياة",         screen: "mawazin" },
  { id: "muraqaba",  name: "مراقبة",   emoji: "👁️", color: "#14b8a6", category: "insight", description: "لوحة المراقبة",        screen: "muraqaba" },
  // Daily
  { id: "wird",      name: "ورد",      emoji: "📿", color: "#8b5cf6", category: "daily",   description: "الأذكار اليومية",      screen: "wird" },
  { id: "habits",    name: "عادات",    emoji: "🔄", color: "#10b981", category: "daily",   description: "تتبع العادات",         screen: "habits" },
  { id: "sanctuary", name: "ملاذ",     emoji: "🏔️", color: "#475569", category: "daily",   description: "الملاذ الآمن",          screen: "sanctuary" },
];

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function KharitaScreen() {
  const categories = useMemo(() => {
    const cats = Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[];
    return cats.map((cat) => ({
      ...CATEGORY_META[cat],
      key: cat,
      tools: ECOSYSTEM.filter((t) => t.category === cat),
    }));
  }, []);

  const handleNavigate = (screen: string) => {
    window.location.hash = `#${screen}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full top-[-20%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.05), transparent 65%)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-10%] right-[-10%]"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.04), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-900/15 border border-teal-500/20">
            <Map className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">خريطة</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">منظومة رحلتك الكاملة</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "أدوات", value: ECOSYSTEM.length, color: "#14b8a6" },
            { label: "أقسام", value: Object.keys(CATEGORY_META).length, color: "#8b5cf6" },
            { label: "متصلة", value: "100%", color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="relative z-10 px-5 space-y-6">
        {categories.map((cat, catIdx) => (
          <motion.div key={cat.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08 }}>

            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}20` }}>
                <span className="text-sm">{cat.emoji}</span>
              </div>
              <span className="text-sm font-black text-white">{cat.label}</span>
              <span className="text-[9px] text-slate-600 font-bold mr-1">({cat.tools.length})</span>
              <div className="flex-1 h-px mr-2" style={{ background: `${cat.color}15` }} />
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-2 gap-2">
              {cat.tools.map((tool, toolIdx) => (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: catIdx * 0.08 + toolIdx * 0.03 }}
                  onClick={() => handleNavigate(tool.screen)}
                  className="rounded-xl p-3 flex items-center gap-2.5 transition-all active:scale-95 group relative overflow-hidden"
                  style={{
                    background: `${tool.color}05`,
                    border: `1px solid ${tool.color}12`,
                  }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 30% 50%, ${tool.color}08, transparent 70%)` }} />

                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 relative z-10"
                    style={{ background: `${tool.color}12`, border: `1px solid ${tool.color}20` }}>
                    <span className="text-lg">{tool.emoji}</span>
                  </div>
                  <div className="min-w-0 relative z-10 text-right">
                    <span className="text-xs font-black text-white block truncate">{tool.name}</span>
                    <span className="text-[9px] text-slate-500 block truncate">{tool.description}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Connection Lines Visual */}
      <div className="relative z-10 px-5 mt-8">
        <div className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-4">🔗 شبكة الاتصال</span>
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {categories.map((cat, i) => (
              <React.Fragment key={cat.key}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}>
                    <span className="text-lg">{cat.emoji}</span>
                  </div>
                  <span className="text-[8px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                  <span className="text-[7px] text-slate-600">{cat.tools.length} أدوات</span>
                </div>
                {i < categories.length - 1 && (
                  <div className="flex items-center gap-0.5">
                    <div className="w-6 h-px" style={{ background: "rgba(51,65,85,0.5)" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500/30" />
                    <div className="w-6 h-px" style={{ background: "rgba(51,65,85,0.5)" }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-[9px] text-teal-400/60 font-bold">
              كل أداة متصلة بالمنظومة — بياناتك تتدفق بينها تلقائياً
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🗺️ خريطة — منظومتك الكاملة في نظرة واحدة — كل أداة تعرف مكانها في رحلتك
        </p>
      </motion.div>
    </div>
  );
}
