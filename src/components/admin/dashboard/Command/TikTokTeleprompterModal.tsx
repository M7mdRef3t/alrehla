import React, { type FC, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap as Sparkles, Copy, Video, Hash, Camera, Check, Play, Pause, ImagePlus, Loader2, Brain, ShieldAlert, Zap, ChevronLeft, ThumbsUp, ThumbsDown, Users, TrendingUp, Download, RefreshCcw } from "lucide-react";
import type { TikTokScriptGeneration } from "@/ai/aiMarketingCopy";
import { marketingCopywriter } from "@/ai/aiMarketingCopy";
import { logger } from "@/services/logger";
import { feedbackService } from "@/services/feedbackService";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type StudioStep = "customize" | "generating" | "result";
type StudioTone = "deep" | "direct" | "sarcastic";
type StudioTopic = "energy" | "toxic" | "mindset";

interface TikTokTeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  illusionName: string;
  illusionDescription?: string;
  illusionPercent?: number;
  illusionCount?: number;
  /** Legacy support: if scriptData is passed, skip to result */
  scriptData?: TikTokScriptGeneration | null;
  isGenerating?: boolean;
}

// Auto-detect topic from illusion name
const ILLUSION_TOPIC_MAP: Record<string, StudioTopic> = {
  "طوارئ": "energy",
  "سجين ذهني": "mindset",
  "استنزاف نشط": "energy",
  "علاقة مشروطة": "toxic",
  "ميناء آمن": "mindset",
  "علاقة منقطعة": "toxic",
};

const TOPIC_LABELS: Record<StudioTopic, { label: string; icon: React.ReactNode }> = {
  energy: { label: "الطاقة والاحتراق", icon: <Zap className="w-3.5 h-3.5" /> },
  toxic: { label: "العلاقات والحدود", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  mindset: { label: "المبادئ والوعي", icon: <Brain className="w-3.5 h-3.5" /> },
};

const TONE_OPTIONS: { id: StudioTone; label: string; desc: string }[] = [
  { id: "deep", label: "عميق وهادي", desc: "بيبني مفاهيم بدل ما يهدم" },
  { id: "direct", label: "مباشر وتحدي", desc: "بيفوق اللي قدامه" },
  { id: "sarcastic", label: "ساخر وصادم", desc: "بيضرب الدجل بذكاء" },
];

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export const TikTokTeleprompterModal: FC<TikTokTeleprompterModalProps> = ({
  isOpen, onClose, illusionName, illusionDescription,
  illusionPercent, illusionCount,
  scriptData: externalScriptData, isGenerating: externalIsGenerating,
}) => {
  // Studio State
  const [step, setStep] = useState<StudioStep>(externalScriptData ? "result" : "customize");
  const [tone, setTone] = useState<StudioTone>("direct");
  const [topic, setTopic] = useState<StudioTopic>("energy");

  // Auto-detect topic from illusion name
  useEffect(() => {
    if (illusionName && ILLUSION_TOPIC_MAP[illusionName]) {
      setTopic(ILLUSION_TOPIC_MAP[illusionName]);
    }
  }, [illusionName]);
  const [copied, setCopied] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState<Record<number, boolean>>({});
  const [intentCopied, setIntentCopied] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [internalScript, setInternalScript] = useState<TikTokScriptGeneration | null>(null);
  const [internalGenerating, setInternalGenerating] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scriptData = externalScriptData ?? internalScript;
  const isGenerating = externalIsGenerating ?? internalGenerating;

  // Reset on close
  const handleClose = useCallback(() => {
    if (isGenerating) return;
    setStep("customize");
    setInternalScript(null);
    setFeedback(null);
    setPublishedUrl("");
    setIsPublished(false);
    setGeneratedImages({});
    setGeneratingImages({});
    setAutoScroll(false);
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    onClose();
  }, [isGenerating, onClose]);

  // ── Persistence ──
  useEffect(() => {
    if (isOpen && illusionName) {
      const saved = localStorage.getItem(`studio_draft_${illusionName}`);
      if (saved) {
        try {
          const { script, images, tone: savedTone, topic: savedTopic } = JSON.parse(saved);
          if (script) setInternalScript(script);
          if (images) setGeneratedImages(images);
          if (savedTone) setTone(savedTone);
          if (savedTopic) setTopic(savedTopic);
          if (script) setStep("result");
        } catch (e) {
          console.error("[Studio] Failed to load draft", e);
        }
      }
    }
  }, [isOpen, illusionName]);

  useEffect(() => {
    if (isOpen && (internalScript || Object.keys(generatedImages).length > 0)) {
      const data = {
        script: internalScript,
        images: generatedImages,
        tone,
        topic,
        updatedAt: Date.now()
      };
      localStorage.setItem(`studio_draft_${illusionName}`, JSON.stringify(data));
    }
  }, [internalScript, generatedImages, tone, topic, illusionName, isOpen]);

  // ── Generate ──
  const handleGenerate = async () => {
    setStep("generating");
    setInternalGenerating(true);
    setInternalScript(null);
    setGeneratedImages({});
    try {
      const result = await marketingCopywriter.generateIllusionDismantlingScript({
        illusionName,
        description: illusionDescription || "",
        tone,
        topic,
      });
      if (result) {
        setInternalScript(result);
        setStep("result");
        
        // Log script generation
        feedbackService.logAiGeneration({
          prompt: `Illusion: ${illusionName}, Tone: ${tone}, Topic: ${topic}`,
          response: JSON.stringify(result),
          source: "tiktok_studio_script",
          metadata: { illusionName, tone, topic }
        });
      } else {
        setStep("customize");
      }
    } catch (e) {
      logger.error(e);
      setStep("customize");
    } finally {
      setInternalGenerating(false);
    }
  };

  // ── Image Generation ──
  const getAspectRatio = () => {
    const platform = scriptData?.platform?.toLowerCase() ?? "";
    const format = scriptData?.format?.toLowerCase() ?? "";
    const rationale = scriptData?.rationale?.toLowerCase() ?? "";
    
    // Improved detection for portrait modes
    const isPortrait = 
      platform.includes("instagram") || 
      platform.includes("tiktok") || 
      format.includes("reel") || 
      format.includes("short") || 
      format.includes("story") ||
      rationale.includes("طولي") || 
      rationale.includes("portrait");

    return isPortrait ? "9:16" : "16:9";
  };

  const handleGenerateImage = async (idx: number, prompt: string) => {
    setGeneratingImages(prev => ({ ...prev, [idx]: true }));
    try {
      const res = await fetch("/api/maraya/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt: prompt, sceneId: `scene-${idx}`, aspectRatio: getAspectRatio() }),
      });
      const data = await res.json();
      if (data.success && data.image?.base64) {
        const base64 = `data:${data.image.mimeType};base64,${data.image.base64}`;
        setGeneratedImages(prev => ({ ...prev, [idx]: base64 }));

        // Log image generation
        feedbackService.logAiGeneration({
          prompt,
          response: "[Base64 Image Generated]",
          source: "tiktok_studio_image",
          metadata: { sceneIdx: idx, illusionName, aspectRatio: getAspectRatio() }
        });
      }
    } catch (e) {
      logger.error("[Studio] Image generation failed", e);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleDownloadImage = (idx: number) => {
    const src = generatedImages[idx];
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `scene-${idx + 1}-${illusionName.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const handleCopyPrompt = async (idx: number, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompts(prev => ({ ...prev, [idx]: true }));
      setTimeout(() => setCopiedPrompts(prev => ({ ...prev, [idx]: false })), 2000);
    } catch { /* ignore */ }
  };

  // ── Auto-scroll ──
  const toggleAutoScroll = () => {
    if (autoScroll) {
      setAutoScroll(false);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    } else {
      setAutoScroll(true);
      scrollIntervalRef.current = setInterval(() => {
        scrollRef.current?.scrollBy({ top: 1, behavior: "auto" });
      }, 40);
    }
  };

  // ── Copy ──
  const handleCopy = () => {
    if (!scriptData) return;
    const blocksText = scriptData.scriptBlocks.map((b, i) =>
      `SCENE ${i + 1}:\n[TEXT]: ${b.text}\n[CUE]: ${b.cue || "None"}\n[IMAGE PROMPT]: ${b.imagePrompt || "N/A"}\n[MOTION PROMPT]: ${b.motionPrompt || "N/A"}`
    ).join("\n\n");
    const fullText = `STUDIO REPORT: ${illusionName}\nPLATFORM: ${scriptData.platform?.toUpperCase()}\nFORMAT: ${scriptData.format?.toUpperCase()}\nRATIONALE: ${scriptData.rationale}\n\nVISUAL CONCEPT:\n${scriptData.visualConcept}\n\n---\nHOOK:\n${scriptData.hook}\n---\n\nSTORYBOARD:\n${blocksText}\n\n---\nCAPTION:\n${scriptData.caption}`.trim();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Copy Intent Link ──
  const handleCopyIntentLink = () => {
    if (!scriptData) return;
    const baseUrl = window.location.origin;
    // Generate slug from illusion name
    const slugMap: Record<string, string> = {
      'مغالطة التكلفة الغارقة': 'sunk-cost', 'تحيز التأكيد': 'confirmation',
      'تأثير الألفة': 'familiarity', 'وهم السيطرة': 'illusion-of-control',
      'تحيز التفاؤل': 'optimism', 'تحيز الوضع الراهن': 'status-quo',
      'تحيز النقطة العمياء': 'blind-spot',
    };
    const slug = slugMap[illusionName] || illusionName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const utm = `utm_source=content_studio&utm_medium=${scriptData.platform || 'social'}&utm_campaign=illusion_dismantling&utm_content=${slug}`;
    const intentUrl = `${baseUrl}/go/illusion/${slug}?${utm}`;
    
    navigator.clipboard.writeText(intentUrl);
    setIntentCopied(true);
    setTimeout(() => setIntentCopied(false), 2000);
  };

  // ── Submit Video URL ──
  const handlePublishDismantle = async () => {
    if (!publishedUrl.trim()) return;
    setIsPublishing(true);
    try {
      await feedbackService.submit({
        content: publishedUrl,
        rating: 'up',
        source: 'illusion_dismantled_video',
        metadata: { illusionName, topic, tone, rationale: scriptData?.rationale }
      });
      setIsPublished(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />

          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="relative w-full max-w-4xl admin-glass-card flex flex-col max-h-[90vh]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 bg-slate-900/40 relative z-10 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                  <Video className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-wide flex items-center gap-2">
                    استوديو صناعة المحتوى
                    {scriptData && (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30">
                          {scriptData.platform ?? "Social"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30">
                          {scriptData.format ?? "Post"}
                        </span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">تفكيك وهم: {illusionName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {step === "result" && scriptData && (
                  <>
                    <button onClick={toggleAutoScroll} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-white/10">
                      {autoScroll ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4" />}
                      {autoScroll ? "إيقاف" : "تلقين"}
                    </button>
                    <button onClick={handleCopyIntentLink} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition-colors border border-rose-500/20">
                      {intentCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {intentCopied ? "تم النسخ!" : "رابط المنصة الذكي"}
                    </button>
                    <button onClick={handleCopy} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-white/10">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? "تم النسخ!" : "نسخ السكريبت"}
                    </button>
                  </>
                )}
                {step === "result" && (
                  <button onClick={() => { setStep("customize"); setInternalScript(null); setGeneratedImages({}); setFeedback(null); }}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="رجوع للتخصيص">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {!isGenerating && (
                  <button onClick={handleClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Canvas ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10" ref={scrollRef}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

              {/* STEP 1: Customize — Illusion Context + Tone Selection */}
              {step === "customize" && (
                <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-8" dir="rtl">

                  {/* ── Illusion Context Card ── */}
                  <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-900/80 to-slate-900 p-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-fuchsia-600" />
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.2em]">الوهم المرصود</p>
                        <h3 className="text-xl font-black text-white">{illusionName}</h3>
                      </div>
                      {illusionPercent != null && illusionPercent > 0 && (
                        <div className="flex flex-col items-center bg-rose-500/15 px-4 py-2 rounded-2xl border border-rose-500/20">
                          <span className="font-mono text-2xl font-black text-rose-300">{Math.round(illusionPercent)}%</span>
                          <span className="text-[8px] font-bold text-rose-400/50 uppercase tracking-wider">تردد الظهور</span>
                        </div>
                      )}
                    </div>
                    {illusionDescription && (
                      <p className="text-sm text-slate-300/70 leading-relaxed mb-4 font-bold">{illusionDescription}</p>
                    )}
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                      {illusionCount != null && illusionCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {illusionCount} نفس متأثرة
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        {TOPIC_LABELS[topic].icon}
                        تم تحديد المحور تلقائياً: {TOPIC_LABELS[topic].label}
                      </span>
                    </div>
                  </div>

                  {/* ── Tone Selection ── */}
                  <div className="space-y-3">
                    <div className="text-center space-y-1 mb-2">
                      <h2 className="text-lg font-black text-white">اختار النبرة</h2>
                      <p className="text-xs text-slate-500 font-bold">ده القرار الإبداعي الوحيد — الباقي الذكاء الاصطناعي هيتكفل بيه</p>
                    </div>
                    <div className="space-y-2">
                      {TONE_OPTIONS.map(t => (
                        <button key={t.id} onClick={() => setTone(t.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-right ${tone === t.id
                            ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-white"
                            : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/60"}`}>
                          <div>
                            <span className="text-sm font-black block">{t.label}</span>
                            <span className="text-[10px] text-slate-500">{t.desc}</span>
                          </div>
                          {tone === t.id && <div className="w-2 h-2 rounded-full bg-fuchsia-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate CTA */}
                  <button onClick={handleGenerate}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    ابدأ التفكيك بالعلم
                  </button>
                </div>
              )}

              {/* STEP 2: Generating */}
              {step === "generating" && (
                <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-cyan-400 font-bold mt-6 text-lg">جاري كتابة السكريبت والتوجيه البصري...</p>
                  <p className="text-sm text-slate-500 mt-2 font-mono">تطبيق المبادئ الأولى. حقن الحقيقة.</p>
                </div>
              )}

              {/* STEP 3: Result */}
              {step === "result" && scriptData && (
                <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-8">
                  {/* Rationale & Visual Metadata */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-white/10 p-5 rounded-2xl">
                    <h4 className="text-xs font-bold text-cyan-400 mb-2 tracking-widest uppercase flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> لماذا هذا المحتوى؟ (AI Rationale)
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed font-bold mb-4 italic">"{scriptData.rationale}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                      <div className="flex items-start gap-3">
                        <Camera className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-bold text-indigo-300 mb-1 tracking-widest uppercase">التوجيه البصري</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{scriptData.visualConcept}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Hash className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-bold text-emerald-300 mb-1 tracking-widest uppercase">الكابشن المنصوح بيه</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{scriptData.caption}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teleprompter */}
                  <div className="bg-black/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-inner overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest px-8 py-1 rounded-b-xl flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REC
                    </div>
                    <div className="mt-6 space-y-8">
                      {/* HOOK */}
                      <div className="group relative">
                        <div className="absolute -left-4 top-2 text-[10px] font-bold text-rose-500/50 -rotate-90 origin-right uppercase tracking-[0.2em]">HOOK</div>
                        <p className="text-3xl md:text-5xl font-black text-white leading-[1.3] drop-shadow-lg" style={{ wordSpacing: "0.1em" }}>
                          {scriptData.hook}
                        </p>
                      </div>
                      <div className="w-16 h-px bg-slate-700 mx-auto opacity-50" />

                      {/* SCRIPT BLOCKS */}
                      {scriptData.scriptBlocks.map((block, idx) => (
                        <div key={idx} className="relative group space-y-3">
                          {block.cue && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" /> {block.cue}
                            </div>
                          )}
                          <p className="text-2xl md:text-3xl font-bold text-slate-200 leading-[1.6]">{block.text}</p>

                           {/* Image + Motion Prompts with Generation */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {block.imagePrompt && (
                              <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 space-y-3">
                                {/* Header row */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                    <Camera className="w-3 h-3" /> Image Prompt
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {/* Copy prompt */}
                                    <button
                                      onClick={() => handleCopyPrompt(idx, block.imagePrompt!)}
                                      title="نسخ الـ Prompt كاملاً"
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white text-[9px] font-bold transition-all">
                                      {copiedPrompts[idx] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                      {copiedPrompts[idx] ? "تم" : "Prompt"}
                                    </button>
                                    {/* Generate image */}
                                    <button onClick={() => handleGenerateImage(idx, block.imagePrompt!)}
                                      disabled={generatingImages[idx] || !!generatedImages[idx]}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                      {generatingImages[idx] ? <Loader2 className="w-3 h-3 animate-spin" /> : generatedImages[idx] ? <Check className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                                      {generatingImages[idx] ? "جارٍ..." : generatedImages[idx] ? "تم" : "ولّد"}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-400 italic line-clamp-2 hover:line-clamp-none transition-all cursor-default">{block.imagePrompt}</p>
                                {generatedImages[idx] && (
                                  <div className="space-y-2">
                                    <div className="relative group/img overflow-hidden rounded-lg border border-white/10 shadow-lg">
                                      <motion.img
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        src={generatedImages[idx]} alt={`Scene ${idx + 1}`}
                                        className={`w-full object-cover ${
                                          getAspectRatio() === "9:16" ? "aspect-[9/16]" : "aspect-video"
                                        }`} />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                         <button
                                          onClick={() => handleDownloadImage(idx)}
                                          className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white transition-all"
                                          title="تنزيل الصورة">
                                          <Download className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleDownloadImage(idx)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black border border-white/5 transition-all">
                                        <Download className="w-3.5 h-3.5" />
                                        تنزيل
                                      </button>
                                      <button
                                        onClick={() => handleGenerateImage(idx, block.imagePrompt!)}
                                        disabled={generatingImages[idx]}
                                        className="flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-all disabled:opacity-40"
                                        title="إعادة التوليد">
                                        {generatingImages[idx] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {block.motionPrompt && (
                              <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">
                                  <Video className="w-3 h-3" /> Motion Prompt
                                </div>
                                <p className="text-[10px] text-slate-400 italic line-clamp-2 hover:line-clamp-none transition-all">{block.motionPrompt}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Feedback */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">هل السكريبت عجبك؟</span>
                    <div className="flex gap-3">
                      <button onClick={() => { setFeedback("up"); if (scriptData) feedbackService.submit({ content: scriptData.hook, rating: 'up', source: 'content_studio', metadata: { illusionName, topic, tone } }); }} disabled={!!feedback}
                        className={`p-2 rounded-xl transition-all ${feedback === "up" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5"}`}>
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setFeedback("down"); if (scriptData) feedbackService.submit({ content: scriptData.hook, rating: 'down', source: 'content_studio', metadata: { illusionName, topic, tone } }); }} disabled={!!feedback}
                        className={`p-2 rounded-xl transition-all ${feedback === "down" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5"}`}>
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Submit Video URL */}
                  <div className="mt-8 pt-6 border-t border-dashed border-slate-700/50">
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-4 h-4" /> تم النشر؟ اربط الفيديو بالوهم
                      </label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                        لو نشرت الفيديو، حط الرابط هنا عشان نربطه ببيانات الوهم ونقيس تأثير "الرحلة" الحقيقي.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://tiktok.com/@user/video/..."
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                          value={publishedUrl}
                          onChange={(e) => setPublishedUrl(e.target.value)}
                          disabled={isPublished}
                        />
                        <button
                          onClick={handlePublishDismantle}
                          disabled={isPublishing || isPublished || !publishedUrl.trim()}
                          className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                            isPublished
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40'
                          }`}
                        >
                          {isPublishing ? '...' : isPublished ? '✅ تم الربط!' : 'ربط الفيديو'}
                        </button>
                      </div>
                      {isPublished && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                        >
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <p className="text-xs text-emerald-300 font-bold">
                            تم ربط الفيديو بالوهم "{illusionName}" بنجاح — هيظهر في رادار التأثير خلال ثوانٍ.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => {
                          localStorage.removeItem(`studio_draft_${illusionName}`);
                          setInternalScript(null);
                          setStep("customize");
                          setInternalGenerating(false);
                          setFeedback(null);
                          setPublishedUrl("");
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-rose-400 transition-all uppercase tracking-widest"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        ابدأ من جديد (مسح المسودة)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            {step === "result" && scriptData && !isGenerating && (
              <div className="sm:hidden p-4 bg-slate-900 border-t border-white/10 shrink-0 flex gap-2">
                <button onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "تم!" : "نسخ"}
                </button>
                <button onClick={handleCopyIntentLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/20 text-rose-300 font-bold rounded-xl border border-rose-500/20 transition-colors">
                  {intentCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  {intentCopied ? "تم!" : "رابط ذكي"}
                </button>
                <button onClick={toggleAutoScroll}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl border border-white/10">
                  {autoScroll ? <Pause className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
