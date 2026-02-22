import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
    onAnalyze: (answers: string[]) => void;
    isLoading: boolean;
}

const QUESTIONS = [
    "ما هي أهم 3 أشياء تشغل تفكيرك الآن؟",
    "من 1 إلى 10، كم تستنزفك هذه الأشياء طاقياً؟",
    "ما هو الشيء الذي تتجاهله وتعرف أنك يجب أن تفعله؟"
];

export default function ChatInterface({ onAnalyze, isLoading }: ChatInterfaceProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [answers, setAnswers] = useState<string[]>([]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newAnswers = [...answers, inputValue];
        setAnswers(newAnswers);
        setInputValue('');

        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Finished all questions
            onAnalyze(newAnswers);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-8">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="absolute inset-0 border-t-2 border-teal-500 rounded-full animate-spin" />
                    <div className="absolute inset-4 border-b-2 border-indigo-500 rounded-full animate-spin-reverse" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-teal-400 animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-teal-400 text-xs font-black tracking-[0.3em] animate-pulse uppercase font-mono">جاري_المسح_العصبي</p>
                    <p className="text-[10px] text-slate-600 font-mono uppercase mt-4">جاري_معايرة_الفيزياء_الداخلية...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto bg-transparent p-1">
            <div className="mb-10 text-center transition-all duration-300">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-6 leading-relaxed">
                    {QUESTIONS[currentStep]}
                </h3>
                <div className="flex justify-center gap-2">
                    {QUESTIONS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-12 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : i < currentStep ? 'w-6 bg-teal-900' : 'w-6 bg-white/10'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="relative group">
                <div className="absolute inset-0 bg-teal-500/5 blur-md rounded-2xl group-focus-within:bg-teal-500/10 transition-all" />
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:border-teal-500/30 focus:ring-1 focus:ring-teal-500/20 resize-none h-32 transition-all relative z-10 font-medium placeholder:text-slate-600"
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="absolute left-4 bottom-4 p-3 bg-teal-500 text-slate-950 rounded-xl hover:bg-teal-400 disabled:opacity-20 disabled:grayscale transition-all z-20 shadow-lg shadow-teal-500/20 active:scale-95"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
