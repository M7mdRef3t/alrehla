import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap as Sparkles, Send, ShieldCheck, Zap, RefreshCcw, CheckCircle2, AlertCircle, BarChart3, TrendingUp, Users, Video, Link as LinkIcon, Link2, Plus, ChevronDown, Calendar, Eye, PenLine, Magnet } from 'lucide-react';
import { viralArchitect, ViralPost } from '@/ai/ViralContentManager';
import { supabase, isSupabaseReady } from '@/services/supabaseClient';
import { AdminTooltip } from '../Overview/components/AdminTooltip';
import { ToneBreakdownChart, TimelineView, GrowthChart, DismantlingScore, IllusionCalendar } from './AnalyticsCharts';

interface VideoAnalytics {
    illusionName: string;
    topic: string;
    tone: string;
    url: string;
    publishedAt: string;
    estimatedClicks: number;
    platform: string;
    description?: string;
    views?: number;
    hook?: string;
    visualDirection?: string;
}

export const CreativeDashboard: React.FC = () => {
    const [view, setView] = useState<'analytics' | 'generation'>('analytics');
    
    // Generation State
    const [posts, setPosts] = useState<ViralPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deployedId, setDeployedId] = useState<string | null>(null);

    // Analytics State
    const [videos, setVideos] = useState<VideoAnalytics[]>([]);
    const [stats, setStats] = useState<{
        totalVideos: number;
        totalClicks: number;
        activeIllusions: number;
        conversionRate: number;
        bestHook: { text: string; views: number } | null;
        bestVisual: { text: string; views: number } | null;
    }>({
        totalVideos: 0,
        totalClicks: 0,
        activeIllusions: 0,
        conversionRate: 0,
        bestHook: null,
        bestVisual: null
    });
    const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

    // Manual Add State
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [manualIllusion, setManualIllusion] = useState('مغالطة التكلفة الغارقة');
    const [manualTone, setManualTone] = useState('deep');
    const [manualToneOverride, setManualToneOverride] = useState(false);
    const [manualType, setManualType] = useState('video');
    const [manualPlatform, setManualPlatform] = useState('');
    const [manualDescription, setManualDescription] = useState('');
    const [manualPublishDate, setManualPublishDate] = useState(new Date().toISOString().slice(0, 10));
    const [manualPublishDateOverride, setManualPublishDateOverride] = useState(false);
    const [manualViews, setManualViews] = useState('');
    const [manualViewsOverride, setManualViewsOverride] = useState(false);
    const [manualVisualDirection, setManualVisualDirection] = useState('');
    const [manualCaption, setManualCaption] = useState('');
    const [manualHook, setManualHook] = useState('');
    const [manualScript, setManualScript] = useState('');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    const [manualSuccess, setManualSuccess] = useState(false);
    const [isSyncingViews, setIsSyncingViews] = useState(false);

    // ═══ Illusion Options (Grouped) ═══
    const ILLUSION_GROUPS = [
        { group: '⚔️ أوهام معرفية', items: [
            'مغالطة التكلفة الغارقة', 'تحيز التأكيد', 'تأثير الألفة',
            'وهم السيطرة', 'تحيز التفاؤل', 'تحيز الوضع الراهن', 'تحيز النقطة العمياء',
        ]},
        { group: '🪞 أنماط علاقات', items: [
            'الإنكار العاطفي', 'الانفصال عن الواقع', 'قلق التموضع',
            'الدعم الوهمي', 'الحب المستنزف', 'الحدود الورقية', 'التعافي المزيف',
        ]},
        { group: '🔥 إضافات', items: [
            'علاقة منقطعة', 'الاعتمادية العاطفية', 'التلاعب النفسي', 'الحب النرجسي',
        ]},
    ];

    // ═══ Platform Options ═══
    const PLATFORM_OPTIONS = [
        { value: 'tiktok', label: '🎵 TikTok', color: '#ff0050' },
        { value: 'instagram', label: '📸 Instagram', color: '#c13584' },
        { value: 'youtube', label: '▶️ YouTube', color: '#ff0000' },
        { value: 'twitter', label: '𝕏 Twitter', color: '#1da1f2' },
        { value: 'threads', label: '🧵 Threads', color: '#a855f7' },
        { value: 'other', label: '🌐 أخرى', color: '#64748b' },
    ];

    // ═══ Tone Auto-Detect Map ═══
    const TONE_MAP: Record<string, string> = {
        'مغالطة التكلفة الغارقة': 'deep', 'تحيز التأكيد': 'direct', 'تأثير الألفة': 'deep',
        'وهم السيطرة': 'deep', 'تحيز التفاؤل': 'sarcastic', 'تحيز الوضع الراهن': 'direct',
        'تحيز النقطة العمياء': 'sarcastic', 'الإنكار العاطفي': 'deep', 'الانفصال عن الواقع': 'deep',
        'قلق التموضع': 'direct', 'الدعم الوهمي': 'direct', 'الحب المستنزف': 'deep',
        'الحدود الورقية': 'sarcastic', 'التعافي المزيف': 'direct', 'علاقة منقطعة': 'deep',
        'الاعتمادية العاطفية': 'deep', 'التلاعب النفسي': 'deep', 'الحب النرجسي': 'sarcastic',
    };
    const TONE_LABELS: Record<string, string> = { deep: 'عميق 🎭', direct: 'مباشر 🎯', sarcastic: 'ساخر 😏' };

    const CONTENT_TYPE_OPTIONS = [
        { value: 'video', label: '🎬 فيديو', color: '#f43f5e' },
        { value: 'text', label: '📝 بوست نصي', color: '#06b6d4' },
        { value: 'image', label: '🖼️ صورة', color: '#a78bfa' },
        { value: 'carousel', label: '📸 كاروسيل', color: '#f59e0b' },
    ];

    // Auto-detect tone when illusion changes
    useEffect(() => {
        if (!manualToneOverride) {
            setManualTone(TONE_MAP[manualIllusion] || 'direct');
        }
    }, [manualIllusion, manualToneOverride]);

    // Detect platform from URL as fallback
    const detectPlatformFromUrl = (url: string): string => {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
        if (url.includes('threads.net')) return 'threads';
        return 'other';
    };

    const handleManualSubmit = async () => {
        if (!manualUrl.trim() || !isSupabaseReady || !supabase) return;
        setIsSubmittingManual(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const resolvedPlatform = manualPlatform || detectPlatformFromUrl(manualUrl);
            
            let initialViews = manualViews ? Number(manualViews) : 0;
            if (!manualViews) {
                try {
                    const res = await fetch('/api/social/views', {
                        method: 'POST',
                        body: JSON.stringify({ url: manualUrl.trim(), platform: resolvedPlatform, publishedAt: manualPublishDate })
                    });
                    const data = await res.json();
                    if (data.success && data.views) initialViews = data.views;
                } catch (e) { console.error('Initial views fetch failed', e); }
            }

            await supabase.from('feedback').insert({
                content: manualUrl.trim(),
                rating: 'up',
                source: 'illusion_dismantled_video',
                user_id: user?.id || null,
                metadata: {
                    illusionName: manualIllusion,
                    tone: manualTone,
                    contentType: manualType,
                    platform: resolvedPlatform,
                    description: manualDescription.trim() || undefined,
                    publishDate: manualPublishDate,
                    views: initialViews,
                    topic: 'تفكيك أوهام',
                    manual: true,
                    visualDirection: manualVisualDirection.trim() || undefined,
                    caption: manualCaption.trim() || undefined,
                    hook: manualHook.trim() || undefined,
                    script: manualScript.trim() || undefined,
                },
            });
            setManualSuccess(true);
            setManualUrl('');
            setManualDescription('');
            setManualViews('');
            setManualViewsOverride(false);
            setManualPublishDate(new Date().toISOString().slice(0, 10));
            setManualPublishDateOverride(false);
            setManualVisualDirection('');
            setManualCaption('');
            setManualHook('');
            setManualScript('');
            setManualPlatform('');
            setManualToneOverride(false);
            setTimeout(() => { setManualSuccess(false); setShowManualForm(false); fetchAnalytics(); }, 1500);
        } catch (e) {
            console.error('Manual video submit failed:', e);
        } finally {
            setIsSubmittingManual(false);
        }
    };

    const handleSyncViews = async () => {
        setIsSyncingViews(true);
        try {
            const res = await fetch('/api/social/sync-views');
            await res.json();
            fetchAnalytics();
        } catch (e) {
            console.error('Failed to sync views:', e);
        } finally {
            setIsSyncingViews(false);
        }
    };

    const generateDrafts = async () => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        const drafts = await viralArchitect.produceViralInsights();
        setPosts(drafts);
        setIsLoading(false);
    };

    const deployPost = (id: string) => {
        setDeployedId(id);
        console.log(`🚀 [RLHF] Reward Signal Sent for Post: ${id}`);
        setTimeout(() => setDeployedId(null), 3000);
    };

    const fetchAnalytics = async () => {
        if (!isSupabaseReady || !supabase) return;
        setIsFetchingAnalytics(true);
        try {
            // 1. Fetch published videos from feedback table
            const { data: feedbackData } = await supabase
                .from('feedback')
                .select('*')
                .eq('source', 'illusion_dismantled_video')
                .order('created_at', { ascending: false });

            // 2. Fetch marketing leads with content_studio UTM
            const { data: leadsData } = await supabase
                .from('marketing_leads')
                .select('utm, created_at');

            // Count clicks that came from content_studio
            const studioLeads = (leadsData || []).filter(lead => {
                const utm = lead.utm as any;
                return utm && utm.utm_source === 'content_studio';
            });
            const totalStudioClicks = studioLeads.length;

            if (feedbackData) {
                const formattedVideos: VideoAnalytics[] = feedbackData.map(f => {
                    const meta = f.metadata || {};
                    // Platform: prefer metadata, fallback to URL detection
                    const PLATFORM_LABEL_MAP: Record<string, string> = {
                        tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube',
                        twitter: 'X / Twitter', threads: 'Threads', other: 'أخرى',
                    };
                    let platform = 'Unknown';
                    if (meta.platform) {
                        platform = PLATFORM_LABEL_MAP[meta.platform] || meta.platform;
                    } else {
                        if (f.content?.includes('tiktok.com')) platform = 'TikTok';
                        else if (f.content?.includes('instagram.com')) platform = 'Instagram';
                        else if (f.content?.includes('youtube.com')) platform = 'YouTube';
                        else if (f.content?.includes('twitter.com') || f.content?.includes('x.com')) platform = 'X / Twitter';
                    }

                    // Correlate clicks: count leads that arrived AFTER this video was published
                    const videoDate = new Date(meta.publishDate || f.created_at || 0);
                    const correlatedClicks = studioLeads.filter(lead => {
                        const leadDate = new Date(lead.created_at);
                        const diffDays = (leadDate.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24);
                        return diffDays >= 0 && diffDays <= 30;
                    }).length;

                    return {
                        illusionName: meta.illusionName || 'وهم غير معروف',
                        topic: meta.topic || 'عام',
                        tone: meta.tone || 'غير محدد',
                        url: f.content || '',
                        publishedAt: meta.publishDate || f.created_at || new Date().toISOString(),
                        platform,
                        estimatedClicks: correlatedClicks,
                        description: meta.description,
                        views: meta.views,
                        hook: meta.hook,
                        visualDirection: meta.visualDirection,
                    };
                });

                setVideos(formattedVideos);
                
                const illusions = new Set(formattedVideos.map(v => v.illusionName)).size;
                const totalCorrelatedClicks = formattedVideos.reduce((a, b) => a + b.estimatedClicks, 0);
                
                // Smart Insights Calculation
                const hooksMap: Record<string, { totalViews: number; count: number }> = {};
                const visualsMap: Record<string, { totalViews: number; count: number }> = {};

                formattedVideos.forEach(v => {
                    const views = v.views || 0;
                    if (v.hook) {
                        if (!hooksMap[v.hook]) hooksMap[v.hook] = { totalViews: 0, count: 0 };
                        hooksMap[v.hook].totalViews += views;
                        hooksMap[v.hook].count += 1;
                    }
                    if (v.visualDirection) {
                        if (!visualsMap[v.visualDirection]) visualsMap[v.visualDirection] = { totalViews: 0, count: 0 };
                        visualsMap[v.visualDirection].totalViews += views;
                        visualsMap[v.visualDirection].count += 1;
                    }
                });

                let bestHook = null;
                let bestVisual = null;
                let maxHookAvg = -1;
                let maxVisualAvg = -1;

                Object.entries(hooksMap).forEach(([hook, data]) => {
                    const avg = data.totalViews / data.count;
                    if (avg > maxHookAvg) { maxHookAvg = avg; bestHook = { text: hook, views: Math.floor(avg) }; }
                });

                Object.entries(visualsMap).forEach(([visual, data]) => {
                    const avg = data.totalViews / data.count;
                    if (avg > maxVisualAvg) { maxVisualAvg = avg; bestVisual = { text: visual, views: Math.floor(avg) }; }
                });

                setStats({
                    totalVideos: formattedVideos.length,
                    totalClicks: totalStudioClicks,
                    activeIllusions: illusions,
                    conversionRate: totalStudioClicks > 0 && formattedVideos.length > 0
                        ? Number(((totalStudioClicks / (formattedVideos.length * totalStudioClicks / totalCorrelatedClicks || 1)) * 100 / 100).toFixed(1))
                        : 0,
                    bestHook,
                    bestVisual
                });
            }
        } catch (err) {
            console.error("Failed to fetch video analytics:", err);
        } finally {
            setIsFetchingAnalytics(false);
        }
    };

    useEffect(() => {
        if (view === 'analytics') {
            fetchAnalytics();
        }
    }, [view]);

    return (
        <div className="space-y-8 p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        المركز التنفيذي (Creative & Impact)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-mono text-[10px]">
                        Viral Content Architecture & Dismantling Impact
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setView('analytics')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'analytics' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        تأثير الفيديوهات (Analytics)
                    </button>
                    <button
                        onClick={() => setView('generation')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'generation' ? 'bg-teal-500 text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        توليد المسودات (Drafts)
                    </button>
                </div>
            </div>

            {/* View: Analytics */}
            <AnimatePresence mode="wait">
                {view === 'analytics' && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 text-cyan-400">
                                    <Video className="w-5 h-5" />
                                </div>
                                <h4 className="text-3xl font-black text-white mb-1">{stats.totalVideos}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">فيديو منشور (Linked)</p>
                            </div>
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 text-amber-400">
                                    <Link2 className="w-5 h-5" />
                                </div>
                                <h4 className="text-3xl font-black text-white mb-1">{stats.totalClicks}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">زيارات من الـ Studio</p>
                            </div>
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-3 text-rose-400">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h4 className="text-3xl font-black text-white mb-1">{stats.activeIllusions}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">أوهام تم تفكيكها</p>
                            </div>
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h4 className="text-3xl font-black text-white mb-1">{stats.conversionRate}%</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">معدل التحويل (CR)</p>
                            </div>
                        </div>

                        {/* Smart Insights (الرؤى الذكية) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 p-6 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Magnet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white">أفضل هوك (Best Hook)</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">بناءً على متوسط المشاهدات</p>
                                    </div>
                                </div>
                                {stats.bestHook ? (
                                    <div>
                                        <p className="text-lg text-white font-medium mb-3 leading-relaxed" dir="rtl">"{stats.bestHook.text}"</p>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">{stats.bestHook.views.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-500">متوسط مشاهدة</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic mt-4">جاري جمع البيانات... أضف هوك للفيديوهات القادمة</p>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-6 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Eye className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white">أفضل توجيه بصري (Best Visuals)</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">بناءً على متوسط المشاهدات</p>
                                    </div>
                                </div>
                                {stats.bestVisual ? (
                                    <div>
                                        <p className="text-lg text-white font-medium mb-3 leading-relaxed" dir="rtl">"{stats.bestVisual.text}"</p>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">{stats.bestVisual.views.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-500">متوسط مشاهدة</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic mt-4">جاري جمع البيانات... أضف توجيه بصري للفيديوهات القادمة</p>
                                )}
                            </div>
                        </div>

                        {/* Manual Video Add */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-emerald-400" />
                                    إضافة محتوى يدوي
                                </h3>
                                <button onClick={() => setShowManualForm(!showManualForm)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showManualForm ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            {!showManualForm && (
                                <p className="text-[10px] text-slate-500">نشرت محتوى (فيديو / بوست / صورة) من غير الاستوديو؟ ضيفه هنا عشان يتتبع في التحليلات.</p>
                            )}
                            <AnimatePresence>
                                {showManualForm && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden">
                                        {manualSuccess ? (
                                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                                className="py-6 flex flex-col items-center gap-2">
                                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                                <p className="text-sm font-black text-emerald-400">تم الإضافة بنجاح!</p>
                                            </motion.div>
                                        ) : (
                                            <div className="space-y-4 pt-2">
                                                {/* Content Type Selector */}
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">نوع المحتوى</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {CONTENT_TYPE_OPTIONS.map(ct => (
                                                            <button key={ct.value} onClick={() => setManualType(ct.value)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                                                                    manualType === ct.value
                                                                        ? 'text-white border-white/20'
                                                                        : 'text-slate-500 border-white/5 hover:border-white/10'
                                                                }`}
                                                                style={manualType === ct.value ? { background: ct.color + '20', borderColor: ct.color + '40' } : {}}>
                                                                {ct.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Platform Selector */}
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">المنصة</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PLATFORM_OPTIONS.map(p => (
                                                            <button key={p.value} onClick={() => setManualPlatform(manualPlatform === p.value ? '' : p.value)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                                                                    manualPlatform === p.value
                                                                        ? 'text-white border-white/20'
                                                                        : 'text-slate-500 border-white/5 hover:border-white/10'
                                                                }`}
                                                                style={manualPlatform === p.value ? { background: p.color + '20', borderColor: p.color + '40' } : {}}>
                                                                {p.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {!manualPlatform && <p className="text-[9px] text-slate-600 mt-1 font-mono">لو ما اخترتش — هيتحدد من الرابط تلقائياً</p>}
                                                </div>
                                                {/* URL */}
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">رابط المحتوى</label>
                                                    <input type="url" value={manualUrl} onChange={e => setManualUrl(e.target.value)}
                                                        placeholder={manualType === 'text' ? 'رابط البوست أو اتركه فارغ' : 'https://www.tiktok.com/@... أو أي رابط'}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors" dir="ltr" />
                                                </div>
                                                {/* Illusion (grouped) + Tone (auto) */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">الوهم المفكك</label>
                                                        <select value={manualIllusion} onChange={e => { setManualIllusion(e.target.value); setManualToneOverride(false); }}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors appearance-none">
                                                            {ILLUSION_GROUPS.map(g => (
                                                                <optgroup key={g.group} label={g.group} className="bg-slate-900 text-slate-400">
                                                                    {g.items.map(o => <option key={o} value={o} className="bg-slate-900 text-white">{o}</option>)}
                                                                </optgroup>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">النبرة (تلقائي)</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                                                                <span className="text-white font-bold">{TONE_LABELS[manualTone] || manualTone}</span>
                                                                {!manualToneOverride && <span className="text-[8px] text-emerald-400 font-mono uppercase">AUTO</span>}
                                                            </div>
                                                            <button onClick={() => {
                                                                if (manualToneOverride) {
                                                                    setManualToneOverride(false);
                                                                } else {
                                                                    setManualToneOverride(true);
                                                                    const tones = ['deep', 'direct', 'sarcastic'];
                                                                    const next = tones[(tones.indexOf(manualTone) + 1) % tones.length];
                                                                    setManualTone(next);
                                                                }
                                                            }}
                                                                className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                                                                {manualToneOverride ? '↺ تلقائي' : '✏️ تغيير'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Description */}
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">وصف مختصر (اختياري)</label>
                                                    <input type="text" value={manualDescription} onChange={e => setManualDescription(e.target.value)}
                                                        placeholder="مثال: فيديو عن إزاي التعود بيخليك فاكر إنك محتاج حد"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors" dir="rtl" />
                                                </div>
                                                {/* Date + Views Row */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">تاريخ النشر (تلقائي)</label>
                                                        <div className="flex items-center gap-2">
                                                            {manualPublishDateOverride ? (
                                                                <input type="date" value={manualPublishDate} onChange={e => setManualPublishDate(e.target.value)}
                                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" autoFocus />
                                                            ) : (
                                                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                                                                    <span className="text-slate-500 font-medium text-xs">تاريخ اليوم ({new Date().toISOString().slice(0, 10)})</span>
                                                                    <span className="text-[8px] text-emerald-400 font-mono uppercase">AUTO</span>
                                                                </div>
                                                            )}
                                                            <button onClick={() => {
                                                                setManualPublishDateOverride(!manualPublishDateOverride);
                                                                if (manualPublishDateOverride) setManualPublishDate(new Date().toISOString().slice(0, 10));
                                                            }}
                                                                className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                                                                {manualPublishDateOverride ? '↺ تلقائي' : '✏️ تغيير'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">المشاهدات (تلقائي)</label>
                                                        <div className="flex items-center gap-2">
                                                            {manualViewsOverride ? (
                                                                <input type="number" value={manualViews} onChange={e => setManualViews(e.target.value)}
                                                                    placeholder="مثال: 5000"
                                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors" dir="ltr" autoFocus />
                                                            ) : (
                                                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                                                                    <span className="text-slate-500 font-medium text-xs">جلب تلقائي من الرابط</span>
                                                                    <span className="text-[8px] text-emerald-400 font-mono uppercase">AUTO</span>
                                                                </div>
                                                            )}
                                                            <button onClick={() => {
                                                                setManualViewsOverride(!manualViewsOverride);
                                                                if (manualViewsOverride) setManualViews('');
                                                            }}
                                                                className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">
                                                                {manualViewsOverride ? '↺ تلقائي' : '✏️ تغيير'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Optional Content Details */}
                                                <div className="space-y-4 border-t border-white/10 pt-4 mt-2">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">الهوك - Hook (اختياري)</label>
                                                        <input type="text" value={manualHook} onChange={e => setManualHook(e.target.value)}
                                                            placeholder="العبارة الخاطفة في أول ثواني..."
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors" dir="rtl" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">الاسكريبت - Script (اختياري)</label>
                                                        <textarea value={manualScript} onChange={e => setManualScript(e.target.value)}
                                                            placeholder="النص الكامل أو النقاط الأساسية..."
                                                            rows={3}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none" dir="rtl" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">التوجيه البصري - Visuals (اختياري)</label>
                                                        <input type="text" value={manualVisualDirection} onChange={e => setManualVisualDirection(e.target.value)}
                                                            placeholder="مثال: زوم بطيء، إضاءة خافتة..."
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors" dir="rtl" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">الكابشن - Caption (اختياري)</label>
                                                        <textarea value={manualCaption} onChange={e => setManualCaption(e.target.value)}
                                                            placeholder="النص المكتوب تحت الفيديو والهاشتاجات..."
                                                            rows={2}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none" dir="rtl" />
                                                    </div>
                                                </div>
                                                {/* Submit */}
                                                <button onClick={handleManualSubmit} disabled={!manualUrl.trim() || isSubmittingManual}
                                                    className="w-full py-3 rounded-xl font-black text-sm text-white transition-all disabled:opacity-30"
                                                    style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                                                    {isSubmittingManual ? 'جاري الحفظ...' : '+ إضافة المحتوى للتتبع'}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Videos Table */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-amber-400" />
                                    تأثير الفيديوهات (Video Impact Radar)
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSyncViews}
                                        disabled={isSyncingViews}
                                        title="مزامنة المشاهدات تلقائياً"
                                        className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCcw className={`w-4 h-4 ${isSyncingViews ? 'animate-spin' : ''}`} />
                                        <span className="text-xs font-bold hidden sm:inline">مزامنة المشاهدات</span>
                                    </button>
                                    <button
                                        onClick={fetchAnalytics}
                                        disabled={isFetchingAnalytics}
                                        title="تحديث الجدول"
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                    >
                                        <RefreshCcw className={`w-4 h-4 ${isFetchingAnalytics ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-right" dir="rtl">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="py-3 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">الفيديو (الرابط)</th>
                                            <th className="py-3 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">الوهم المفكك</th>
                                            <th className="py-3 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">النبرة (Tone)</th>
                                            <th className="py-3 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">المنصة</th>
                                            <th className="py-3 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">الزيارات المقدرة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {videos.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                                                    لا توجد فيديوهات مرتبطة حتى الآن. استخدم استوديو المحتوى لإنشاء وربط الفيديوهات.
                                                </td>
                                            </tr>
                                        ) : (
                                            videos.map((vid, i) => (
                                                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 px-4">
                                                        <a href={vid.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-colors">
                                                            <LinkIcon className="w-3 h-3" />
                                                            {vid.url.substring(0, 30)}...
                                                        </a>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs font-bold text-white">{vid.illusionName}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-slate-300 border border-white/5">{vid.tone}</span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                                            vid.platform === 'TikTok' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                            vid.platform === 'Instagram' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}>
                                                            {vid.platform}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-black text-amber-400">
                                                        +{vid.estimatedClicks}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Dismantling Score */}
                        <DismantlingScore videos={videos} totalClicks={stats.totalClicks} />

                        {/* Illusion Calendar */}
                        <IllusionCalendar videos={videos} />

                        {/* Timeline View */}
                        <TimelineView videos={videos} />

                        {/* Tone Breakdown */}
                        <ToneBreakdownChart videos={videos} />

                        {/* Growth & AI Logs Charts */}
                        <GrowthChart />
                    </motion.div>
                )}

                {/* View: Generation */}
                {view === 'generation' && (
                    <motion.div
                        key="generation"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={generateDrafts}
                                disabled={isLoading}
                                className="px-6 py-3 rounded-2xl bg-teal-500 text-black font-black flex items-center gap-3 hover:bg-teal-400 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                توليد مسودات ذكية
                            </button>
                        </div>

                        {!posts.length && !isLoading && (
                            <div className="p-20 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <Sparkles className="w-8 h-8 text-slate-700" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-400">لا توجد مسودات حالية</h3>
                                <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
                                    اضغط على زر التوليد لتحليل نبضات المستخدمين وتحويلها إلى محتوى فيروسي.
                                </p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {posts.map((post: any, idx) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full hover:border-teal-500/30 transition-all relative overflow-hidden"
                                    >
                                        {/* Variant Badge */}
                                        <div className="flex items-center justify-between mb-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${idx === 0 ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                                    idx === 1 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                {idx === 0 ? 'Safe Mode' : idx === 1 ? 'Deep Analysis' : 'Bold / Viral'}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-600">{post.targetSlot}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow space-y-4 mb-8">
                                            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">Topic: {post.topic}</h3>
                                            <p className="text-white text-lg font-bold leading-relaxed text-right" dir="rtl">
                                                "{post.content}"
                                            </p>
                                        </div>

                                        {/* Scoring HUD */}
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[9px] font-black uppercase">
                                                    <span className="text-slate-500">Safety</span>
                                                    <span className="text-teal-400">{post.scores.safety}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500/50" style={{ width: `${post.scores.safety}%` }} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[9px] font-black uppercase">
                                                    <span className="text-slate-500">Virality</span>
                                                    <span className="text-amber-400">{post.scores.virality}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500/50" style={{ width: `${post.scores.virality}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <button
                                            onClick={() => deployPost(post.id)}
                                            disabled={deployedId !== null}
                                            className={`w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm transition-all ${deployedId === post.id
                                                    ? 'bg-teal-500 text-black'
                                                    : 'bg-white/5 hover:bg-white/10 text-white'
                                                }`}
                                        >
                                            {deployedId === post.id ? (
                                                <> <CheckCircle2 className="w-4 h-4" /> تم النشر والتعلم </>
                                            ) : (
                                                <> <Send className="w-4 h-4" /> اعتماد المسودة </>
                                            )}
                                        </button>

                                        <div className="mt-4 flex items-center justify-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-slate-700" />
                                            <span className="text-[9px] text-slate-600 uppercase font-mono italic">Rationale: {post.rationale}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {deployedId && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-teal-500 text-black rounded-full font-black shadow-2xl flex items-center gap-3 z-[100]"
                >
                    <Zap className="w-5 h-5 fill-current" />
                    تم إرسال إشارة المكافأة للمحرك.. جاري تحسين النتائج المستقبلية
                </motion.div>
            )}
        </div>
    );
};

