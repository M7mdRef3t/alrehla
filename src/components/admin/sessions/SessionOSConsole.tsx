'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BrainCircuit, Users, FileText, Briefcase, ChevronRight, Share, FileCheck2, AlertTriangle, MessageCircle, BarChart3, TrendingUp, PieChart as PieChartIcon, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

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
  const [recommendFollowup, setRecommendFollowup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
          recommendFollowup,
          notes: `تم عن طريق كونسول الإغلاق. مربط بعقدة: ${selectedNodeId || 'None'}`,
          linkedNodeId: selectedNodeId
        })
      });
      setSummary('');
      setAssignment('');
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

  const pendingRequests = requests.filter(r => ['new_request', 'intake_completed', 'manual_review', 'prep_pending'].includes(r.status));
  const readyRequests = requests.filter(r => r.status === 'session_ready' || r.status === 'brief_generated');

  const handleSelectRequest = (req: any) => {
    setSelectedRequest(req);
    setActiveTab('live_session');
  };

  const sessionBrief = selectedRequest?.dawayir_ai_session_briefs?.[0] || {
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
      <div className="flex-1 overflow-y-auto p-8 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl">
              <h1 className="text-3xl font-bold mb-8">نظرة عامة على الجلسات</h1>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <StatCard title="طلبات جديدة" value="2" icon={<Users className="text-blue-500" />} />
                <StatCard title="جاهزون للجلسة" value="1" icon={<FileText className="text-green-500" />} />
                <StatCard title="متابعات معلقة" value="3" icon={<Share className="text-orange-500" />} />
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
                        {req.status === 'manual_review' && (
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
                      <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-200">تحويل للاستكشاف</button>
                      <button className="bg-[#1A1A1A] border border-neutral-700 px-4 py-2 rounded-lg text-sm hover:bg-neutral-800">إرسال رابط الـ Prep Form</button>
                      <button className="text-red-400 hover:text-red-300 text-sm mt-2">رفض مهذب / إحالة</button>
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
                  {sessionBrief.hypothesis}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <BriefBlock title="المشكلة الظاهرة (حسب كلامه)" content={sessionBrief.visibleProblem} />
                <BriefBlock title="الإشارة العاطفية" content={sessionBrief.emotionalSignal} />
                <BriefBlock title="الاحتياج المخفي (الدفين)" content={sessionBrief.hiddenNeed} />
                <BriefBlock title="الهدف المتوقع من الجلسة" content={sessionBrief.expectedGoal} />
              </div>

              <div className="mt-6 bg-red-950/20 border border-red-900/30 rounded-xl p-5">
                <h3 className="text-red-400 text-sm font-bold flex items-center mb-2"><AlertTriangle className="w-4 h-4 ml-2"/> حدود الأمان للجلسة</h3>
                <p className="text-red-200 text-sm">{sessionBrief.boundaries}</p>
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
                  <p className="text-neutral-400">العميل: السيد/ أحمد محمود — الجلسة جارية الآن.</p>
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
                        <button key={pat} className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800 transition">
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
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-600"
                      >
                        <option value="">اختر شخص/دائرة من الخريطة..</option>
                        {nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-neutral-500">لا توجد خريطة مفعلة لهذا العميل حالياً.</p>
                    )}
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
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">الخلاصة: ماذا اكتشفنا وما النمط؟</label>
                    <textarea rows={4} className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-white focus:outline-none focus:border-neutral-600"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">الإجراء المطلوب (الواجب)</label>
                    <input type="text" className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-white focus:outline-none focus:border-neutral-600" placeholder="خطوة واحدة خلال 48 ساعة..." />
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
                    • الموضوع الأساسي: [سيتم إدخاله]<br/>
                    • النمط اللي ظهر: [سيتم إدخاله]<br/>
                    • أهم نقطة خرجنا بيها: [سيتم إدخاله]<br/><br/>
                    المطلوب منك حاليًا: [الواجب المكتوب]<br/><br/>
                    ركز على التنفيذ الفعلي، مش مجرد الإحساس بعد الجلسة.
                  </div>
                  <button className="w-full mt-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-neutral-200 transition">توثيق الجلسة وإرسال الرسالة</button>
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
                <StatCard title="معدل الإكمال" value="85%" icon={<FileCheck2 className="text-emerald-400" />} />
                <StatCard title="متوسط الوضوح" value="7.2/10" icon={<TrendingUp className="text-indigo-400" />} />
                <StatCard title="نقاط الأثر" value="124" icon={<Zap className="text-yellow-400" />} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Distribution Chart */}
                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-widest">توزيع المشاكل الظاهرة</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'علاقات', value: 45 },
                        { name: 'عمل', value: 30 },
                        { name: 'ذات', value: 25 },
                        { name: 'مستقبل', value: 15 }
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
