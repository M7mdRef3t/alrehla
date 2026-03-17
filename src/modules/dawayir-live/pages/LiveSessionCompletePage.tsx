"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Link2, RotateCcw } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { createLiveShare, getLiveSession } from "../api";
import type { LiveSessionArtifactRecord, LiveSessionDetail } from "../types";

function findArtifact(artifacts: LiveSessionArtifactRecord[], type: string) {
  return artifacts.find((artifact) => artifact.artifact_type === type);
}

export default function LiveSessionCompletePage({ sessionId }: { sessionId: string }) {
  const [detail, setDetail] = useState<LiveSessionDetail | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getLiveSession(sessionId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "complete_failed"));
  }, [sessionId]);

  const summary = useMemo(() => detail?.session.summary ?? null, [detail]);
  const truthContract = useMemo(() => findArtifact(detail?.artifacts ?? [], "truth_contract"), [detail]);
  const loopRecall = useMemo(() => findArtifact(detail?.artifacts ?? [], "loop_recall"), [detail]);

  if (error) {
    return <div className="min-h-screen bg-slate-950 p-8 text-white">{error}</div>;
  }

  if (!detail) {
    return <div className="min-h-screen bg-slate-950 p-8 text-white">Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-300/80">Session Complete</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">{summary?.title || detail.session.title || "جلسة مكتملة"}</h1>
            <p className="mt-3 text-sm text-slate-400">{summary?.headline || "تم حفظ الجلسة بنجاح داخل المنصة."}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => assignUrl(`/dawayir-live/replay/${sessionId}`)}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Replay
            </button>
            <button
              type="button"
              onClick={async () => {
                const result = await createLiveShare(sessionId).catch(() => null);
                setShareUrl(result?.url ?? null);
              }}
              className="flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950"
            >
              <Link2 className="h-4 w-4" />
              Judge Share
            </button>
          </div>
        </div>

        {shareUrl && (
          <div className="mb-6 rounded-3xl border border-teal-400/25 bg-teal-400/10 p-4 text-sm text-teal-50">
            رابط المشاركة: <a href={shareUrl} className="underline">{shareUrl}</a>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl md:col-span-2">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Breakthroughs</p>
            <div className="mt-4 space-y-3">
              {(summary?.breakthroughs ?? []).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Next Moves</p>
            <div className="mt-4 space-y-3">
              {(summary?.nextMoves ?? []).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Truth Contract</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {((truthContract?.content?.promises as string[]) || []).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">{item}</div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Loop Recall</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                {(loopRecall?.content?.title as string) || "لم يتم توليد loop recall بعد."}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                {(loopRecall?.content?.trigger as string) || ""}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl md:col-span-2">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Artifacts</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {detail.artifacts.map((artifact) => (
                <div key={artifact.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{artifact.title || artifact.artifact_type}</p>
                      <p className="text-xs text-slate-400">{artifact.artifact_type}</p>
                    </div>
                    {artifact.storage_path && (
                      <Download className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
