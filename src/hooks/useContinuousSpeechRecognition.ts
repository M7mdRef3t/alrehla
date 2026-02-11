import { useState, useCallback, useRef } from "react";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

/** للتسجيل المتواصل — يسجل ويفهم الكلام ويرجع نص. مناسب لـ "فضفضة للـ AI". */
export function useContinuousSpeechRecognition(options?: { lang?: string }) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const accumulatedRef = useRef<string[]>([]);

  const isSupported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition != null || window.webkitSpeechRecognition != null);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("المتصفح لا يدعم التعرف على الصوت");
      return;
    }
    setError(null);
    setTranscript("");
    accumulatedRef.current = [];
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options?.lang ?? "ar-EG";
    recognitionRef.current = recognition;

    recognition.onresult = (e: { results: SpeechRecognitionResultList }) => {
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        const text = (result as SpeechRecognitionResult)[0]?.transcript ?? "";
        if (result.isFinal && text.trim()) {
          accumulatedRef.current.push(text.trim());
          setTranscript(accumulatedRef.current.join(" "));
        }
      }
    };

    recognition.onerror = (e: { error: string }) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        setError(e.error === "not-allowed" ? "يُرجى السماح بالميكروفون" : "حدث خطأ في التعرف على الصوت");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("لم نتمكن من بدء التعرف على الصوت");
      setIsListening(false);
    }
  }, [isSupported, options?.lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const clear = useCallback(() => {
    setTranscript("");
    accumulatedRef.current = [];
  }, []);

  return { isSupported, isListening, transcript, error, start, stop, clear };
}
