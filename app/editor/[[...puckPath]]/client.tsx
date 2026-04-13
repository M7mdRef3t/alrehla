"use client";

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
  const normalizeItem = (item: any, index: number) => ({
    ...item,
    id: item?.id ?? item?.props?.id ?? `${item?.type ?? "item"}-${index + 1}`,
    props: item?.props ?? {},
  });

  return {
    ...value,
    root: {
      ...value.root,
      props: value.root?.props ?? {},
    },
    content: Array.isArray(value.content) ? value.content.map((item, index) => normalizeItem(item, index)) : [],
    zones: value.zones
      ? Object.fromEntries(
          Object.entries(value.zones).map(([zoneKey, zoneItems]) => [
            zoneKey,
            Array.isArray(zoneItems)
              ? zoneItems.map((item, index) => normalizeItem(item, index))
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
    "ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù†ÙˆØ§ÙŠØ§ ÙˆØªØµÙ…ÙŠÙ… Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø·Ø§Ù‚ÙŠ...",
    "Ø§Ø³ØªØ¯Ø¹Ø§Ø¡ Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª ÙˆØ¨Ø±Ù…Ø¬Ø© Ø§Ù„Ø³ÙŠØ§Ø¯Ø©...",
    "ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ÙˆØ±Ø¨Ø· Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆØ¹ÙŠ...",
    "Ù…Ø³Ø­ Ø§Ù„ØªØ±Ø¯Ø¯Ø§Øª ÙˆØªÙ‡ÙŠØ¦Ø© ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…..."
  ];
  const [currentStage, setCurrentStage] = useState(0);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAIGenerating(true);
    setCurrentStage(0);
    
    // Simulate stages
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
        setData(normalizePuckData(result.data)); // Update data
        setKey(k => k + 1);   // Force Puck to re-mount with new data
        setIsModalOpen(false); // Close modal
      }
    } catch (err: unknown) {
      clearInterval(stageInterval);
      console.error(err);
      const message = err instanceof Error ? err.message : "Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ"; alert("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªÙˆÙ„ÙŠØ¯:\n" + message);
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 text-right" dir="rtl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Page Preset</span>
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
          Save as preset
        </button>
      </div>

      <Puck
        key={key}
        config={config}
        data={data}
        onPublish={save}
      />
      
      {/* Sovereign AI Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-105 transition-all duration-300 font-bold"
      >
        <Sparkles className="w-5 h-5 ml-2" />
        Sovereign AI Generator
      </button>

      {isModalOpen && (
        <div className="absolute inset-0 z-[9999] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-lg w-full backdrop-blur-xl relative overflow-hidden" dir="rtl">
            <button 
              className="absolute top-4 left-4 text-white/50 hover:text-white z-20"
              onClick={() => !isAIGenerating && setIsModalOpen(false)}
              disabled={isAIGenerating}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center text-right relative z-20">
              <Sparkles className="w-5 h-5 ml-2 text-blue-400" />
              Sovereign AI Generator
            </h3>
            
            {!isAIGenerating ? (
              <div className="relative z-20 transition-all duration-500 opacity-100">
                <p className="text-sm text-white/60 mb-4 text-right">
                  Ø§ÙˆØµÙ Ø§Ù„Ø¬Ø³Ø¯ Ø§Ù„Ù„ÙŠ Ø¹Ø§ÙŠØ²Ù‡ØŒ ÙˆØ§Ø­Ù†Ø§ Ù‡Ù†Ø¨Ù†ÙŠ Ø§Ù„Ø±ÙˆØ­ ÙˆØ§Ù„Ù‡ÙŠÙƒÙ„.
                </p>
                <textarea 
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-lg text-white p-3 focus:outline-none focus:border-blue-500 mb-4 text-right resize-none placeholder:text-white/30"
                  placeholder="Ø¹Ø§ÙŠØ² ÙˆØ§Ø¬Ù‡Ø© Ù„ÙƒÙˆØ±Ø³ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ù…Ø¹ Ø¨Ø§Ù†Ø± Ø¬Ø°Ø§Ø¨ØŒ Ùˆ3 ÙƒØ±ÙˆØª Ù„Ù„Ù…Ù…ÙŠØ²Ø§Øª..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  onClick={handleGenerate}
                >
                  ØªÙƒÙˆÙŠÙ† Ø§Ù„Ø³ÙŠØ§Ø¯Ø© 
                </button>
              </div>
            ) : (
              <div className="relative z-20 transition-all duration-500 py-8 flex flex-col items-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 flex items-center justify-center border border-blue-500/30 animate-pulse shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                   <Sparkles className="w-10 h-10 text-blue-400 animate-spin-slow" />
                </div>
                
                {/* Wireframe skeleton lines */}
                <div className="w-full flex flex-col gap-3 mb-8 opacity-70">
                   <div className="h-3 bg-white/10 rounded-full w-3/4 mx-auto animate-pulse"></div>
                   <div className="h-3 bg-white/10 rounded-full w-1/2 mx-auto animate-pulse" style={{ animationDelay: '150ms'}}></div>
                   <div className="h-3 bg-white/10 rounded-full w-5/6 mx-auto animate-pulse" style={{ animationDelay: '300ms'}}></div>
                </div>

                <div className="text-blue-400 font-bold mb-2 animate-bounce">
                  {aiStages[currentStage]}
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${((currentStage + 1) / aiStages.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Background effects */}
            {isAIGenerating && (
              <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

