"use client";

import { useEffect, useState } from "react";
import { getLiveAdminAnalytics } from "../api";
import type { LiveAdminAnalytics } from "../types";

export default function LiveAdminPanel() {
  const [analytics, setAnalytics] = useState<LiveAdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getLiveAdminAnalytics()
      .then(setAnalytics)
      .catch((err) => setError(err instanceof Error ? err.message : "admin_live_failed"));
  }, []);

  if (error) {
    return <div className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-100">{error}</div>;
  }

  if (!analytics) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">Loading live analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Sessions", analytics.totalSessions],
          ["Completed", analytics.completedSessions],
          ["Active", analytics.activeSessions],
          ["Shared", analytics.sharedSessions],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">By Mode</p>
          <div className="mt-4 space-y-3">
            {analytics.byMode.map((item) => (
              <div key={item.mode} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <span>{item.mode}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">By Status</p>
          <div className="mt-4 space-y-3">
            {analytics.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <span>{item.status}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
