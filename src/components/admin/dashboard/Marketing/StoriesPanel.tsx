import type { FC } from "react";
import { useState, useEffect } from "react";
import { 
  Trophy, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Star,
  MapPin,
  Quote,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchAdminStories, 
  saveStory, 
  deleteStory, 
  type SuccessStory 
} from "@/services/admin/adminStories";
import { logger } from "@/services/logger";

export const StoriesPanel: FC = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    const data = await fetchAdminStories();
    setStories(data);
    setLoading(false);
  };

  const handleEdit = (story: SuccessStory) => {
    setEditingStory({ ...story });
    setError(null);
  };

  const handleAddNew = () => {
    setEditingStory({
      name: "",
      age: 25,
      city: "",
      category: "عام",
      quote: "",
      outcome: "",
      stars: 5,
      avatar: "",
      color: "from-teal-500 to-emerald-600",
      is_published: true
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!editingStory) return;
    
    // Basic validation
    if (!editingStory.name || !editingStory.quote || !editingStory.outcome) {
      setError("الرجاء ملء جميع الحقول الأساسية (الاسم، الاقتباس، والنتيجة).");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error: saveErr } = await saveStory(editingStory);
      if (saveErr) throw saveErr;
      
      await loadStories();
      setEditingStory(null);
    } catch (err) {
      logger.error("Failed to save story:", err);
      setError("حدث خطأ أثناء حفظ القصة. تأكد من صلاحياتك.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه القصة؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    try {
      const { success } = await deleteStory(id);
      if (success) {
        setStories(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      logger.error("Failed to delete story:", err);
    }
  };

  const filteredStories = stories.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) || 
    s.city.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  const colors = [
    { label: "Teal (علاقات)", value: "from-teal-500 to-emerald-600" },
    { label: "Violet (إنتاجية)", value: "from-violet-500 to-purple-600" },
    { label: "Rose (ثقة)", value: "from-rose-500 to-pink-600" },
    { label: "Blue (هدوء)", value: "from-blue-500 to-cyan-600" },
    { label: "Amber (هوية)", value: "from-amber-500 to-orange-600" },
    { label: "Green (مهنة)", value: "from-green-500 to-teal-600" },
  ];

  return (
    <div className="space-y-6 text-slate-200" dir="rtl">
      {/* Header */}
      <header className="admin-glass-card rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-4 md:mb-0">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
            <Trophy className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">سجل حكايات الانتصار</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-sm font-bold text-teal-500/80 uppercase tracking-widest">إدارة الدليل الاجتماعي والقصص الملهمة</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في القصص..."
              className="w-full rounded-xl border border-slate-700/50 bg-slate-950/60 pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all shadow-inner"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            <Plus className="w-4 h-4" />
            إضافة قصة
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stories List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
              <p className="text-slate-500 font-bold tracking-widest uppercase animate-pulse">جاري استرجاع الحكايات...</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-500 font-bold tracking-widest uppercase">لا توجد قصص مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredStories.map((story) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={story.id}
                    className={`admin-glass-card rounded-2xl border border-slate-800 group hover:border-teal-500/30 transition-all duration-500 relative overflow-hidden ${!story.is_published ? 'opacity-60' : ''}`}
                  >
                    <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${story.color}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-black border border-white/20 shadow-lg`}>
                            {story.avatar || story.name[0]}
                          </div>
                          <div>
                            <h3 className="font-black text-white">{story.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              <MapPin className="w-3 h-3" />
                              {story.city} • {story.age} سنة
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEdit(story)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all border border-transparent hover:border-teal-500/30"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => story.id && handleDelete(story.id)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-black/30 border border-white/5 relative">
                          <Quote className="absolute -top-1 -right-1 w-4 h-4 text-slate-700" />
                          <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">
                            "{story.quote}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-tight line-clamp-1">{story.outcome}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {story.category}
                        </span>
                        <div className="flex items-center gap-2">
                          {story.is_published ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-teal-400 uppercase tracking-widest">
                              <Eye className="w-3 h-3" /> منشور
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              <EyeOff className="w-3 h-3" /> مسودة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Editor Side Panel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {editingStory ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="admin-glass-card rounded-2xl border border-teal-500/30 bg-teal-500/5 p-6 sticky top-6 shadow-[0_0_40px_rgba(20,184,166,0.1)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                    {editingStory.id ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingStory.id ? "تعديل حكاية" : "إضافة حكاية جديدة"}
                  </h3>
                  <button onClick={() => setEditingStory(null)} className="text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الاسم</label>
                      <input
                        value={editingStory.name}
                        onChange={e => setEditingStory({ ...editingStory, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50"
                        placeholder="سارة المنصوري"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">المدينة</label>
                      <input
                        value={editingStory.city}
                        onChange={e => setEditingStory({ ...editingStory, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50"
                        placeholder="الرياض"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">العمر</label>
                      <input
                        type="number"
                        value={editingStory.age}
                        onChange={e => setEditingStory({ ...editingStory, age: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">التصنيف</label>
                      <input
                        value={editingStory.category}
                        onChange={e => setEditingStory({ ...editingStory, category: e.target.value })}
                        className="w-full rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50"
                        placeholder="العلاقات"
                      />
                    </div>
                  </div>

                  {/* Quote & Outcome */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الاقتباس الرئيسي</label>
                    <textarea
                      rows={3}
                      value={editingStory.quote}
                      onChange={e => setEditingStory({ ...editingStory, quote: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 resize-none"
                      placeholder="ماذا قال المسافر عن رحلته؟"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">النتيجة الملموسة</label>
                    <input
                      value={editingStory.outcome}
                      onChange={e => setEditingStory({ ...editingStory, outcome: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50"
                      placeholder="مثال: القدرة على تحديد الحدود بوضوح"
                    />
                  </div>

                  {/* Style Config */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">اللون المعبر (Gradient)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setEditingStory({ ...editingStory, color: c.value })}
                          className={`h-8 rounded-lg bg-gradient-to-br ${c.value} border-2 transition-all ${editingStory.color === c.value ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingStory({ ...editingStory, is_published: !editingStory.is_published })}>
                      <div className={`w-10 h-5 rounded-full transition-colors relative ${editingStory.is_published ? 'bg-teal-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingStory.is_published ? 'right-6' : 'right-1'}`} />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">نشر الحكاية</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">التقييم:</label>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star}
                            className={`w-3 h-3 cursor-pointer ${star <= editingStory.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                            onClick={() => setEditingStory({ ...editingStory, stars: star })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ الحكاية
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-700">
                  <Quote className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-sm">اختر حكاية لتعديلها أو أضف واحدة جديدة</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">THE POWER OF SOCIAL PROOF</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
