import type { FC, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useMapState } from "../state/mapState";
import type { AdviceCategory } from "../data/adviceScripts";
import { ResultScreen } from "./AddPersonModal/ResultScreen";
import type { QuickAnswer2 } from "../utils/suggestInitialRing";
import { useShadowPulseState } from "../state/shadowPulseState";
import { BoundaryGeneratorModal } from "./BoundaryGeneratorModal";
import { GhostingSimulatorModal } from "./GhostingSimulatorModal";
import { loadSubscription } from "../services/subscriptionManager";
import { UpgradeScreen } from "./UpgradeScreen";
import { ShareableCard } from "./ShareableCard";
import { useEmergencyState } from "../state/emergencyState";
import { buildEmergencyContextFromNode } from "../utils/emergencyContext";
import { deriveRedReturnAlarm } from "../utils/redReturnAlarm";
import { deriveOrbitDriftReplay } from "../utils/orbitDriftReplay";
import { OrbitDriftReplayCard } from "./OrbitDriftReplayCard";

interface ViewPersonModalProps {
  nodeId: string;
  category: AdviceCategory;
  goalId?: string;
  onClose: () => void;
  onOpenMission?: (nodeId: string) => void;
}

export const ViewPersonModal: FC<ViewPersonModalProps> = ({
  nodeId,
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
  const [showReturnAlarm, setShowReturnAlarm] = useState(false);
  const [showShareCard, setShowShareCard] = useState<{
    title: string;
    desc: string;
    type: "boundary" | "achievement" | "milestone";
  } | null>(null);
  const openEmergency = useEmergencyState((state) => state.open);
  const returnAlarm = useMemo(
    () => (node ? deriveRedReturnAlarm(node, node.label) : null),
    [node]
  );
  const orbitReplay = useMemo(
    () => (node ? deriveOrbitDriftReplay(node, node.label) : null),
    [node]
  );

  useEffect(() => {
    recordOpen(nodeId);
    openedAtRef.current = Date.now();

    return () => {
      if (openedAtRef.current !== null) {
        recordClose(nodeId, openedAtRef.current, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  useEffect(() => {
    setShowReturnAlarm(false);
  }, [nodeId]);

  useEffect(() => {
    if (!node?.isNodeArchived) {
      setShowReturnAlarm(false);
    }
  }, [node?.isNodeArchived]);

  if (!node || !node.analysis) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-8"
          onClick={(event) => event.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="py-6 text-center">
            <h3 className="mb-2 text-xl font-bold text-slate-900">الشخص غير متاح الآن</h3>
            <p className="mb-6 text-gray-500">لا توجد قراءة كاملة محفوظة لهذا الشخص حاليًا.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-teal-600 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-teal-700 active:scale-[0.98]"
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
    setShowReturnAlarm(false);
  };

  const handleArchiveToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (node.isNodeArchived) {
      if (returnAlarm) {
        setShowReturnAlarm(true);
        return;
      }

      handleRestoreFromArchive();
      return;
    }

    setShowReturnAlarm(false);
    useMapState.getState().archiveNode(node.id);
    setShowShareCard({
      title: "حررت مساحتي الخاصة!",
      desc: "قمت بتجميد علاقة مستنزفة ونقلها إلى المدار الصفري للحفاظ على سلامي الداخلي.",
      type: "boundary"
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white px-8 py-8"
        onClick={(event) => event.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-xl">
          <div
            className={`pointer-events-none absolute -inset-20 blur-3xl opacity-20 transition-colors duration-1000 ${
              (node.energyBalance?.netEnergy ?? 0) > 0
                ? "bg-emerald-500"
                : (node.energyBalance?.netEnergy ?? 0) < 0
                  ? "bg-rose-500"
                  : "bg-teal-500"
            }`}
          />

          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300">كشف حساب الطاقة</h4>
              <div className="text-right">
                <p className="text-xs text-slate-400">الصافي</p>
                <p
                  className={`text-xl font-black ${
                    (node.energyBalance?.netEnergy ?? 0) > 0
                      ? "text-emerald-400"
                      : (node.energyBalance?.netEnergy ?? 0) < 0
                        ? "text-rose-400"
                        : "text-slate-300"
                  }`}
                >
                  {(node.energyBalance?.netEnergy ?? 0) > 0 ? "+" : ""}
                  {node.energyBalance?.netEnergy ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  useMapState.getState().addEnergyTransaction(node.id, 5, "شحن طاقي");
                }}
                className="flex-1 rounded-xl border border-emerald-500/50 bg-emerald-500/20 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/40 active:scale-95"
              >
                شحن (+5)
              </button>

              <div className="h-8 w-px bg-slate-700" />

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  useMapState.getState().addEnergyTransaction(node.id, -5, "استنزاف طاقي");
                }}
                className="flex-1 rounded-xl border border-rose-500/50 bg-rose-500/20 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500/40 active:scale-95"
              >
                استنزاف (-5)
              </button>
            </div>
          </div>
        </div>

        {node.ring === "green" && (
          <div className="mb-6">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                useMapState.getState().togglePowerBank(node.id);
              }}
              className={`w-full rounded-2xl p-4 transition-all duration-300 ${
                node.isPowerBank
                  ? "border border-teal-500 bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)]"
                  : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-teal-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-right">
                  <span className="block text-base font-bold">
                    {node.isPowerBank ? "🔋 بطارية طوارئ نشطة" : "🔋 تعيين كبطارية طوارئ"}
                  </span>
                  <span
                    className={`mt-1 block text-xs leading-relaxed ${
                      node.isPowerBank ? "text-teal-100" : "text-slate-500"
                    }`}
                  >
                    {node.isPowerBank
                      ? "هذا الشخص سيظهر لك في غرفة الطوارئ لشحن طاقتك."
                      : "أضف هذا الشخص لغرفة الطوارئ لتلجأ إليه وقت النزيف الطاقي."}
                  </span>
                </div>

                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    node.isPowerBank ? "border-white bg-teal-500" : "border-slate-300"
                  }`}
                >
                  {node.isPowerBank ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleArchiveToggle}
            className={`w-full rounded-2xl border p-4 transition-all duration-300 ${
              node.isNodeArchived
                ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-right">
                <span className="block text-base font-bold">
                  {node.isNodeArchived ? "↩️ استعادة من الأرشيف" : "📥 أرشفة العلاقة مؤقتًا"}
                </span>
                <span
                  className={`mt-1 block text-xs leading-relaxed ${
                    node.isNodeArchived ? "text-slate-400" : "text-orange-500/80"
                  }`}
                >
                  {node.isNodeArchived
                    ? "العلاقة معلقة الآن ومحفوظة في الأرشيف الحي."
                    : "انقل العلاقة إلى الأرشيف لوقف الاستنزاف دون حذف البيانات."}
                </span>
              </div>

              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  node.isNodeArchived
                    ? "bg-slate-700 text-slate-400"
                    : "bg-orange-500/20 text-orange-600"
                }`}
              >
                {node.isNodeArchived ? "⚪" : "📦"}
              </div>
            </div>
          </button>
        </div>

        {showReturnAlarm && returnAlarm ? (
          <div
            className={`mb-6 rounded-2xl border p-4 text-right ${
              returnAlarm.tone === "danger"
                ? "border-rose-200 bg-rose-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  returnAlarm.tone === "danger"
                    ? "bg-rose-600 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {returnAlarm.title}
              </span>
              <span className="text-xs font-semibold text-slate-600">فك الأرشفة يحتاج تأكيدًا واعيًا</span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-800">{returnAlarm.summary}</p>

            <ul className="mt-4 space-y-2">
              {returnAlarm.reasons.map((reason) => (
                <li
                  key={reason}
                  className={`rounded-xl border px-3 py-2 text-sm leading-relaxed text-slate-800 ${
                    returnAlarm.tone === "danger"
                      ? "border-rose-200 bg-white/90"
                      : "border-amber-200 bg-white/90"
                  }`}
                >
                  {reason}
                </li>
              ))}
            </ul>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRestoreFromArchive();
                }}
                className={`rounded-full px-4 py-3 text-sm font-bold text-white ${
                  returnAlarm.tone === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {returnAlarm.confirmLabel}
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowReturnAlarm(false);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                {returnAlarm.keepArchivedLabel}
              </button>
            </div>
          </div>
        ) : null}

        {orbitReplay ? <OrbitDriftReplayCard snapshot={orbitReplay} /> : null}

        {(node.isEmergency || node.ring === "red" || (node.energyBalance?.netEnergy ?? 0) < 0) && (
          <div className="mb-6">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openEmergency(buildEmergencyContextFromNode(node));
              }}
              className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all duration-300 hover:bg-rose-500/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-right">
                  <span className="block text-base font-bold text-rose-300">
                    غرفة الطوارئ لهذا الشخص
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-rose-400/80">
                    افتح بروتوكول تهدئة سريع مرتبط بهذه العلاقة قبل أي رد أو رجوع لنفس الحلقة.
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
                  !
                </div>
              </div>
            </button>
          </div>
        )}

        {(node.energyBalance?.netEnergy ?? 0) < 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsBoundaryModalOpen(true);
              }}
              className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300 hover:bg-indigo-500/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-right">
                  <span className="block text-base font-bold text-indigo-300">
                    🛡️ توليد درع الحماية الذكي
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-indigo-400/80">
                    استخدم الذكاء الاصطناعي لإنشاء رسالة وضع حدود أو اعتذار مخصصة بناءً على بيانات الاستنزاف الحالية.
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  ✨
                </div>
              </div>
            </button>
          </div>
        )}

        {(node.energyBalance?.netEnergy ?? 0) < 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                const subscription = loadSubscription();
                if (subscription.tier === "basic") {
                  setIsUpgradeOpen(true);
                } else {
                  setIsGhostSimOpen(true);
                }
              }}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 hover:bg-emerald-500/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-right">
                  <span className="block text-base font-bold text-emerald-300">
                    👻 محاكاة الانسحاب التكتيكي
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-emerald-400/80">
                    احسب كمية الطاقة التي ستوفرها وتستردها إذا قررت تجنب هذا الشخص لمدة أسبوع كامل.
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  ⚡
                </div>
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
        />
      </motion.div>

      <BoundaryGeneratorModal
        isOpen={isBoundaryModalOpen}
        onClose={() => setIsBoundaryModalOpen(false)}
        personId={node.id}
      />
      <GhostingSimulatorModal
        isOpen={isGhostSimOpen}
        onClose={() => setIsGhostSimOpen(false)}
        personId={node.id}
      />
      <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />

      {showShareCard ? (
        <ShareableCard
          title={showShareCard.title}
          description={showShareCard.desc}
          type={showShareCard.type}
          metrics={[
            {
              label: "نوع العلاقة",
              value:
                node.ring === "red"
                  ? "مستنزفة"
                  : node.ring === "yellow"
                    ? "محايدة"
                    : "مشحونة"
            },
            { label: "صافي الطاقة", value: node.energyBalance?.netEnergy || 0 }
          ]}
          onClose={() => setShowShareCard(null)}
        />
      ) : null}
    </div>
  );
};
