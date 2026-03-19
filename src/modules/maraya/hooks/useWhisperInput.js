import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function useWhisperInput({ language = 'en-US', onTranscript } = {}) {
  const recognitionRef = useRef(null);
  const isSupported = useMemo(() => Boolean(getRecognitionCtor()), []);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const RecognitionCtor = getRecognitionCtor();
    if (!RecognitionCtor) {
      setError('Whisper input is not supported in this browser.');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError('');
      setTranscript('');
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      setError(event?.error === 'not-allowed'
        ? 'Microphone permission was denied.'
        : 'Whisper capture failed.');
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const next = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();

      if (next) {
        setTranscript(next);
      }

      const lastResult = event.results?.[event.results.length - 1];
      if (lastResult?.isFinal && next) {
        onTranscript?.(next);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    };
  }, []);

  return {
    error,
    isListening,
    isSupported,
    start,
    stop,
    transcript,
  };
}
