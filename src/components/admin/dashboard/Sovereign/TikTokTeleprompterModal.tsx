import React, { type FC, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Copy, Video, Type, Hash, Camera, Check } from "lucide-react";
import type { TikTokScriptGeneration } from "@/ai/aiMarketingCopy";

interface TikTokTeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  scriptData: TikTokScriptGeneration | null;
  illusionName: string;
}

export const TikTokTeleprompterModal: FC<TikTokTeleprompterModalProps> = ({
  isOpen,
  onClose,
  isGenerating,
  scriptData,
  illusionName,
}) => {
  const [copied, setCopied] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (!scriptData) return;
    const fullText = `HOOK:\n${scriptData.hook}\n\nSCRIPT:\n${scriptData.scriptBlocks.map(b => b.text).join(" ")}\n\nCAPTION:\n${scriptData.caption}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => { if (!isGenerating) onClose(); }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-[#0f172a] border border-[#334155] shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* ── Studio Header ── */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                  <Video className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-wide flex items-center gap-2">
                    استوديو صناعة المحتوى
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest border border-rose-500/30">
                      TikTok
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">تفكيك وهم: {illusionName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isGenerating && scriptData && (
                  <button 
                    onClick={handleCopy}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-white/10"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "تم النسخ!" : "نسخ السكريبت للـ Notion"}
                  </button>
                )}
                {!isGenerating && (
                  <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Studio Canvas ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#0b1121]" ref={scrollRef}>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-cyan-400 font-bold mt-6 text-lg">جاري كتابة السكريبت والتوجيه البصري...</p>
                  <p className="text-sm text-slate-500 mt-2 font-mono">Applying First Principles. Injecting Truth.</p>
                </div>
              ) : scriptData ? (
                <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-8">
                  
                  {/* Visual Metadata Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <Camera className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-indigo-300 mb-1 tracking-widest uppercase">التوجيه البصري (Camera & Lighting)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{scriptData.visualConcept}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/40 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <Hash className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-300 mb-1 tracking-widest uppercase">الكابشن المنصوح بيه</h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{scriptData.caption}</p>
                      </div>
                    </div>
                  </div>

                  {/* Teleprompter View */}
                  <div className="bg-black/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-inner overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest px-8 py-1 rounded-b-xl flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REC
                    </div>

                    <div className="mt-6 space-y-8">
                      {/* HOOK */}
                      <div className="group relative">
                        <div className="absolute -left-4 top-2 text-[10px] font-bold text-rose-500/50 -rotate-90 origin-right uppercase tracking-[0.2em]">HOOK</div>
                        <p className="text-3xl md:text-5xl font-black text-white leading-[1.3] drop-shadow-lg" style={{ wordSpacing: '0.1em' }}>
                          {scriptData.hook}
                        </p>
                      </div>

                      <div className="w-16 h-px bg-slate-700 mx-auto opacity-50" />

                      {/* SCRIPT BLOCKS */}
                      {scriptData.scriptBlocks.map((block, idx) => (
                        <div key={idx} className="relative group">
                           {/* Cue Tooltip */}
                           {block.cue && (
                             <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                {block.cue}
                             </div>
                           )}
                           {/* Text intended for reading */}
                           <p className="text-2xl md:text-3xl font-bold text-slate-200 leading-[1.6]">
                             {block.text}
                           </p>
                        </div>
                      ))}
                    </div>

                    {/* Gradient Fade for teleprompter look */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>

                </div>
              ) : null}
            </div>
            
            {/* Mobile Actions */}
            {scriptData && !isGenerating && (
              <div className="sm:hidden p-4 bg-slate-900 border-t border-white/10 shrink-0">
                <button 
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
                  {copied ? "تم النسخ!" : "نسخ السكريبت"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
