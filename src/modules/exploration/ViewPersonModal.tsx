import { useEffect, useMemo, useRef, useState, type FC, type MouseEvent as ReactMouseEvent } from "react";
import { motion } from "framer-motion";
import { X, Share2, Target, ClipboardList } from "lucide-react";
import { Z_LAYERS } from "@/config/zIndices";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useMapState } from '@/modules/map/dawayirIndex';
import type { AdviceCategory } from "@/data/adviceScripts";
import { ResultScreen } from "./AddPersonModal/ResultScreen";
import type { QuickAnswer2 } from "@/utils/suggestInitialRing";
import { useShadowPulseState } from "@/domains/consciousness/store/shadowPulse.store";
import { BoundaryGeneratorModal } from '@/modules/action/BoundaryGeneratorModal';
import { GhostingSimulatorModal } from '@/modules/action/GhostingSimulatorModal';
import { loadSubscription } from "@/services/subscriptionManager";
import { UpgradeScreen } from "./UpgradeScreen";
import { ShareableCard } from '@/modules/exploration/ShareableCard';
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { buildEmergencyContextFromNode } from "@/utils/emergencyContext";
import { deriveRedReturnAlarm } from "@/utils/redReturnAlarm";
import { deriveOrbitDriftReplay } from "@/utils/orbitDriftReplay";
import { OrbitDriftReplayCard } from '@/components/OrbitDriftReplayCard';
import { PersonalizedTraining } from "./PersonalizedTraining";
import { SymptomsChecklist } from "./SymptomsChecklist";

interface ViewPersonModalProps {
  nodeId: string;
  category: AdviceCategory;
  goalId?: string;
  onClose: () => void;
  onOpenMission?: (nodeId: string) => void;
}

export const ViewPersonModal: FC<ViewPersonModalProps> = ({
  nodeId,
  category,
  onClose,
  onOpenMission
}) => {
  const node = useMapState((state) => state.nodes.find((item) => item.id === nodeId));
  const recordOpen = useShadowPulseState((state) => state.recordOpen);
  const recordClose = useShadowPulseState((state) => state.recordClose);
  const openedAtRef = useRef<number | null>(null);
  const [isBoundaryModalOpen, setIsBoundaryModalOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isGhostSimOpen, setIsGhostSimOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState<{
    title: string;
    desc: string;
    type: "boundary" | "achievement" | "milestone";
  } | null>(null);
  const [showTraining, setShowTraining] = useState(false);
  const openEmergency = useEmergencyState((state) => state.open);
  
  const returnAlarm = useMemo(
    () => (node ? deriveRedReturnAlarm(node, node.label) : null),
    [node]
  );
  const orbitReplay = useMemo(
    () => (node ? deriveOrbitDriftReplay(node, node.label) : null),
    [node]
  );

  useScrollLock(!!node);

  useEffect(() => {
    recordOpen(nodeId);
    openedAtRef.current = Date.now();

    return () => {
      if (openedAtRef.current !== null) {
        recordClose(nodeId, openedAtRef.current, false);
      }
    };
  }, [nodeId, recordOpen, recordClose]);

  if (!node || !node.analysis) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-950/60"
        style={{ zIndex: Z_LAYERS.MODAL_CONTENT }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md rounded-3xl bg-slate-900/40 p-8 border border-white/10 shadow-2xl"
          dir="rtl"
        >
          <button onClick={onClose} className="absolute left-4 top-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="py-6 text-center">
            <h3 className="mb-2 text-xl font-black text-white">الشخص غير متاح الآن</h3>
            <p className="mb-6 text-slate-400">لا توجد قراءة كاملة محفوظة لهذا الشخص حاليًا.</p>
            <button
               onClick={onClose}
               className="w-full rounded-2xl py-4 bg-teal-500 text-white font-black shadow-md shadow-teal-500/10 active:scale-95 transition-all"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleOpenMission = (targetNodeId: string) => {
    onOpenMission?.(targetNodeId);
    onClose();
  };

  const handleRestoreFromArchive = () => {
    useMapState.getState().unarchiveNode(node.id);
  };

  const handleArchiveToggle = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (node.isNodeArchived) {
      if (returnAlarm) {
        return;
      }
      handleRestoreFromArchive();
      return;
    }
    useMapState.getState().archiveNode(node.id);
    setShowShareCard({
      title: "حررت مساحتي الخاصة!",
      desc: "قمت بتجميد علاقة مستنزفة ونقلها إلى المدار الصفري للحفاظ على سلامي الداخلي.",
      type: "boundary"
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl bg-slate-950/60"
      style={{ zIndex: Z_LAYERS.MODAL_CONTENT }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-6 sm:p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-500 no-scrollbar"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />

        <div className="sticky top-0 z-20 mb-10 flex items-center justify-between -mx-2 -mt-2 bg-slate-950/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-6">
            <div className="relative group">
               <div className="absolute inset-0 bg-teal-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
               <button
                 type="button"
                 onClick={() => onClose()}
                 className="relative h-12 w-12 rounded-2xl bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white border border-white/10 flex items-center justify-center shadow-xl active:scale-95"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {node.label}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_var(--ring-safe)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {category === "work" ? "مدار عمل" : category === "family" ? "مدار عائلي" : "مدار عام"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {node.ring === "red" && (
              <div className="mr-2 rounded-full bg-rose-500/20 px-4 py-1.5 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">منطقة خطر</span>
              </div>
            )}
            <button
               type="button"
               onClick={() => setShowShareCard({ title: `تبصرة مدار ${node.label}`, desc: "رؤية شاملة للمدار وتأثيره الطاقي", type: "achievement" })}
               className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-400 transition-all hover:bg-teal-500/20 border border-teal-500/20 flex items-center justify-center shadow-lg active:scale-95"
            >
               <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          <div className="relative mb-5 overflow-hidden rounded-3xl p-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${
                (node.energyBalance?.netEnergy ?? 0) > 0 ? "rgba(45,212,191,0.2)" :
                (node.energyBalance?.netEnergy ?? 0) < 0 ? "rgba(244,63,94,0.2)" :
                "rgba(255,255,255,0.08)"
              }`,
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="pointer-events-none absolute -inset-10 opacity-20"
              style={{
                background: `radial-gradient(circle, ${
                  (node.energyBalance?.netEnergy ?? 0) > 0 ? "var(--ring-safe)" :
                  (node.energyBalance?.netEnergy ?? 0) < 0 ? "var(--ring-danger)" : "var(--ring-safe)"
                } 0%, transparent 70%)`,
                filter: "blur(30px)",
              }}
            />
            <div className="relative z-10 flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">كشف حساب الطاقة</h4>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">الصافي</p>
                <p className="text-3xl font-black tabular-nums" style={{ color: (node.energyBalance?.netEnergy ?? 0) > 0 ? "var(--ring-safe)" : (node.energyBalance?.netEnergy ?? 0) < 0 ? "var(--ring-danger)" : "var(--ring-detached)" }}>
                  {(node.energyBalance?.netEnergy ?? 0) > 0 ? "+" : ""}{node.energyBalance?.netEnergy ?? 0}
                </p>
              </div>
            </div>
            <div className="relative z-10 flex gap-3">
              <button onClick={() => useMapState.getState().addEnergyTransaction(node.id, 5, "شحن طاقي")} className="flex-1 rounded-2xl py-3 text-sm font-black transition-all bg-teal-500/10 border border-teal-500/20 text-teal-400">شحن (+5)</button>
              <button onClick={() => useMapState.getState().addEnergyTransaction(node.id, -5, "استنزاف طاقي")} className="flex-1 rounded-2xl py-3 text-sm font-black transition-all bg-rose-500/10 border border-rose-500/20 text-rose-400">استنزاف (-5)</button>
            </div>
          </div>

          {node.ring === "green" && (
            <button onClick={() => useMapState.getState().togglePowerBank(node.id)} className={`w-full rounded-2xl p-5 border transition-all backdrop-blur-md ${node.isPowerBank ? "border-teal-500/50 bg-teal-600/20 text-white shadow-[0_0_30px_rgba(20,184,166,0.3)]" : "border-white/10 bg-white/5 text-slate-300"}`}>
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <span className="block text-base font-black">{node.isPowerBank ? "🔋 بطارية طوارئ نشطة" : "🔋 تعيين كبطارية طوارئ"}</span>
                  <span className="text-xs text-slate-400">للوصول السريع وقت النزيف الطاقي.</span>
                </div>
                <div className={`h-6 w-6 rounded-full border-2 transition-all ${node.isPowerBank ? "border-teal-400 bg-teal-500 shadow-[0_0_10px_var(--ring-safe)]" : "border-slate-600"}`} />
              </div>
            </button>
          )}

          <button onClick={handleArchiveToggle} className={`w-full rounded-2xl border p-5 transition-all backdrop-blur-md ${node.isNodeArchived ? "border-slate-700/50 bg-slate-800/40 text-slate-300" : "border-orange-500/20 bg-orange-500/5 text-orange-400"}`}>
            <div className="flex items-center justify-between">
              <div className="text-right">
                <span className="block text-base font-black">{node.isNodeArchived ? "↩️ استعادة من الأرشيف" : "📥 أرشفة العلاقة مؤقتًا"}</span>
                <span className="text-xs text-slate-500">وقف الاستنزاف دون حذف البيانات.</span>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5">{node.isNodeArchived ? "⚪" : "📦"}</div>
            </div>
          </button>

          {orbitReplay && <OrbitDriftReplayCard snapshot={orbitReplay} />}

          {(node.isEmergency || node.ring === "red" || (node.energyBalance?.netEnergy ?? 0) < 0) && (
            <button onClick={() => openEmergency(buildEmergencyContextFromNode(node))} className="w-full rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)] transition-all hover:bg-rose-500/20 backdrop-blur-md group relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div className="text-right">
                  <span className="block text-base font-black text-rose-200">🚑 غرفة الطوارئ لـ {node.label}</span>
                  <span className="text-xs text-rose-300/60 uppercase tracking-tight font-medium">بروتوكول تهدئة سريع لوقف النزيف الطاقي.</span>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-rose-500 text-white font-black shadow-[0_0_15px_var(--ring-danger)]">!</div>
              </div>
            </button>
          )}

          <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 font-black text-purple-400"><ClipboardList strokeWidth={3} /></div>
               <div className="text-right">
                 <h4 className="text-base font-black text-white">أعراض مسجلة مع {node.label}</h4>
                 <p className="text-xs text-slate-400">مراجعة وتحديث الإشارات</p>
               </div>
            </div>
            <SymptomsChecklist
              ring={node.ring}
              personLabel={node.label}
              selectedSymptoms={node.analysis?.selectedSymptoms ?? []}
              onSymptomsChange={(ids) => useMapState.getState().updateNodeSymptoms(node.id, ids)}
            />
          </div>

          {node && (node.analysis?.selectedSymptoms?.length ?? 0) > 0 && (
            <button onClick={() => setShowTraining(true)} className="w-full rounded-2xl border border-teal-500/30 bg-white/[0.03] p-5 text-teal-400 shadow-xl transition-all hover:bg-teal-500/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <span className="block text-base font-black text-white">🎯 تدريب مخصص: {node.label}</span>
                  <span className="text-xs text-slate-400">تجاوز {node.analysis?.selectedSymptoms?.length ?? 0} أعراض.</span>
                </div>
                <Target className="w-8 h-8 text-teal-500" />
              </div>
            </button>
          )}

          {(node.energyBalance?.netEnergy ?? 0) < 0 && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsBoundaryModalOpen(true)} className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-5 transition-all hover:bg-indigo-500/10">
                <div className="text-center font-black">
                  <span className="block text-2xl mb-1">🛡️</span>
                  <span className="text-white text-xs block">درع الحماية</span>
                </div>
              </button>
              <button onClick={() => {
                const sub = loadSubscription();
                if (sub.tier === "basic") setIsUpgradeOpen(true);
                else setIsGhostSimOpen(true);
              }} className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all hover:bg-emerald-500/10">
                <div className="text-center font-black">
                  <span className="block text-2xl mb-1">👻</span>
                  <span className="text-white text-xs block">انسحاب تكتيكي</span>
                </div>
              </button>
            </div>
          )}

          <ResultScreen
            personLabel={node.label}
            personTitle={node.label}
            score={node.analysis.score}
            feelingAnswers={node.analysis.answers}
            realityAnswers={node.realityAnswers}
            isEmergency={node.isEmergency}
            safetyAnswer={node.safetyAnswer as QuickAnswer2 | undefined}
            summaryOnly
            addedNodeId={node.id}
            onOpenMission={handleOpenMission}
            onClose={() => onClose()}
            category={category}
          />
        </div>
      </motion.div>

      <BoundaryGeneratorModal isOpen={isBoundaryModalOpen} onClose={() => setIsBoundaryModalOpen(false)} personId={node.id} />
      <GhostingSimulatorModal isOpen={isGhostSimOpen} onClose={() => setIsGhostSimOpen(false)} personId={node.id} />
      <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />

      {showShareCard && (
        <ShareableCard
          title={showShareCard.title}
          description={showShareCard.desc}
          type={showShareCard.type}
          metrics={[
            { label: "نوع العلاقة", value: node.ring === "red" ? "مستنزفة" : node.ring === "yellow" ? "محايدة" : "مشحونة" },
            { label: "صافي الطاقة", value: node.energyBalance?.netEnergy || 0 }
          ]}
          onClose={() => setShowShareCard(null)}
        />
      )}

      {showTraining && node && (
        <PersonalizedTraining
          personLabel={node.label}
          selectedSymptoms={node.analysis?.selectedSymptoms ?? []}
          ring={node.ring}
          goalId={node.goalId ?? "unknown"}
          onClose={() => setShowTraining(false)}
          onComplete={() => setShowTraining(false)}
        />
      )}
    </div>
  );
};
