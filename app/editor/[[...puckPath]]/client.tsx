"use client";

import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { config } from "../../../src/puck.config";
import { supabase } from "../../../src/services/supabaseClient";
import { useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

export function EditorClient({ path, initialData }: { path: string, initialData: Data }) {
  const [data, setData] = useState<Data>(initialData);
  const [key, setKey] = useState(0);
  
  // AI Generator state
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const save = async (dataToSave: Data) => {
    if (!supabase) {
      alert("خطأ: لم يتم الاتصال بقاعدة البيانات.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('dawayir_pages')
        .upsert({ path, data: dataToSave });
        
      if (error) throw error;
      alert("تم الحفظ بنجاح في قاعدة البيانات!");
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ:\n" + err.message);
    }
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
        setData(result.data); // Update data
        setKey(k => k + 1);   // Force Puck to re-mount with new data
        setIsModalOpen(false); // Close modal
      }
    } catch (err: any) {
      clearInterval(stageInterval);
      console.error(err);
      alert("حدث خطأ أثناء التوليد:\n" + err.message);
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="w-full h-screen relative">
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
                  اوصف الجسد اللي عايزه، واحنا هنبني الروح والهيكل.
                </p>
                <textarea 
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-lg text-white p-3 focus:outline-none focus:border-blue-500 mb-4 text-right resize-none placeholder:text-white/30"
                  placeholder="عايز واجهة لكورس الذكاء الاصطناعي مع بانر جذاب، و3 كروت للمميزات..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  onClick={handleGenerate}
                >
                  تكوين السيادة 
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
