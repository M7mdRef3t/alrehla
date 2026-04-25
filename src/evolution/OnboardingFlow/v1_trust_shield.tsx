import React, { type FC, memo } from "react";
import { Shield, Lock, EyeOff } from "lucide-react";

/**
 * v1_trust_shield 🛡️
 * Evolution: ADK Psychological Optimization (Trust Barrier)
 * Decision: Contextual Badge over Modal for better UX flow.
 */

interface TrustShieldProps {
  mirrorName?: string;
  children: React.ReactNode;
}

const TrustShield: FC<TrustShieldProps> = ({ mirrorName, children }) => {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      {/* Sovereign Trust Banner - The "Trust Buff" */}
      <div className="w-full p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/30">
          <Shield className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs font-bold text-teal-400 mb-1 flex items-center gap-2 justify-start">
             درع القيادة الشخصية نشط <Lock size={10} />
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            يا {mirrorName || "مسافر"}، رحلة وعيك خاصة بيك لوحدك. كل البيانات اللي بتدخلها هنا بتتشفر وبتتعالج **محلياً على جهازك**، ومش بتخرج للسيرفرات أبداً.
          </p>
        </div>
      </div>

      {/* The Actual Inventory Inputs (Children) */}
      <div className="relative">
        <div className="absolute -top-3 -right-3 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 z-10 flex items-center gap-1">
           <EyeOff size={10} className="text-slate-500" />
           <span className="text-[8px] font-bold text-slate-500 uppercase">Input Encrypted</span>
        </div>
        {children}
      </div>

      <div className="text-center opacity-40">
        <p className="text-[9px] text-slate-500">مبادئ الوعي السِيادي: الخصوصية أولاً، البيانات ثانياً.</p>
      </div>
    </div>
  );
};

export default memo(TrustShield);
