"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, Sparkles, Shield, Palette, 
  Coins, CheckCircle2, Lock, ArrowRight,
  Info, Cpu, MessageSquare, X
} from "lucide-react";
import { useGamificationState } from "@/state/gamificationState";
import { STORE_ITEMS, StoreCategory, StoreItem } from "@/data/storeItems";
import { getStoreRecommendations, StoreRecommendation } from "@/services/storeAdvisor";

export function SovereigntyStore({ onClose }: { onClose: () => void }) {
  const { 
    coins, 
    purchasedItemIds, 
    activeThemeId, 
    activeVoiceId, 
    purchaseItem, 
    setActiveTheme, 
    setActiveVoice,
    lastPurchaseFeedback,
    clearPurchaseFeedback
  } = useGamificationState();
  
  const [activeTab, setActiveTab] = useState<StoreCategory>("evolutions");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // AI recommendations
  const [recommendations, setRecommendations] = useState<StoreRecommendation[]>([]);

  useEffect(() => {
    setRecommendations(getStoreRecommendations(purchasedItemIds));
  }, [purchasedItemIds]);

  const filteredItems = STORE_ITEMS.filter(item => item.category === activeTab);

  const handleAction = (item: StoreItem) => {
    const isOwned = purchasedItemIds.includes(item.id);

    if (isOwned) {
      if (item.category === "sanctuaries") {
        setActiveTheme(activeThemeId === item.id ? null : item.id);
      } else if (item.category === "evolutions") {
        setActiveVoice(activeVoiceId === item.id ? null : item.id);
      }
    } else {
      const recommendation = recommendations.find(r => r.itemId === item.id);
      const finalPrice = recommendation?.discountPercent 
        ? Math.floor(item.price * (1 - recommendation.discountPercent / 100))
        : item.price;

      if (coins >= finalPrice) {
        setBuyingId(item.id);
        
        // Prepare Jarvis Feedback
        const feedback = {
          itemId: item.id,
          title: "جارفيس يحييك!",
          message: recommendation?.reason || `اختيار موفق لـ ${item.name}. هذا التطوير سيقوي حضورك السيادي.`
        };

        setTimeout(() => {
          if (purchaseItem(item.id, finalPrice, feedback)) {
            // Auto equip on purchase
            if (item.category === "sanctuaries") setActiveTheme(item.id);
            if (item.category === "evolutions") setActiveVoice(item.id);
          }
          setBuyingId(null);
        }, 1200);
      }
    }
  };

  const getButtonText = (item: StoreItem) => {
    const isOwned = purchasedItemIds.includes(item.id);
    const isActive = activeThemeId === item.id || activeVoiceId === item.id;

    if (buyingId === item.id) return "جاري الاستلام...";
    if (isOwned) return isActive ? "مُفعّل" : "تفعيل";
    return `${item.price} عملة`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      {/* Main Container */}
      <motion.div 
        className="relative w-full max-w-2xl bg-[#080a16] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_48px_120px_rgba(0,0,0,0.9)]"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">متجر السيادة</h2>
            </div>
            <p className="text-sm text-white/40">طوّر حضورك الرقمي وصمم عالمك الخاص</p>
          </div>

          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
               <Coins className="w-5 h-5 text-amber-500" />
               <span className="text-lg font-black font-mono text-amber-400">{coins}</span>
             </div>
             <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Categories */}
        <div className="px-8 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          {(["evolutions", "sanctuaries", "identity"] as StoreCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap border ${
                activeTab === cat 
                ? "bg-white/10 border-white/20 text-white shadow-lg" 
                : "bg-transparent border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              {cat === "evolutions" && "تطويرات الذكاء"}
              {cat === "sanctuaries" && "الملاذات البصرية"}
              {cat === "identity" && "أوسمة الهوية"}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 no-scrollbar space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const isOwned = purchasedItemIds.includes(item.id);
                const isActive = activeThemeId === item.id || activeVoiceId === item.id;
                
                const recommendation = recommendations.find(r => r.itemId === item.id);
                const isRecommended = !!recommendation;
                
                const finalPrice = recommendation?.discountPercent 
                  ? Math.floor(item.price * (1 - recommendation.discountPercent / 100))
                  : item.price;
                
                const canAfford = coins >= finalPrice;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      borderColor: isRecommended ? "rgba(139, 92, 246, 0.4)" : "rgba(255, 255, 255, 0.05)"
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative p-5 rounded-[2.5rem] border transition-all ${
                      isActive 
                      ? "bg-white/[0.04] border-white/20 shadow-[0_12px_32px_rgba(255,255,255,0.02)]" 
                      : isRecommended
                      ? "bg-indigo-500/[0.04] border-indigo-500/30 shadow-[0_12px_32px_rgba(99,102,241,0.05)]"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10"
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2 -left-2 z-10">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/30"
                        >
                          <Sparkles className="w-3 h-3" />
                          ترشيح جارفيس
                        </motion.div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3.5 rounded-2xl text-2xl ${isActive ? "bg-indigo-500/20 text-indigo-300" : isRecommended ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-white/60"}`}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isOwned && (
                          <div className="p-1 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                            مملوك
                          </div>
                        )}
                        {recommendation?.discountPercent && !isOwned && (
                          <div className="p-1 px-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                            خصم {recommendation.discountPercent}%
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mb-4 px-1">
                      <h3 className="font-black text-white text-sm">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-white/40 leading-relaxed min-h-[32px]">
                        {item.description}
                      </p>
                    </div>

                    {isRecommended && !isOwned && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
                      >
                        <p className="text-[10px] text-indigo-300 font-bold leading-relaxed">
                          {recommendation.reason}
                        </p>
                      </motion.div>
                    )}

                    <button
                      onClick={() => handleAction(item)}
                      disabled={buyingId !== null || (!isOwned && !canAfford)}
                      className={`w-full py-3.5 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-2 ${
                        isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : isOwned
                        ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        : canAfford
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 border border-indigo-400/20"
                        : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                      }`}
                    >
                      {buyingId === item.id ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Cpu className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        item.icon && <span className="opacity-40">{item.icon}</span>
                      )}
                      <span>{getButtonText(item).includes("عملة") && recommendation?.discountPercent ? `${finalPrice} عملة` : getButtonText(item)}</span>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Jarvis Feedback Overlay (Emotional Payoff) */}
        <AnimatePresence>
          {lastPurchaseFeedback && (
            <motion.div 
              className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-indigo-950/40 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="w-full max-w-sm p-8 rounded-[3rem] bg-[#0c0e1b] border border-indigo-500/30 text-center relative overflow-hidden shadow-[0_48px_120px_rgba(0,0,0,0.8)]"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
              >
                {/* Decorative particles background if possible would go here */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                
                <div className="w-20 h-20 mx-auto mb-6 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-10 h-10 text-indigo-400" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-3">
                  {lastPurchaseFeedback.title}
                </h3>
                <p className="text-sm text-indigo-200/70 leading-relaxed mb-8">
                  {lastPurchaseFeedback.message}
                </p>
                
                <button
                  onClick={clearPurchaseFeedback}
                  className="w-full py-4 bg-white text-black rounded-3xl font-black text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  تم استيعاب التطوير
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-white/30 leading-normal font-medium">
            المشتريات دائمة ويتم حفظها في ملفك الشخصي السيادي. الثيمات المشتراة يمكن تبديلها في أي وقت من إعدادات المظهر.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
