"use client";

import { useEffect, useState } from "react";
import { getLiveAdminAnalytics } from "../api";
import type { LiveAdminAnalytics } from '../types';
import { AdminTooltip } from "@/components/admin/dashboard/Overview/components/AdminTooltip";

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
    return <div className="rounded-[2rem] border border-app-border bg-app-muted p-5 text-sm text-app-muted-foreground">Loading live analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["إجمالي الجلسات", analytics.totalSessions, "Live Sessions", "إجمالي الجلسات التفاعلية اللي اتفتحت على الموديول اللايف حتى الآن."],
          ["مكتملة", analytics.completedSessions, "Completed", "جلسات اللايف اللي اكتملت لحد النهاية وطلعت نتايج/روشتات الوعي للمستخدم."],
          ["نشطة الآن", analytics.activeSessions, "Active", "المستخدمين اللي فاتحين اللايف ناو وبيعملوا الجلسة في اللحظة دي."],
          ["تمت المشاركة", analytics.sharedSessions, "Shared", "عدد الجلسات اللي اليوزرز عملولها شير على السوشيال ميديا كنوع من الـ Viral Loop."],
        ].map(([title, value, key, tooltip]) => (
          <div key={String(key)} className="rounded-[2rem] border border-app-border bg-app-muted p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-app-muted-foreground font-bold">{title}</p>
              <AdminTooltip content={String(tooltip)} position="bottom" />
            </div>
            <p className="mt-3 text-3xl font-black text-app-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-app-border bg-app-muted p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-app-muted-foreground">By Mode</p>
          <div className="mt-4 space-y-3">
            {analytics.byMode.map((item) => (
              <div key={item.mode} className="flex items-center justify-between rounded-2xl border border-app-border bg-app-surface/40 px-4 py-3">
                <span className="text-app-foreground">{item.mode}</span>
                <span className="font-bold text-app-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-app-border bg-app-muted p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-app-muted-foreground">By Status</p>
          <div className="mt-4 space-y-3">
            {analytics.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-2xl border border-app-border bg-app-surface/40 px-4 py-3">
                <span className="text-app-foreground">{item.status}</span>
                <span className="font-bold text-app-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
