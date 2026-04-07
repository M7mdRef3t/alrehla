/**
 * useAIQuestionGenerator — React Hook للتكامل مع AI Curator
 * =============================================================
 * يستخدمه الـ DailyPulseWidget عشان يولّد أسئلة ديناميكية
 */

import { useState, useEffect, useCallback } from "react";
import { aiCurator, buildUserContext } from "../ai/aiCurator";
import { useMapState } from "../state/mapState";
import { useDailyJournalState } from "../state/dailyJournalState";
import { useShadowPulseState } from "../state/shadowPulseState";
import { computeTEI } from "../utils/traumaEntropyIndex";
import type { DailyQuestion } from "../data/dailyQuestions";
import type { UserContext } from "../ai/aiCurator";
import type { PersonViewInsights } from "../modules/map/mapTypes";

interface UseAIQuestionGeneratorResult {
  /** السؤال المُولّد */
  generatedQuestion: DailyQuestion | null;
  /** هل التوليد شغال؟ */
  isGenerating: boolean;
  /** هل في error؟ */
  error: string | null;
  /** دالة لتوليد سؤال جديد */
  generateQuestion: () => Promise<void>;
  /** هل الـ AI متاح؟ */
  isAIAvailable: boolean;
}

/**
 * Hook رئيسي لتوليد الأسئلة بالـ AI
 */
export function useAIQuestionGenerator(): UseAIQuestionGeneratorResult {
  const [generatedQuestion, setGeneratedQuestion] = useState<DailyQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(false);

  const nodes = useMapState((state) => state.nodes);
  const journalEntries = useDailyJournalState((state) => state.entries);
  const shadowScores = useShadowPulseState((state) => state.scores);

  // تحقق من توفر الـ AI عند التحميل
  useEffect(() => {
    (async () => {
      try {
        const { geminiClient } = await import("../services/geminiClient");
        setIsAIAvailable(geminiClient.isAvailable());
      } catch (err) {
        setIsAIAvailable(false);
      }
    })();
  }, []);

  /**
   * بناء UserContext كامل من الـ state الحالي
   */
  const buildCompleteUserContext = useCallback((): UserContext => {
    const activeNodes = nodes.filter((n) => !n.isNodeArchived);
    const teiResult = computeTEI(nodes);

    // أكتر شخص في Shadow Pulse
    const shadowList = Object.values(shadowScores).sort((a, b) => b.score - a.score);
    const topShadowPerson = shadowList[0]
      ? {
          label: activeNodes.find((n) => n.id === shadowList[0].nodeId)?.label || "غير معروف",
          score: shadowList[0].score,
        }
      : undefined;

    // آخر 3 إجابات
    const recentAnswers = journalEntries
      .slice(0, 3)
      .map((e) => ({
        question: e.questionText,
        answer: e.answer,
      }));

    // عدد أيام الرحلة (من أول شخص اتضاف)
    const oldestNode = activeNodes
      .filter((n) => n.journeyStartDate)
      .sort((a, b) => (a.journeyStartDate || 0) - (b.journeyStartDate || 0))[0];
    const journeyDays = oldestNode
      ? Math.floor((Date.now() - (oldestNode.journeyStartDate || 0)) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalNodes: activeNodes.length,
      redCircles: activeNodes.filter((n) => n.ring === "red").length,
      yellowCircles: activeNodes.filter((n) => n.ring === "yellow").length,
      greenCircles: activeNodes.filter((n) => n.ring === "green").length,
      teiScore: teiResult.score,
      recentAnswers,
      topShadowPerson,
      journeyDays,
      hasCompletedTraining: activeNodes.some((n) => n.hasCompletedTraining),
    };
  }, [nodes, journalEntries, shadowScores]);

  /**
   * توليد سؤال جديد
   */
  const generateQuestion = useCallback(async () => {
    if (!isAIAvailable) {
      setError("AI غير متاح حالياً");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const context = buildCompleteUserContext();
      const question = await aiCurator.generateDailyQuestion(context);

      if (question) {
        setGeneratedQuestion(question);
        setError(null);
      } else {
        setError("فشل توليد السؤال. حاول مرة تانية.");
      }
    } catch (err) {
      console.error("Error generating question:", err);
      setError("حدث خطأ أثناء التوليد");
    } finally {
      setIsGenerating(false);
    }
  }, [isAIAvailable, buildCompleteUserContext]);

  return {
    generatedQuestion,
    isGenerating,
    error,
    generateQuestion,
    isAIAvailable,
  };
}

/**
 * Hook لتوليد Content Packet (greeting + mission)
 */
export function useAIContentGenerator() {
  const [contentPacket, setContentPacket] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodes = useMapState((state) => state.nodes);
  const journalEntries = useDailyJournalState((state) => state.entries);
  const shadowScores = useShadowPulseState((state) => state.scores);

  const buildCompleteUserContext = useCallback((): UserContext => {
    const activeNodes = nodes.filter((n) => !n.isNodeArchived);
    const teiResult = computeTEI(nodes);

    const shadowList = Object.values(shadowScores).sort((a, b) => b.score - a.score);
    const topShadowPerson = shadowList[0]
      ? {
          label: activeNodes.find((n) => n.id === shadowList[0].nodeId)?.label || "غير معروف",
          score: shadowList[0].score,
        }
      : undefined;

    const recentAnswers = journalEntries
      .slice(0, 3)
      .map((e) => ({
        question: e.questionText,
        answer: e.answer,
      }));

    const oldestNode = activeNodes
      .filter((n) => n.journeyStartDate)
      .sort((a, b) => (a.journeyStartDate || 0) - (b.journeyStartDate || 0))[0];
    const journeyDays = oldestNode
      ? Math.floor((Date.now() - (oldestNode.journeyStartDate || 0)) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalNodes: activeNodes.length,
      redCircles: activeNodes.filter((n) => n.ring === "red").length,
      yellowCircles: activeNodes.filter((n) => n.ring === "yellow").length,
      greenCircles: activeNodes.filter((n) => n.ring === "green").length,
      teiScore: teiResult.score,
      recentAnswers,
      topShadowPerson,
      journeyDays,
      hasCompletedTraining: activeNodes.some((n) => n.hasCompletedTraining),
    };
  }, [nodes, journalEntries, shadowScores]);

  const generateContent = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const context = buildCompleteUserContext();
      const packet = await aiCurator.generateContentPacket(context);

      if (packet) {
        setContentPacket(packet);
        setError(null);
      } else {
        setError("فشل توليد المحتوى");
      }
    } catch (err) {
      console.error("Error generating content:", err);
      setError("حدث خطأ أثناء التوليد");
    } finally {
      setIsGenerating(false);
    }
  }, [buildCompleteUserContext]);

  return {
    contentPacket,
    isGenerating,
    error,
    generateContent,
  };
}

/**
 * Hook لتوليد Insights لشخص معين
 */
export function useAIPersonInsights(nodeId: string | null) {
  const [insights, setInsights] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodes = useMapState((state) => state.nodes);
  const updateNodeInsights = useMapState((state) => state.updateNodeInsights);

  const generateInsights = useCallback(async () => {
    if (!nodeId) return;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setIsGenerating(true);
    setError(null);

    try {
      const generatedInsights = await aiCurator.generatePersonInsights(node);

      if (generatedInsights) {
        setInsights(generatedInsights);
        setError(null);

        // حفظ في الـ state
        const mappedInsights: PersonViewInsights = {
          diagnosisSummary: generatedInsights.diagnosis,
          symptomsInterpretation: generatedInsights.symptoms?.join("، "),
          solutionSuggestions: generatedInsights.solution,
          planHighlights: generatedInsights.planSuggestion ? [generatedInsights.planSuggestion] : undefined,
        };
        updateNodeInsights(nodeId, mappedInsights);
      } else {
        setError("فشل توليد التحليل");
      }
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("حدث خطأ أثناء التوليد");
    } finally {
      setIsGenerating(false);
    }
  }, [nodeId, nodes, updateNodeInsights]);

  return {
    insights,
    isGenerating,
    error,
    generateInsights,
  };
}
