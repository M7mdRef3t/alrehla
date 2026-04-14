'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BrainCircuit, Users, FileText, Briefcase, ChevronRight, Share, FileCheck2, AlertTriangle, MessageCircle, BarChart3, TrendingUp, LayoutDashboard, Filter, Zap, Bell, Download, Clock, Loader2, XCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ConsoleTab = 'dashboard' | 'triage_queue' | 'ai_brief' | 'live_session' | 'post_session' | 'analytics';

<<<<<<< HEAD
const techEase: [number, number, number, number] = [0, 0.7, 0.1, 1];
=======
// Unused constant causing TS issues - definition kept but type-cast if used
const techEase: any = [0, 0.7, 0.1, 1];
>>>>>>> feat/sovereign-final-stabilization

export function SessionOSConsole() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('dashboard');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Map Integration State
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  // Form states for post-session
  const [summary, setSummary] = useState('');
  const [assignment, setAssignment] = useState('');
  const [mainTopic, setMainTopic] = useState('');
  const [dominantPattern, setDominantPattern] = useState('');
  const [mainIntervention, setMainIntervention] = useState('');
  const [firstShift, setFirstShift] = useState('');
  const [recommendFollowup, setRecommendFollowup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [liveIntakes, setLiveIntakes] = useState<any[]>([]);

  async function getSupabaseClient() {
    const mod = await import('@/services/supabaseClient');
    return mod.supabase;
  }

  React.useEffect(() => {
    fetchSessions();

    let channel: any;
    const initTelemetry = async () => {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      channel = supabase.channel('sovereign_control');
      channel.on('broadcast', { event: 'INTAKE_TELEMETRY' }, (payload: any) => {
        const data = payload.payload;
        setLiveIntakes(prev => {
          const now = Date.now();
          const filtered = prev.filter(p => now - p.updatedAt < 5 * 60 * 1000);
          const exists = filtered.find((p: any) => p.phone === data.phone);
          if (exists) {
            return filtered.map((p: any) => p.phone === data.phone ? { ...p, ...data, updatedAt: now } : p);
          }
          return [...filtered, { ...data, updatedAt: now }];
        });
      }).subscribe();
    };

    initTelemetry();

    return () => {
      if (channel) {
<<<<<<< HEAD
         void getSupabaseClient().then((supabase) => {
           supabase?.removeChannel(channel);
=======
        void getSupabaseClient().then((supabase) => {
           if (supabase) {
             supabase.removeChannel(channel);
           }
>>>>>>> feat/sovereign-final-stabilization
         });
      }
    };
  }, []);

  React.useEffect(() => {
    if (selectedRequest?.dawayir_clients?.user_id) {
      fetchMapNodes(selectedRequest.dawayir_clients.user_id);
    }
  }, [selectedRequest]);

  const fetchMapNodes = async (userId: string) => {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/admin/sessions/map-nodes?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setNodes(json.nodes);
    } catch (e) { console.error(e); }
  };

  const sendSovereignCommand = async (type: string, payload: any) => {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const channel = supabase.channel('sovereign_control');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'OVERRIDE',
            payload: { type, ...payload }
          }).then(() => {
<<<<<<< HEAD
            supabase?.removeChannel(channel);
=======
            if (supabase) {
              supabase.removeChannel(channel);
            }
>>>>>>> feat/sovereign-final-stabilization
          });
        }
      });
    } catch (e) { console.error('Failed to send sovereign command', e); }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setRequests(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const generatePDF = async () => {
    const element = document.getElementById('report-export-container');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#000000' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Alrehla-Session-Report-${selectedRequest?.dawayir_clients?.name || 'Client'}.pdf`);
    } catch (e) { console.error('PDF Export Error:', e); }
  };

  const notifications = React.useMemo(() => {
    return requests.filter(r => ['new_request', 'needs_manual_review', 'prep_form_completed'].includes(r.status))
      .map(r => ({
        id: r.id,
        title: r.status === 'prep_form_completed' ? 'نموذج تحضير مكتمل' : 'طلب جديد يحتاج مراجعة',
        client: r.dawayir_clients?.name,
        time: new Date(r.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        type: r.status
      }));
  }, [requests]);

  const updateRequestStatus = async (requestId: string, status: string, reason?: string) => {
    setIsUpdatingStatus(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'update_status', requestId, status, reason })
      });
      if (res.ok) {
        fetchSessions();
        setRejectingRequest(null);
        setRejectionReason("");
      }
    } catch (e) { console.error(e); }
    finally { setIsUpdatingStatus(false); }
  };

  const generateBrief = async (req: any) => {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          action: 'generate_brief', 
          requestId: req.id,
          biggestChallenge: req.biggest_challenge || 'غير محدد'
        })
      });
      if (res.ok) fetchSessions();
    } catch (e) { console.error(e); }
  };

  const closeSession = async () => {
    if (!selectedRequest) return;
    setIsClosing(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'close_session',
          requestId: selectedRequest.id,
          summary,
          assignment,
          mainTopic,
          dominantPattern,
          mainIntervention,
          firstShift,
          recommendFollowup,
          notes: `تم عن طريق كونسول الإغلاق. مربط بعقدة: ${selectedNodeId || 'None'}`,
          linkedNodeId: selectedNodeId
        })
      });
      setSummary(''); setAssignment(''); setMainTopic(''); setDominantPattern(''); setMainIntervention(''); setFirstShift(''); setRecommendFollowup(false); setSelectedNodeId('');
      setActiveTab('dashboard');
      fetchSessions();
    } catch(e) { console.error(e); }
    finally { setIsClosing(false); }
  };

  const pendingRequests = requests.filter(r => ['new_request', 'intake_completed', 'needs_manual_review', 'prep_pending'].includes(r.status));
  const readyRequests = requests.filter(r => r.status === 'session_ready' || r.status === 'brief_generated');

  const handleSelectRequest = (req: any) => {
    setSelectedRequest(req);
    setActiveTab('live_session');
  };

  const rawBrief = selectedRequest?.dawayir_ai_session_briefs;
  const sessionBrief = (Array.isArray(rawBrief) ? rawBrief[0] : rawBrief) || {
    visible_problem: 'جاري استخراج المشكلة...',
    emotional_signal: 'جاري تحليل الإشارة...',
    hidden_need: 'جاري القراءة ما بين السطور...',
    expected_goal: '...',
    first_hypothesis: 'اختر طلب لمعاينة الفرضية..',
    session_boundaries: 'لا توجد بيانات'
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0A0A0A] text-white overflow-hidden" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-l border-neutral-800 bg-[#0F0F0F] flex flex-col p-4 z-10">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-black text-indigo-400 font-sans tracking-tight uppercase">بوصلة السيادة</h2>
<<<<<<< HEAD
          <p className="text-[10px] text-neutral-500 mt-1 font-bold uppercase tracking-widest">محرك الوعي السيادي</p>
=======
          <p className="text-[10px] text-neutral-500 mt-1 font-bold uppercase tracking-widest">محرك الوعي الخاص</p>
>>>>>>> feat/sovereign-final-stabilization
        </div>

        <nav className="space-y-1.5 flex-grow">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-4 h-4" />} label="الرؤية الكلية" />
          <NavItem active={activeTab === 'triage_queue'} onClick={() => setActiveTab('triage_queue')} icon={<Filter className="w-4 h-4" />} label="بوابة العبور" badge={pendingRequests.length > 0 ? pendingRequests.length.toString() : undefined} />
          
          <div className="my-6 border-t border-white/5 pt-6"></div>
          
          <NavItem active={activeTab === 'ai_brief'} onClick={() => setActiveTab('ai_brief')} icon={<BrainCircuit className="w-4 h-4" />} label="ما وراء السطور" />
          <NavItem 
            active={false} 
            onClick={() => window.open('/admin/sessions/live', '_blank')} 
            icon={<Zap className="w-4 h-4 text-amber-400" />} 
            label="رادار المسافرين" 
          />
          <NavItem active={activeTab === 'live_session'} onClick={() => setActiveTab('live_session')} icon={<Briefcase className="w-4 h-4" />} label="قمرة القيادة" />
          <NavItem active={activeTab === 'post_session'} onClick={() => setActiveTab('post_session')} icon={<FileCheck2 className="w-4 h-4" />} label="ميثاق الجلسة" />
          
          <div className="my-6 border-t border-white/5 pt-6"></div>
          
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 className="w-4 h-4" />} label="أثر النور" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative selection:bg-indigo-500/30">
        <div className="absolute inset-0 pointer-events-none z-0" style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 p-8 md:p-12">
          {/* Top Intelligence Bar */}
          <div className="flex justify-between items-center mb-12">
            <div>
<<<<<<< HEAD
              <h1 className="text-3xl font-black tracking-tight">لوحة التحكم السيادية</h1>
=======
              <h1 className="text-3xl font-black tracking-tight">لوحة التحكم الخاصة</h1>
>>>>>>> feat/sovereign-final-stabilization
              <p className="text-neutral-500 text-sm mt-1">إدارة وتحليل رحلات الوعي</p>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition relative"
              >
                <Bell className={`w-5 h-5 ${notifications.length > 0 ? 'text-indigo-400' : 'text-neutral-500'}`} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1.5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-14 left-0 w-80 bg-[#0F0F0F] border border-white/10 rounded-3xl shadow-2xl p-6 z-50 overflow-hidden"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 pb-4 border-b border-white/5">التنبيهات الذكية</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-neutral-500 text-center py-8">لا توجد إشارات جديدة</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition cursor-pointer group">
                             <div className="flex justify-between items-start mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${n.type === 'prep_form_completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-neutral-500 font-bold">{n.time}</span>
                             </div>
                             <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition">{n.client}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <StatCard title="مسافرون جدد" value={requests.filter(r => r.status === 'new_request' || r.status === 'needs_manual_review').length.toString()} icon={<Users className="text-indigo-400" />} />
                <StatCard title="في انتظار الإشارة" value={requests.filter(r => ['session_ready', 'brief_generated'].includes(r.status)).length.toString()} icon={<Zap className="text-teal-400" />} />
                <StatCard title="روافد معلقة" value={requests.filter(r => r.status === 'followup_pending').length.toString()} icon={<Share className="text-orange-400" />} />
              </motion.div>
            )}

            {activeTab === 'triage_queue' && (
              <motion.div key="triage_queue" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {pendingRequests.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-neutral-600">
                    <Users className="w-12 h-12 mb-4 opacity-10" />
                    <p className="text-sm font-medium">لا توجد طلبات معلقة</p>
                  </div>
                ) : (
                  pendingRequests.map(req => {
                    const client = req.dawayir_clients || {};
                    const triage = req.dawayir_triage_answers?.[0] || {};
                    const urgency = triage.urgency_score || 0;
                    return (
                      <div key={req.id} className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between hover:border-indigo-500/30 transition-all duration-500 group" onClick={() => handleSelectRequest(req)}>
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-indigo-400 group-hover:scale-110 transition-transform">
                             {(client.name || 'U')[0]}
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-white">{client.name || 'عميل مجهول'}</h3>
                                {urgency > 7 && <span className="bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse border border-red-500/20">نداء عاجل</span>}
                              </div>
                              <p className="text-xs text-neutral-500 font-medium">الهدف: {triage.session_goal_type || 'غير معروف'} • العمر: {client.age_range || '---'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                           <button onClick={(e) => { e.stopPropagation(); generateBrief(req); }} className="px-5 py-2.5 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">تحليل الذكاء</button>
                           <button onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.id, 'prep_pending'); }} className="px-5 py-2.5 bg-white/5 border border-white/10 text-neutral-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">فتح بوابة Prep</button>
                           <button onClick={(e) => { e.stopPropagation(); setRejectingRequest(req); }} className="p-2.5 text-red-900 hover:text-red-500 transition-colors"><XCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {activeTab === 'live_session' && (
              <motion.div key="live_session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {selectedRequest ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="report-export-container">
                    <div className="lg:col-span-2 space-y-8">
                       <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-8">تحليل البصمة النفسية (AI Brief)</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <BriefBlock title="المشكلة الظاهرة" content={sessionBrief.visible_problem} />
                            <BriefBlock title="الإشارة النفسية" content={sessionBrief.emotional_signal} />
                            <BriefBlock title="الاحتياج الخفي" content={sessionBrief.hidden_need} />
                            <BriefBlock title="الهدف المتوقع" content={sessionBrief.expected_goal} />
                          </div>
                          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                             <p className="text-sm font-medium text-slate-200 leading-relaxed italic">"{sessionBrief.first_hypothesis}"</p>
                          </div>
                       </div>
                       <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-8">
                          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">محركات السيادة (Live Overrides)</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <CommandButton onClick={() => sendSovereignCommand('THEME_SHIFT', { theme: 'tranquil' })} label="هدوء الغابة" icon={<Activity className="w-4 h-4" />} />
                             <CommandButton onClick={() => sendSovereignCommand('THEME_SHIFT', { theme: 'focus' })} label="تركيز حاد" icon={<Zap className="w-4 h-4" />} />
                             <CommandButton onClick={() => sendSovereignCommand('WHISPER', { message: 'تنفس بعمق.. أنت بأمان.' })} label="همسة دعم" icon={<MessageCircle className="w-4 h-4" />} />
                             <CommandButton onClick={() => sendSovereignCommand('ACCELERATE', {})} label="تسريع الإيقاع" icon={<TrendingUp className="w-4 h-4" />} />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-6">
                          <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">بيانات المسافر</h2>
                          <DataRow label="الاسم" value={selectedRequest.dawayir_clients?.name} />
                          <DataRow label="الحالة" value={selectedRequest.status} />
                          <DataRow label="الكود" value={selectedRequest.id.split('-')[0].toUpperCase()} />
                       </div>
                       <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-6">
                          <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">اختصارات القيادة</h2>
                          <div className="flex flex-col gap-3">
                             <button onClick={() => updateRequestStatus(selectedRequest.id, 'post_session_pending')} className="w-full py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition">انتهت الجلسة - للتوثيق</button>
                             <button onClick={() => updateRequestStatus(selectedRequest.id, 'postponed')} className="w-full py-3 bg-white/5 border border-white/10 text-neutral-500 rounded-xl text-sm font-bold hover:bg-white/10 transition">تعليق الرحلة</button>
                             <button onClick={generatePDF} className="w-full py-3 bg-white/5 border border-white/10 text-neutral-400 rounded-xl text-sm font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"><Download className="w-4 h-4" /> تصدير السجل</button>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-neutral-700">
                    <Zap className="w-12 h-12 mb-4 opacity-5" />
                    <p className="text-sm font-medium">قمرة القيادة فارغة.. اختر مسافراً للبدء</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'post_session' && (
              <motion.div key="post_session" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                 <div className="flex justify-between items-center bg-[#0F0F0F] border border-white/5 p-8 rounded-3xl">
                    <div>
                       <h2 className="text-2xl font-black text-white">إغلاق وتعميد السجل</h2>
                       <p className="text-xs text-neutral-500 font-medium">المسافر: {selectedRequest?.dawayir_clients?.name || '---'}</p>
                    </div>
                    <button onClick={closeSession} disabled={isClosing} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                       {isClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
                       حفظ الجلسة في الأبدية
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <InputField label="جوهر الصحوة (الملخص)" value={summary} onChange={setSummary} textarea />
                       <InputField label="العقدة المفككة" value={mainTopic} onChange={setMainTopic} />
                       <InputField label="النمط السلوكي" value={dominantPattern} onChange={setDominantPattern} />
                    </div>
                    <div className="space-y-6">
                       <InputField label="التدخل المعرفي" value={mainIntervention} onChange={setMainIntervention} textarea />
<<<<<<< HEAD
                       <InputField label="التكليف السيادي (Assignment)" value={assignment} onChange={setAssignment} textarea />
=======
                       <InputField label="المهمة الخاصة (Assignment)" value={assignment} onChange={setAssignment} textarea />
>>>>>>> feat/sovereign-final-stabilization
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Logic Modals */}
      <AnimatePresence>
        {rejectingRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#111] border border-red-900/30 rounded-3xl p-8 relative">
              <h2 className="text-2xl font-black text-white mb-2">قفل المسار</h2>
              <p className="text-xs text-neutral-500 mb-6 font-medium uppercase tracking-widest">المسافر: {rejectingRequest.dawayir_clients?.name}</p>
              <textarea 
                value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="لماذا تم قفل المسار؟..."
                className="w-full h-32 bg-black border border-white/10 rounded-2xl p-4 text-sm focus:border-red-500 focus:outline-none mb-6"
              />
              <div className="flex gap-4">
                <button onClick={() => setRejectingRequest(null)} className="flex-1 py-3 text-neutral-500 font-bold hover:text-white transition">تراجع</button>
                <button onClick={() => updateRequestStatus(rejectingRequest.id, 'rejected', rejectionReason)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/20">تأكيد الإغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, icon, label, badge, onClick }: { active: boolean, icon: React.ReactNode, label: string, badge?: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-[#111]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h3>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10 shadow-inner">{icon}</div>
      </div>
      <div className="text-4xl font-black font-sans tracking-tight text-white">{value}</div>
    </div>
  );
}

function BriefBlock({ title, content }: { title: string, content: string }) {
  return (
    <div className="bg-[#111]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex gap-2"><div className="w-1 h-3 rounded-full bg-slate-600"/>{title}</h3>
      <p className="text-sm font-medium text-slate-200 leading-relaxed max-w-prose">{content}</p>
    </div>
  );
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
      <span className="text-xs text-neutral-500 font-bold">{label}</span>
      <span className="text-sm text-slate-200 font-medium">{value || 'غير محدد'}</span>
    </div>
  );
}

function CommandButton({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-500/20 hover:border-indigo-500/50 transition duration-300 group">
       <div className="bg-white/5 p-3 rounded-xl mb-3 group-hover:scale-110 transition">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-indigo-300">{label}</span>
    </button>
  );
}

function InputField({ label, value, onChange, textarea }: { label: string, value: string, onChange: (v: string) => void, textarea?: boolean }) {
  return (
    <div className="space-y-2">
       <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
       {textarea ? (
          <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#111] border border-neutral-800 rounded-2xl p-4 text-sm focus:border-indigo-500 focus:outline-none min-h-[120px]"
          />
       ) : (
          <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#111] border border-neutral-800 rounded-2xl p-4 text-sm focus:border-indigo-500 focus:outline-none"
          />
       )}
    </div>
  );
}
