import React, { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Store, Palette, Award, Gem, 
  ChevronLeft, Gift, Zap, ShieldCheck, Star
} from 'lucide-react';
import { soundManager } from '@/services/soundManager';
import { useGamificationState } from '@/state/gamificationState';
import { triggerGamificationNudge } from './GamificationNudgeToast';

interface RewardStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'market' | 'inventory' | 'history';
type RewardItem = (typeof REWARDS)[number];

const REWARDS = [
  { id: 'theme_1', title: 'Cosmic Sanctuary', category: 'Exclusive Themes', type: 'theme', cost: 1500, icon: Palette, description: 'تحول بصري كامل يعكس صفاء المجرات العميقة.' },
  { id: 'badge_1', title: 'حكيم العلاقات', category: 'Rarity Badges', type: 'badge', cost: 500, icon: Award, description: 'وسام نادر يعكس عمق التزامك بالتواصل الإيجابي.' },
  { id: 'counseling_1', title: 'جلسة استشارية إضافية (30 دقيقة)', category: 'Professional Services', type: 'service', cost: 3000, icon: ShieldCheck, description: 'جلسة عميقة مع مستشار معتمد لحل العقد المستعصية.' },
  { id: 'report_1', title: 'تقرير ذكاء اصطناعي مفصل', category: 'Professional Services', type: 'service', cost: 2000, icon: Gem, description: 'مستند من 20 صفحة لتحليل الأنماط السلوكية والديناميكيات.' }
];

export const RewardStoreModal: FC<RewardStoreModalProps> = ({ isOpen, onClose }) => {
  const { coins, spendCoins, awardBadge } = useGamificationState();
  const [activeTab, setActiveTab] = useState<TabType>('market');
  
  // States for sub-flows
  const [purchasingItem, setPurchasingItem] = useState<RewardItem | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGrandCelebration, setShowGrandCelebration] = useState(false);

  if (!isOpen) return null;

  const handlePurchaseClick = (item: RewardItem) => {
    soundManager.playClick();
    setPurchasingItem(item);
  };

  const confirmPurchase = () => {
    if (!purchasingItem) return;

    const success = spendCoins(purchasingItem.cost);
    if (!success) {
      triggerGamificationNudge({
        type: 'danger',
        title: 'رصيد غير كافٍ',
        message: 'لا تملك ما يكفي من النقاط لإتمام هذه العملية.'
      });
      setPurchasingItem(null);
      return;
    }

    soundManager.playSuccess();
    
    if (purchasingItem.type === 'badge') {
      awardBadge(purchasingItem.id, purchasingItem.title, purchasingItem.description, purchasingItem.icon.name || 'Award');
    }

    triggerGamificationNudge({
      type: 'points',
      title: 'عملية ناجحة',
      message: `تم شراء "${purchasingItem.title}" بنجاح!`,
      value: -purchasingItem.cost
    });

    if (purchasingItem.cost >= 2000) {
      setShowGrandCelebration(true);
    } else {
      setShowSuccessModal(true);
    }
    setPurchasingItem(null);
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowGrandCelebration(false);
    onClose();
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
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
          onClick={closeModal}
        />

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-indigo-900/30 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900/50 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">متجر المكافآت</h2>
                <div className="text-sm font-medium text-slate-400 mt-1">استبدل نقاطك بامتيازات حصرية لرحلتك.</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">الرصيد الحالي</span>
                <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-black text-white">{coins.toLocaleString()}</span>
                </div>
              </div>
              
              <button 
                onClick={closeModal}
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition flex items-center justify-center border border-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-l border-white/5 bg-slate-900/30 p-6 flex-col gap-2 hidden lg:flex shrink-0">
              <button 
                onClick={() => setActiveTab('market')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'market' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 relative overflow-hidden' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                {activeTab === 'market' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-full" />}
                <Store className="w-5 h-5" />
                السوق
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'inventory' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 relative overflow-hidden' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                {activeTab === 'inventory' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-full" />}
                <Gem className="w-5 h-5" />
                مخزوني
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'history' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 relative overflow-hidden' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                {activeTab === 'history' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-full" />}
                <Zap className="w-5 h-5" />
                سجل النقاط
              </button>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2">كيف تجمع النقاط؟</h4>
                  <ul className="text-xs text-indigo-200/70 space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                      <span>إتمام التأمل اليومي (+50 نقطة)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                      <span>التفاعل البنّاء في المجتمع (+20 نقطة)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Main View Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <AnimatePresence mode="wait">
                {activeTab === 'market' && (
                  <motion.div 
                    key="market"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    {/* Highlight Section */}
                    <div className="relative rounded-3xl overflow-hidden bg-slate-800 mb-10 h-72 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 opacity-80 mix-blend-multiply" />
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401')] bg-cover bg-center mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-center">
                        <span className="px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-bold ring-1 ring-white/20 w-max mb-6 tracking-wider uppercase">
                          مكافأة حصرية جديدة
                        </span>
                        <h3 className="text-3xl lg:text-4xl font-black text-white mb-4">وثيقة رحلة التعافي</h3>
                        <p className="text-indigo-100/90 text-sm lg:text-base max-w-xl leading-relaxed mb-8">
                          اصدار محدود. تقرير فاخر مطبوع يلخص مسيرتك العاطفية وإنجازاتك خلال العام الماضي بنظرة احترافية.
                        </p>
                        <button className="bg-white text-indigo-950 font-black px-8 py-3.5 rounded-xl w-max hover:bg-indigo-50 hover:-translate-y-1 transition-all flex items-center gap-3">
                          استبدل الآن <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Catalog */}
                    <div className="space-y-12">
                      {['Exclusive Themes', 'Professional Services', 'Rarity Badges'].map(category => (
                        <div key={category}>
                          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">
                            {category === 'Exclusive Themes' ? 'ثيمات حصرية' : 
                             category === 'Professional Services' ? 'خدمات احترافية' : 
                             'أوسمة نادرة'}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {REWARDS.filter(r => r.category === category).map((item, i) => (
                              <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all flex flex-col group cursor-pointer"
                                onClick={() => handlePurchaseClick(item)}
                              >
                                <div className="h-32 bg-slate-900/50 flex items-center justify-center border-b border-slate-800 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
                                  <item.icon className="w-12 h-12 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" />
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                  <h4 className="text-lg font-bold text-slate-200 mb-2">{item.title}</h4>
                                  <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
                                    {item.description}
                                  </p>
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
                                    <div className="flex items-center gap-1.5 font-black text-amber-500">
                                      <Star className="w-4 h-4 fill-amber-500" />
                                      {item.cost.toLocaleString()}
                                    </div>
                                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                                      استبدال
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Sub-tabs fallback */}
                {(activeTab === 'inventory' || activeTab === 'history') && (
                  <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-slate-500"
                  >
                    <Gem className="w-16 h-16 text-slate-800 mb-4" />
                    <p>المحتوى متوفر في التحديث القادم...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Purchase Confirmation Modal */}
        <AnimatePresence>
          {purchasingItem && !showSuccessModal && !showGrandCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-[60] bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              dir="rtl"
            >
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الاستبدال</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                هل أنت متأكد من استبدال <span className="font-bold text-indigo-300">{purchasingItem.title}</span> مقابل {purchasingItem.cost} نقطة؟
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={confirmPurchase}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition"
                >
                  نعم، استبدل
                </button>
                <button 
                  onClick={() => setPurchasingItem(null)}
                  className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}

          {/* Normal Success Modal */}
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-[60] bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <Gift className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">تم الاستبدال بنجاح!</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                لقد حصلت للتو على المكافأة بنجاح. يمكنك العثور عليها في قسم "مخزوني".
              </p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition"
              >
                متابعة التسوق
              </button>
            </motion.div>
          )}

          {/* Grand Celebration Modal */}
          {showGrandCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute z-[60] bg-gradient-to-br from-indigo-900 to-purple-900 p-10 rounded-3xl shadow-[0_0_100px_rgba(99,102,241,0.5)] max-w-md w-full flex flex-col items-center text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-indigo-400/50"
              dir="rtl"
            >
              {/* Confetti simulation elements could go here */}
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md relative z-10 border-2 border-indigo-300">
                <Zap className="w-12 h-12 text-yellow-300" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3 relative z-10 tracking-tight">إنجاز مذهل!</h3>
              <p className="text-indigo-200 text-base leading-relaxed mb-8 relative z-10 font-medium">
                لقد استبدلت مكافأة كبرى بكل جدارة. هذا يدل على التزامك العميق برحلة النمو والتطور. نحن فخورون بك!
              </p>
              <button 
                onClick={() => setShowGrandCelebration(false)}
                className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-black py-4 rounded-xl transition-all shadow-xl relative z-10 active:scale-95"
              >
                أشكركم بصراحة!
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
};
