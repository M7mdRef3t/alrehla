/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧠 useAdaptiveLayout Hook — محرك التخطيط التكيفي
 * ════════════════════════════════════════════════════════════════════════════
 *
 * يحسب الوضع الأنسب للواجهة تلقائياً بناءً على:
 * - عدد الدوائر
 * - TEI Score
 * - Shadow Score
 * - سؤال اليوم
 * - الوقت من اليوم
 * - سلوك المستخدم
 */

import { useEffect, useMemo } from "react";
import { useLayoutState } from "@/domains/dawayir/store/layout.store";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { useDailyQuestion } from "./useDailyQuestion";
import { computeTEI } from "@/utils/traumaEntropyIndex";
import { getShadowScore } from "@/domains/consciousness/store/shadowPulse.store";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function useAdaptiveLayout() {
  const mode = useLayoutState((s) => s.mode);
  const setMode = useLayoutState((s) => s.setMode);
  const getSuggestedMode = useLayoutState((s) => s.getSuggestedMode);
  const userPreferredMode = useLayoutState((s) => s.userPreferredMode);

  // ─── Context Data ─────────────────────────────────────────────────────────
  const nodes = useMapState((s) => s.nodes);
  const { hasAnsweredToday } = useDailyQuestion();

  const nodesCount = useMemo(() => {
    return nodes.filter((n) => !n.isNodeArchived).length;
  }, [nodes]);

  const teiScore = useMemo(() => {
    return computeTEI(nodes).score;
  }, [nodes]);

  const shadowScore = useMemo(() => {
    return getShadowScore();
  }, []);

  const currentHour = useMemo(() => {
    return new Date().getHours();
  }, []);

  // ─── Suggested Mode ───────────────────────────────────────────────────────
  const suggestedMode = useMemo(() => {
    return getSuggestedMode({
      nodesCount,
      teiScore,
      shadowScore,
      hasAnsweredPulse: hasAnsweredToday,
      currentHour
    });
  }, [
    getSuggestedMode,
    nodesCount,
    teiScore,
    shadowScore,
    hasAnsweredToday,
    currentHour
  ]);

  // ─── Auto-Apply Adaptive Mode ────────────────────────────────────────────
  useEffect(() => {
    // فقط لو المستخدم في adaptive mode ومفضلش وضع معين
    if (mode === "adaptive" && !userPreferredMode) {
      setMode(suggestedMode);
    }
  }, [mode, suggestedMode, userPreferredMode, setMode]);

  // ─── Return ───────────────────────────────────────────────────────────────
  return {
    /** الوضع الحالي */
    currentMode: mode,
    /** الوضع المقترح من النظام الذكي */
    suggestedMode,
    /** هل المستخدم في adaptive mode؟ */
    isAdaptive: mode === "adaptive",
    /** البيانات اللي اتبنى عليها القرار */
    context: {
      nodesCount,
      teiScore,
      shadowScore,
      hasAnsweredPulse: hasAnsweredToday,
      currentHour
    }
  };
}
