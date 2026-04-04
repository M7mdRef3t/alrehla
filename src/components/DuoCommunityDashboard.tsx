import React, { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, TrendingUp, Bookmark, 
  Users, BookOpen, MessageSquare, Award,
  Heart, Share2, MoreHorizontal
} from 'lucide-react';
import { soundManager } from '../services/soundManager';

interface DuoCommunityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'explore' | 'experts' | 'groups' | 'challenges' | 'discussion_room';

// Sample Data
const EXPERTS = [
  { id: 1, name: 'د. سارة الأحمد', role: 'مستشارة علاقات زوجية', avatar: 'https://i.pravatar.cc/150?u=doc1' },
  { id: 2, name: 'أ. خالد منصور', role: 'خبير في التواصل الفعال', avatar: 'https://i.pravatar.cc/150?u=doc2' },
];

const FEED_POSTS = [
  {
    id: 1,
    author: 'عضو مجهول',
    category: 'حديثو الزواج',
    time: 'منذ ساعتين',
    title: 'كيف تجاوزنا سنة أولى زواج؟',
    content: 'كانت البداية مليئة بالتحديات، خاصة في تقسيم المسؤوليات اليومية. ما ساعدنا فعلاً هو "اجتماع الأحد" الأسبوعي، حيث نجلس بكل هدوء لنناقش ما أزعجنا وما أسعدنا في الأسبوع الماضي...',
    likes: 24,
    comments: 8
  },
  {
    id: 2,
    author: 'عضو مجهول',
    category: 'تطوير التواصل',
    time: 'منذ 5 ساعات',
    title: 'قوة الكلمات البسيطة',
    content: 'أدركت مؤخراً أن جملة "أقدر ما تفعله" لها مفعول السحر أكثر من أي نقاش منطقي. التقدير هو الوقود الحقيقي لأي علاقة ناجحة، جربوا قولها اليوم...',
    likes: 56,
    comments: 12
  }
];

const DISCUSSION_COMMENTS = [
  { id: 1, author: 'ليلى العمري', comment: 'هذه الفقرة بالذات غيرت منظوري تماماً. هل يعني هذا أن "الحدس" هو ببساطة معالجة سريعة لهذه المحاكاة؟' },
  { id: 2, author: 'أحمد منصور', comment: 'أتفق معك يا ليلى. أعتقد أن التفكك العاطفي المذكور لاحقاً هو ما نراه في بيئات العمل السامة حيث تُقمع المشاعر بدلاً من محاكاتها.' },
  { id: 3, author: 'نورة سالم', comment: 'موضوع "انكسار المرآة" يحتاج لنقاش أطول. هل يمكن استعادتها مرة أخرى بعد فقدان الثقة؟' }
];

export const DuoCommunityDashboard: FC<DuoCommunityDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('explore');

  if (!isOpen) return null;

  const handleTabSwitch = (tab: TabType) => {
    soundManager.playClick();
    setActiveTab(tab);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
          dir="rtl"
        >
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full bg-slate-900/50 relative overflow-hidden order-2 md:order-1">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900 z-10 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  {activeTab === 'explore' && <TrendingUp className="w-6 h-6 text-indigo-400" />}
                  {activeTab === 'experts' && <Users className="w-6 h-6 text-rose-400" />}
                  {activeTab === 'discussion_room' && <BookOpen className="w-6 h-6 text-emerald-400" />}
                  {activeTab === 'explore' ? 'مجتمع الثنائي - استكشاف' : 
                   activeTab === 'experts' ? 'زاوية الخبراء' : 
                   activeTab === 'discussion_room' ? 'الغرفة النقاشية' : 'المجتمع'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {activeTab === 'discussion_room' ? 'الفصل الثامن: تأثير المرأة وعلم الروابط العاطفية' : 'شارك رحلتك واستلهم من تجارب الآخرين في بيئة آمنة.'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition flex md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'explore' && (
                  <motion.div 
                    key="explore"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Feed Column */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Highlight Card */}
                      <div className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-800 p-6 border border-indigo-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full mb-4 inline-block">تحدي مجتمعي</span>
                          <h3 className="text-xl font-bold text-white mb-2">30 يوم من الامتنان المشترك</h3>
                          <p className="text-indigo-200/80 text-sm leading-relaxed mb-4">
                            عززوا الروابط العاطفية من خلال ممارسة يومية بسيطة: مشاركة شيء واحد تشعرون بالامتنان له تجاه شريككم.
                          </p>
                          <button 
                            onClick={() => handleTabSwitch('challenges')}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition"
                          >
                            الانضمام للتحدي
                          </button>
                        </div>
                      </div>

                      {/* Feed Posts */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          مواضيع ساخنة
                        </h4>
                        {FEED_POSTS.map(post => (
                          <div key={post.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 relative">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 font-bold text-slate-300">
                                  {post.author[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-200">{post.author}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span>{post.category}</span>
                                    <span>•</span>
                                    <span>{post.time}</span>
                                  </div>
                                </div>
                              </div>
                              <button className="text-slate-500 hover:text-slate-300">
                                <MoreHorizontal className="w-5 h-5" />
                              </button>
                            </div>
                            <h5 className="text-md font-bold text-indigo-100 mb-2">{post.title}</h5>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 text-slate-400">
                              <button className="flex items-center gap-1.5 text-xs hover:text-rose-400 transition">
                                <Heart className="w-4 h-4" /> {post.likes}
                              </button>
                              <button className="flex items-center gap-1.5 text-xs hover:text-indigo-400 transition" onClick={() => handleTabSwitch('discussion_room')}>
                                <MessageSquare className="w-4 h-4" /> {post.comments}
                              </button>
                              <button className="flex items-center gap-1.5 text-xs hover:text-emerald-400 transition">
                                <Share2 className="w-4 h-4" /> مشاركة
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sidebar inside tab */}
                    <div className="space-y-6">
                      {/* Search */}
                      <div className="relative">
                        <input
                          id="community-search"
                          name="communitySearch"
                          type="text" 
                          placeholder="ابحث في المجتمع..." 
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>

                      {/* Experts Snippet */}
                      <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-slate-300">زاوية الخبراء</h4>
                          <button 
                            onClick={() => handleTabSwitch('experts')}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            عرض الكل
                          </button>
                        </div>
                        <div className="space-y-4">
                          {EXPERTS.map(expert => (
                            <div key={expert.id} className="flex items-center gap-3">
                              <img src={expert.avatar} alt={expert.name} className="w-10 h-10 rounded-full border border-slate-600" />
                              <div>
                                <div className="text-sm font-semibold text-slate-200">{expert.name}</div>
                                <div className="text-xs text-slate-500">{expert.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Categories / Groups */}
                      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                          <h4 className="text-sm font-bold text-slate-300">مجموعات الاهتمام</h4>
                        </div>
                        <div className="divide-y divide-slate-700/30">
                          {['حديثو الزواج', 'علاقات المسافات', 'تطوير التواصل'].map(g => (
                            <button key={g} className="w-full text-right px-4 py-3 text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition">
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'discussion_room' && (
                  <motion.div
                    key="discussion"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-4xl mx-auto space-y-8 pb-10"
                  >
                    {/* Reading Section */}
                    <div className="prose prose-invert prose-indigo max-w-none">
                      <div className="text-indigo-400 text-sm font-bold mb-2">من كتاب: "علم الروابط العاطفية" • المجلد الأول</div>
                      <h3 className="text-3xl font-black text-white mb-6">Neural Echoes: تأثير المرآة</h3>
                      
                      <p className="text-slate-300 text-lg leading-relaxed md:leading-loose">
                        إن الفهم العميق للوعي العاطفي يبدأ من نقطة مركزية واحدة: كيف نرى أنفسنا في الآخرين؟ في هذا الفصل، نغوص في أعماق "تأثير المرآة" وكيف يشكل هويتنا الاجتماعية.
                      </p>
                      
                      <blockquote className="border-r-4 border-indigo-500 pr-6 my-8 py-2 bg-indigo-950/20 rounded-l-xl">
                        <p className="text-indigo-200 text-xl font-bold italic leading-relaxed m-0">
                          "إن مفهوم المحاكاة العاطفية (Emotional Mirroring) ليس مجرد استجابة بيولوجية، بل هو جسر عصبي يربط بين الأنا والآخر في تناغم تام يسبق الكلمات."
                        </p>
                      </blockquote>
                      
                      <p className="text-slate-400 leading-relaxed md:leading-loose text-base">
                        عندما نراقب شخصاً يضحك، لا تدرك عقولنا الفرح فقط، بل تحاكي تلك المشاعر داخلياً. هذه هي الأسس التي تُبنى عليها الثقة، وحيث يكمن سر الكاريزما الطبيعية والتعاطف الجذري.
                        لكن ماذا يحدث عندما تنكسر هذه المرآة؟ التفكك العاطفي يبدأ عندما نفقد القدرة على رؤية انعكاس مشاعرنا في الطرف الآخر، مما يؤدي إلى "العزلة النفسية" حتى في أكثر الغرف ازدحاماً.
                      </p>
                    </div>

                    <div className="h-px w-full bg-slate-800 my-8"></div>

                    {/* Live Pulse */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50">
                      <div>
                        <div className="text-sm font-bold text-indigo-300 mb-1">Pulse: التفاعل العاطفي</div>
                        <div className="text-xs text-indigo-200/70">القراء حالياً يتفاعلون بعمق مع "مفهوم المحاكاة". معدل التناغم العصبي مرتفع.</div>
                      </div>
                      <div className="h-8 w-32 bg-slate-900 rounded-lg flex items-end gap-1 p-1 overflow-hidden">
                        {[40, 60, 30, 80, 50, 90, 70, 40].map((h, i) => (
                          <motion.div 
                            key={i}
                            animate={{ height: `${h}%` }}
                            transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1 + Math.random() }}
                            className="flex-1 bg-indigo-500 rounded-t-sm"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                      <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        النقاشات الحية (الدوائر)
                      </h4>
                      <p className="text-sm text-slate-400 mb-6 bg-slate-800/50 p-3 rounded-lg inline-block border border-slate-700/50">
                        يدور النقاش حالياً حول الربط بين التعاطف الجذري ومفهوم المحاكاة العاطفية كأداة لبناء الثقة في العلاقات المهنية.
                      </p>
                      
                      <div className="space-y-6">
                        {DISCUSSION_COMMENTS.map(c => (
                          <div key={c.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center font-bold text-slate-400 text-sm">
                              {c.author[0]}
                            </div>
                            <div className="flex-1 bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                              <div className="font-bold text-slate-300 text-sm mb-2">{c.author}</div>
                              <div className="text-slate-400 text-sm leading-relaxed">{c.comment}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Input */}
                      <div className="mt-8 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-900/50 shrink-0 border border-indigo-700/50 flex items-center justify-center font-bold text-indigo-300 text-sm">
                          أنت
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            id="discussion-reply"
                            name="discussionReply"
                            placeholder="شارك برأيك في الغرفة النقاشية..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition resize-none h-24 custom-scrollbar"
                          ></textarea>
                          <button className="absolute left-3 bottom-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">
                            إرسال
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Fallback for other tabs */}
                {(activeTab === 'experts' || activeTab === 'groups' || activeTab === 'challenges') && (
                  <motion.div
                    key="fallback"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-slate-500"
                  >
                    <BookOpen className="w-16 h-16 text-slate-800 mb-4" />
                    <p>هذا القسم قيد التطوير...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 order-1 md:order-2 overflow-x-auto md:overflow-visible relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="p-4 md:p-6 pb-2 md:pb-6 flex items-center justify-between border-b border-slate-800 shrink-0 w-max md:w-auto min-w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-black tracking-tight text-white hidden md:block">Insight Circles</h3>
              </div>
              <button 
                onClick={onClose}
                className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 flex md:flex-col gap-2 md:gap-1 custom-scrollbar">
              <button 
                onClick={() => handleTabSwitch('explore')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm w-full shrink-0 ${activeTab === 'explore' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <TrendingUp className="w-5 h-5" />
                استكشاف
              </button>
              
              <button 
                onClick={() => handleTabSwitch('discussion_room')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm w-full shrink-0 ${activeTab === 'discussion_room' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <MessageSquare className="w-5 h-5" />
                الغرف النقاشية
              </button>

              <button 
                onClick={() => handleTabSwitch('experts')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm w-full shrink-0 ${activeTab === 'experts' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <Award className="w-5 h-5" />
                زاوية الخبراء
              </button>

              <button 
                onClick={() => handleTabSwitch('groups')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm w-full shrink-0 ${activeTab === 'groups' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <Users className="w-5 h-5" />
                مجموعات الاهتمام
              </button>

              <button 
                onClick={() => handleTabSwitch('challenges')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm w-full shrink-0 ${activeTab === 'challenges' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <Bookmark className="w-5 h-5" />
                تحديات نشطة
              </button>
            </nav>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
