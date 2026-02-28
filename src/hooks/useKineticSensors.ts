import { useCallback, useRef, useState } from "react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { writeLatestKineticTelemetry, type KineticTelemetrySnapshot } from "../services/kineticTelemetry";

type Point = { x: number; y: number };
type ActiveDragSession = {
  nodeId: string;
  startedAt: number;
  startPoint: Point;
  firstMoveAt: number | null;
  points: Point[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pointFromActivatorEvent(event: DragStartEvent["activatorEvent"]): Point {
  const e = event as unknown as Record<string, unknown>;
  const touches = e.touches as Array<{ clientX: number; clientY: number }> | undefined;
  if (Array.isArray(touches) && touches.length > 0) {
    return { x: Number(touches[0].clientX) || 0, y: Number(touches[0].clientY) || 0 };
  }
  const changedTouches = e.changedTouches as Array<{ clientX: number; clientY: number }> | undefined;
  if (Array.isArray(changedTouches) && changedTouches.length > 0) {
    return { x: Number(changedTouches[0].clientX) || 0, y: Number(changedTouches[0].clientY) || 0 };
  }
  if (typeof e.clientX === "number" && typeof e.clientY === "number") {
    return { x: e.clientX, y: e.clientY };
  }
  return { x: 0, y: 0 };
}

function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function classifyKineticProfile(
  velocityPxPerSec: number,
  hesitationMs: number,
  erraticDeviation: number
): KineticTelemetrySnapshot["profile"] {
  if (velocityPxPerSec >= 900 && hesitationMs <= 400) return "impulsive_aggressive";
  if (hesitationMs >= 1600) return "hesitant_anxious";
  if (erraticDeviation >= 0.55) return "scattered_unsettled";
  return "grounded_deliberate";
}

function toSummary(profile: KineticTelemetrySnapshot["profile"]): string {
  if (profile === "impulsive_aggressive") return "Kinetic Profile: Impulsive / Aggressive state.";
  if (profile === "hesitant_anxious") return "Kinetic Profile: Hesitant / Anxious state.";
  if (profile === "scattered_unsettled") return "Kinetic Profile: Scattered / Unsettled state.";
  return "Kinetic Profile: Grounded / Deliberate state.";
}

export function useKineticSensors() {
  const activeRef = useRef<ActiveDragSession | null>(null);
  const [latest, setLatest] = useState<KineticTelemetrySnapshot | null>(null);

  const onDragStart = useCallback((event: DragStartEvent) => {
    const startPoint = pointFromActivatorEvent(event.activatorEvent);
    activeRef.current = {
      nodeId: String(event.active.id),
      startedAt: performance.now(),
      startPoint,
      firstMoveAt: null,
      points: [startPoint]
    };
  }, []);

  const onDragMove = useCallback((event: DragMoveEvent) => {
    const active = activeRef.current;
    if (!active) return;
    if (active.firstMoveAt == null) active.firstMoveAt = performance.now();

    const next: Point = {
      x: active.startPoint.x + event.delta.x,
      y: active.startPoint.y + event.delta.y
    };
    active.points.push(next);
  }, []);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const active = activeRef.current;
    activeRef.current = null;
    if (!active) return null;

    const endedAt = performance.now();
    const durationMs = Math.max(endedAt - active.startedAt, 1);
    const finalPoint: Point = {
      x: active.startPoint.x + event.delta.x,
      y: active.startPoint.y + event.delta.y
    };
    const points = active.points.length ? [...active.points, finalPoint] : [active.startPoint, finalPoint];

    const straightDistance = Math.max(distance(active.startPoint, finalPoint), 0.001);
    const traveledDistance = points.slice(1).reduce((sum, p, idx) => sum + distance(points[idx], p), 0);
    const velocityPxPerSec = (straightDistance / durationMs) * 1000;
    const hesitationMs = Math.max((active.firstMoveAt ?? endedAt) - active.startedAt, 0);
    const erraticDeviation = Math.max(0, traveledDistance / straightDistance - 1);

    const profile = classifyKineticProfile(velocityPxPerSec, hesitationMs, erraticDeviation);
    const snapshot: KineticTelemetrySnapshot = {
      nodeId: active.nodeId,
      measuredAt: new Date().toISOString(),
      velocityPxPerSec: round2(velocityPxPerSec),
      hesitationMs: Math.round(hesitationMs),
      erraticDeviation: round2(erraticDeviation),
      profile,
      summary: toSummary(profile)
    };

    setLatest(snapshot);
    writeLatestKineticTelemetry(snapshot);

    console.log("[KineticSensors]", {
      nodeId: snapshot.nodeId,
      velocityPxPerSec: snapshot.velocityPxPerSec,
      hesitationMs: snapshot.hesitationMs,
      erraticDeviation: snapshot.erraticDeviation,
      profile: snapshot.profile
    });

    return snapshot;
  }, []);

  return {
    latestKineticSnapshot: latest,
    onDragStart,
    onDragMove,
    onDragEnd
  };
}
