'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BrainCircuit, Users, FileText, Briefcase, ChevronRight, Share, FileCheck2, AlertTriangle, MessageCircle, BarChart3, TrendingUp, PieChart as PieChartIcon, Zap, Bell, Download, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ConsoleTab = 'dashboard' | 'triage_queue' | 'ai_brief' | 'live_session' | 'post_session' | 'analytics';

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
  const [lastSeenRequests, setLastSeenRequests] = useState<string[]>([]);

  React.useEffect(() => {
    fetchSessions();
  }, []);

  React.useEffect(() => {
    if (selectedRequest?.dawayir_clients?.user_id) {
      fetchMapNodes(selectedRequest.dawayir_clients.user_id);
    }
  }, [selectedRequest]);

  const fetchMapNodes = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/map-nodes?userId=${userId}`);
      const json = await res.json();
      if (json.success) setNodes(json.nodes);
    } catch (e) { console.error(e); }
  };

  const sendSovereignCommand = async (type: string, payload: any) => {
    try {
      const { supabase } = await import('@/services/supabaseClient');
      const channel = supabase.channel('sovereign_control');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'OVERRIDE',
            payload: { type, ...payload }
          }).then(() => {
            supabase.removeChannel(channel);
          });
        }
      });
    } catch (e) {
      console.error('Failed to send sovereign command', e);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      const json = await res.json();
      if (json.success) {
        setRequests(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      console.error('PDF Export Error:', e);
    }
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

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', requestId, status })
      });
      if (res.ok) fetchSessions();
    } catch (e) { console.error(e); }
  };

  const generateBrief = async (req: any) => {
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setSummary('');
      setAssignment('');
      setMainTopic('');
      setDominantPattern('');
      setMainIntervention('');
      setFirstShift('');
      setRecommendFollowup(false);
      setSelectedNodeId('');
      setActiveTab('dashboard');
      fetchSessions();
    } catch(e) {
      console.error(e);
    } finally {
      setIsClosing(false);
    }
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
    <div className="flex h-[calc(100vh-64px)] bg-[#0A0A0A] text-white">
      {/* Sidebar Navigation */}
      <div className="w-64 border-l border-neutral-800 bg-[#0F0F0F] flex flex-col p-4">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-black text-indigo-400 font-sans tracking-widest uppercase">Session OS</h2>
          <p className="text-xs text-neutral-500 mt-1">Cognitive Coaching Engine</p>
        </div>

        <nav className="space-y-2 flex-grow">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-4 h-4" />} label="نظرة عامة" />
          <NavItem active={activeTab === 'triage_queue'} onClick={() => setActiveTab('triage_queue')} icon={<Users className="w-4 h-4" />} label="طابور الفرز" badge="2" />
          <div className="my-4 border-t border-neutral-800 pt-4"></div>
          <NavItem active={activeTab === 'ai_brief'} onClick={() => setActiveTab('ai_brief')} icon={<BrainCircuit className="w-4 h-4" />} label="ذكاء ما قبل الجلسة" />
          <NavItem active={activeTab === 'live_session'} onClick={() => setActiveTab('live_session')} icon={<Briefcase className="w-4 h-4" />} label="كونسول التنفيذ (Live)" />
          <NavItem active={activeTab === 'post_session'} onClick={() => setActiveTab('post_session')} icon={<FileCheck2 className="w-4 h-4" />} label="الإغلاق والتوثيق" />
          <div className="my-4 border-t border-neutral-800 pt-4"></div>
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 className="w-4 h-4" />} label="الإحصائيات والأثر" />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {/* Top Intelligence Bar */}
        <div className="flex justify-end mb-6 relative z-50">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-[#111] border border-neutral-800 rounded-full hover:bg-neutral-800 transition relative"
          >
            <Bell className="w-5 h-5 text-neutral-400" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-12 left-0 w-80 bg-[#151515] border border-neutral-800 rounded-2xl shadow-2xl p-4 overflow-hidden"
              >
                <h3 className="text-sm font-bold border-b border-neutral-800 pb-3 mb-3 flex items-center justify-between">
                  <span>التنبيهات الذكية</span>
                  <Zap className="w-3 h-3 text-indigo-400" />
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-4">لا توجد تنبيهات جديدة</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 bg-neutral-900/50 rounded-xl hover:bg-neutral-900 transition cursor-pointer" dir="rtl">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.type === 'prep_form_completed' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-neutral-500 flex items-center"><Clock className="w-2 h-2 ml-1" /> {n.time}</span>
                        </div>
                        <p className="text-sm font-bold text-neutral-200">{n.client}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <h1 className="text-3xl font-bold mb-8">نظرة عامة على الجلسات</h1>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <StatCard title="طلبات جديدة" value={requests.filter(r => r.status === 'new_request' || r.status === 'needs_manual_review').length.toString()} icon={<Users className="text-blue-500" />} />
                <StatCard title="جاهزون للجلسة" value={requests.filter(r => ['session_ready', 'brief_generated'].includes(r.status)).length.toString()} icon={<FileText className="text-green-500" />} />
                <StatCard title="متابعات معلقة" value={requests.filter(r => r.status === 'followup_pending').length.toString()} icon={<Share className="text-orange-500" />} />
              </div>
            </motion.div>
          )}

          {activeTab === 'triage_queue' && (
            <motion.div key="triage_queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">طابور الفرز والمراجعة</h1>
                <button className="bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-lg text-sm hover:bg-neutral-700 transition">تحديث القائمة</button>
              </div>

              <div className="space-y-4">
                {pendingRequests.length === 0 && <div className="text-neutral-500 text-sm">لا توجد طلبات معلقة للمراجعة.</div>}
                {pendingRequests.map(req => {
                  const client = req.dawayir_clients || {};
                  const triage = req.dawayir_triage_answers?.[0] || {};
                  const urgency = triage.urgency_score || 0;
                  return (
                  <div key={req.id} className="bg-[#111] border border-neutral-800 rounded-xl p-5 flex items-start justify-between cursor-pointer hover:border-neutral-700 transition" onClick={() => handleSelectRequest(req)}>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{client.name || 'عميل مجهول'}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${urgency > 5 ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'}`}>
                          {urgency > 5 ? 'استعجال عالي' : 'عادي'}
                        </span>
                        {req.status === 'needs_manual_review' && (
                          <span className="text-xs bg-yellow-900/30 text-yellow-500 border border-yellow-900/50 px-2 py-1 rounded-full flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            مراجعة يدوية للسلامة
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400 mb-4">الهدف المبدئي: <span className="text-white">{triage.session_goal_type || 'غير محدد'}</span> • الفئة العمرية: {client.age_range || 'غير محدد'}</p>
                      <div className="flex gap-2">
                        <span className="text-xs text-neutral-500">مستوى الوضوح: {triage.clarity_score || 0}/10</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.id, 'prep_pending'); }}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-200"
                      >
                        تحويل للاستكشاف
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); generateBrief(req); }}
                        className="bg-indigo-600/20 text-indigo-400 border border-indigo-600/50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600/40"
                      >
                        <BrainCircuit className="w-4 h-4 inline ml-2" /> توليد AI Brief
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.id, 'prep_pending'); }}
                        className="bg-[#1A1A1A] border border-neutral-700 px-4 py-2 rounded-lg text-sm hover:bg-neutral-800"
                      >
                        إرسال رابط الـ Prep Form
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateRequestStatus(req.id, 'rejected'); }}
                        className="text-red-400 hover:text-red-300 text-sm mt-2"
                      >
                        رفض مهذب / إحالة
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </motion.div>
          )}

          {activeTab === 'ai_brief' && (
            <motion.div key="ai_brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <BrainCircuit className="text-indigo-400" />
                ملخص الذكاء الاصطناعي (AI Brief)
              </h1>
              
              <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-6 mb-6">
                <h3 className="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-2">أول فرضية تشغيلية</h3>
                <p className="text-xl leading-relaxed text-indigo-50 border-l-2 border-indigo-500 pl-4">
                  {sessionBrief.first_hypothesis}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <BriefBlock title="المشكلة الظاهرة (حسب كلامه)" content={sessionBrief.visible_problem} />
                <BriefBlock title="الإشارة العاطفية" content={sessionBrief.emotional_signal} />
                <BriefBlock title="الاحتياج المخفي (الدفين)" content={sessionBrief.hidden_need} />
                <BriefBlock title="الهدف المتوقع من الجلسة" content={sessionBrief.expected_goal} />
              </div>

              <div className="mt-6 bg-red-950/20 border border-red-900/30 rounded-xl p-5">
                <h3 className="text-red-400 text-sm font-bold flex items-center mb-2"><AlertTriangle className="w-4 h-4 ml-2"/> حدود الأمان للجلسة</h3>
                <p className="text-red-200 text-sm">{sessionBrief.session_boundaries}</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'live_session' && (
            <motion.div key="live_session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <div className="flex justify-between items-end mb-8 border-b border-neutral-800 pb-4">
                <div>
                  <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-3 mb-2">
                    <Activity className="animate-pulse" />
                    كونسول التنفيذ (Live)
                  </h1>
                  <p className="text-neutral-400">العميل: {selectedRequest?.dawayir_clients?.name || '---'} — الجلسة جارية الآن.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-500 block mb-1">الافتتاح المقترح</span>
                  <div className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-lg text-sm text-neutral-200 max-w-sm">
                    "قبل ما نبدأ، عايز نحدد في جملة واحدة: إيه أهم حاجة محتاج تطلع بيها من الجلسة النهارده؟"
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 h-[500px]">
                {/* Structure Analysis */}
                <div className="col-span-8 bg-[#111] border border-neutral-800 rounded-2xl flex flex-col">
                  <div className="p-4 border-b border-neutral-800 bg-[#151515] rounded-t-2xl flex gap-4">
                    <div className="px-3 py-1 bg-neutral-800 rounded text-sm text-neutral-300">وقائع</div>
                    <div className="px-3 py-1 bg-neutral-800 rounded text-sm text-neutral-300">تفسير</div>
                    <div className="px-3 py-1 bg-neutral-800 rounded text-sm text-neutral-300">إحساس</div>
                    <div className="px-3 py-1 bg-neutral-800 rounded text-sm text-neutral-300">سلوك</div>
                  </div>
                  <div className="flex-1 p-4 relative">
                    <textarea 
                      className="w-full h-full bg-transparent resize-none outline-none text-neutral-300 leading-relaxed" 
                      placeholder="ابدأ بتدوين الملاحظات لفصل الطبقات أو تحليل القصة..."
                    ></textarea>
                  </div>
                </div>

                {/* Pattern Tracker */}
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 flex-1">
                    <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-widest">كشف النمط الظاهر</h3>
                    <div className="flex flex-wrap gap-2">
                      {['التجنب', 'الاسترضاء', 'الانسحاب', 'التضخيم', 'التعلق', 'السيطرة', 'Overthinking'].map(pat => (
                        <button 
                          key={pat} 
                          onClick={() => setDominantPattern(pat)}
                          className={`px-3 py-1.5 rounded-lg border text-xs transition ${dominantPattern === pat ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'}`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 flex-1">
                    <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-widest">ربط بخريطة العلاقات</h3>
                    {nodes.length > 0 ? (
                      <select 
                        value={selectedNodeId}
                        onChange={(e) => setSelectedNodeId(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-600 mb-4"
                      >
                        <option value="">اختر شخص/دائرة من الخريطة..</option>
                        {nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-neutral-500 mb-4">لا توجد خريطة مفعلة لهذا العميل حالياً.</p>
                    )}

                    <div className="pt-4 border-t border-neutral-800">
                      <h3 className="text-sm font-bold text-red-400 mb-4 uppercase tracking-widest flex items-center">
                        <Zap className="w-4 h-4 ml-2" /> Sovereign Control (Live Override)
                      </h3>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button onClick={() => sendSovereignCommand('FORCE_STATE', { state: 'crisis' })} className="flex-1 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 text-xs py-2 rounded-lg transition">Force Crisis</button>
                          <button onClick={() => sendSovereignCommand('FORCE_STATE', { state: 'flow' })} className="flex-1 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-900/50 text-blue-400 text-xs py-2 rounded-lg transition">Force Flow</button>
                        </div>
                        <button onClick={() => sendSovereignCommand('TRIGGER_HAPTIC', { severity: 'crisis' })} className="w-full bg-orange-900/20 hover:bg-orange-900/40 border border-orange-900/50 text-orange-400 text-xs py-2 rounded-lg transition">Haptic Shock</button>
                        <div className="flex gap-2">
                          <input id="whisper-text" type="text" placeholder="اهمس للمستخدم..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 text-xs" />
                          <button onClick={() => {
                            const input = document.getElementById('whisper-text') as HTMLInputElement;
                            if (input && input.value) {
                              sendSovereignCommand('INJECT_WHISPER', { text: input.value });
                              input.value = '';
                            }
                          }} className="bg-indigo-600 hover:bg-indigo-500 px-3 rounded-lg text-xs font-bold text-white transition">إرسال</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'post_session' && (
            <motion.div key="post_session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <h1 className="text-3xl font-bold mb-8 text-neutral-100 flex items-center">
                <FileCheck2 className="w-8 h-8 ml-3 text-blue-400" />
                شاشة الإغلاق والتوثيق
              </h1>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1">الموضوع الأساسي</label>
                      <input type="text" value={mainTopic} onChange={(e) => setMainTopic(e.target.value)} className="w-full bg-[#111] border border-neutral-800 rounded-lg p-3 text-sm" placeholder="مثلاً: الخوف من الفقد" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1">النمط السائد</label>
                      <input type="text" value={dominantPattern} onChange={(e) => setDominantPattern(e.target.value)} className="w-full bg-[#111] border border-neutral-800 rounded-lg p-3 text-sm" placeholder="مثلاً: تجنب الصراع" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">التدخل الأساسي (ماذا فعلنا؟)</label>
                    <input type="text" value={mainIntervention} onChange={(e) => setMainIntervention(e.target.value)} className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-white" placeholder="مثلاً: فصل الوقائع عن التفسير" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">أول علامة تحول (First Shift)</label>
                    <input type="text" value={firstShift} onChange={(e) => setFirstShift(e.target.value)} className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-white" placeholder="ماذا حدث في ملامحه أو كلامه؟" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">الخلاصة الكبرى</label>
                    <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-white focus:outline-none focus:border-neutral-600"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">الإجراء المطلوب (الواجب)</label>
                    <input type="text" value={assignment} onChange={(e) => setAssignment(e.target.value)} className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-white focus:outline-none focus:border-neutral-600" placeholder="خطوة واحدة خلال 48 ساعة..." />
                  </div>
                  <div className="flex items-center justify-between bg-[#111] border border-neutral-800 p-4 rounded-xl">
                    <span className="text-sm font-bold">تفعيل المتابعة الآلية (بعد 48س)؟</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={recommendFollowup}
                        onChange={(e) => setRecommendFollowup(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 ml-2 text-neutral-400" />
                    معاينة رسالة ما بعد الجلسة الآلية
                  </h3>
                  <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-lg text-sm text-neutral-300 font-mono leading-relaxed">
                    شكرًا لحضورك الجلسة.<br/><br/>
                    ملخص سريع:<br/>
                    • الموضوع الأساسي: {mainTopic || '[سيتم إدخاله]'}<br/>
                    • النمط اللي ظهر: {dominantPattern || '[سيتم إدخاله]'}<br/>
                    • أهم نقطة خرجنا بيها: {summary.substring(0, 50) + '...'}<br/><br/>
                    المطلوب منك حاليًا: {assignment}<br/><br/>
                    ركز على التنفيذ الفعلي، مش مجرد الإحساس بعد الجلسة.
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button 
                        onClick={closeSession}
                        disabled={isClosing || !summary}
                        className="flex-1 py-3 bg-white text-black rounded-lg font-bold hover:bg-neutral-200 transition disabled:bg-neutral-700 disabled:text-neutral-500"
                    >
                        {isClosing ? 'جاري الحفظ...' : 'توثيق الجلسة وإرسال الرسالة'}
                    </button>
                    <button 
                        onClick={generatePDF}
                        disabled={!selectedRequest}
                        className="p-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg hover:bg-neutral-700 transition"
                        title="تحميل تقرير PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hidden Report Container for PDF Export */}
              <div id="report-export-container" className="fixed -left-[10000px] top-0 w-[800px] bg-black text-white p-12 font-sans" dir="rtl">
                <div className="border-b-2 border-indigo-500 pb-8 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-indigo-400 mb-2">ALREHLA</h1>
                        <p className="text-neutral-500">Session OS Intelligence Report</p>
                    </div>
                    <div className="text-left text-sm text-neutral-500">
                        {new Date().toLocaleDateString('ar-EG')}
                    </div>
                </div>

                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 text-neutral-400">ملف العميل</h2>
                    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                        <p className="text-xl font-bold mb-2">{selectedRequest?.dawayir_clients?.name}</p>
                        <p className="text-neutral-500 text-sm">العمر: {selectedRequest?.dawayir_clients?.age_range} • تاريخ الطلب: {new Date(selectedRequest?.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="p-6 border border-neutral-800 rounded-2xl">
                        <h3 className="text-sm font-bold text-neutral-500 mb-4 uppercase">الموضوع الأساسي</h3>
                        <p className="text-lg">{mainTopic || 'غير محدد'}</p>
                    </div>
                    <div className="p-6 border border-neutral-800 rounded-2xl">
                        <h3 className="text-sm font-bold text-neutral-500 mb-4 uppercase">النمط السائد</h3>
                        <p className="text-lg">{dominantPattern || 'غير محدد'}</p>
                    </div>
                </div>

                <div className="mb-12">
                    <h3 className="text-sm font-bold text-neutral-500 mb-4 uppercase">خلاصة الجلسة والتدخل</h3>
                    <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 text-xl leading-relaxed">
                        {summary}
                    </div>
                </div>

                <div className="mb-12">
                     <h3 className="text-sm font-bold text-indigo-400 mb-4 uppercase">التكليف المطلوب (48 ساعة)</h3>
                     <div className="bg-indigo-950/20 border border-indigo-900/30 p-8 rounded-2xl text-2xl font-bold text-indigo-50 leading-relaxed">
                        {assignment}
                     </div>
                </div>

                <div className="mt-20 pt-8 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-600">
                    <span>Generated by Session OS Intelligence Engine</span>
                    <span>alrehla.io</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <BarChart3 className="text-blue-400" />
                تحليلات الأثر والتحول التحويلي
              </h1>

              <div className="grid grid-cols-4 gap-6 mb-8">
                <StatCard title="إجمالي الجلسات" value={requests.length.toString()} icon={<Activity className="text-blue-400" />} />
                <StatCard title="معدل الإكمال" value={`${Math.round((requests.filter(r => r.status === 'session_done').length / (requests.length || 1)) * 100)}%`} icon={<FileCheck2 className="text-emerald-400" />} />
                <StatCard title="متوسط الوضوح" value={`${(requests.reduce((acc, r) => acc + (r.dawayir_triage_answers?.[0]?.clarity_score || 0), 0) / (requests.length || 1)).toFixed(1)}/10`} icon={<TrendingUp className="text-indigo-400" />} />
                <StatCard title="طلبات الفرز" value={requests.filter(r => r.status === 'needs_manual_review').length.toString()} icon={<AlertTriangle className="text-yellow-400" />} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Distribution Chart */}
                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-widest">توزيع المشاكل الظاهرة</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'علاقات', value: requests.filter(r => r.dawayir_triage_answers?.[0]?.session_goal_type === 'علاقات').length },
                        { name: 'عمل', value: requests.filter(r => r.dawayir_triage_answers?.[0]?.session_goal_type === 'عمل').length },
                        { name: 'ذات', value: requests.filter(r => r.dawayir_triage_answers?.[0]?.session_goal_type === 'ذات').length },
                        { name: 'أخرى', value: requests.filter(r => !['علاقات', 'عمل', 'ذات'].includes(r.dawayir_triage_answers?.[0]?.session_goal_type)).length }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Evolution Profile */}
                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-widest">منحنى الوضوح (Clarity Trend)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { day: '1', score: 3 },
                        { day: '3', score: 4 },
                        { day: '7', score: 8 },
                        { day: '10', score: 7 },
                        { day: '14', score: 9 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="day" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} domain={[0, 10]} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                        <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
    <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm text-neutral-400 font-medium">{title}</h3>
        <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">{icon}</div>
      </div>
      <div className="text-4xl font-black">{value}</div>
    </div>
  );
}

function BriefBlock({ title, content }: { title: string, content: string }) {
  return (
    <div className="bg-[#111] border border-neutral-800 rounded-xl p-5">
      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-sm text-neutral-200 leading-relaxed">{content}</p>
    </div>
  );
}
