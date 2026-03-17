"use client";

import { useEffect, useState } from "react";
import { Clock3, PlayCircle, Share2 } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { createLiveShare, listLiveSessions } from "../api";
import type { LiveSessionRecord } from "../types";

export default function LiveHistoryPage() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listLiveSessions()
      .then((result) => setSessions(result.sessions))
      .catch((err) => setError(err instanceof Error ? err.message : "history_failed"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-300/80">Dawayir Live</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">سجل الجلسات</h1>
            <p className="mt-3 text-sm text-slate-400">كل جلسة محفوظة هنا مع report، replay، وروابط المشاركة.</p>
          </div>
          <button
            type="button"
            onClick={() => assignUrl("/dawayir-live")}
            className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950"
          >
            جلسة جديدة
          </button>
        </div>

        {error && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {error === "AUTH_REQUIRED" && (
            <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 text-sm text-amber-50">
              يجب تسجيل الدخول لعرض سجل جلسات Dawayir Live.
            </div>
          )}
          {sessions.map((session) => (
            <div key={session.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{session.mode}</p>
                  <h2 className="mt-2 text-2xl font-black">{session.title || "جلسة Dawayir Live"}</h2>
                  <p className="mt-2 text-sm text-slate-400">{session.summary?.headline || "لم يُولد summary بعد."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {new Date(session.updated_at).toLocaleString("ar-EG")}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => assignUrl(`/dawayir-live/replay/${session.id}`)}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <PlayCircle className="h-4 w-4" />
                  Replay
                </button>
                <button
                  type="button"
                  onClick={() => assignUrl(`/dawayir-live/complete/${session.id}`)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await createLiveShare(session.id).catch(() => null);
                    if (result?.url) window.open(result.url, "_blank", "noopener,noreferrer");
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          ))}

          {sessions.length === 0 && !error && (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-400">
              لا توجد جلسات محفوظة بعد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
