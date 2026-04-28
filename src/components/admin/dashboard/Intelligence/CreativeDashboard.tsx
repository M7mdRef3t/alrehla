import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap as Sparkles, Send, ShieldCheck, Zap, RefreshCcw, CheckCircle2, AlertCircle, BarChart3, TrendingUp, Users, Video, Link as LinkIcon, Link2, Plus, ChevronDown } from 'lucide-react';
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
}

export const CreativeDashboard: React.FC = () => {
    const [view, setView] = useState<'analytics' | 'generation'>('analytics');
    
    // Generation State
    const [posts, setPosts] = useState<ViralPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deployedId, setDeployedId] = useState<string | null>(null);

    // Analytics State
    const [videos, setVideos] = useState<VideoAnalytics[]>([]);
    const [stats, setStats] = useState({
        totalVideos: 0,
        totalClicks: 0,
        activeIllusions: 0,
        conversionRate: 0
    });
    const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

    // Manual Add State
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [manualIllusion, setManualIllusion] = useState('مغالطة التكلفة الغارقة');
    const [manualTone, setManualTone] = useState('deep');
    const [manualType, setManualType] = useState('video');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    const [manualSuccess, setManualSuccess] = useState(false);

    const ILLUSION_OPTIONS = [
        'مغالطة التكلفة الغارقة', 'تحيز التأكيد', 'تأثير الألفة',
        'وهم السيطرة', 'تحيز التفاؤل', 'تحيز الوضع الراهن', 'تحيز النقطة العمياء',
    ];
    const TONE_OPTIONS = [
        { value: 'deep', label: 'عميق 🎭' },
        { value: 'direct', label: 'مباشر 🎯' },
        { value: 'sarcastic', label: 'ساخر 😏' },
    ];
    const CONTENT_TYPE_OPTIONS = [
        { value: 'video', label: '🎬 فيديو', color: '#f43f5e' },
        { value: 'text', label: '📝 بوست نصي', color: '#06b6d4' },
        { value: 'image', label: '🖼️ صورة', color: '#a78bfa' },
        { value: 'carousel', label: '📸 كاروسيل', color: '#f59e0b' },
    ];

    const handleManualSubmit = async () => {
        if (!manualUrl.trim() || !isSupabaseReady || !supabase) return;
        setIsSubmittingManual(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('feedback').insert({
                content: manualUrl.trim(),
                rating: 'up',
                source: 'illusion_dismantled_video',
                user_id: user?.id || null,
                metadata: { illusionName: manualIllusion, tone: manualTone, contentType: manualType, topic: 'تفكيك أوهام', manual: true },
            });
            setManualSuccess(true);
            setManualUrl('');
            setTimeout(() => { setManualSuccess(false); setShowManualForm(false); fetchAnalytics(); }, 1500);
        } catch (e) {
            console.error('Manual video submit failed:', e);
        } finally {
            setIsSubmittingManual(false);
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
                    let platform = 'Unknown';
                    if (f.content?.includes('tiktok.com')) platform = 'TikTok';
                    else if (f.content?.includes('instagram.com')) platform = 'Instagram';
                    else if (f.content?.includes('youtube.com')) platform = 'YouTube Shorts';

                    // Correlate clicks: count leads that arrived AFTER this video was published
                    const videoDate = new Date(f.created_at || 0);
                    const correlatedClicks = studioLeads.filter(lead => {
                        const leadDate = new Date(lead.created_at);
                        // Count leads that arrived within 30 days after video publish
                        const diffDays = (leadDate.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24);
                        return diffDays >= 0 && diffDays <= 30;
                    }).length;

                    return {
                        illusionName: meta.illusionName || 'وهم غير معروف',
                        topic: meta.topic || 'عام',
                        tone: meta.tone || 'غير محدد',
                        url: f.content || '',
                        publishedAt: f.created_at || new Date().toISOString(),
                        platform,
                        estimatedClicks: correlatedClicks
                    };
                });

                setVideos(formattedVideos);
                
                const illusions = new Set(formattedVideos.map(v => v.illusionName)).size;
                const totalCorrelatedClicks = formattedVideos.reduce((a, b) => a + b.estimatedClicks, 0);
                
                setStats({
                    totalVideos: formattedVideos.length,
                    totalClicks: totalStudioClicks,
                    activeIllusions: illusions,
                    conversionRate: totalStudioClicks > 0 && formattedVideos.length > 0
                        ? Number(((totalStudioClicks / (formattedVideos.length * totalStudioClicks / totalCorrelatedClicks || 1)) * 100 / 100).toFixed(1))
                        : 0
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
                                                {/* URL */}
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">رابط المحتوى</label>
                                                    <input type="url" value={manualUrl} onChange={e => setManualUrl(e.target.value)}
                                                        placeholder={manualType === 'text' ? 'رابط البوست أو اتركه فارغ' : 'https://www.tiktok.com/@... أو أي رابط'}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors" dir="ltr" />
                                                </div>
                                                {/* Illusion + Tone */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">الوهم المفكك</label>
                                                        <select value={manualIllusion} onChange={e => setManualIllusion(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors appearance-none">
                                                            {ILLUSION_OPTIONS.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">النبرة</label>
                                                        <select value={manualTone} onChange={e => setManualTone(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors appearance-none">
                                                            {TONE_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>)}
                                                        </select>
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
                                <button
                                    onClick={fetchAnalytics}
                                    disabled={isFetchingAnalytics}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                >
                                    <RefreshCcw className={`w-4 h-4 ${isFetchingAnalytics ? 'animate-spin' : ''}`} />
                                </button>
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

