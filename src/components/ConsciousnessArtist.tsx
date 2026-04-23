"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Brain, Waves, Loader2, Zap as Sparkles, X } from "lucide-react";
import { useSwarmMutationStore } from "@/state/useSwarmMutationStore";
import { swarmOrchestrator } from "@/infrastructure/agents/swarmOrchestrator";

// Global declarations removed to avoid 'identical modifiers' TS error.

interface ConsciousnessArtistProps {
  onClose?: () => void;
  telemetrySource?: string;
}

export default function ConsciousnessArtist({ onClose, telemetrySource = "Dashboard" }: ConsciousnessArtistProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Store connections
  const { currentTheme, activeTool, pulseEffect, artistMessage, applyMutations, setArtistMessage } = useSwarmMutationStore();

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "ar-EG";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + " " + finalTranscript);
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (transcript.trim().length > 0) {
          processAudioSignal(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [transcript]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const processAudioSignal = async (text: string) => {
    setIsProcessing(true);
    try {
      // Build dummy telemetry payload mapping for Swarm (we can fetch real stats from Zustand later)
      const telemetry = {
        stability: currentTheme === "RECOVERY" ? 0.3 : 0.8,
        recentErrors: 0,
        interactionCount: 15,
        activePath: telemetrySource
      };

      const response = await swarmOrchestrator.orchestrate(telemetry, text);
      
      // Speak back
      const utterance = new SpeechSynthesisUtterance(response.coachingText);
      utterance.lang = "ar-EG";
      window.speechSynthesis.speak(utterance);

      // Mutate UI
      applyMutations(response.suggestedMutations);
      setArtistMessage(response.coachingText);

    } catch (e) {
      console.error(e);
      setArtistMessage("هناك تشويش في الإشارة، تنفس وحاول مجدداً.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Theming derivations
  const themeClasses = {
    NORMAL: "bg-neutral-900/90 border-white/10",
    RECOVERY: "bg-rose-950/90 border-rose-500/50",
    CRITICAL: "bg-red-950/90 border-red-600/80",
    CALM: "bg-teal-950/90 border-teal-500/50"
  }[currentTheme];

  const pulseClasses = {
    NONE: "",
    CRITICAL: "animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.5)]",
    SUCCESS: "animate-pulse shadow-[0_0_50px_rgba(20,184,166,0.5)]",
    WARNING: "animate-pulse shadow-[0_0_50px_rgba(245,158,11,0.5)]"
  }[pulseEffect];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl transition-all duration-1000 ${themeClasses} ${pulseClasses}`}>
      
      {onClose && (
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-md">
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="max-w-2xl w-full flex flex-col items-center justify-center text-center space-y-12">
        
        {/* Main Avatar / Artifact */}
        <div className="relative">
          <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 transition-opacity duration-1000 ${isRecording ? 'opacity-50 animate-pulse' : ''} ${isProcessing ? 'animate-spin opacity-80' : ''}`} />
          <div className="relative w-48 h-48 rounded-full border border-white/20 bg-black/40 backdrop-blur-2xl flex items-center justify-center overflow-hidden shadow-2xl">
            {isProcessing ? (
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
            ) : isRecording ? (
              <Waves className="w-16 h-16 text-rose-400 animate-pulse" />
            ) : (
              <Brain className={`w-16 h-16 transition-colors duration-1000 ${currentTheme === 'RECOVERY' ? 'text-rose-400' : 'text-indigo-400'}`} />
            )}
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-4 min-h-[100px]">
          <h2 className="text-3xl font-black text-white px-8 leading-tight tracking-wide" dir="rtl">
            {artistMessage || "أنا هنا في هذه المحطة من رحلتك.. تحدّث."}
          </h2>
          {transcript && !artistMessage && (
            <p className="text-white/50 text-lg" dir="rtl">"{transcript}"</p>
          )}
        </div>

        {/* Controls */}
        <button 
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold border transition-all disabled:opacity-50 ${isRecording ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-white/5 text-white hover:bg-white/10 border-white/10'}`}
        >
          {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {isRecording ? "إنهاء التسجيل" : "ابدأ الحديث"}
        </button>

        {/* Dynamic Tool Display from Mutations */}
        {activeTool && (
          <div className="mt-8 p-4 bg-black/40 border border-white/10 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles className="text-yellow-400 w-5 h-5" />
            <span className="text-white/80 font-medium">الأداة الفعالة الآن: {activeTool}</span>
          </div>
        )}
      </div>
    </div>
  );
}
