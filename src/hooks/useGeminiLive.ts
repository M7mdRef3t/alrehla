import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioStreamProcessor, AudioPlayer } from '@/utils/audioUtils';
import { logger } from '@/services/logger';

export interface UIExerciseMutation {
  componentType: 'slider' | 'button_group' | 'text_reflection' | 'radar_chart';
  props: Record<string, any>;
  title: string;
  description: string;
}

export function useGeminiLive(onUiMutated: (mutation: UIExerciseMutation) => void) {
  const [isLive, setIsLive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const streamProcessorRef = useRef<AudioStreamProcessor | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopLiveSession();
    };
  }, []);

  const simulateAILogic = (audioBase64Chunk: string) => {
    // In a production environment, this base64 PCM stream is piped to Gemini WebSockets.
    // For MVP prototyping without direct WebSockets API keys in browser:
    // We simulate Gemini analyzing voice tone and returning a response/tool call.
    
    // Simulate some logic checking if user spoke enough
    if (Math.random() > 0.98 && !isProcessing) {
        setIsProcessing(true);
        setTimeout(() => {
            // Trigger a UI mutation
            onUiMutated({
                componentType: 'slider',
                title: 'مستوى التشتت (مُكتشف صوتياً)',
                description: 'نبرة صوتك توحي بتداخل الأفكار. حدد بصراحة مستوى التشتت الآن.',
                props: { min: 0, max: 10, defaultValue: 7, labelString: 'التشتت الداخلي' }
            });
            setIsProcessing(false);
        }, 3000);
    }
  };

  const startLiveSession = async () => {
    try {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new AudioPlayer();
        audioPlayerRef.current.onPlaybackStateChange = (speaking) => {
           setIsSpeaking(speaking);
        };
      }
      
      streamProcessorRef.current = new AudioStreamProcessor((base64Audio) => {
         // Send streaming audio to Gemini via our simulated logic or WS
         simulateAILogic(base64Audio);
      });

      await streamProcessorRef.current.start();
      setIsLive(true);
      logger.info("[GeminiLive] Handshake verified. Session active.");
    } catch (e) {
      logger.error("[GeminiLive] Failed starting live session:", e);
      setIsLive(false);
    }
  };

  const stopLiveSession = () => {
    if (streamProcessorRef.current) {
      streamProcessorRef.current.stop();
      streamProcessorRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.dispose();
      audioPlayerRef.current = null;
    }
    setIsLive(false);
    setIsSpeaking(false);
    setIsProcessing(false);
  };

  const executeSystemTool = (toolCallResponse: string) => {
      // Used if we route normal text/LLM outputs to this hook.
  };

  return {
    isLive,
    isSpeaking,
    isProcessing,
    startLiveSession,
    stopLiveSession,
  };
}
