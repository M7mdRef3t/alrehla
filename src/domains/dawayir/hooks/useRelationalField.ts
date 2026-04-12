/**
 * Domain: Dawayir — useRelationalField hook
 *
 * المحرك التحليلي — يحسب الـ snapshot ويعرضه للـ UI
 * مع دعم caching لتجنب إعادة الحساب في كل render.
 */

"use client";
import { useState, useCallback, useRef } from "react";
import { relationalAnalysisService } from "../services/relational.service";
import type { RelationalFieldSnapshot } from "../types";

const CACHE_TTL_MS = 30_000; // 30s — لا نعيد الحساب إلا بعد 30 ثانية

export function useRelationalField() {
  const [snapshot, setSnapshot] = useState<RelationalFieldSnapshot | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const lastComputedAt = useRef<number>(0);

  const computeSnapshot = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (!force && now - lastComputedAt.current < CACHE_TTL_MS) {
        return snapshot; // return cached
      }

      setIsComputing(true);
      try {
        // جري في microtask لتجنب block الـ UI
        const result = await Promise.resolve(
          relationalAnalysisService.computeCurrentSnapshot(now)
        );
        lastComputedAt.current = now;
        setSnapshot(result);
        return result;
      } finally {
        setIsComputing(false);
      }
    },
    [snapshot]
  );

  const painSummary = snapshot
    ? relationalAnalysisService.interpretPainLevel(snapshot.pain.painFieldIntensity)
    : null;

  const twinSummary = snapshot
    ? relationalAnalysisService.summarizeTwinRecommendation(snapshot)
    : null;

  return {
    snapshot,
    isComputing,
    painSummary,
    twinSummary,
    computeSnapshot,
    lastComputedAt: lastComputedAt.current,
  };
}
