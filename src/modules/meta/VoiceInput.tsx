/**
 * VoiceInput Component
 * مكون الإدخال الصوتي - يستخدم useContinuousSpeechRecognition
 */

import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useContinuousSpeechRecognition } from "@/hooks/useContinuousSpeechRecognition";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function VoiceInput({
  onTranscript,
  disabled = false,
  language = "ar-EG"
}: VoiceInputProps) {
  const { isSupported, isListening, transcript, error, start, stop, clear } = 
    useContinuousSpeechRecognition({ lang: language });

  const handleToggle = () => {
    if (isListening) {
      stop();
      // Send final transcript
      if (transcript.trim()) {
        onTranscript(transcript.trim());
        clear();
      }
    } else {
      clear();
      start();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-slate-500 flex items-center gap-2">
        <MicOff className="w-4 h-4" />
        <span>المتصفح لا يدعم الإدخال الصوتي</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`relative p-2 rounded-full transition-all ${
          isListening
            ? "bg-red-500 text-white animate-pulse"
            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        whileTap={{ scale: 0.95 }}
        aria-label={isListening ? "إيقاف التسجيل" : "بدء التسجيل"}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        
        {/* Recording indicator */}
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      <AnimatePresence mode="wait">
        {isListening && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-red-400 font-medium"
          >
            جاري الاستماع...
          </motion.span>
        )}
        
        {error && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
