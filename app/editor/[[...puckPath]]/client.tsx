"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes('unique "key" prop')) {
      return; // Silence puck's list key warnings
    }
    originalError.apply(console, args);
  };
}
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { config } from "../../../src/puck.config";
import { supabase } from "../../../src/services/supabaseClient";
import { editorTemplateOptions, EditorTemplatePath, getEditorTemplate } from "../../../src/editor/editorTemplates";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

const normalizePuckData = (value: Data): Data => {
  const componentMap: Record<string, string> = {
    "PricingTableBlock": "ZadElTariqBlock",
    "FAQBlock": "AselatElMosaferBlock",
    "FeatureListBlock": "MahatatBlock",
    "TestimonialBlock": "HekayatBlock",
  };

  const normalizeItem = (item: any, index: number) => {
    const type = componentMap[item?.type] || item?.type || "item";
    return {
      ...item,
      type,
      id: item?.id ?? item?.props?.id ?? `${type}-${index + 1}`,
      props: item?.props ?? {},
    };
  };

  const filterFooters = (items: any[]) => {
    let footerSeen = false;
    // Iterate from end to beginning to keep only the LAST footer (usually what users want when stacking)
    // Actually, keeping the FIRST footer makes more sense for a top-down flow?
    // Let's keep the last one, as it drops to the bottom.
    return items.reverse().filter(item => {
      const type = componentMap[item?.type] || item?.type;
      if (type === "FooterBlock") {
        if (footerSeen) return false;
        footerSeen = true;
      }
      return true;
    }).reverse();
  };

  const normalizedContent = Array.isArray(value.content) ? filterFooters(value.content).map((item, index) => normalizeItem(item, index)) : [];

  return {
    ...value,
    root: {
      ...value.root,
      props: value.root?.props ?? {},
    },
    content: normalizedContent,
    zones: value.zones
      ? Object.fromEntries(
          Object.entries(value.zones).map(([zoneKey, zoneItems]) => [
            zoneKey,
            Array.isArray(zoneItems)
              ? filterFooters(zoneItems).map((item, index) => normalizeItem(item, index))
              : [],
          ])
        )
      : undefined,
  };
};

export function EditorClient({ path, initialData }: { path: string, initialData: Data }) {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState(path);
  const [data, setData] = useState<Data>(initialData);
  const [key, setKey] = useState(0);
  
  // AI Generator state
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const currentTemplateLabel = useMemo(
    () => editorTemplateOptions.find((option) => option.path === selectedPath)?.label ?? selectedPath,
    [selectedPath]
  );

  useEffect(() => {
    setSelectedPath(path);
    if (typeof window !== "undefined") {
      const storedPreset = window.localStorage.getItem(`dawayir-editor-preset:${path}`);
      if (storedPreset) {
        try {
          setData(normalizePuckData(JSON.parse(storedPreset) as Data));
          setKey((current) => current + 1);
          return;
        } catch {
          window.localStorage.removeItem(`dawayir-editor-preset:${path}`);
        }
      }
    }
    setData(normalizePuckData(initialData));
    setKey((current) => current + 1);
  }, [path, initialData]);

  const save = async (dataToSave: Data) => {
    if (!supabase) {
      alert("Ø®Ø·Ø£: Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('dawayir_pages')
        .upsert({ path, data: dataToSave });
        
      if (error) throw error;
      alert("ØªÙ… Ø§Ù„Ø­ÙØ¸ Ø¨Ù†Ø¬Ø§Ø­ ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª!");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ"; alert("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø­ÙØ¸:\n" + message);
    }
  };

  const handleTemplateChange = (nextPath: string) => {
    const safePath = nextPath as EditorTemplatePath;
    setSelectedPath(safePath);
    setData(normalizePuckData(getEditorTemplate(safePath)));
    setKey((current) => current + 1);
    router.push(safePath === "/" ? "/editor" : `/editor${safePath}`);
  };

  const handleSavePreset = () => {
    if (typeof window === "undefined") return;
    const storageKey = `dawayir-editor-preset:${selectedPath}`;
    window.localStorage.setItem(storageKey, JSON.stringify(data));
    window.alert(`تم حفظ الـ preset باسم ${currentTemplateLabel}`);
  };

  // AI Stage Messages
  const aiStages = [
    "تحليل النوايا وتصميم الهيكل الطاقي...",
    "استدعاء المكونات وبرمجة السيادة...",
    "توليد المحتوى وربط نقاط الوعي...",
    "مسح الترددات وتهيئة واجهة المستخدم..."
  ];
  const [currentStage, setCurrentStage] = useState(0);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAIGenerating(true);
    setCurrentStage(0);
    
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < aiStages.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch("/api/editor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const result = await res.json();
      
      clearInterval(stageInterval);

      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        setData(normalizePuckData(result.data));
        setKey(k => k + 1);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      clearInterval(stageInterval);
      console.error(err);
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      alert("حدث خطأ أثناء التوليد:\n" + message);
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="w-full h-screen relative bg-slate-950 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --puck-color-bg: #020617 !important;
          --puck-color-surface: rgba(15, 23, 42, 0.6) !important;
          --puck-color-surface-hover: rgba(15, 23, 42, 0.8) !important;
          --puck-color-text: #e2e8f0 !important;
          --puck-color-grey-11: #1e293b !important;
          --puck-color-grey-10: #334155 !important;
          --puck-color-grey-9: #475569 !important;
          --puck-color-grey-8: #94a3b8 !important;
        }
        .puck-root {
          font-family: inherit;
        }
        .puck-sidebar, .puck-inspector {
           backdrop-filter: blur(16px);
           background: rgba(4, 10, 24, 0.7) !important;
           border-color: rgba(255, 255, 255, 0.05) !important;
        }
        .puck-header {
           backdrop-filter: blur(16px);
           background: rgba(4, 10, 24, 0.8) !important;
           border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
      `}} />
      <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 text-right" dir="rtl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">محطة القيادة</span>
          <select
            value={selectedPath}
            onChange={(event) => handleTemplateChange(event.target.value)}
            className="min-w-[260px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white outline-none"
          >
            {editorTemplateOptions.map((option) => (
              <option key={option.path} value={option.path} className="text-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 text-xs text-white/45" dir="rtl">
          {editorTemplateOptions.find((option) => option.path === selectedPath)?.note}
        </div>
        <button
          type="button"
          onClick={handleSavePreset}
          className="mt-3 w-full rounded-xl border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-sm font-bold text-teal-100 hover:bg-teal-400/20"
        >
          حفظ كقالب للرحلة
        </button>
      </div>

      <Puck
        key={key}
        config={config}
        data={data}
        onPublish={save}
        overrides={{
          headerActions: ({ children }) => (
            <>
              {children}
            </>
          ),
        }}
      />
      
      {/* Sovereign AI Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-6 py-4 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-full flex items-center shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] hover:scale-105 transition-all duration-300 font-bold border border-teal-400/30 backdrop-blur-xl group"
      >
        <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
        Sovereign AI Generator
      </button>

      {isModalOpen && (
        <div className="absolute inset-0 z-[9999] bg-slate-950/80 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-slate-900/60 border border-teal-500/20 p-8 rounded-3xl shadow-[0_0_60px_rgba(45,212,191,0.15)] max-w-lg w-full backdrop-blur-2xl relative overflow-hidden" dir="rtl">
            <button 
              className="absolute top-4 left-4 text-white/50 hover:text-white z-20 bg-white/5 p-2 rounded-full transition-colors"
              onClick={() => !isAIGenerating && setIsModalOpen(false)}
              disabled={isAIGenerating}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black text-white mb-2 flex items-center text-right relative z-20 tracking-tight">
              <Sparkles className="w-6 h-6 ml-3 text-teal-400 animate-pulse" />
              Sovereign AI Generator
            </h3>
            
            {!isAIGenerating ? (
              <div className="relative z-20 transition-all duration-500 opacity-100 mt-6">
                <p className="text-sm text-teal-100/70 mb-6 text-right leading-relaxed font-medium">
                  اكتب تصورك للمحطة.. ومحرك مسارات هيبني الهيكل البصري والنصوص بأكملها عشان تخدم رحلة المستخدم بأسلوب سيادي.
                </p>
                <textarea 
                  className="w-full h-36 bg-slate-950/50 border border-teal-500/30 rounded-xl text-teal-50 p-4 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 mb-6 text-right resize-none placeholder:text-teal-100/30 shadow-inner"
                  placeholder="عايز محطة ترويجية لخدمة كوتشينج جديدة بتكلم الناس اللي حاسة باستنزاف..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button 
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-white font-black rounded-xl transition-all flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.4)] text-lg border border-teal-300/20"
                  onClick={handleGenerate}
                >
                  تكوين المحطة 
                </button>
              </div>
            ) : (
              <div className="relative z-20 transition-all duration-500 py-12 flex flex-col items-center">
                <div className="w-32 h-32 mb-8 rounded-full bg-gradient-to-tr from-teal-500/20 to-indigo-600/20 flex items-center justify-center border border-teal-400/40 shadow-[0_0_50px_rgba(45,212,191,0.3)] relative">
                   <div className="w-full h-full rounded-full border-t-2 border-teal-400 animate-spin absolute top-0 left-0"></div>
                   <Sparkles className="w-12 h-12 text-teal-300 animate-pulse" />
                </div>
                
                <div className="w-full flex flex-col gap-4 mb-10 opacity-80">
                   <div className="h-3 bg-teal-500/20 rounded-full w-3/4 mx-auto animate-pulse"></div>
                   <div className="h-3 bg-indigo-500/20 rounded-full w-1/2 mx-auto animate-pulse" style={{ animationDelay: '150ms'}}></div>
                   <div className="h-3 bg-teal-500/20 rounded-full w-5/6 mx-auto animate-pulse" style={{ animationDelay: '300ms'}}></div>
                </div>

                <div className="text-teal-300 font-bold text-lg mb-3 tracking-wide">
                  {aiStages[currentStage]}
                </div>
                
                <div className="w-full bg-slate-900 rounded-full h-2 mt-2 overflow-hidden shadow-inner border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-teal-400 to-indigo-400 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(45,212,191,0.5)]" 
                    style={{ width: `${((currentStage + 1) / aiStages.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {isAIGenerating && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-600/10 rounded-full blur-[80px] animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

