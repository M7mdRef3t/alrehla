"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Compass,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { listLiveSessions } from "../api";
import type { LiveSessionRecord } from "../types";
import { captureMarketingLead } from "../../../services/marketingLeadService";
import { trackEvent } from "../../../services/analytics";
import { recordFlowEvent } from "../../../services/journeyTracking";

type GrowthPillar = {
  id: "emotional-intelligence" | "communication" | "resilience";
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  current: number;
  target: number;
  tone: string;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toHours(session: LiveSessionRecord) {
  const endedAt = new Date(session.ended_at || session.updated_at).getTime();
  const startedAt = new Date(session.started_at).getTime();
  const fallback = Number((session as LiveSessionRecord & { session_duration_minutes?: number }).session_duration_minutes ?? 0) / 60;
  if (!Number.isFinite(endedAt - startedAt) || endedAt <= startedAt) {
    return Math.max(0, fallback);
  }
  return Math.max(0.25, (endedAt - startedAt) / (1000 * 60 * 60));
}

function computeInsightPoints(list: LiveSessionRecord[]) {
  return list.reduce((total, session) => {
    const clarity = Number(session.metrics?.clarityDelta ?? 0) || 0;
    const equilibrium = Number(session.metrics?.equilibriumScore ?? 0) || 0;
    return total + Math.round((clarity + equilibrium + 0.2) * 120);
  }, 0);
}

function getQuarterlyRoadmap(isArabic: boolean) {
  return [
    {
      quarter: "Q1",
      title: isArabic ? "التأسيس" : "Foundations",
      subtitle: isArabic ? "بناء روتين ثابت واستعادة الاتزان" : "Build routine and recover baseline balance",
    },
    {
      quarter: "Q2",
      title: isArabic ? "تواصل أعمق" : "Deep Communication",
      subtitle: isArabic ? "تطوير الحوار الصعب والاحتواء" : "Improve difficult conversations and containment",
    },
    {
      quarter: "Q3",
      title: isArabic ? "مرونة متقدمة" : "Advanced Resilience",
      subtitle: isArabic ? "تثبيت الهدوء تحت الضغط" : "Maintain calm under pressure",
    },
    {
      quarter: "Q4",
      title: isArabic ? "الإشراق" : "Radiance",
      subtitle: isArabic ? "دمج النمو في الحياة اليومية" : "Integrate growth into daily life",
    },
  ];
}

export default function AnnualGrowthReportPage() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [advisorRequestStatus, setAdvisorRequestStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [isAdvisorCooldown, setIsAdvisorCooldown] = useState(false);

  useEffect(() => {
    void listLiveSessions()
      .then((result) => {
        setSessions(result.sessions);
        setLang(result.sessions.some((session) => session.language === "ar") ? "ar" : "en");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "growth_plan_failed"));
  }, []);

  const isArabic = lang === "ar";
  const thisYear = new Date().getFullYear();

  const annualSessions = useMemo(() => {
    return sessions.filter((session) => new Date(session.updated_at).getFullYear() === thisYear);
  }, [sessions, thisYear]);

  const stats = useMemo(() => {
    const totalHours = annualSessions.reduce((sum, session) => sum + toHours(session), 0);
    const insightPoints = computeInsightPoints(annualSessions);
    const avgClarity = annualSessions.length
      ? annualSessions.reduce((sum, session) => sum + (Number(session.metrics?.clarityDelta ?? 0) || 0), 0) / annualSessions.length
      : 0;
    return {
      sessions: annualSessions.length,
      totalHours,
      insightPoints,
      avgClarity: clampPercent(avgClarity * 100 + 58),
    };
  }, [annualSessions]);

  const pillars = useMemo<GrowthPillar[]>(() => {
    const emotional = clampPercent(stats.avgClarity + 6);
    const communication = clampPercent(42 + Math.min(26, stats.sessions));
    const resilience = clampPercent(36 + Math.min(32, Math.round(stats.totalHours * 1.5)));

    return [
      {
        id: "emotional-intelligence",
        titleAr: "الذكاء العاطفي",
        titleEn: "Emotional Intelligence",
        subtitleAr: "تعزيز الوعي الذاتي والتنظيم الهادئ",
        subtitleEn: "Strengthen awareness and calm regulation",
        current: emotional,
        target: 85,
        tone: "from-cyan-300 to-teal-300",
      },
      {
        id: "communication",
        titleAr: "التواصل الفعّال",
        titleEn: "Effective Communication",
        subtitleAr: "بناء جسور التفاهم في اللحظات الصعبة",
        subtitleEn: "Build understanding during difficult moments",
        current: communication,
        target: 90,
        tone: "from-violet-300 to-fuchsia-300",
      },
      {
        id: "resilience",
        titleAr: "المرونة النفسية",
        titleEn: "Psychological Resilience",
        subtitleAr: "التعافي السريع والثبات تحت الضغط",
        subtitleEn: "Recover faster and remain steady under pressure",
        current: resilience,
        target: 78,
        tone: "from-emerald-300 to-cyan-300",
      },
    ];
  }, [stats.avgClarity, stats.sessions, stats.totalHours]);

  const aiInsight = useMemo(() => {
    const strongest = [...pillars].sort((a, b) => b.current - a.current)[0];
    const weakest = [...pillars].sort((a, b) => a.current - b.current)[0];

    if (isArabic) {
      return {
        title: "توقعات البصيرة",
        body: `إذا التزمت بخطة 2025 بنفس وتيرة هذا العام، سيظهر تحسن واضح في "${weakest.titleAr}" مع الحفاظ على قوة "${strongest.titleAr}".`,
        impact: `النتيجة المتوقعة: علاقات أكثر استقرارًا وقرارات أهدأ خلال الربعين Q3 وQ4.`,
      };
    }

    return {
      title: "AI Insight Forecast",
      body: `If you commit to the 2025 roadmap, your biggest lift should appear in "${weakest.titleEn}" while preserving strength in "${strongest.titleEn}".`,
      impact: "Expected impact: steadier relationships and calmer decisions by Q3-Q4.",
    };
  }, [isArabic, pillars]);

  const recommendations = useMemo(() => {
    return isArabic
      ? [
          { title: "جلسة: إتقان الحوار الصعب", meta: "15 دقيقة - صوتي", cta: "ابدأ الآن" },
          { title: "تمرين: إعادة ضبط الجهاز العصبي", meta: "8 دقائق - عملي", cta: "تدريب سريع" },
          { title: "مقالة: الحفاظ على الهدوء تحت الضغط", meta: "قراءة 6 دقائق", cta: "افتح المقالة" },
        ]
      : [
          { title: "Session: Difficult Conversation Mastery", meta: "15 min - Guided Audio", cta: "Start now" },
          { title: "Exercise: Nervous System Reset", meta: "8 min - Practical", cta: "Quick drill" },
          { title: "Article: Staying Calm Under Pressure", meta: "6 min read", cta: "Open article" },
        ];
  }, [isArabic]);

  const roadmap = useMemo(() => getQuarterlyRoadmap(isArabic), [isArabic]);

  async function handleAdvisorInterest() {
    if (isAdvisorCooldown) return;

    const email = advisorEmail.trim();
    const name = advisorName.trim();
    if (!email || !email.includes("@")) {
      setAdvisorRequestStatus("error");
      trackEvent("advisor_interest_submit_failed", {
        source: "annual_growth_plan_2025",
        reason: "invalid_email"
      });
      return;
    }
    if (name.length > 60) {
      setAdvisorRequestStatus("error");
      trackEvent("advisor_interest_submit_failed", {
        source: "annual_growth_plan_2025",
        reason: "name_too_long"
      });
      return;
    }

    setAdvisorRequestStatus("saving");
    setIsAdvisorCooldown(true);
    window.setTimeout(() => setIsAdvisorCooldown(false), 2000);
    const ok = await captureMarketingLead({
      email,
      name: name || undefined,
      source: "annual_growth_plan_2025",
      sourceType: "website",
      note: "advisor_interest_request"
    });

    trackEvent(ok ? "advisor_interest_submit_success" : "advisor_interest_submit_failed", {
      source: "annual_growth_plan_2025"
    });
    recordFlowEvent(ok ? "lead_followup_connected" : "lead_followup_attempted", {
      meta: {
        source: "annual_growth_plan_2025",
        channel: "advisor_interest"
      }
    });
    setAdvisorRequestStatus(ok ? "success" : "error");
  }

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,rgba(14,165,233,0.2),transparent_40%),radial-gradient(circle_at_80%_12%,rgba(168,85,247,0.17),transparent_42%),#040816] px-4 py-8 text-white md:py-12"
      dir="rtl"
      style={{ fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => assignUrl("/dawayir-live/history")}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          {isArabic ? "العودة إلى الأرشيف" : "Back to archive"}
        </button>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/25 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-[11px] font-semibold text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                {isArabic ? `خطة النمو لعام ${thisYear + 1}` : `Growth Plan ${thisYear + 1}`}
              </span>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {isArabic ? "رحلة الوضوح العاطفي - خطة شخصية مخصصة" : "Your personalized emotional clarity roadmap"}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
                {isArabic
                  ? "تم بناء هذه الخطة من سجلاتك السابقة لتحديد أهداف واقعية، محطات فصلية، وخطوات عملية تدفعك لنمو ثابت خلال العام القادم."
                  : "Built from your previous records to set realistic targets, quarterly milestones, and practical growth actions for the next year."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] text-white/55">{isArabic ? "جلسات العام" : "Sessions"}</div>
                <strong className="mt-1 block text-2xl">{stats.sessions}</strong>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] text-white/55">{isArabic ? "ساعات التأمل" : "Hours"}</div>
                <strong className="mt-1 block text-2xl">{stats.totalHours.toFixed(1)}</strong>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] text-white/55">{isArabic ? "نقاط البصيرة" : "Insight Points"}</div>
                <strong className="mt-1 block text-2xl">{stats.insightPoints}</strong>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] text-white/55">{isArabic ? "وضوحك الحالي" : "Current Clarity"}</div>
                <strong className="mt-1 block text-2xl">{stats.avgClarity}%</strong>
              </article>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{isArabic ? "أعمدة النمو الشخصي" : "Growth Pillars"}</h2>
              <Target className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {pillars.map((pillar) => {
                const title = isArabic ? pillar.titleAr : pillar.titleEn;
                const subtitle = isArabic ? pillar.subtitleAr : pillar.subtitleEn;
                return (
                  <article key={pillar.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h3 className="text-base font-bold">{title}</h3>
                    <p className="mt-1 min-h-10 text-xs text-white/60">{subtitle}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-white/55">{isArabic ? "الحالي" : "Current"}: {pillar.current}%</span>
                      <span className="font-semibold text-white/80">Target {pillar.target}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full bg-gradient-to-r ${pillar.tone}`} style={{ width: `${Math.min(100, (pillar.current / pillar.target) * 100)}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <aside className="rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-cyan-400/10 to-violet-400/10 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">{aiInsight.title}</h2>
              <Zap className="h-5 w-5 text-cyan-100" />
            </div>
            <p className="text-sm leading-relaxed text-white/80">{aiInsight.body}</p>
            <p className="mt-3 text-sm text-cyan-100/90">{aiInsight.impact}</p>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{isArabic ? `خارطة طريق ${thisYear + 1}` : `Roadmap ${thisYear + 1}`}</h2>
            <Compass className="h-5 w-5 text-cyan-200" />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {roadmap.map((item) => (
              <article key={item.quarter} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                  {item.quarter}
                </div>
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="mt-1 text-xs text-white/60">{item.subtitle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{isArabic ? "موصى به لك" : "Recommended for you"}</h2>
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="space-y-3">
              {recommendations.map((item) => (
                <article key={item.title} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div>
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <p className="mt-1 text-xs text-white/55">{item.meta}</p>
                  </div>
                  <button type="button" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                    {item.cta}
                  </button>
                </article>
              ))}
            </div>
          </article>

          <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-200" />
              <h2 className="text-lg font-bold">{isArabic ? "الاجتماع السنوي مع المستشار" : "Annual Advisor Meeting"}</h2>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              {isArabic
                ? "ميزة الحجز المباشر ستتوفر قريبًا. يمكنك الآن إرسال اهتمامك لنخطط موعدًا يناسب أهدافك وخارطة رحلتك."
                : "Direct booking is coming soon. For now, you can send your interest so we can prepare a tailored annual review session."}
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-white/55">
                {isArabic ? "الاسم (اختياري)" : "Name (optional)"}
              </span>
              <input
                type="text"
                value={advisorName}
                onChange={(event) => {
                  setAdvisorName(event.target.value.slice(0, 60));
                  if (advisorRequestStatus !== "idle") setAdvisorRequestStatus("idle");
                }}
                placeholder={isArabic ? "اسمك" : "Your name"}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-cyan-300/45"
                autoComplete="name"
              />
              <span className="mt-1 block text-[11px] text-white/45">
                {isArabic ? `${advisorName.length}/60` : `${advisorName.length}/60`}
              </span>
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-white/55">
                {isArabic ? "بريدك الإلكتروني" : "Your email"}
              </span>
              <input
                type="email"
                value={advisorEmail}
                onChange={(event) => {
                  setAdvisorEmail(event.target.value);
                  if (advisorRequestStatus !== "idle") setAdvisorRequestStatus("idle");
                }}
                placeholder={isArabic ? "you@example.com" : "you@example.com"}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-cyan-300/45"
                autoComplete="email"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleAdvisorInterest()}
              disabled={advisorRequestStatus === "saving" || isAdvisorCooldown}
              className="mt-4 w-full rounded-full border border-violet-300/35 bg-violet-400/12 px-4 py-2.5 text-sm font-semibold text-violet-100 transition-transform hover:-translate-y-0.5"
            >
              {advisorRequestStatus === "saving"
                ? isArabic
                  ? "جاري الإرسال..."
                  : "Sending..."
                : advisorRequestStatus === "success"
                  ? isArabic
                    ? "تم تسجيل اهتمامك"
                    : "Interest registered"
                  : isArabic
                    ? "سجّل اهتمامك"
                    : "Register interest"}
            </button>
            <p className="mt-2 text-xs text-white/50">
              {advisorRequestStatus === "error"
                ? isArabic
                  ? advisorName.trim().length > 60
                    ? "الاسم يجب ألا يتجاوز 60 حرفًا."
                    : "أدخل بريدًا صحيحًا أو حاول مرة أخرى."
                  : advisorName.trim().length > 60
                    ? "Name must be 60 characters or less."
                    : "Enter a valid email and try again."
                : advisorRequestStatus === "success"
                  ? isArabic
                    ? "وصلك تأكيد الاهتمام، وسنتواصل معك عند تفعيل الحجز."
                    : "Your interest is saved. We will contact you once booking is enabled."
                  : isArabic
                    ? "Coming Soon: حجز مباشر مع المستشار داخل المنصة."
                    : "Coming Soon: direct in-app advisor booking."}
            </p>
          </aside>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-200" />
            <span>{isArabic ? "ملاحظة: هذه الخطة تقديرية مبنية على سجلاتك الحالية، وليست تشخيصًا نفسيًا." : "Note: This plan is an estimate based on your current records, not a clinical diagnosis."}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
