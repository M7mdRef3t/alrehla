"use client";

import { useEffect, useState } from "react";
import { assignUrl } from "../../../services/navigation";
import { listCoachLiveSessions } from "../api";
import type { LiveSessionRecord } from "../types";

export default function LiveCoachPanel() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listCoachLiveSessions()
      .then((result) => setSessions(result.sessions))
      .catch((err) => setError(err instanceof Error ? err.message : "coach_live_failed"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-300/80">Coach Dashboard</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">جلسات Dawayir Live المشتركة معك</h1>
        {error && <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm">{error}</div>}
        <div className="mt-8 grid gap-4">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => assignUrl(`/dawayir-live/complete/${session.id}`)}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-right shadow-xl backdrop-blur-xl"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{session.mode}</p>
              <h2 className="mt-2 text-2xl font-black">{session.title || "جلسة Dawayir Live"}</h2>
              <p className="mt-2 text-sm text-slate-400">{session.summary?.headline || "No summary yet."}</p>
            </button>
          ))}
          {sessions.length === 0 && !error && (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-400">
              لا توجد جلسات coach مخصصة لك حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
