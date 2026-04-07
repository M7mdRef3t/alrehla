import { logger } from "../../../services/logger";
import { useRef, useCallback, useEffect } from 'react';

/**
 * useNarrationVoice - High Performance AI Narration Playback
 * Supports both Browser Synthesis (Legacy) and Native AI Audio Streaming (OpenAI).
 */
export default function useNarrationVoice() {
  const audioContextRef = useRef(null);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef(null);
  const currentGainNodeRef = useRef(null);
  const currentVoiceVersionRef = useRef(0);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Initialize Audio Context on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const stop = useCallback(() => {
    // 1. Stop Browser Synth
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    // 2. Clear Queue
    queueRef.current = [];

    // 3. 80ms Fade out for seamless cancel without clicking sounds
    if (currentSourceRef.current && currentGainNodeRef.current && isPlayingRef.current && audioContextRef.current) {
      const audioCtx = audioContextRef.current;
      const gainNode = currentGainNodeRef.current;
      const source = currentSourceRef.current;

      try {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08); // 80ms fade out

        source.stop(audioCtx.currentTime + 0.08);
      } catch (e) {
        source.stop();
      }
    }

    currentSourceRef.current = null;
    currentGainNodeRef.current = null;
    isPlayingRef.current = false;
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;

    // Check version
    const nextChunk = queueRef.current[0];
    if (nextChunk.version && nextChunk.version < currentVoiceVersionRef.current) {
      queueRef.current.shift();
      playNextInQueue();
      return;
    }

    isPlayingRef.current = true;
    const { blob, meta, onStart } = queueRef.current.shift();

    try {
      initAudio();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      onStart?.(meta);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.setValueAtTime(1, audioContextRef.current.currentTime);

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      currentSourceRef.current = source;
      currentGainNodeRef.current = gainNode;

      source.onended = () => {
        isPlayingRef.current = false;
        currentSourceRef.current = null;
        currentGainNodeRef.current = null;
        playNextInQueue();
      };

      source.start(0);
    } catch (err) {
      logger.error('[voice] Playback failed:', err);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, [initAudio]);

  const queueAudioChunk = useCallback((chunk, onStart) => {
    if (chunk.version) {
      currentVoiceVersionRef.current = Math.max(currentVoiceVersionRef.current, chunk.version);
    }
    queueRef.current.push({ ...chunk, onStart });
    if (!isPlayingRef.current) {
      playNextInQueue();
    }
  }, [playNextInQueue]);

  // Legacy fallback for English or Browser-only modes
  const speakLegacy = useCallback((text, opts = {}) => {
    if (!synthRef.current) return;
    const content = typeof text === 'string' ? text.trim() : '';
    if (!content) return;

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = opts.lang || 'en-US';
    utterance.rate = 1.0;

    synthRef.current.cancel();
    synthRef.current.speak(utterance);
  }, []);

  const warmup = useCallback(() => {
    initAudio();
  }, [initAudio]);

  return {
    isSupported: true,
    warmup,
    speak: speakLegacy, // Backward compat
    queueAudioChunk,
    stop
  };
}
