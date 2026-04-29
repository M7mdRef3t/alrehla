/**
 * برج حورس — Horus Tower: المركز التنفيذي
 * 
 * Unified Command Center — aggregates all 17 products with Sovereign UI:
 * - Horus Eye (Central Clarity)
 * - Vertical Resonance (Connection with Source)
 * - Systemic Health (Executive Ops - if Owner)
 * - The Call (Attention Queue)
 */

import type { FC } from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Activity, Flame, Shield, BookOpen, Compass,
  Brain, FileText, Scale, Users, Eye, Wind, Map,
  Target, Zap, AlertTriangle, Star,
  RefreshCw, TrendingUp, Cpu, Server, Database
} from "lucide-react";

// Stores
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useDailyJournalState } from "@/domains/journey/store/journal.store";
import { useBawsalaState } from "@/modules/bawsala/store/bawsala.store";
import { useNadhirState } from "@/modules/nadhir/store/nadhir.store";
import { useWirdState } from "@/modules/wird/store/wird.store";
import { useHafizState, getVerticalResonanceState } from "@/modules/hafiz/store/hafiz.store";
import { getEffectiveRoleFromState, useAuthState } from "@/domains/auth/store/auth.store";
import { useMapState } from '@/modules/map/dawayirIndex';
import { calculateEntropy } from "@/services/predictiveEngine";
import { VaultService } from "@/services/truthVault";

// Components & Utils
import { HorusEye } from "@/components/shared/HorusEye";
import { safeGetSession } from "@/services/supabaseClient";
import { fetchPendingInterventions, executeIntervention } from "@/services/admin/adminInterventions";
import type { InterventionEntry } from "@/services/admin/adminTypes";

/* ═══════════════════════════════════════════ */
/*               TYPES & CONSTS               */
/* ═══════════════════════════════════════════ */

const HORUS_GOLD = "#C9A84C";
const HORUS_BLUE = "#1B6CA8";
const SPACE_VOID = "#060812";

type ProductStatus = "green" | "yellow" | "red" | "neutral";

interface ProductCard {
  id: string;
  name: string;
  emoji: string;
  icon: any;
  status: ProductStatus;
  metric: string;
  detail: string;
  color: string;
  route: string;
}

interface AttentionItem {
  id: string;
  emoji: string;
  message: string;
  priority: "high" | "medium" | "low";
  action: string;
  route?: string;
  onExecute?: () => Promise<void>;
}

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const MarkazScreen: FC = () => {
  // ── Auth & Role ──
  const role = useAuthState(getEffectiveRoleFromState);
  const rawRole = useAuthState((s) => s.role);
  const isOwnerWatcher = useMemo(() => {
    const r = (role || "").toLowerCase();
    const rr = (rawRole || "").toLowerCase();
    return ["owner", "superadmin", "admin", "developer"].includes(r) || ["owner", "superadmin", "admin", "developer"].includes(rr);
  }, [role, rawRole]);

  // ── Executive Data (Conditional) ──
  const [opsCounts, setOpsCounts] = useState<{ pending_proofs: number; capi_health: number; unanalyzed_leads: number; open_tickets: number } | null>(null);
  const [pendingInterventions, setPendingInterventions] = useState<InterventionEntry[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const fetchOpsData = useCallback(async () => {
    if (!isOwnerWatcher) return;
    setLoadingOps(true);
    try {
      const session = await safeGetSession();
      const token = session?.access_token ?? "";
      
      const [countsRes, capiRes, interventions] = await Promise.all([
        fetch("/api/admin/ops/counts", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/ops/capi-stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetchPendingInterventions(5)
      ]);

      if (countsRes.ok && capiRes.ok) {
        const counts = await countsRes.json();
        const capi = await capiRes.json();
        const capiHealth = capi.total > 0 ? Math.round((capi.success / capi.total) * 100) : 100;
        setOpsCounts({ 
          pending_proofs: counts.pending_proofs, 
          capi_health: capiHealth,
          unanalyzed_leads: counts.unanalyzed_leads || 0,
          open_tickets: counts.open_tickets || 0
        });
      }

      if (interventions) {
        setPendingInterventions(interventions);
      }
    } catch (e) {
      console.error("Ops fetch failed", e);
    } finally {
      setLoadingOps(false);
    }
  }, [isOwnerWatcher]);

  useEffect(() => {
    fetchOpsData();
  }, [fetchOpsData]);

  // ── User Data Sources ──
  const logs = usePulseState((s) => s.logs || []);
  const memories = useHafizState((s) => s.memories || []);
  const { badges, level, streak: gameStreak } = useGamificationState();
  const journalEntries = useDailyJournalState((s) => s.entries || []);
  const { decisions } = useBawsalaState();
  const { safeContacts } = useNadhirState();
  const wirdState = useWirdState();

  // ── Vertical Resonance ──
  const resonance = useMemo(() => getVerticalResonanceState(memories), [memories]);

  // ── Leadership Oracle Logic ──
  const nodes = useMapState((s) => s.nodes || []);
  const xp = useGamificationState((s) => s.xp || 0);

  const leadership = useMemo(() => {
    const entropy = calculateEntropy();
    const vaultRecords = VaultService.getRecords().length;
    const greenCount = nodes.filter(n => n.ring === "green").length;

    const balanceFactor = nodes.length === 0 ? 1 : greenCount / nodes.length;
    const entropyFactor = Math.max(0, 1 - entropy.entropyScore / 100);
    const growthFactor = Math.min(1, xp / 5000) + (vaultRecords * 0.05);

    const score = Math.round(((balanceFactor * 0.4) + (entropyFactor * 0.4) + (growthFactor * 0.2)) * 100);

    return {
      score,
      status: score > 80 ? "قيادة مطلقة" : score > 50 ? "تحت السيطرة" : "اختراق أمني",
      color: score > 80 ? HORUS_GOLD : score > 50 ? "#fbbf24" : "#ef4444",
      chaosScore: entropy.entropyScore
    };
  }, [nodes, xp]);

  // ── Computed Metrics ──
  const recentLogs = useMemo(() => logs.filter((l) => Date.now() - l.timestamp < 48 * 3600000), [logs]);
  const avgEnergy = useMemo(() => {
    if (recentLogs.length === 0) return 0;
    return Math.round((recentLogs.reduce((s, l) => s + l.energy, 0) / recentLogs.length) * 10) / 10;
  }, [recentLogs]);

  const wirdToday = wirdState.getTodayCompletion();
  const wirdEnabled = wirdState.rituals.filter((r) => r.enabled).length;
  const wirdProgress = wirdEnabled > 0 ? Math.round((wirdToday.completedRituals.length / wirdEnabled) * 100) : 0;
  const totalJournals = journalEntries.filter((e) => e.answer?.length > 0).length;

  // ── Product Health Matrix ──
  const products = useMemo<ProductCard[]>(() => {
    const base: ProductCard[] = [
      {
        id: "pulse", name: "نبض", emoji: "💓", icon: Activity,
        status: recentLogs.length > 0 ? (avgEnergy >= 6 ? "green" : avgEnergy >= 3 ? "yellow" : "red") : "neutral",
        metric: recentLogs.length > 0 ? `${avgEnergy}/10` : "—",
        detail: `${recentLogs.length} نبضة`, color: "#ef4444", route: "/#pulse",
      },
      {
        id: "wird", name: "وِرد", emoji: "🔥", icon: Flame,
        status: resonance.strength >= 0.6 ? "green" : resonance.strength >= 0.4 ? "yellow" : resonance.strength > 0 ? "red" : "neutral",
        metric: resonance.label, detail: `streak: ${resonance.daysActive}`,
        color: HORUS_GOLD, route: "/#wird",
      },
      {
        id: "watheeqa", name: "وثيقة", emoji: "📝", icon: FileText,
        status: totalJournals > 0 ? "green" : "neutral",
        metric: `${totalJournals}`, detail: "تدوينة",
        color: "#f97316", route: "/#watheeqa",
      },
      {
        id: "bawsala", name: "بوصلة", emoji: "🧭", icon: Compass,
        status: decisions.some(d => d.status === "active") ? "yellow" : decisions.length > 0 ? "green" : "neutral",
        metric: `${decisions.length}`, detail: "قرارات",
        color: "#06b6d4", route: "/#bawsala",
      },
      {
        id: "dawayir", name: "دوائر", emoji: "🔵", icon: Map,
        status: "green", metric: "نشط", detail: "العلاقات",
        color: "#3b82f6", route: "/#dawayir",
      },
      {
        id: "nadhir", name: "نذير", emoji: "🛡️", icon: Shield,
        status: safeContacts.length > 0 ? "green" : "yellow",
        metric: safeContacts.length > 0 ? "محمي" : "أضف",
        detail: `${safeContacts.length} أمان`,
        color: "#ef4444", route: "/#nadhir",
      },
      {
        id: "murshid", name: "مرشد", emoji: "🧠", icon: Brain,
        status: logs.length >= 3 ? "green" : "neutral",
        metric: "AI", detail: "الذكاء",
        color: "#8b5cf6", route: "/#murshid",
      },
      {
        id: "mizan", name: "ميزان", emoji: "⚖️", icon: Scale,
        status: resonance.strength >= 0.5 ? "green" : "neutral",
        metric: resonance.strength >= 0.5 ? "متزن" : "بيانات", detail: "التقدم",
        color: "#14b8a6", route: "/#mizan",
      },
      {
        id: "gamification", name: "أوسمة", emoji: "🏅", icon: Star,
        status: badges.length > 0 ? "green" : "neutral",
        metric: `Lv ${level}`, detail: `${badges.length} وسام`,
        color: "#a855f7", route: "/#home",
      }
    ];

    // Add Executive Card if Owner
    if (isOwnerWatcher && opsCounts) {
      base.unshift({
        id: "executive", name: "السيستم", emoji: "🏛️", icon: Server,
        status: opsCounts.capi_health >= 90 && opsCounts.pending_proofs === 0 && opsCounts.unanalyzed_leads === 0 ? "green" : "yellow",
        metric: `${opsCounts.capi_health}%`,
        detail: `${opsCounts.pending_proofs} دفعات | ${opsCounts.unanalyzed_leads} مسافر`,
        color: "#10b981", route: "/admin/ops",
      });
    }

    return base;
  }, [recentLogs, avgEnergy, resonance, totalJournals, decisions, safeContacts, logs, badges, level, isOwnerWatcher, opsCounts]);

  // ── Overall Health Score ──
  const healthScore = useMemo(() => {
    const greenCount = products.filter((p) => p.status === "green").length;
    return Math.round((greenCount / products.length) * 100);
  }, [products]);

  // ── Attention Queue ──
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    
    // User Context
    if (recentLogs.length === 0) items.push({ id: "pulse", emoji: "💓", message: "المنظومة محتاجة تحس بنبضك النهارده", priority: "high", action: "سجّل نبضة", route: "/#pulse" });
    if (resonance.strength < 0.5) items.push({ id: "resonance", emoji: "✨", message: "اتصالك بالمصدر محتاج تقوية", priority: "high", action: "وِردك", route: "/#wird" });
    
    // Executive Context
    if (opsCounts) {
      if (opsCounts.pending_proofs > 0) items.push({ id: "ops_proofs", emoji: "💰", message: `فيه ${opsCounts.pending_proofs} دفعات مستنية مراجعتك`, priority: "high", action: "راجع", route: "/admin/ops/proofs" });
      if (opsCounts.unanalyzed_leads > 0) items.push({ id: "ops_leads", emoji: "🦅", message: `فيه ${opsCounts.unanalyzed_leads} مسافر جديد محتاج تحليل الأوراكل`, priority: "high", action: "حلل", route: "/admin/intelligence" });
      if (opsCounts.open_tickets > 0) items.push({ id: "ops_tickets", emoji: "✉️", message: `فيه ${opsCounts.open_tickets} تذاكر دعم مفتوحة محتاجة ردك`, priority: "medium", action: "رد", route: "/admin/ops" });
    }

    // Pending Interventions (Nidaa Al-Haqq)
    pendingInterventions.filter(pi => pi.status === 'unread').forEach(pi => {
      items.push({
        id: `nidaa_${pi.id}`,
        emoji: "✨",
        message: `نداء جاهز لـ ${pi.userName}: "${pi.aiMessage.substring(0, 40)}..."`,
        priority: "high",
        action: "إرسال",
        onExecute: async () => {
          setExecutingId(pi.id);
          const res = await executeIntervention(pi);
          if (res.success) {
            setPendingInterventions(prev => prev.filter(p => p.id !== pi.id));
          }
          setExecutingId(null);
        }
      });
    });

    return items;
  }, [recentLogs, resonance, opsCounts, pendingInterventions]);

  const navigate = (route: string) => { window.location.hash = route.replace("/#", ""); };

  return (
    <div className="min-h-full pb-32 select-none overflow-x-hidden" dir="rtl"
      style={{ background: SPACE_VOID }}
    >
      {/* ═══ Header (The Tower) ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative px-6 pt-10 pb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/5 blur-[80px] -z-10" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-amber-500/10" />
              <LayoutGrid className="w-7 h-7 text-white/80" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                برج حورس
                {isOwnerWatcher && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/40 font-bold border border-white/5 uppercase tracking-tighter">Exec</span>}
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {leadership.status} — {leadership.score}%
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
             <HorusEye score={leadership.score} size={80} />
          </div>
        </div>

        {/* ── Vertical Axis Indicator ── */}
        <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">المحور الرأسي</p>
                <p className="text-sm font-black text-white">درجة الاتصال: <span style={{ color: resonance.strength >= 0.6 ? HORUS_GOLD : '#94a3b8' }}>{resonance.label}</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold">STREAK</p>
              <p className="text-sm font-black text-white">{resonance.daysActive} يوم</p>
            </div>
          </div>

          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(201,168,76,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${resonance.strength * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ═══ The Call (Attention Queue) ═══ */}
      <AnimatePresence>
        {attentionItems.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-6 mb-8">
             <p className="text-[11px] text-slate-500 font-black mb-3 flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-amber-500" /> نداء البصيرة
             </p>
             <div className="space-y-2">
               {attentionItems.map((item) => (
                 <motion.button key={item.id} 
                   onClick={() => {
                     if (item.onExecute) {
                       void item.onExecute();
                     } else if (item.route) {
                       navigate(item.route);
                     }
                   }}
                   disabled={executingId === item.id.replace('nidaa_', '')}
                   className="w-full p-4 rounded-2xl flex items-center gap-3 text-right bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <span className="text-xl">{item.emoji}</span>
                   <p className="flex-1 text-xs text-slate-300 font-bold leading-relaxed">{item.message}</p>
                   <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${
                     item.id.startsWith('nidaa_') 
                       ? "bg-teal-500/10 text-teal-500 group-hover:bg-teal-500 group-hover:text-black" 
                       : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black"
                   }`}>
                     {executingId === item.id.replace('nidaa_', '') ? (
                       <RefreshCw className="w-3 h-3 animate-spin" />
                     ) : (
                       item.action
                     )}
                   </div>
                 </motion.button>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ System Integration Matrix ═══ */}
      <div className="px-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-slate-500 font-black flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> اتزان المنظومة ({products.filter(p => p.status === 'green').length}/{products.length})
          </p>
          {isOwnerWatcher && (
            <button onClick={fetchOpsData} className="p-2 text-slate-500 hover:text-white transition-colors">
              <RefreshCw className={`w-3 h-3 ${loadingOps ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {products.map((p, i) => (
            <motion.button key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(p.route)}
              className="p-4 rounded-3xl flex flex-col items-center text-center relative overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/10 active:scale-95 transition-all"
            >
               {/* Status Indicator */}
               <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full" 
                 style={{ 
                   backgroundColor: p.status === 'green' ? '#10b981' : p.status === 'yellow' ? '#fbbf24' : p.status === 'red' ? '#ef4444' : '#475569',
                   boxShadow: p.status === 'green' ? '0 0 8px #10b981' : 'none'
                 }} 
               />
               
               <span className="text-2xl mb-2">{p.emoji}</span>
               <p className="text-[11px] font-black text-white/90 mb-1">{p.name}</p>
               <p className="text-[13px] font-black" style={{ color: p.color }}>{p.metric}</p>
               <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{p.detail}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ The Sovereign Message ═══ */}
      <div className="px-8 mt-4 text-center">
        <div className="w-8 h-[1px] bg-white/10 mx-auto mb-4" />
        <p className="text-[10px] text-slate-600 font-bold leading-relaxed max-w-[200px] mx-auto italic">
          "ارتفع فوق الموقف، شوف الحقيقة، واتحرك بوعي."
        </p>
      </div>
    </div>
  );
};

export default MarkazScreen;

