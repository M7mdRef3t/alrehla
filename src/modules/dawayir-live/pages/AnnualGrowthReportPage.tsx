"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CalendarDays, Sparkles, Star, Trophy, TrendingUp } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { listLiveSessions } from "../api";
import type { LiveSessionRecord } from "../types";

type MonthlyBucket = {
  label: string;
  count: number;
  clarity: number;
  hours: number;
};

const MONTH_LABELS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function sortSessionsByRecent(list: LiveSessionRecord[]) {
  return [...list].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

function buildMonthlyBuckets(sessions: LiveSessionRecord[], lang: "ar" | "en") {
  const labels = lang === "ar" ? MONTH_LABELS_AR : MONTH_LABELS_EN;
  const map = new Map<string, MonthlyBucket>();

  sessions.forEach((session) => {
    const date = new Date(session.updated_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const current = map.get(key) ?? {
      label: labels[date.getMonth()],
      count: 0,
      clarity: 0,
      hours: 0,
    };

    current.count += 1;
    current.clarity += Number(session.metrics?.clarityDelta ?? 0) || 0;
    current.hours += Math.max(0.25, (new Date(session.ended_at || session.updated_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60 * 60));
    map.set(key, current);
  });

  return [...map.values()].slice(-12);
}

function formatSessionLabel(session: LiveSessionRecord | undefined, lang: "ar" | "en") {
  if (!session) {
    return lang === "ar" ? "لا توجد جلسات بعد" : "No sessions yet";
  }

  const title = session.title?.trim().length ? session.title : lang === "ar" ? "جلسة دواير لايف" : "Dawayir Live Session";
  const dateLabel = new Date(session.updated_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  });
  return `${title} • ${dateLabel}`;
}

export default function AnnualGrowthReportPage() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    void listLiveSessions()
      .then((result) => {
        setSessions(result.sessions);
        setLang(result.sessions.some((session) => session.language === "ar") ? "ar" : "en");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "annual_report_failed"));
  }, []);

  const recentSessions = useMemo(() => sortSessionsByRecent(sessions), [sessions]);
  const annualSessions = useMemo(() => {
    const year = new Date().getFullYear();
    return sessions.filter((session) => new Date(session.updated_at).getFullYear() === year);
  }, [sessions]);

  const totalHours = useMemo(() => {
    return annualSessions.reduce((total, session) => {
      const durationHours = Math.max(
        0.25,
        (new Date(session.ended_at || session.updated_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60 * 60),
      );
      return total + durationHours;
    }, 0);
  }, [annualSessions]);

  const insightPoints = useMemo(() => {
    return annualSessions.reduce((total, session) => {
      const clarity = Number(session.metrics?.clarityDelta ?? 0) || 0;
      const equilibrium = Number(session.metrics?.equilibriumScore ?? 0) || 0;
      return total + Math.round((clarity + equilibrium) * 120);
    }, 0);
  }, [annualSessions]);

  const avgClarity = useMemo(() => {
    if (!annualSessions.length) return 0;
    const sum = annualSessions.reduce((total, session) => total + (Number(session.metrics?.clarityDelta ?? 0) || 0), 0);
    return Math.round((sum / annualSessions.length) * 100);
  }, [annualSessions]);

  const monthlyBuckets = useMemo(() => buildMonthlyBuckets(annualSessions, lang), [annualSessions, lang]);
  const bestMonth = useMemo(() => {
    if (!monthlyBuckets.length) return null;
    return [...monthlyBuckets].sort((left, right) => right.clarity - left.clarity)[0];
  }, [monthlyBuckets]);

  const topSession = recentSessions[0];
  const maxClarity = Math.max(...monthlyBuckets.map((bucket) => Math.abs(bucket.clarity)), 1);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:py-12" dir="rtl" style={{ fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif" }}>
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => assignUrl("/dawayir-live/history")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          {lang === "ar" ? "العودة إلى الأرشيف" : "Back to archive"}
        </button>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/20 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[11px] font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                {lang === "ar" ? "ملخص النمو السنوي" : "Annual Growth Report"}
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  {lang === "ar" ? "ملخص سنوي شامل لتحوّلاتك" : "A complete yearly summary of your growth"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
                  {lang === "ar"
                    ? "يجمع هذا التقرير الجلسات، والاتجاهات، ولحظات التحول الأساسية خلال السنة الحالية في لوحة واحدة واضحة."
                    : "This report gathers sessions, trends, and key turning points from the current year into one board."}
                </p>
              </div>
            </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => assignUrl("/dawayir-live/history")}
              className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-transform hover:-translate-y-0.5"
              >
                {lang === "ar" ? "فتح الأرشيف" : "Open Archive"}
              </button>
              <button
                type="button"
                onClick={() => assignUrl("/dawayir-live")}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition-transform hover:-translate-y-0.5 hover:bg-white/10"
              >
              {lang === "ar" ? "جلسة جديدة" : "New Session"}
            </button>
          </div>
          <p className="mt-2 text-sm text-white/55">
            {lang === "ar"
              ? "يمكنك فتح الأرشيف للتفاصيل أو بدء جلسة جديدة إذا أردت استمرار الرحلة."
              : "You can open the archive for details or start a new session to continue the journey."}
          </p>
        </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: lang === "ar" ? "جلسات السنة" : "Year Sessions", value: annualSessions.length, note: lang === "ar" ? "الجلسات المكتملة" : "Completed sessions" },
              { label: lang === "ar" ? "ساعات التأمل" : "Meditation Hours", value: totalHours.toFixed(1), note: lang === "ar" ? "مجمعة هذا العام" : "Accumulated this year" },
              { label: lang === "ar" ? "نقاط البصيرة" : "Insight Points", value: insightPoints, note: lang === "ar" ? "مؤشر تقديري للنمو" : "Estimated growth signal" },
              { label: lang === "ar" ? "متوسط الوضوح" : "Avg Clarity", value: `${avgClarity >= 0 ? "+" : ""}${avgClarity}%`, note: lang === "ar" ? "متوسط التحول السنوي" : "Yearly average shift" },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">{item.label}</div>
                <div className="mt-2 text-3xl font-black text-white">{item.value}</div>
                <div className="mt-1 text-xs text-white/50">{item.note}</div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">{lang === "ar" ? "التحول الشهري" : "Monthly shift"}</div>
                  <h2 className="mt-1 text-xl font-bold">{lang === "ar" ? "تطور الذكاء العاطفي خلال السنة" : "Emotional intelligence trend across the year"}</h2>
                </div>
                <BarChart3 className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-6 grid grid-cols-12 items-end gap-3">
                {monthlyBuckets.length ? (
                  monthlyBuckets.map((bucket, index) => {
                    const barHeight = Math.max(12, Math.round((Math.abs(bucket.clarity) / maxClarity) * 120));
                    return (
                      <div key={`${bucket.label}-${index}`} className="col-span-1 flex flex-col items-center gap-2">
                        <div className="flex h-36 w-full items-end justify-center">
                          <div
                            className="w-full max-w-5 rounded-t-full bg-gradient-to-t from-sky-400 to-violet-400 shadow-[0_0_18px_rgba(56,189,248,0.22)]"
                            style={{ height: `${barHeight}px` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/55">{bucket.label}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-12 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                    {lang === "ar" ? "لا توجد بيانات شهرية بعد." : "No monthly data yet."}
                  </div>
                )}
              </div>
            </article>

            <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-sky-400/10 to-violet-400/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">{lang === "ar" ? "أهم الخلاصات" : "Key takeaways"}</div>
                  <h2 className="mt-1 text-xl font-bold">{lang === "ar" ? "ما الذي تغيّر فعلاً؟" : "What actually changed?"}</h2>
                </div>
                <TrendingUp className="h-5 w-5 text-cyan-200" />
              </div>

              <ul className="mt-6 space-y-4">
                <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/80">{lang === "ar" ? "أفضل شهر" : "Best month"}</span>
                    <Trophy className="h-4 w-4 text-amber-300" />
                  </div>
                  <p className="mt-2 text-lg font-black">{bestMonth ? bestMonth.label : lang === "ar" ? "لا يوجد بعد" : "Not enough data"}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {bestMonth
                      ? lang === "ar"
                        ? `تحسن الوضوح الإجمالي ${Math.round(bestMonth.clarity * 100)} نقطة تقريبًا هذا الشهر.`
                        : `Estimated clarity improvement of ${Math.round(bestMonth.clarity * 100)} points this month.`
                      : lang === "ar"
                        ? "أضف جلسات أكثر حتى يظهر أفضل شهر."
                        : "Add more sessions to reveal the strongest month."}
                  </p>
                </li>

                <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/80">{lang === "ar" ? "أحدث جلسة" : "Latest session"}</span>
                    <CalendarDays className="h-4 w-4 text-cyan-200" />
                  </div>
                  <p className="mt-2 text-lg font-black">{formatSessionLabel(topSession, lang)}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {lang === "ar" ? "أقرب لحظة محفوظة داخل الأرشيف السنوي." : "The most recent saved moment in the yearly archive."}
                  </p>
                </li>

                <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/80">{lang === "ar" ? "أفضل قفزة" : "Best lift"}</span>
                    <Star className="h-4 w-4 text-violet-200" />
                  </div>
                  <p className="mt-2 text-lg font-black">
                    {Math.max(
                      ...annualSessions.map((session) => Math.round((Number(session.metrics?.clarityDelta ?? 0) || 0) * 100)),
                      0,
                    )}% 
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {lang === "ar" ? "أعلى تحسن فردي في الوضوح داخل السنة." : "Strongest single-session clarity lift this year."}
                  </p>
                </li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
