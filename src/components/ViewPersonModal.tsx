import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ArrowRight } from "lucide-react";
import { useMapState } from "../state/mapState";
import type { AdviceCategory } from "../data/adviceScripts";
import { mapCopy } from "../copy/map";
import { getPersonViewData } from "../modules/personView/personViewData";
import { generatePersonSolution } from "../utils/personSolutionAI";
import { generatePersonViewInsightsFromAI } from "../utils/personViewAI";

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
  goalId,
  onClose,
  onOpenMission
}) => {
  const node = useMapState((s) => s.nodes.find((n) => n.id === nodeId));
  const updateNodeInsights = useMapState((s) => s.updateNodeInsights);

  const [viewScreen, setViewScreen] = useState<"diagnosis" | "solution">("diagnosis");
  const [showDiagnosisInsight, setShowDiagnosisInsight] = useState(false);
  const [solutionText, setSolutionText] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const hasAIInsights = !!node?.analysis?.insights;
  const viewData = node && node.analysis ? getPersonViewData(node, category, goalId) : null;
  const diagnosis = viewData?.diagnosis ?? null;
  const relationshipToneText = useMemo(() => {
    const label = diagnosis?.stateLabel ?? "";
    if (diagnosis?.isEmotionalCaptivity) return "في هدوء خارجي، بس لسه محتاجين نقفل الاختراق الداخلي.";
    if (label.includes("رمادية")) return "في هدوء خارجي، بس لسه محتاجين نقفل الاختراق الداخلي.";
    if (label.includes("حمراء") || label.includes("استنزاف")) return "الجبهة دي ضاغطة، وأولوية المرحلة حماية الموارد.";
    if (label.includes("صفراء")) return "في إشارات استنزاف، ومع ضبط الدرع الوضع يتحسن بسرعة.";
    if (label.includes("خضراء")) return "الجبهة متوازنة، والهدف الحفاظ على الاستقرار.";
    return "ده ملخص وضع الجبهة الحالي عشان القرار يبقى أوضح.";
  }, [diagnosis?.isEmotionalCaptivity, diagnosis?.stateLabel]);

  // توليد تشخيص / فهم / هدف مخصص من الذكاء الاصطناعي، مربوط بكل ما نعرفه عن الشخص
  useEffect(() => {
    if (!node || !node.analysis) return;
    // لو عندنا خلاص ملخص تشخيص من AI، نسيبها زي ما هي
    if (node.analysis.insights?.diagnosisSummary) return;

    let cancelled = false;
    generatePersonViewInsightsFromAI(node, category, goalId)
      .then((insights) => {
        if (!insights || cancelled) return;
        updateNodeInsights(node.id, insights);
      });

    return () => {
      cancelled = true;
    };
  }, [node, category, goalId, updateNodeInsights]);

  useEffect(() => {
    if (!diagnosis || !node) return;
    if (viewScreen !== "solution" || solutionText !== null || solutionLoading) return;
    setSolutionLoading(true);
    const input = {
      personLabel: node.label,
      personalizedTitle: diagnosis.personalizedTitle,
      stateLabel: diagnosis.stateLabel,
      goalAction: diagnosis.goalAction,
      understanding: diagnosis.understanding,
      isEmotionalCaptivity: diagnosis.isEmotionalCaptivity,
      understandingSubtext: diagnosis.understandingSubtext
    };
    generatePersonSolution(input)
      .then((text) => {
        setSolutionText(text ?? "تعذر توليد الحل. جرّب لاحقاً.");
      })
      .catch(() => setSolutionText("تعذر توليد الحل. جرّب لاحقاً."))
      .finally(() => setSolutionLoading(false));
  }, [viewScreen, node, diagnosis, solutionText, solutionLoading]);

  if (!node || !node.analysis || !diagnosis) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center py-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {node?.label ? `علاقتك مع ${node.label}` : "شخص غير موجود"}
            </h3>
            <p className="text-gray-500 mb-6">
              تمت إضافة هذا الشخص قبل تفعيل ميزة حفظ التحليل.
              <br />
              يمكنك حذفه وإضافته مرة أخرى للحصول على قراءة أدق.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700 z-10"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
        <AnimatePresence mode="wait">
          {viewScreen === "diagnosis" && (
            <motion.div
              key="diagnosis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mb-5 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-teal-800">قراءة الجبهة الحالية</p>
                <h3 className="mt-1 text-xl font-extrabold leading-tight text-slate-900">
                  علاقتك مع{" "}
                  <span className="inline-block max-w-[72vw] truncate align-bottom text-teal-700 sm:max-w-full" title={node.label}>
                    {node.label}
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  {relationshipToneText}
                </p>
              </div>
              {/* النتيجة الرئيسية — محتوى التشخيص بدون كلمة التشخيص */}
              <div className="p-6 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                  <span>{diagnosis.personalizedTitle}</span>
                  {hasAIInsights && (
                    <span
                      className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                      title="تم توليده/تعديله بالذكاء الاصطناعي"
                    >
                      AI
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-500 text-center">
                  <p>
                    الحالة: <span className="font-semibold text-slate-700">{diagnosis.stateLabel}</span>
                  </p>
                  {diagnosis.goalAction && (
                    <p className="w-full">
                      الهدف: <span className="font-semibold text-slate-700">{diagnosis.goalAction}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* فهم الوضع */}
              <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-right mb-6">
                <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>🔍</span> فهم الوضع
                  {hasAIInsights && (
                    <span
                      className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                      title="تم توليده/تعديله بالذكاء الاصطناعي"
                    >
                      AI
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {diagnosis.understanding}
                </p>
                {diagnosis.understandingSubtext && (
                  <p className="text-sm text-teal-800 mt-3 font-medium leading-relaxed">
                    {diagnosis.understandingSubtext}
                  </p>
                )}
              </div>

              {onOpenMission && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMission(node.id);
                    onClose();
                  }}
                  className="w-full mb-6 rounded-full bg-slate-900 text-white px-6 py-3 text-sm font-semibold shadow hover:bg-slate-800 active:scale-[0.99] transition-all duration-200"
                >
                  افتح شاشة المناورة
                </button>
              )}

              {diagnosis.showDetachmentSections && (
                <div className="p-5 bg-violet-50 border-2 border-violet-200 rounded-xl text-right mb-6">
                  <h3 className="text-sm font-bold text-violet-900 mb-2 flex items-center gap-2">
                    <span>توضيح الحالة</span>
                    {hasAIInsights && (
                      <span
                        className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                        title="تم توليده/تعديله بالذكاء الاصطناعي"
                      >
                        AI
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{diagnosis.enemyExplanation}</p>
                </div>
              )}

              {diagnosis.diagnosisSummary && (
                <div className="rounded-xl border-2 border-violet-200 overflow-hidden mb-6">
                  <motion.button
                    type="button"
                    onClick={() => setShowDiagnosisInsight((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-right bg-violet-50 hover:bg-violet-100 transition-colors duration-200 text-sm font-semibold text-violet-900"
                    whileTap={{ scale: 0.995 }}
                  >
                    <span className="flex items-center gap-2">
                      <span>✨</span> {mapCopy.diagnosisReadInsight}
                    </span>
                    <motion.span
                      animate={{ rotate: showDiagnosisInsight ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </motion.span>
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {showDiagnosisInsight && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-violet-50/80 border-t border-violet-100 text-right">
                          <p className="text-sm text-gray-700 leading-relaxed">{diagnosis.diagnosisSummary}</p>
                          <button
                            type="button"
                            onClick={() => setShowDiagnosisInsight(false)}
                            className="mt-2 text-xs text-slate-500 hover:text-slate-700 transition-colors duration-150"
                          >
                            {mapCopy.diagnosisCollapse}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                type="button"
                onClick={() => setViewScreen("solution")}
                className="w-full mt-6 rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>الحل</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {viewScreen === "solution" && (
            <motion.div
              key="solution"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-right"
            >
              <button
                type="button"
                onClick={() => setViewScreen("diagnosis")}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors active:scale-95 rounded-lg hover:bg-slate-100"
              >
                <ArrowRight className="w-4 h-4" aria-hidden />
                <span className="font-medium">رجوع</span>
              </button>
              {solutionLoading ? (
                <div className="p-6 text-center text-slate-500">
                  <p className="text-sm">جاري تحليل الوضع وتوليد حل مخصص...</p>
                </div>
              ) : solutionText ? (
                <div className="p-5 bg-teal-50 border-2 border-teal-200 rounded-xl">
                  <h3 className="text-sm font-bold text-teal-900 mb-2 flex items-center gap-2">
                    <span>💡</span> الحل المخصص
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{solutionText}</p>
                </div>
              ) : null}
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};
