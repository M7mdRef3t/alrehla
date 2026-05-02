import { createPortal } from "react-dom";
import React, { type FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Activity, Target, BookOpen, Clock, HeartPulse, AlertTriangle, ShieldAlert, Search, MessageCircle, Radio, Users, Fingerprint, Loader2 } from "lucide-react";
import { getIllusionProfile } from "@/services/admin/illusionDictionary";

interface IllusionProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  illusionName: string;
  illusionPercent?: number;
  illusionCount?: number;
  onShowAffectedUsers?: (illusionName: string) => void;
  onPulseBroadcast?: (illusionName: string) => void;
}

export const IllusionProfileModal: FC<IllusionProfileModalProps> = ({
  isOpen,
  onClose,
  illusionName,
  illusionPercent = 0,
  illusionCount = 0,
  onShowAffectedUsers,
  onPulseBroadcast
}) => {
  const profile = illusionName ? getIllusionProfile(illusionName) : null;
  const [isPulsing, setIsPulsing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePulse = async () => {
    if (!onPulseBroadcast) return;
    setIsPulsing(true);
    await onPulseBroadcast(illusionName);
    setIsPulsing(false);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && profile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-white/10 bg-slate-800/50 flex items-start justify-between shrink-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-fuchsia-600" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{profile.label}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-rose-300 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      تشريح الوهم
                    </span>
                    <span className="text-xs text-slate-400">تحليل المبادئ الأولى</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Stats & Vertical Axis Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <Activity className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">نسبة التردد</p>
                    <p className="text-xl font-mono font-black text-white">{Math.round(illusionPercent)}%</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <HeartPulse className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">الأنفس المتأثرة</p>
                    <p className="text-xl font-mono font-black text-white">{illusionCount}</p>
                  </div>
                </div>
                <div className={`border rounded-2xl p-4 flex items-center gap-4 ${
                  profile.verticalDisconnection.level === "High" ? "bg-rose-500/10 border-rose-500/20" :
                  profile.verticalDisconnection.level === "Medium" ? "bg-amber-500/10 border-amber-500/20" :
                  "bg-emerald-500/10 border-emerald-500/20"
                }`}>
                  <div className={`p-3 rounded-xl ${
                    profile.verticalDisconnection.level === "High" ? "bg-rose-500/20 text-rose-400" :
                    profile.verticalDisconnection.level === "Medium" ? "bg-amber-500/20 text-amber-400" :
                    "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">خطر المحور الرأسي</p>
                    <p className={`text-sm font-black ${
                      profile.verticalDisconnection.level === "High" ? "text-rose-400" :
                      profile.verticalDisconnection.level === "Medium" ? "text-amber-400" :
                      "text-emerald-400"
                    }`}>{
                      profile.verticalDisconnection.level === "High" ? "انقطاع شديد" :
                      profile.verticalDisconnection.level === "Medium" ? "انقطاع متوسط" :
                      "تأثير طفيف"
                    }</p>
                  </div>
                </div>
              </div>

              {/* Vertical Disconnection Description */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {profile.verticalDisconnection.description}
                </p>
              </div>

              {/* Core Vulnerability */}
              <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-indigo-400 mb-3">
                  <Fingerprint className="w-5 h-5" />
                  الثغرة النفسية (الجذر)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {profile.coreVulnerability}
                </p>
              </div>

              {/* Cognitive Bias */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-white mb-3">
                  <BookOpen className="w-5 h-5 text-rose-400" />
                  التشخيص العلمي (الميكانيزم)
                </h3>
                <p className="text-rose-200/80 font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 inline-block mb-4">
                  {profile.cognitiveBias}
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">هو بيعمل إيه وليه؟</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{profile.mechanism}</p>
                </div>
              </div>

              {/* Socratic Reality Checks */}
              <div className="bg-gradient-to-br from-fuchsia-900/20 to-slate-900 border border-fuchsia-500/20 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-fuchsia-400 mb-4">
                  <Search className="w-5 h-5" />
                  أسئلة كشف الحقيقة (Reality Checks)
                </h3>
                <div className="space-y-3">
                  {profile.realityChecks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-fuchsia-500/5 p-3 rounded-xl border border-fuchsia-500/10">
                      <MessageCircle className="w-4 h-4 text-fuchsia-400 shrink-0 mt-1" />
                      <p className="text-sm text-fuchsia-100 font-medium leading-relaxed">"{check}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Truth Text Antidote */}
              <div className="bg-gradient-to-br from-amber-900/20 to-slate-900 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                <h3 className="flex items-center gap-2 text-lg font-black text-amber-400 mb-3 relative z-10">
                  <BookOpen className="w-5 h-5" />
                  ترياق نص الحقيقة
                </h3>
                <div className="space-y-3 relative z-10">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <span className="text-amber-500/70 font-black ml-2">القانون الكوني:</span>
                    {profile.truthTextAntidote.concept}
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center">
                    <p className="text-lg font-bold text-amber-200 font-serif leading-relaxed">
                      {profile.truthTextAntidote.reference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Intervention Plan */}
              <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-emerald-400 mb-3">
                  <Target className="w-5 h-5" />
                  خطة التدخل والتعافي
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300 leading-relaxed">{profile.intervention}</p>
                </div>
              </div>

              {/* Historical Impact */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-400 mb-3">
                  <Clock className="w-5 h-5" />
                  الأثر التاريخي
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{profile.historicalContext}</p>
              </div>

            </div>

            {/* Action Triggers Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-800/80 shrink-0 flex items-center justify-end gap-3">
              <button 
                onClick={() => onShowAffectedUsers && onShowAffectedUsers(illusionName)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-white/10"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                كشف الأنفس المتأثرة
              </button>
              <button 
                onClick={handlePulse}
                disabled={isPulsing || !onPulseBroadcast}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-lg shadow-rose-500/20"
              >
                {isPulsing ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Radio className="w-4 h-4 text-white" />}
                إرسال إشارة للأنفس (Pulse)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};


