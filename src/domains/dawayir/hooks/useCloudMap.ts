/**
 * Domain: Dawayir — useCloudMap hook
 *
 * مهاجر من src/hooks/useDawayirEngine.ts
 * يدير حالة التحليل بالـ AI وحفظ الخريطة في السحابة.
 */

"use client";
import { useState, useCallback } from "react";
import { cloudMapService } from "../services/cloudMap.service";
import type { DawayirMapState } from "../types";

interface UseCloudMapResult {
  data: DawayirMapState | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  analyzeAnswers: (answers: string[], maxNodes?: number) => Promise<void>;
  saveMap: (userId: string, title?: string) => Promise<void>;
  loadMap: (userId: string) => Promise<void>;
  clearError: () => void;
}

export function useCloudMap(): UseCloudMapResult {
  const [data, setData] = useState<DawayirMapState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeAnswers = useCallback(async (answers: string[], maxNodes = 50) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cloudMapService.analyzeAnswers(answers, maxNodes);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل الاتصال بمحرك الوعي.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveMap = useCallback(
    async (userId: string, title = "خريطتي") => {
      if (!data) return;
      setIsSaving(true);
      setError(null);
      try {
        const saved = await cloudMapService.saveMap(data, userId, title);
        setData(saved);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "فشل حفظ الخريطة.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [data]
  );

  const loadMap = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await cloudMapService.loadLatestMap(userId);
      if (loaded) setData(loaded);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل تحميل الخريطة.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    data,
    isLoading,
    isSaving,
    error,
    analyzeAnswers,
    saveMap,
    loadMap,
    clearError,
  };
}
