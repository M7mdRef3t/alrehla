'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Mic, Calendar, Brain, Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { supabase, isSupabaseReady } from '@/services/supabaseClient';

// ═══ Types ═══
interface AiLog { source: string; metadata: any; created_at: string; }
interface VideoItem { tone: string; publishedAt: string; estimatedClicks: number; illusionName: string; }

// ═══ Tone Breakdown Chart ═══
const TONE_COLORS: Record<string, string> = { deep: '#06b6d4', direct: '#f59e0b', sarcastic: '#f43f5e', 'غير محدد': '#64748b' };
const TONE_LABELS: Record<string, string> = { deep: 'عميق', direct: 'مباشر', sarcastic: 'ساخر', 'غير محدد': 'غير محدد' };

export const ToneBreakdownChart: React.FC<{ videos: VideoItem[] }> = ({ videos }) => {
  const data = useMemo(() => {
    const map: Record<string, { count: number; clicks: number }> = {};
    videos.forEach(v => {
      const t = v.tone || 'غير محدد';
      if (!map[t]) map[t] = { count: 0, clicks: 0 };
      map[t].count++;
      map[t].clicks += v.estimatedClicks;
    });
    return Object.entries(map).map(([tone, d]) => ({
      name: TONE_LABELS[tone] || tone,
      videos: d.count,
      clicks: d.clicks,
      avgClicks: d.count > 0 ? Math.round(d.clicks / d.count) : 0,
      fill: TONE_COLORS[tone] || '#64748b',
    }));
  }, [videos]);

  if (!data.length) return null;

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-6">
        <Mic className="w-4 h-4 text-cyan-400" /> أداء النبرات (Tone Performance)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, color: '#fff' }} />
              <Bar dataKey="avgClicks" name="متوسط الزيارات" radius={[8, 8, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart */}
        <div className="h-56 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="videos" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} stroke="none">
                {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.8} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mr-4">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-bold">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="text-slate-400">{d.name}</span>
                <span className="text-white">{d.videos}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══ Timeline View ═══
export const TimelineView: React.FC<{ videos: VideoItem[] }> = ({ videos }) => {
  const weeks = useMemo(() => {
    const now = Date.now();
    const grid: { date: string; count: number; clicks: number; dayLabel: string }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const matching = videos.filter(v => v.publishedAt.slice(0, 10) === key);
      grid.push({ date: key, count: matching.length, clicks: matching.reduce((a, b) => a + b.estimatedClicks, 0), dayLabel: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) });
    }
    return grid;
  }, [videos]);

  const maxCount = Math.max(1, ...weeks.map(w => w.count));

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-emerald-400" /> خريطة النشاط (Timeline — آخر 90 يوم)
      </h3>
      <div className="flex flex-wrap gap-[3px]" dir="ltr">
        {weeks.map((w, i) => {
          const intensity = w.count === 0 ? 0 : Math.ceil((w.count / maxCount) * 4);
          const colors = ['bg-slate-800/40', 'bg-emerald-500/20', 'bg-emerald-500/40', 'bg-emerald-500/60', 'bg-emerald-400'];
          return (
            <div key={i} className="group relative">
              <div className={`w-3 h-3 rounded-[3px] ${colors[intensity]} border border-white/[0.03] transition-all hover:scale-150 hover:z-10 cursor-default`} />
              {w.count > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                  <div className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white font-bold whitespace-nowrap shadow-xl">
                    {w.dayLabel}: {w.count} فيديو · {w.clicks} زيارة
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-600 mt-3 font-mono uppercase tracking-wider">أقل ← أكثر نشاطاً</p>
    </div>
  );
};

// ═══ Growth Area Chart (from admin_ai_logs) ═══
export const GrowthChart: React.FC = () => {
  const [data, setData] = useState<{ date: string; scripts: number; images: number }[]>([]);
  const [toneStats, setToneStats] = useState<{ tone: string; count: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) { setLoading(false); return; }
    (async () => {
      try {
        const { data: logs } = await supabase.from('admin_ai_logs').select('source, metadata, created_at').in('source', ['tiktok_studio_script', 'tiktok_studio_image']).order('created_at', { ascending: true });

        if (!logs?.length) { setLoading(false); return; }

        // Daily aggregation
        const dayMap: Record<string, { scripts: number; images: number }> = {};
        const toneMap: Record<string, number> = {};

        logs.forEach((l: AiLog) => {
          const day = l.created_at?.slice(0, 10) || '';
          if (!dayMap[day]) dayMap[day] = { scripts: 0, images: 0 };
          if (l.source === 'tiktok_studio_script') {
            dayMap[day].scripts++;
            const tone = (l.metadata as any)?.tone || 'unknown';
            toneMap[tone] = (toneMap[tone] || 0) + 1;
          }
          if (l.source === 'tiktok_studio_image') dayMap[day].images++;
        });

        setData(Object.entries(dayMap).map(([date, v]) => ({ date, ...v })));
        setToneStats(Object.entries(toneMap).map(([tone, count]) => ({ tone, count, label: TONE_LABELS[tone] || tone })).sort((a, b) => b.count - a.count));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-40 bg-slate-900/40 border border-white/5 rounded-[2rem] animate-pulse" />;

  return (
    <div className="space-y-6">
      {/* Growth Area Chart */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> اتجاه الإنتاج (Production Trend)
        </h3>
        {data.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">لا توجد بيانات إنتاج بعد. ابدأ بتوليد السكريبتات من استوديو المحتوى.</div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gScripts" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gImages" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, color: '#fff' }} />
                <Area type="monotone" dataKey="scripts" name="سكريبتات" stroke="#06b6d4" fill="url(#gScripts)" strokeWidth={2} />
                <Area type="monotone" dataKey="images" name="صور" stroke="#a78bfa" fill="url(#gImages)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tone Intelligence from AI Logs */}
      {toneStats.length > 0 && (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-fuchsia-400" /> ذكاء النبرة (Tone Intelligence — من سجل الـ AI)
          </h3>
          <div className="space-y-3">
            {toneStats.map((t, i) => {
              const max = toneStats[0].count;
              const pct = Math.round((t.count / max) * 100);
              const color = TONE_COLORS[t.tone] || '#64748b';
              return (
                <motion.div key={t.tone} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-black text-white">{t.label}</span>
                    <span className="font-mono text-slate-400">{t.count} سكريبت</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: color }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══ BIAS catalog for calendar ═══
const ALL_ILLUSIONS = [
  // أوهام معرفية
  { key: 'sunk_cost', ar: 'مغالطة التكلفة الغارقة', slug: 'sunk-cost' },
  { key: 'confirmation', ar: 'تحيز التأكيد', slug: 'confirmation' },
  { key: 'familiarity', ar: 'تأثير الألفة', slug: 'familiarity' },
  { key: 'illusion_of_control', ar: 'وهم السيطرة', slug: 'illusion-of-control' },
  { key: 'optimism', ar: 'تحيز التفاؤل', slug: 'optimism' },
  { key: 'status_quo', ar: 'تحيز الوضع الراهن', slug: 'status-quo' },
  { key: 'blind_spot', ar: 'تحيز النقطة العمياء', slug: 'blind-spot' },
  // أنماط علاقات (Mirror Science)
  { key: 'emotional_denial', ar: 'الإنكار العاطفي', slug: 'emotional-denial' },
  { key: 'reality_detachment', ar: 'الانفصال عن الواقع', slug: 'reality-detachment' },
  { key: 'placement_anxiety', ar: 'قلق التموضع', slug: 'placement-anxiety' },
  { key: 'false_support', ar: 'الدعم الوهمي', slug: 'false-support' },
  { key: 'love_drain', ar: 'الحب المستنزف', slug: 'love-drain' },
  { key: 'paper_boundaries', ar: 'الحدود الورقية', slug: 'paper-boundaries' },
  { key: 'false_recovery', ar: 'التعافي المزيف', slug: 'false-recovery' },
  // إضافات
  { key: 'disconnected', ar: 'علاقة منقطعة', slug: 'disconnected' },
  { key: 'emotional_dependency', ar: 'الاعتمادية العاطفية', slug: 'emotional-dependency' },
  { key: 'gaslighting', ar: 'التلاعب النفسي', slug: 'gaslighting' },
  { key: 'narcissistic_love', ar: 'الحب النرجسي', slug: 'narcissistic-love' },
];

// ═══ Dismantling Score ═══
export const DismantlingScore: React.FC<{ videos: VideoItem[]; totalClicks: number }> = ({ videos, totalClicks }) => {
  const score = useMemo(() => {
    const videoCount = videos.length;
    const uniqueIllusions = new Set(videos.map(v => v.illusionName)).size;
    const totalIllusions = ALL_ILLUSIONS.length;

    // Consistency: how many of the last 4 weeks had at least 1 video
    const now = Date.now();
    const weeksActive = [0, 1, 2, 3].filter(w => {
      const weekStart = now - (w + 1) * 7 * 86400000;
      const weekEnd = now - w * 7 * 86400000;
      return videos.some(v => { const t = new Date(v.publishedAt).getTime(); return t >= weekStart && t < weekEnd; });
    }).length;

    // Score components (each 0-25, total max 100)
    const volumeScore = Math.min(25, videoCount * 5);
    const coverageScore = Math.min(25, Math.round((uniqueIllusions / totalIllusions) * 25));
    const impactScore = Math.min(25, Math.round(Math.min(totalClicks, 100) / 4));
    const consistencyScore = Math.min(25, weeksActive * 6.25);

    return {
      total: Math.round(volumeScore + coverageScore + impactScore + consistencyScore),
      volume: volumeScore,
      coverage: coverageScore,
      impact: impactScore,
      consistency: consistencyScore,
      uniqueIllusions,
      weeksActive,
    };
  }, [videos, totalClicks]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score.total / 100) * circumference;
  const color = score.total >= 70 ? '#34d399' : score.total >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-6">
        <Zap className="w-4 h-4 text-amber-400" /> Dismantling Score
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Ring */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="text-3xl font-black text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              {score.total}
            </motion.span>
            <span className="text-[9px] text-slate-500 font-mono uppercase">/ 100</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-3 w-full">
          {[
            { label: 'حجم الإنتاج', value: score.volume, max: 25, color: '#06b6d4', sub: `${videos.length} فيديو` },
            { label: 'تغطية الأوهام', value: score.coverage, max: 25, color: '#a78bfa', sub: `${score.uniqueIllusions}/${ALL_ILLUSIONS.length} وهم` },
            { label: 'التأثير', value: score.impact, max: 25, color: '#f59e0b', sub: `${totalClicks} زيارة` },
            { label: 'الاتساق', value: score.consistency, max: 25, color: '#34d399', sub: `${score.weeksActive}/4 أسابيع` },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-bold text-slate-300">{item.label}</span>
                <span className="font-mono text-slate-500">{item.sub}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full" style={{ background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══ Illusion Calendar ═══
export const IllusionCalendar: React.FC<{ videos: VideoItem[] }> = ({ videos }) => {
  const plan = useMemo(() => {
    const covered = new Set(videos.map(v => v.illusionName));
    // Sort: uncovered first, then least covered
    const countMap: Record<string, number> = {};
    videos.forEach(v => { countMap[v.illusionName] = (countMap[v.illusionName] || 0) + 1; });

    const sorted = [...ALL_ILLUSIONS].sort((a, b) => {
      const aCov = countMap[a.ar] || 0;
      const bCov = countMap[b.ar] || 0;
      return aCov - bCov;
    });

    // Best tone per illusion (from existing videos)
    const tonePerIllusion: Record<string, string> = {};
    const toneClickMap: Record<string, Record<string, number>> = {};
    videos.forEach(v => {
      if (!toneClickMap[v.illusionName]) toneClickMap[v.illusionName] = {};
      toneClickMap[v.illusionName][v.tone] = (toneClickMap[v.illusionName][v.tone] || 0) + v.estimatedClicks;
    });
    Object.entries(toneClickMap).forEach(([illusion, tones]) => {
      const best = Object.entries(tones).sort((a, b) => b[1] - a[1])[0];
      if (best) tonePerIllusion[illusion] = best[0];
    });

    // Generate 4-week plan
    const weeks = sorted.slice(0, 4).map((illusion, i) => {
      const weekNum = i + 1;
      const isCovered = covered.has(illusion.ar);
      const suggestedTone = tonePerIllusion[illusion.ar] || (weekNum <= 2 ? 'deep' : 'sarcastic');
      const reason = !isCovered ? 'لم يتم تغطيته بعد' : `مغطى ${countMap[illusion.ar]} مرة — محتاج تعميق`;
      return { weekNum, illusion, isCovered, suggestedTone, reason, count: countMap[illusion.ar] || 0 };
    });

    // Week 4 = recap
    if (weeks.length === 4) {
      weeks[3] = {
        ...weeks[3],
        reason: 'أسبوع المراجعة — أعد نشر أقوى فيديو أو اعمل recap',
      };
    }

    return weeks;
  }, [videos]);

  const toneEmoji: Record<string, string> = { deep: '🎭', direct: '🎯', sarcastic: '😏', 'غير محدد': '❓' };
  const toneLabel: Record<string, string> = { deep: 'عميق', direct: 'مباشر', sarcastic: 'ساخر' };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-violet-400" /> تقويم التفكيك (Illusion Calendar — الشهر القادم)
      </h3>
      <p className="text-[10px] text-slate-500 mb-6 font-mono uppercase tracking-wider">خطة مقترحة بناءً على الفجوات وأداء النبرات</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plan.map((week, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="border border-white/5 rounded-2xl p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-all relative overflow-hidden group">

            {/* Week badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الأسبوع {week.weekNum}</span>
              {!week.isCovered && (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">جديد</span>
              )}
            </div>

            {/* Illusion name */}
            <h4 className="text-sm font-black text-white mb-2 leading-snug">{week.illusion.ar}</h4>

            {/* Suggested tone */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{toneEmoji[week.suggestedTone] || '🎤'}</span>
              <span className="text-[10px] font-bold text-slate-400">
                النبرة المقترحة: <span className="text-white">{toneLabel[week.suggestedTone] || week.suggestedTone}</span>
              </span>
            </div>

            {/* Reason */}
            <p className="text-[10px] text-slate-500 leading-relaxed">{week.reason}</p>

            {/* Coverage indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${week.count === 0 ? 'bg-slate-700' : week.count < 3 ? 'bg-amber-500/60' : 'bg-emerald-500/60'}`} />
              <span className="text-[9px] font-mono text-slate-600">{week.count} فيديو سابق</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
