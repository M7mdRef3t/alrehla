"use client";

import { useEffect, useMemo, useState } from "react";
import { assignUrl } from "../../../services/navigation";
import { getLiveSession } from "../api";
import LiveCanvas from "../components/LiveCanvas";
import type { LiveSessionDetail } from "../types";

export default function LiveReplayPage({ sessionId }: { sessionId: string }) {
  const [detail, setDetail] = useState<LiveSessionDetail | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getLiveSession(sessionId)
      .then((result) => {
        setDetail(result);
        setIndex(Math.max(0, result.replayFrames.length - 1));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "replay_failed"));
  }, [sessionId]);

  const frame = useMemo(() => detail?.replayFrames[index]?.frame ?? null, [detail, index]);

  if (error) {
    return <div className="min-h-screen bg-slate-950 p-8 text-white">{error}</div>;
  }

  if (!detail || !frame) {
    return <div className="min-h-screen bg-slate-950 p-8 text-white">Loading replay...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute left-4 top-4 z-40 flex gap-2">
        <button
          type="button"
          onClick={() => assignUrl("/dawayir-live/history")}
          className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold backdrop-blur-xl"
        >
          رجوع للسجل
        </button>
      </div>

      <LiveCanvas
        circles={frame.circles}
        spawnedOthers={frame.spawnedOthers}
        spawnedTopics={frame.spawnedTopics}
        topicConnections={frame.topicConnections}
        thoughtMap={frame.thoughtMap}
        whyNowLine={frame.whyNowLine}
        isAgentSpeaking={false}
      />

      <div className="absolute bottom-6 left-1/2 z-40 w-[min(92vw,52rem)] -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Replay</p>
            <h1 className="mt-2 text-2xl font-black">{detail.session.title || "جلسة Dawayir Live"}</h1>
          </div>
          <div className="text-sm text-slate-400">
            {index + 1} / {detail.replayFrames.length}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, detail.replayFrames.length - 1)}
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
          className="mt-4 w-full"
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Journey Stage</p>
            <p className="mt-2 text-lg font-bold text-white">{frame.journeyStage}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Why Now</p>
            <p className="mt-2 text-sm text-slate-200">{frame.whyNowLine || "No why-now line at this step."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
