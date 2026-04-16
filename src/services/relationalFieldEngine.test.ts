import { describe, expect, it } from "vitest";
import type { MapNode } from "@/modules/map/mapTypes";
import type { DawayirSignalEventV1 } from "@/modules/recommendation/types";
import type { PulseEntry } from "@/domains/consciousness/store/pulse.store";
import type { FlowStep, JourneyEvent } from "./journeyTracking";
import { buildRelationalFieldSnapshot } from "./relationalFieldEngine";

const NOW = new Date("2026-02-18T12:00:00Z").getTime();

function node(
  id: string,
  ring: MapNode["ring"],
  partial?: Partial<MapNode>
): MapNode {
  return {
    id,
    label: `Node ${id}`,
    ring,
    x: 0,
    y: 0,
    recoveryProgress: {
      completedSteps: [],
      situationLogs: [],
      pathStage: "awareness"
    },
    ...partial
  };
}

function signal(
  type: DawayirSignalEventV1["type"],
  timestamp: number,
  payload?: Record<string, unknown>
): DawayirSignalEventV1 {
  return {
    id: `${type}_${timestamp}`,
    type,
    timestamp,
    payload
  };
}

function flowEvent(step: FlowStep, timestamp: number): JourneyEvent {
  return {
    type: "flow_event",
    client_event_id: `flow_${timestamp}`,
    timestamp,
    payload: {
      step
    },
    sessionId: "sess_1"
  };
}

function taskCompleted(timestamp: number): JourneyEvent {
  return {
    type: "task_completed",
    client_event_id: `task_${timestamp}`,
    timestamp,
    payload: {
      pathId: "path_protection",
      taskId: `task_${timestamp}`,
      date: "2026-02-18"
    }
  };
}

function pulse(
  mood: PulseEntry["mood"],
  energy: number,
  timestamp: number
): PulseEntry {
  return {
    mood,
    energy,
    focus: "event",
    timestamp
  };
}

describe("relationalFieldEngine", () => {
  it("detects recurrence hidden pattern from periodic stress signals", () => {
    const signals: DawayirSignalEventV1[] = [];
    for (let i = 0; i < 7; i += 1) {
      const ts = NOW - i * 24 * 60 * 60 * 1000;
      signals.push(signal("ring_changed", ts, { fromRing: "yellow", toRing: "red" }));
      signals.push(signal("situation_logged", ts + 90 * 60 * 1000, { feeling: "tense" }));
    }

    const snapshot = buildRelationalFieldSnapshot({
      now: NOW,
      nodes: [node("1", "red"), node("2", "yellow"), node("3", "green")],
      pulses: [
        pulse("anxious", 3, NOW - 2 * 24 * 60 * 60 * 1000),
        pulse("calm", 6, NOW - 1 * 24 * 60 * 60 * 1000)
      ],
      signals,
      journeyEvents: [],
      entropyScore: 62
    });

    expect(snapshot.hiddenPattern?.kind).toBe("recurrence_wave");
    expect(snapshot.hiddenPattern?.periodHours).toBeGreaterThanOrEqual(12);
    expect(snapshot.hiddenPattern?.periodHours).toBeLessThanOrEqual(72);
    expect((snapshot.hiddenPattern?.periodHours ?? 0) % 6).toBe(0);
    expect(snapshot.flow.dominantFrequencyHours).toBe(snapshot.hiddenPattern?.periodHours ?? null);
  });

  it("converts pain to measurable dividend when stress trend improves", () => {
    const signals: DawayirSignalEventV1[] = [
      signal("ring_changed", NOW - 6 * 24 * 60 * 60 * 1000, { fromRing: "yellow", toRing: "red" }),
      signal("ring_changed", NOW - 5.5 * 24 * 60 * 60 * 1000, { fromRing: "yellow", toRing: "red" }),
      signal("ring_changed", NOW - 5 * 24 * 60 * 60 * 1000, { fromRing: "yellow", toRing: "red" }),
      signal("path_stage_changed", NOW - 2 * 24 * 60 * 60 * 1000, { fromStage: "resistance", toStage: "acceptance" }),
      signal("path_stage_changed", NOW - 1 * 24 * 60 * 60 * 1000, { fromStage: "acceptance", toStage: "integration" })
    ];

    const journeyEvents: JourneyEvent[] = [
      taskCompleted(NOW - 36 * 60 * 60 * 1000),
      taskCompleted(NOW - 20 * 60 * 60 * 1000),
      flowEvent("next_step_action_taken", NOW - 16 * 60 * 60 * 1000)
    ];

    const snapshot = buildRelationalFieldSnapshot({
      now: NOW,
      nodes: [
        node("1", "yellow", {
          recoveryProgress: {
            completedSteps: ["a", "b", "c", "d", "e"],
            situationLogs: [],
            pathStage: "integration",
            boundaryLegitimacyScore: 82
          },
          missionProgress: { isCompleted: true, checkedSteps: [0, 1] }
        }),
        node("2", "green", {
          recoveryProgress: {
            completedSteps: ["a", "b", "c"],
            situationLogs: [],
            pathStage: "acceptance",
            boundaryLegitimacyScore: 76
          }
        })
      ],
      pulses: [
        pulse("overwhelmed", 3, NOW - 6 * 24 * 60 * 60 * 1000),
        pulse("anxious", 4, NOW - 5 * 24 * 60 * 60 * 1000),
        pulse("calm", 7, NOW - 2 * 24 * 60 * 60 * 1000),
        pulse("hopeful", 8, NOW - 1 * 24 * 60 * 60 * 1000)
      ],
      signals,
      journeyEvents,
      entropyScore: 34
    });

    expect(snapshot.pain.baselinePain).toBeGreaterThanOrEqual(snapshot.pain.painFieldIntensity);
    expect(snapshot.pain.recoveryMomentum).toBeGreaterThan(0);
    expect(snapshot.pain.painDividend).toBeGreaterThan(0);
  });

  it("recommends an intervention scenario under high pressure", () => {
    const snapshot = buildRelationalFieldSnapshot({
      now: NOW,
      nodes: [
        node("1", "red", {
          detachmentMode: true,
          recoveryProgress: {
            completedSteps: [],
            situationLogs: [],
            pathStage: "resistance",
            ruminationLogCount: 6
          }
        }),
        node("2", "red", {
          recoveryProgress: {
            completedSteps: [],
            situationLogs: [],
            pathStage: "awareness",
            ruminationLogCount: 4
          }
        }),
        node("3", "yellow")
      ],
      pulses: [
        pulse("anxious", 3, NOW - 4 * 60 * 60 * 1000),
        pulse("angry", 2, NOW - 8 * 60 * 60 * 1000),
        pulse("overwhelmed", 3, NOW - 15 * 60 * 60 * 1000),
        pulse("sad", 2, NOW - 20 * 60 * 60 * 1000)
      ],
      signals: [
        signal("ring_changed", NOW - 18 * 60 * 60 * 1000, { fromRing: "yellow", toRing: "red" }),
        signal("detachment_toggled", NOW - 10 * 60 * 60 * 1000, { value: true })
      ],
      journeyEvents: [
        flowEvent("pulse_abandoned", NOW - 2 * 60 * 60 * 1000),
        flowEvent("pulse_abandoned", NOW - 1 * 60 * 60 * 1000)
      ],
      entropyScore: 84
    });

    expect(snapshot.pain.painFieldIntensity).toBeGreaterThanOrEqual(60);
    expect(snapshot.twin.recommended.id).not.toBe("no_action");
    expect(snapshot.twin.recommended.predictedPain).toBeLessThanOrEqual(snapshot.pain.painFieldIntensity);
  });
});
