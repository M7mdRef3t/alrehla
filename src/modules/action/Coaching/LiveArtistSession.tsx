import React, { useState } from 'react';
import { Mic, MicOff, Activity, Variable, X, Zap as Sparkles, Brain } from 'lucide-react';
import { useGeminiLive, UIExerciseMutation } from '@/hooks/useGeminiLive';

export const LiveArtistSession = ({ onClose }: { onClose: () => void }) => {
    const [currentExercise, setCurrentExercise] = useState<UIExerciseMutation | null>(null);
    const [userValue, setUserValue] = useState<number>(5);

    const {
        isLive,
        isSpeaking,
        isProcessing,
        startLiveSession,
        stopLiveSession
    } = useGeminiLive((mutation) => {
        // AI directly modified the UI dynamically!
        setCurrentExercise(mutation);
    });

    const toggleLive = () => {
        if (isLive) {
            stopLiveSession();
        } else {
            startLiveSession();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-slate-950/80 to-transparent z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">فنان الوعي (Live)</h2>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                            </span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                {isLive ? (isSpeaking ? "Artist Speaking..." : "Listening...") : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={() => { stopLiveSession(); onClose(); }} className="p-3 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all group">
                    <X className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                </button>
            </div>

            <div className="w-full max-w-6xl h-full pb-24 pt-28 flex flex-col lg:flex-row gap-6 relative z-0">
                
                {/* 1) Central Voice / Avatar Console */}
                <div className={`flex-1 rounded-[2rem] border transition-all duration-700 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md
                    ${isSpeaking ? 'bg-teal-900/10 border-teal-500/40 shadow-[0_0_80px_rgba(20,184,166,0.15)]' : 'bg-slate-900/40 border-white/10'}`}>
                    
                    {/* Visualizer Orb */}
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute w-64 h-64 rounded-full transition-all duration-300 pointer-events-none
                            ${isLive ? 'bg-teal-500/10 opacity-100 animate-pulse' : 'bg-transparent opacity-0'}`} />
                        <div className={`absolute w-48 h-48 rounded-full border border-teal-500/30 transition-all duration-500 pointer-events-none
                            ${isSpeaking ? 'scale-125 opacity-100 animate-[spin_4s_linear_infinite]' : 'scale-100 opacity-50'}`} />
                        
                        <button 
                            onClick={toggleLive}
                            className={`z-10 w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl
                            ${isLive 
                                ? 'bg-slate-900 border-teal-500 text-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.3)]' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {isLive ? <Mic className="w-10 h-10 animate-bounce" /> : <MicOff className="w-10 h-10" />}
                        </button>
                    </div>

                    <div className="mt-12 text-center max-w-sm px-6">
                        <h3 className="text-2xl font-black text-white mb-2">
                            {isLive ? 'أنا سامعك، اتفضل' : 'جاهز؟'}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            {isProcessing ? "جاري قراءة المعطيات وتوليد التمرين المناسب..." : "اتكلم بشكل عفوي. الفنان هيسمع نبرتك وهيوجهلك تمرين يتشكل فوراً بناءً على اللي بتقوله."}
                        </p>
                    </div>

                    {isProcessing && (
                        <div className="absolute top-10 left-10 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
                            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">Mutating Code...</span>
                        </div>
                    )}
                </div>

                {/* 2) Canvas / Live Exercise Mutation Area */}
                <div className={`flex-1 rounded-[2rem] border bg-slate-900/40 border-white/5 backdrop-blur-xl relative overflow-hidden transition-all duration-1000 p-8 flex flex-col justify-center
                    ${currentExercise ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
                    
                    {!currentExercise ? (
                        <div className="text-center opacity-40 flex flex-col items-center">
                            <Variable className="w-16 h-16 text-slate-500 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest font-mono text-sm">مساحة التمارين المرنة</p>
                            <p className="text-slate-500 text-xs mt-2 max-w-xs">سيقوم الذكاء الاصطناعي بكتابة وتجميع التمرين المناسب هنا فوراً عندما تتحدث.</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-md mx-auto space-y-8 animate-in slide-in-from-right-8 fade-in">
                            <div className="text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded-full mb-4">
                                    <Brain className="w-4 h-4 text-teal-400" />
                                    <span className="text-teal-300 text-[10px] font-black tracking-widest uppercase">Generated Live By Artist</span>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-2">{currentExercise.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{currentExercise.description}</p>
                            </div>

                            {/* Render Component dynamically based on AI function call! */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                {currentExercise.componentType === 'slider' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-xs font-bold text-slate-400">
                                            <span>الحد الأقصى</span>
                                            <span>صفر</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min={currentExercise.props.min} 
                                            max={currentExercise.props.max} 
                                            defaultValue={currentExercise.props.defaultValue}
                                            onChange={(e) => setUserValue(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                        />
                                        <div className="text-center text-teal-400 font-black text-2xl pt-4">
                                            {userValue} / {currentExercise.props.max}
                                        </div>
                                    </div>
                                )}
                                {/* Add more renderers for buttons/text areas if needed */}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
