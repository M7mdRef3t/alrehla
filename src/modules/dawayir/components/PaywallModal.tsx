import React from 'react';
import { ArrowLeft, Shield, Check } from 'lucide-react';

interface PaywallModalProps {
  onClose: () => void;
  onGoogleLogin: () => void;
}

export function PaywallModal({ onClose, onGoogleLogin }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="p-8 max-w-md w-full relative text-center rounded-3xl" style={{ background:"rgba(6,10,22,0.92)", border:"1px solid rgba(20,184,166,0.2)", backdropFilter:"blur(32px)" }}>
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
              <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">النظام هنا لخدمتك</h3>
          <p className="text-slate-400 mb-8 leading-relaxed text-sm font-medium">
              النسخة المجانية منحتك التشخيص. لكي تبدأ في بناء الحدود التلقائية، تتبع التطور، والحصول على أدوات الوعي الذكية.. ارفع مستوى اشتراكك الآن.
          </p>
          <div className="space-y-4">
              <button onClick={onGoogleLogin} className="w-full py-4 bg-teal-500 text-slate-950 rounded-xl font-black shadow-md shadow-teal-500/10 hover:bg-teal-400 transition-all flex items-center justify-center gap-3">
                  <Check className="w-5 h-5" />
                  سجل عبر Google مجاناً
              </button>
              <div className="text-[10px] text-slate-500 tracking-[0.08em]">خطة الوصول: ٩ دولار/شهريًا</div>
          </div>
      </div>
    </div>
  );
}
