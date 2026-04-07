import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, Flame, ChevronRight, BarChart3, TrendingUp, AlertTriangle, Shield, Settings, LogOut, ArrowLeft, BarChart } from 'lucide-react';
import { StabilityHeatmap } from '@/modules/exploration/StabilityHeatmap';

const DEPARTMENTS = [
    { id: 'eng', name: 'الهندسة (Engineering)', employees: 142, burnoutScore: 85, trend: '+15%', status: 'critical' },
    { id: 'sales', name: 'المبيعات (Sales)', employees: 85, burnoutScore: 65, trend: '+5%', status: 'warning' },
    { id: 'hr', name: 'الموارد البشرية (HR)', employees: 24, burnoutScore: 40, trend: '-2%', status: 'stable' },
    { id: 'product', name: 'المنتج (Product)', employees: 56, burnoutScore: 78, trend: '+12%', status: 'critical' },
    { id: 'marketing', name: 'التسويق (Marketing)', employees: 45, burnoutScore: 50, trend: '0%', status: 'stable' },
];

export const EnterprisePortal: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    const getHealthColor = (score: number) => {
        if (score >= 75) return 'var(--ring-danger)'; // Red
        if (score >= 60) return 'var(--ring-caution)'; // Yellow
        return 'var(--ring-safe)'; // Green
    };

    const getHealthBg = (score: number) => {
        if (score >= 75) return 'rgba(248, 113, 113, 0.1)';
        if (score >= 60) return 'rgba(251, 191, 36, 0.1)';
        return 'rgba(52, 211, 153, 0.1)';
    };

    const criticalDeptCount = DEPARTMENTS.filter(d => d.status === 'critical').length;

    return (
        <div className="flex h-[100dvh] w-full bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">

            {/* Sidebar */}
            <motion.aside
                initial={{ width: 260 }}
                className="bg-slate-900 border-l border-slate-800 flex flex-col relative z-20 shrink-0 hidden md:flex"
            >
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    {onBack && (
                        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="رجوع">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex flex-col items-center justify-center shrink-0 border border-teal-500/30">
                        <Shield className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-white">دواير للشركات</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-all bg-teal-500/10 text-teal-400">
                        <Activity className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">خريطة الاحتراق</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-slate-800">
                        <Users className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">الفرق والأقسام</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-slate-800">
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">إعدادات المنصة</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-rose-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-bold">تسجيل الخروج</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-[100dvh] overflow-y-auto bg-[#0a0f1c] relative relative">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.1), transparent 70%)' }} />

                <div className="p-8 max-w-7xl mx-auto w-full relative z-10">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">
                                لوحة القيادة المؤسسية (B2B)
                            </h1>
                            <p className="text-slate-400 mt-1">الرؤية الكلية: خريطة النزيف الطاقي الأسبوعية</p>
                        </div>

                        <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/60 backdrop-blur-md">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-slate-500">معدل الاستمرار المتوقع</span>
                                <span className="text-xl font-bold text-emerald-400">92%</span>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-800" />
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-slate-500">بؤر الاحتراق النشطة</span>
                                <span className="text-xl font-bold text-rose-500 flex items-center gap-2">
                                    <Flame size={18} />
                                    {criticalDeptCount}
                                </span>
                            </div>
                        </div>
                    </header>

                    <div className="flex flex-col xl:flex-row gap-8">
                        {/* Heatmap Grid & Analysis */}
                        <div className="flex-1 space-y-8">
                            <div>
                              <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-white">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Activity className="w-4 h-4 text-indigo-400" />
                                  </div>
                                  توزيع النزيف الطاقي عبر المؤسسة
                              </h2>

                              <div className="p-1 rounded-[2rem] bg-slate-900/30 border border-white/5 backdrop-blur-sm shadow-2xl">
                                <StabilityHeatmap />
                              </div>
                              <p className="mt-4 text-[10px] text-slate-500 text-center font-medium">
                                * البيانات تعكس النبضات المتراكمة لآخر 7 أيام. البقع الداكنة تشير إلى استنزاف طاقي حاد.
                              </p>
                            </div>

                            <div className="space-y-6">
                              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                <BarChart className="w-4 h-4 text-teal-400" />
                                تقرير الأقسام المباشر
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {DEPARTMENTS.map((dept) => (
                                      <motion.div
                                          key={dept.id}
                                          onClick={() => setSelectedDept(dept.id)}
                                          className={`relative overflow-hidden rounded-2xl cursor-pointer border transition-all duration-300 ${selectedDept === dept.id ? 'ring-2 ring-indigo-500 scale-[1.01] z-10' : 'hover:border-slate-700'
                                              }`}
                                          style={{
                                              background: 'rgba(15, 23, 42, 0.45)',
                                              borderColor: selectedDept === dept.id ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                                              backdropFilter: 'blur(10px)'
                                          }}
                                          whileHover={{ y: -2 }}
                                      >
                                          <div className="p-5">
                                              <div className="flex justify-between items-start mb-4">
                                                  <h3 className="text-sm font-black text-white">{dept.name}</h3>
                                                  <div
                                                      className="px-2 py-1 rounded-lg text-[10px] font-black"
                                                      style={{
                                                          background: getHealthBg(dept.burnoutScore),
                                                          color: getHealthColor(dept.burnoutScore),
                                                      }}
                                                  >
                                                      {dept.burnoutScore}%
                                                  </div>
                                              </div>

                                              <div className="w-full bg-slate-800/50 rounded-full h-1">
                                                  <motion.div
                                                      className="h-full rounded-full"
                                                      style={{ backgroundColor: getHealthColor(dept.burnoutScore) }}
                                                      initial={{ width: 0 }}
                                                      animate={{ width: `${dept.burnoutScore}%` }}
                                                  />
                                              </div>
                                          </div>
                                      </motion.div>
                                  ))}
                              </div>
                            </div>
                        </div>

                        {/* Sidebar Insights */}
                        <div className="w-full xl:w-96 shrink-0 h-full">
                            <AnimatePresence mode="popLayout">
                                {selectedDept ? (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                        className="rounded-3xl p-6 sticky top-8 border border-slate-800/80 shadow-2xl"
                                        style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)' }}
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Flame className="text-rose-500" />
                                                تشريح بؤرة الاحتراق
                                            </h3>
                                            <button onClick={() => setSelectedDept(null)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition">
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-4 rounded-xl relative overflow-hidden border border-rose-500/20" style={{ background: 'linear-gradient(180deg, rgba(244,63,94,0.05) 0%, rgba(15,23,42,0) 100%)' }}>
                                                <div className="flex items-center gap-3 mb-3 text-rose-400">
                                                    <AlertTriangle size={18} />
                                                    <span className="font-semibold text-sm">تحذير: ثقب أسود إداري</span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-slate-300/90 font-medium">
                                                    نظام الذكاء الاصطناعي رصد زيادة 15% في معدلات النبضات المرتبطة بـ <span className="text-rose-400 font-bold">"غياب الوضوح"</span> و <span className="text-rose-400 font-bold">"صراعات الصلاحيات"</span> في هذا القسم خلال آخر أسبوعين.
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-300 pb-2 border-b border-slate-800">
                                                    <BarChart3 size={16} />
                                                    أبرز مصادر الاحتكاك (مجهول)
                                                </h4>
                                                <ul className="space-y-4">
                                                    {[
                                                        { label: 'الاجتماعات غير المنتجة', val: 45, color: 'bg-rose-500' },
                                                        { label: 'ضبابية الأهداف', val: 32, color: 'bg-amber-500' },
                                                        { label: 'نقص التقدير الإداري', val: 23, color: 'bg-indigo-500' },
                                                    ].map((item, idx) => (
                                                        <li key={idx}>
                                                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                                <span className="text-slate-300">{item.label}</span>
                                                                <span className="text-slate-400">{item.val}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                                                                <motion.div
                                                                    className={`h-full rounded-full ${item.color}`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${item.val}%` }}
                                                                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.8 }}
                                                                />
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <button className="w-full py-3.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-[0.98]">
                                                اقتراح تدخل مبكر (AI Intervention)
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full rounded-3xl p-6 border border-slate-800/50 flex flex-col items-center justify-center text-center px-8"
                                        style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)' }}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500 border border-slate-700">
                                            <Activity size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-300 mb-2">اختر قسماً للتفاصيل</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            اضغط على أي من الأقسام في الخريطة الحرارية للحصول على تحليل ذكي لمصادر الاحتراق والنزيف الطاقي.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Local component X icon
const X = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);
