import { useState, useCallback, useRef } from "react";
import { getWindowOrNull } from "../services/clientRuntime";

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

export function useSpeechRecognition(options?: { lang?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported = (() => {
    const windowRef = getWindowOrNull();
    return Boolean(windowRef && (windowRef.SpeechRecognition != null || windowRef.webkitSpeechRecognition != null));
  })();

  const start = useCallback(
    (onResult: (transcript: string) => void) => {
      if (!isSupported) {
        setError("المتصفح لا يدعم التعرف على الصوت");
        return;
      }
      setError(null);
      const windowRef = getWindowOrNull();
      if (!windowRef) return;
      const Recognition = windowRef.SpeechRecognition ?? windowRef.webkitSpeechRecognition;
      if (!Recognition) return;
      const recognition = new Recognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = options?.lang ?? "ar-EG";
      recognitionRef.current = recognition;

      recognition.onresult = (e: { results: SpeechRecognitionResultList }) => {
        const last = e.results.length - 1;
        const result = e.results[last];
        const transcript = (result as SpeechRecognitionResult)[0]?.transcript ?? "";
        if (result.isFinal && transcript.trim()) {
          recognition.onresult = null;
          recognition.stop();
          setIsListening(false);
          onResult(transcript.trim());
        }
      };

      recognition.onerror = (e: { error: string }) => {
        if (e.error !== "aborted") {
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
    },
    [isSupported, options?.lang]
  );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  return { isSupported, isListening, error, start, stop };
}
