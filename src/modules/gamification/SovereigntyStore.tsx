"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Moon, Sun, Cpu, 
  Sparkles, Shield, 
  Coins, Lock, CheckCircle,
  Palette, Mic2, ArrowRight
} from "lucide-react";
import { useGamification } from "@/domains/gamification";
import { STORE_ITEMS, StoreItem } from "@/domains/gamification/constants/storeItems";
import { soundManager } from "@/services/soundManager";

export function SovereigntyStore() {
  const { 
    coins, 
    purchasedItemIds, 
    activeThemeId, 
    activeVoiceId,
    purchaseItem,
    setActiveTheme,
    setActiveVoice
  } = useGamification();

  const [activeCategory, setActiveCategory] = useState<"theme" | "voice" | "frost_token" | "border">("theme");

  const filteredItems = STORE_ITEMS.filter(item => item.type === activeCategory);

  const handlePurchase = (item: StoreItem) => {
    const success = purchaseItem(item.id, item.price, {
      title: "عملية شراء ناجحة!",
      message: `لقد امتلكت الآن ${item.name}. يمكنك تفعيله الآن من المتجر.`,
      itemId: item.id
    });

    if (success) {
      soundManager.playEffect('celebration');
    } else {
      soundManager.playEffect('tension');
    }
  };

  const handleApply = (item: StoreItem) => {
    if (item.type === "theme") {
      setActiveTheme(item.id);
      soundManager.playEffect('gavel');
    } else if (item.type === "voice") {
      setActiveVoice(item.id);
      soundManager.playEffect('radar_ping'); // Changed from 'voice_activate' as it's not in the sound signature map
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Moon": return Moon;
      case "Sun": return Sun;
      case "Cpu": return Cpu;
      case "Sparkles": return Sparkles;
      case "Shield": return Shield;
      default: return Palette;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Category Tabs */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveCategory("theme")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeCategory === "theme" 
              ? "bg-white/10 text-white border border-white/20 shadow-lg" 
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Palette className="w-4 h-4" /> المظاهر المرئية
        </button>
        <button 
          onClick={() => setActiveCategory("voice")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeCategory === "voice" 
              ? "bg-white/10 text-white border border-white/20 shadow-lg" 
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Mic2 className="w-4 h-4" /> شخصيات AI
        </button>
        <button 
          onClick={() => setActiveCategory("frost_token")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeCategory === "frost_token" 
              ? "bg-white/10 text-white border border-white/20 shadow-lg" 
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Sparkles className="w-4 h-4" /> ❄️ رموز الصقيع
        </button>
        <button 
          onClick={() => setActiveCategory("border")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeCategory === "border" 
              ? "bg-white/10 text-white border border-white/20 shadow-lg" 
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Palette className="w-4 h-4" /> إطارات جليدية
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
        <AnimatePresence mode="wait">
          {filteredItems.map((item) => {
            const isOwned = purchasedItemIds.includes(item.id);
            const isActive = activeThemeId === item.id || activeVoiceId === item.id;
            const Icon = getIcon(item.icon);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative group p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between h-[320px] ${
                  isActive 
                    ? "bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_40px_rgba(79,70,229,0.2)]" 
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20"
                }`}
              >
                {isActive && (
                  <div className="absolute top-6 right-6 p-1.5 rounded-full bg-indigo-500 text-white">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}

                <div>
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${
                    isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-white/40"
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-2">{item.name}</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  {!isOwned ? (
                    <>
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-black">{item.price}</span>
                      </div>
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={coins < item.price}
                        className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
                          coins >= item.price
                            ? "bg-white text-slate-950 hover:scale-105 active:scale-95"
                            : "bg-white/5 text-white/20 cursor-not-allowed"
                        }`}
                      >
                        امتلاك الآن
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">
                        في حوزتك
                      </span>
                      <button
                        onClick={() => handleApply(item)}
                        disabled={isActive}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                        }`}
                      >
                        {isActive ? "مُفعل حالياً" : "تفعيل المظهر"}
                      </button>
                    </>
                  )}
                </div>

                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-1000 ${
                  isActive ? "bg-indigo-500/5 blur-3xl" : "bg-white/5 blur-2xl"
                }`} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
