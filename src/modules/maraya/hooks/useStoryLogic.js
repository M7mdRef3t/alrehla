import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useWebSocket from './useWebSocket.js';
import useAudioMood from './useAudioMood.js';
import useNarrationVoice from './useNarrationVoice.js';
import useAmbientSync from './useAmbientSync.js';
import useWhisperInput from './useWhisperInput.js';
import {
  hapticSceneReveal,
  hapticChoiceMade,
  hapticRedirect,
  hapticEnding,
} from './useHaptic.js';
import {
  APP_STATES,
  AUDIO_MOOD_MAP,
  JUDGE_SAMPLE_WHISPERS,
  UI_COPY,
  getModeUiLanguage,
  normalizeMode,
} from '../utils/constants.js';
import {
  getOrCreateSessionId,
  getOrCreateUserId,
  getStoredDisplayName,
  setStoredDisplayName,
} from '../utils/session.js';

function getVoiceLang(mode) {
  if (mode === 'judge_en') return 'en-US';
  if (mode === 'ar_fusha') return 'ar-SA';
  return 'ar-EG';
}

function createInitialDuoState(selfName) {
  return {
    roomId: '',
    role: 'solo',
    status: 'idle',
    selfName,
    partnerName: '',
    members: [],
    canStart: false,
    storyStarted: false,
    error: '',
    votes: [],
    mismatch: false,
    readyCount: 0,
    requiredVotes: 2,
    selectedChoiceIndex: null,
    notice: '',
  };
}

function normalizeRoomCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

function hashText(value) {
  let hash = 0;
  for (const char of String(value || '')) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function buildWhisperReflectionCoda({ transcript, uiLanguage }) {
  const isEn = uiLanguage === 'en';
  const normalized = String(transcript || '').trim().toLowerCase();
  const hasAny = (patterns) => patterns.some((pattern) => normalized.includes(pattern));

  if (hasAny(['hope', 'light', 'bright', 'sun', 'dawn'])) {
    return isEn
      ? 'Whatever is still reaching for light in you is already alive.'
      : 'ما يزال يمد يده إلى النور داخلك حيّاً بالفعل.';
  }

  if (hasAny(['lost', 'fog', 'confused', 'confusion', 'maze'])) {
    return isEn
      ? 'Even lost things begin to point somewhere once they are spoken aloud.'
      : 'حتى الأشياء الضائعة تبدأ بالإشارة إلى طريق حين تُقال بصوت مسموع.';
  }

  if (hasAny(['alone', 'lonely', 'silence', 'empty'])) {
    return isEn
      ? 'Naming the loneliness has already broken its perfect silence.'
      : 'تسمية الوحدة كسرت صمتها الكامل بالفعل.';
  }

  if (hasAny(['tired', 'exhausted', 'heavy', 'drained'])) {
    return isEn
      ? 'Fatigue can dim the path, but it has not erased it.'
      : 'قد يبهت التعب الطريق، لكنه لم يمحه.';
  }

  return isEn
    ? 'Something steady in you is already answering back.'
    : 'هناك شيء ثابت فيك بدأ يجيب بالفعل.';
}

function toDisplayEmotionLabel(emotion, uiLanguage) {
  const labels = {
    anxiety: { en: 'anxiety', ar: 'القلق' },
    confusion: { en: 'confusion', ar: 'الحيرة' },
    nostalgia: { en: 'nostalgia', ar: 'الحنين' },
    hope: { en: 'hope', ar: 'الأمل' },
    loneliness: { en: 'loneliness', ar: 'الوحدة' },
    wonder: { en: 'wonder', ar: 'الدهشة' },
  };
  const normalized = String(emotion || '').trim().toLowerCase();
  const match = labels[normalized];
  if (!match) return normalized || (uiLanguage === 'en' ? 'hope' : 'الأمل');
  return uiLanguage === 'en' ? match.en : match.ar;
}

function buildMemoryReflection(snapshot, uiLanguage) {
  if (!snapshot?.rememberedCount) return '';

  const isEn = uiLanguage === 'en';
  const latestJourney = snapshot.recentJourneys?.[0] || null;
  const latestEmotion = toDisplayEmotionLabel(
    latestJourney?.finalEmotion || latestJourney?.seedEmotion || snapshot.signature?.dominantEmotion,
    uiLanguage,
  );
  const dominantEmotion = toDisplayEmotionLabel(snapshot.signature?.dominantEmotion, uiLanguage);
  const arcLine = String(snapshot.arcSummary?.recentArc || '').trim();
  const transformation = snapshot.lastTransformation;

  if (isEn) {
    if (transformation?.fromEmotion && transformation?.toEmotion) {
      const fromLabel = toDisplayEmotionLabel(transformation.fromEmotion, uiLanguage);
      const toLabel = toDisplayEmotionLabel(transformation.toEmotion, uiLanguage);
      return arcLine
        ? `The mirror remembers you moving from ${fromLabel} to ${toLabel}. ${arcLine}`
        : `The mirror remembers you moving from ${fromLabel} to ${toLabel}.`;
    }
    if (latestJourney?.finalEmotion && snapshot.signature?.dominantEmotion && latestJourney.finalEmotion !== snapshot.signature.dominantEmotion) {
      return `The mirror remembers your last journey settling in ${latestEmotion}, even while your deeper signature keeps leaning toward ${dominantEmotion}.`;
    }
    return `The mirror remembers how your last journey settled in ${latestEmotion}.`;
  }

  if (transformation?.fromEmotion && transformation?.toEmotion) {
    const fromLabel = toDisplayEmotionLabel(transformation.fromEmotion, uiLanguage);
    const toLabel = toDisplayEmotionLabel(transformation.toEmotion, uiLanguage);
    return arcLine
      ? `تتذكر المرآة أنك انتقلت من ${fromLabel} إلى ${toLabel}. ${arcLine}`
      : `تتذكر المرآة أنك انتقلت من ${fromLabel} إلى ${toLabel}.`;
  }

  if (latestJourney?.finalEmotion && snapshot.signature?.dominantEmotion && latestJourney.finalEmotion !== snapshot.signature.dominantEmotion) {
    return `المرآة تتذكر أن رحلتك الأخيرة استقرت عند ${latestEmotion}، بينما ما زالت بصمتك الأعمق تميل إلى ${dominantEmotion}.`;
  }
  return `المرآة تتذكر كيف استقرت رحلتك الأخيرة عند ${latestEmotion}.`;
}

function buildWhisperReflectionText({ emotion, transcript, uiLanguage, memorySnapshot = null }) {
  const isEn = uiLanguage === 'en';
  const normalizedEmotion = String(emotion || 'hope').trim().toLowerCase();
  const cleanedTranscript = String(transcript || '').replace(/\s+/g, ' ').trim();
  const reflectionSeed = hashText(`${normalizedEmotion}:${cleanedTranscript || 'silence'}`);

  const reflections = isEn
    ? {
      anxiety: [
        'I hear anxiety trying to hold the whole ceiling up by itself.',
        'I hear your nerves bracing for impact long after the storm has moved on.',
        'I hear a heart rehearsing danger because it still wants to keep you safe.',
      ],
      confusion: [
        'I hear a mind tapping every wall in the fog, still trusting one will open.',
        'I hear someone turning slowly in the mist, looking for the first honest light.',
        'I hear your thoughts circling the dark until one true direction begins to answer.',
      ],
      nostalgia: [
        'I hear memory warming its hands over an old fire that still glows.',
        'I hear the past asking to be touched gently, not dragged forward untouched.',
        'I hear an old room in you opening its windows for one more breath of warmth.',
      ],
      hope: [
        'I hear hope protecting a small flame from the weather.',
        'I hear hope keeping its hand on the door, even after a very long night.',
        'I hear a part of you refusing to confuse exhaustion with the end of the road.',
      ],
      loneliness: [
        'I hear loneliness standing at the edge of the room, hoping to be noticed gently.',
        'I hear a quiet part of you waiting for the world to answer with warmth, not noise.',
        'I hear a held breath asking whether it still has to carry this by itself.',
      ],
      wonder: [
        'I hear wonder widening the room just enough for mystery to breathe.',
        'I hear curiosity leaning toward the unknown with its hands still open.',
        'I hear a door inside the uncertainty beginning to glow at the edges.',
      ],
    }
    : {
      anxiety: 'أسمع قلقاً يحاول أن يحمل السقف كله وحده.',
      confusion: 'أسمع عقلاً يطرق كل جدار في الضباب، وما زال يثق أن واحداً منها سينفتح.',
      nostalgia: 'أسمع ذاكرة تدفئ يديها على نار قديمة ما زالت تتوهج.',
      hope: 'أسمع أملاً يحمي شعلة صغيرة من تقلّبات الطقس.',
      loneliness: 'أسمع وحدة تقف عند حافة الغرفة وتتمنى أن يلاحظها أحد بلطف.',
      wonder: 'أسمع دهشة توسّع الغرفة بما يكفي كي يتنفس الغموض.',
    };

  const emotionalOptions = reflections[normalizedEmotion] || reflections.hope;
  const emotionalLine = Array.isArray(emotionalOptions)
    ? emotionalOptions[reflectionSeed % emotionalOptions.length]
    : emotionalOptions;
  const coda = buildWhisperReflectionCoda({
    transcript: cleanedTranscript,
    uiLanguage,
  });

  const memoryLine = buildMemoryReflection(memorySnapshot, uiLanguage);
  return [memoryLine, emotionalLine, coda].filter(Boolean).join(' ');
}

export default function useStoryLogic(canvasRef, { judgeMode = false } = {}) {
  const readStoredBoolean = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === '1';
  };

  const readStoredNumber = (key, fallback) => {
    const raw = Number(localStorage.getItem(key));
    return Number.isFinite(raw) ? raw : fallback;
  };

  const readStoredMode = () => {
    const raw = localStorage.getItem('maraya_story_mode');
    return normalizeMode(raw);
  };

  const [userId] = useState(() => getOrCreateUserId());
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [appState, setAppState] = useState(() => (judgeMode ? APP_STATES.LANDING : 'SPLASH'));
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [showSpaceUpload, setShowSpaceUpload] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [currentScene, setCurrentScene] = useState(null);
  const [currentMood, setCurrentMood] = useState('ambient_calm');
  const [endingMessage, setEndingMessage] = useState('');
  const [sceneQueue, setSceneQueue] = useState([]);
  const [spaceReading, setSpaceReading] = useState(null);
  const [spaceMyth, setSpaceMyth] = useState(null);
  const [storyMode, setStoryMode] = useState(() => (judgeMode ? 'judge_en' : readStoredMode()));
  const [musicEnabled, setMusicEnabled] = useState(() => readStoredBoolean('maraya_music_enabled', true));
  const musicEnabledRef = useRef(musicEnabled);
  musicEnabledRef.current = musicEnabled;
  const [voiceEnabled, setVoiceEnabled] = useState(() => readStoredBoolean('maraya_voice_enabled', true));
  const [biometricsEnabled, setBiometricsEnabled] = useState(() => readStoredBoolean('maraya_biometrics', false));
  const [spatialModeEnabled, setSpatialModeEnabled] = useState(() => readStoredBoolean('maraya_spatial_mode', false));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [narrationSpeed, setNarrationSpeed] = useState(() => readStoredNumber('maraya_narration_speed', 45));
  const [lastAcceptedVersion, setLastAcceptedVersion] = useState(0);
  const [imageStale, setImageStale] = useState(false);
  const [staleDroppedCount, setStaleDroppedCount] = useState(0);
  const [emotionJourney, setEmotionJourney] = useState([]);
  const [sceneImageData, setSceneImageData] = useState(null);
  const [sceneImageMime, setSceneImageMime] = useState(null);
  const [secretEndingKey, setSecretEndingKey] = useState(null);
  const [mirrorMemory, setMirrorMemory] = useState(null);
  const [storyMoments, setStoryMoments] = useState([]);
  const [directorMove, setDirectorMove] = useState(null);
  const [lastWhisperText, setLastWhisperText] = useState('');
  const [whisperInterpretation, setWhisperInterpretation] = useState(null);
  const [duoJoinCode, setDuoJoinCode] = useState('');
  const [duoState, setDuoState] = useState(() => createInitialDuoState(getStoredDisplayName()));
  const [toasts, setToasts] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const redirectTimerRef = useRef(null);
  const imageFallbackTimerRef = useRef(null);
  const lastWsErrorRef = useRef('');

  const intentThrottleRef = useRef(null);
  const planFallbackTimerRef = useRef(null);
  const interventionDelayTimerRef = useRef(null);
  const pendingIntentRef = useRef(null);

  const uiLanguage = getModeUiLanguage(storyMode);
  const uiText = useMemo(() => UI_COPY[uiLanguage] || UI_COPY.en, [uiLanguage]);
  const wsQuery = useMemo(() => ({ userId, sessionId }), [sessionId, userId]);
  const duoIsActive = duoState.role === 'host' || duoState.role === 'guest';
  const canStartStory = !duoIsActive || duoState.canStart;
  const canRestartStory = !duoIsActive || duoState.role === 'host';

  const { isConnected, error: wsError, connect, sendMessage, on, off } = useWebSocket({ query: wsQuery });
  const { unlock: unlockAudio, loadMood, setMood, stop: stopAudio, setVolume: setMusicVolume, playDuoSyncSound } = useAudioMood();
  const {
    isSupported: voiceSupported,
    warmup: warmupVoice,
    speak: speakVoice,
    queueAudioChunk,
    stop: stopVoice,
  } = useNarrationVoice();

  useAmbientSync(currentMood, appState === APP_STATES.STORY || appState === APP_STATES.ENDING);

  const resetRuntimeState = useCallback((nextAppState = APP_STATES.LANDING) => {
    setAppState(nextAppState);
    setShowSpaceUpload(false);
    setCurrentScene(null);
    setSceneQueue([]);
    setTranscript([]);
    setEndingMessage('');
    setSpaceReading(null);
    setSpaceMyth(null);
    setEmotionJourney([]);
    setSceneImageData(null);
    setSceneImageMime(null);
    setSecretEndingKey(null);
    setStatusText('');
    setStoryMoments([]);
    setDirectorMove(null);
    setLastWhisperText('');
    setWhisperInterpretation(null);
    stopAudio();
    stopVoice();
    if (canvasRef.current) {
      canvasRef.current.clearImage();
    }
  }, [canvasRef, stopAudio, stopVoice]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((type, message, duration = 5000) => {
    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) return;

    setToasts((prev) => {
      const alreadyVisible = prev.some((toast) => toast.type === type && toast.message === normalizedMessage);
      if (alreadyVisible) return prev;
      const next = [...prev, {
        id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        message: normalizedMessage,
        duration,
      }];
      return next.slice(-4);
    });
  }, []);

  const preloadMoods = useCallback(() => {
    Object.entries(AUDIO_MOOD_MAP).forEach(([id, config]) => {
      loadMood(id, `/audio/${config.file}`);
    });
  }, [loadMood]);

  const prepareStoryStart = useCallback((nextStatusText, seedJourney = []) => {
    unlockAudio();
    preloadMoods();
    warmupVoice();

    setAppState(APP_STATES.LOADING);
    setStatusText(nextStatusText);
    setCurrentScene(null);
    setSceneQueue([]);
    setTranscript([]);
    setSpaceReading(null);
    setEmotionJourney(seedJourney);
    setSceneImageData(null);
    setSceneImageMime(null);
    setSpaceMyth(null);
    setSecretEndingKey(null);
    setStoryMoments([]);
    setDirectorMove(null);
    setWhisperInterpretation(null);
    if (canvasRef.current) {
      canvasRef.current.clearImage();
    }
  }, [canvasRef, preloadMoods, unlockAudio, warmupVoice]);

  const applyDuoState = useCallback((room) => {
    setDuoState((prev) => ({
      ...prev,
      roomId: room?.roomId || '',
      role: room?.role || 'solo',
      status: room?.status || 'idle',
      partnerName: room?.partnerName || '',
      members: room?.members || [],
      canStart: Boolean(room?.canStart),
      storyStarted: Boolean(room?.storyStarted),
      error: room?.error || '',
      votes: room?.votes || [],
      mismatch: Boolean(room?.mismatch),
      readyCount: room?.readyCount || 0,
      requiredVotes: room?.requiredVotes || 2,
      selectedChoiceIndex: typeof room?.selectedChoiceIndex === 'number'
        ? room.selectedChoiceIndex
        : prev.selectedChoiceIndex,
      notice: room?.notice || '',
    }));
  }, []);

  const startWhisperStory = useCallback((whisperText, forcedMode = storyMode) => {
    const nextText = String(whisperText || '').trim();
    if (!nextText || !canStartStory) return;

    setLastWhisperText(nextText);
    prepareStoryStart(uiText.loadingStory, []);
    sendMessage('start_story', {
      whisper_text: nextText,
      output_mode: forcedMode,
    });
  }, [canStartStory, prepareStoryStart, sendMessage, storyMode, uiText.loadingStory]);

  const whisperInput = useWhisperInput({
    language: getVoiceLang(storyMode),
    onTranscript: startWhisperStory,
  });

  const handleStartJudgeJourney = useCallback(() => {
    const samplePrompt = uiLanguage === 'ar' ? JUDGE_SAMPLE_WHISPERS.ar : JUDGE_SAMPLE_WHISPERS.en;
    setStoryMode('judge_en');
    startWhisperStory(samplePrompt, 'judge_en');
  }, [startWhisperStory, uiLanguage]);

  useEffect(() => {
    if (!voiceSupported) {
      setVoiceEnabled(false);
    }
  }, [voiceSupported]);

  useEffect(() => {
    if (!wsError) {
      lastWsErrorRef.current = '';
      return;
    }

    if (lastWsErrorRef.current === wsError) return;
    lastWsErrorRef.current = wsError;
    pushToast('error', wsError, 6000);
  }, [pushToast, wsError]);

  useEffect(() => {
    localStorage.setItem('maraya_music_enabled', musicEnabled ? '1' : '0');
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('maraya_voice_enabled', voiceEnabled ? '1' : '0');
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('maraya_narration_speed', String(narrationSpeed));
  }, [narrationSpeed]);

  useEffect(() => {
    localStorage.setItem('maraya_story_mode', storyMode);
  }, [storyMode]);

  useEffect(() => {
    localStorage.setItem('maraya_biometrics', biometricsEnabled ? '1' : '0');
  }, [biometricsEnabled]);

  useEffect(() => {
    localStorage.setItem('maraya_spatial_mode', spatialModeEnabled ? '1' : '0');
  }, [spatialModeEnabled]);

  useEffect(() => {
    if (!judgeMode) return;
    localStorage.setItem('maraya_onboarding_seen', '1');
    localStorage.setItem('maraya_story_mode', 'judge_en');
    if (storyMode !== 'judge_en') {
      setStoryMode('judge_en');
    }
    if (appState === 'SPLASH' || appState === 'ONBOARDING') {
      setAppState(APP_STATES.LANDING);
    }
  }, [appState, judgeMode, storyMode]);

  useEffect(() => {
    const dir = uiLanguage === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [uiLanguage]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (appState !== APP_STATES.STORY) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 0);
    return () => clearTimeout(timer);
  }, [connect]);

  useEffect(() => {
    if (appState !== 'SPLASH') return undefined;
    const hasSeenOnboarding = localStorage.getItem('maraya_onboarding_seen') === '1';
    const timer = setTimeout(() => {
      setAppState(hasSeenOnboarding ? APP_STATES.LANDING : 'ONBOARDING');
    }, hasSeenOnboarding ? 1200 : 1800);
    return () => clearTimeout(timer);
  }, [appState]);

  useEffect(() => {
    on('status', (msg) => {
      if (msg.v < lastAcceptedVersion) {
        setStaleDroppedCount((prev) => prev + 1);
        return;
      }
      setStatusText(msg.text);
    });

    on('memory_snapshot', (msg) => {
      setMirrorMemory(msg.snapshot || null);
    });

    on('whisper_interpreted', (msg) => {
      const reflection = buildWhisperReflectionText({
        emotion: msg?.emotion,
        transcript: msg?.transcript || lastWhisperText,
        uiLanguage,
        memorySnapshot: mirrorMemory,
      });

      setWhisperInterpretation(msg ? { ...msg, reflection } : null);
      if (msg?.emotion) {
        setEmotionJourney((prev) => (prev.length > 0 ? prev : [msg.emotion]));
      }
      if (reflection) {
        setTranscript((prev) => {
          const next = prev.filter((block) => block?.source !== 'mirror_echo');
          next.unshift({
            kind: 'reflection',
            text_ar: reflection,
            source: 'mirror_echo',
          });
          return next.slice(-30);
        });
      }
    });

    on('duo_state', (msg) => {
      applyDuoState(msg.room || null);
      if (msg.room?.role !== 'solo') {
        setDuoJoinCode('');
      }
    });

    on('notice', (msg) => {
      pushToast(msg.level === 'error' ? 'error' : 'warning', msg.message, 6500);
    });

    on('duo_vote_update', (msg) => {
      setDuoState((prev) => {
        const isSyncing = !msg.mismatch && msg.readyCount === (msg.requiredVotes || 2);
        const wasAlreadySyncing = !prev.mismatch && prev.readyCount === (prev.requiredVotes || 2);

        if (isSyncing && !wasAlreadySyncing && musicEnabledRef.current) {
          playDuoSyncSound();
        }

        return {
          ...prev,
          votes: msg.votes || [],
          mismatch: Boolean(msg.mismatch),
          readyCount: msg.readyCount || 0,
          requiredVotes: msg.requiredVotes || 2,
          selectedChoiceIndex: msg.selfVoteIndex ?? prev.selectedChoiceIndex,
        };
      });
    });

    on('duo_closed', (msg) => {
      resetRuntimeState(APP_STATES.LANDING);
      setDuoState(createInitialDuoState(duoState.selfName));
      setDuoJoinCode('');
      setStatusText(msg.message || '');
      pushToast('warning', msg.message || '', 6500);
    });

    on('duo_story_reset', (msg) => {
      resetRuntimeState(APP_STATES.LANDING);
      setDuoState((prev) => ({
        ...prev,
        storyStarted: false,
        votes: [],
        mismatch: false,
        readyCount: 0,
        selectedChoiceIndex: null,
        error: msg.message || '',
      }));
    });

    on('space_reading', (msg) => {
      if (msg.v < lastAcceptedVersion) {
        setStaleDroppedCount((prev) => prev + 1);
        return;
      }
      setSpaceReading(msg.reading);
      setSpaceMyth(msg.mythicReading || msg.reading || null);
    });

    on('scene', (msg) => {
      if (msg.v < lastAcceptedVersion) {
        setStaleDroppedCount((prev) => prev + 1);
        return;
      }
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (imageFallbackTimerRef.current) clearTimeout(imageFallbackTimerRef.current);

      setLastAcceptedVersion(msg.v);
      setImageStale(true);
      imageFallbackTimerRef.current = setTimeout(() => { }, 900);

      const scene = msg.scene;
      if (duoState.role !== 'solo' && appState !== APP_STATES.LOADING) {
        setAppState(APP_STATES.LOADING);
      }
      setSceneQueue((prev) => [...prev, scene]);
      setDirectorMove((prev) => (prev
        ? {
          ...prev,
          phase: prev.phase === 'executing' || prev.phase === 'acknowledged' ? 'arrived' : prev.phase,
          ritualPhase: scene.ritual_phase || prev.ritualPhase || '',
          symbolicAnchor: scene.symbolic_anchor || prev.symbolicAnchor || '',
          carriedArtifact: scene.carried_artifact || prev.carriedArtifact || '',
          arrivedAt: Date.now(),
        }
        : prev));
      setStoryMoments((prev) => [...prev, {
        sceneId: scene.scene_id,
        narration: scene.narration_ar,
        interleavedBlocks: scene.interleaved_blocks,
        audioMood: scene.audio_mood,
        storySceneNumber: scene.story_scene_number,
        carriedArtifact: scene.carried_artifact || '',
        symbolicAnchor: scene.symbolic_anchor || '',
        ritualPhase: scene.ritual_phase || '',
        mythicEcho: scene.mythic_echo || '',
        imageData: null,
        imageMimeType: null,
      }]);
      setDuoState((prev) => ({
        ...prev,
        storyStarted: true,
        votes: [],
        mismatch: false,
        readyCount: 0,
        selectedChoiceIndex: null,
      }));
      hapticSceneReveal();

      if (scene.audio_mood) {
        const moodToEmotion = {
          ambient_calm: 'hope',
          tense_drone: 'anxiety',
          hopeful_strings: 'hope',
          mysterious_wind: 'confusion',
          triumphant_rise: 'wonder',
        };
        setEmotionJourney((prev) => [...prev, moodToEmotion[scene.audio_mood] || 'hope']);
      }
    });

    on('scene_image', (msg) => {
      if (msg.v < lastAcceptedVersion) {
        setStaleDroppedCount((prev) => prev + 1);
        return;
      }
      if (imageFallbackTimerRef.current) clearTimeout(imageFallbackTimerRef.current);
      setImageStale(false);

      setSceneImageData(msg.image);
      setSceneImageMime(msg.mimeType);
      setStoryMoments((prev) => prev.map((moment) => (
        moment.sceneId === msg.scene_id
          ? { ...moment, imageData: msg.image, imageMimeType: msg.mimeType }
          : moment
      )));
      if (canvasRef.current) {
        canvasRef.current.setImage(msg.image, msg.mimeType);
      }
    });

    on('story_complete', (msg) => {
      if (msg.v < lastAcceptedVersion) return;
      setEndingMessage(msg.message);
      setAppState(APP_STATES.ENDING);
      setDuoState((prev) => ({
        ...prev,
        storyStarted: false,
        votes: [],
        mismatch: false,
        readyCount: 0,
        selectedChoiceIndex: null,
      }));
      hapticEnding();
    });

    on('error', (msg) => {
      if (msg.v < lastAcceptedVersion) return;
      const message = msg.message || uiText.loadingError;
      setStatusText(message);
      pushToast('error', message, 7000);
      setTimeout(() => setAppState(APP_STATES.LANDING), 3000);
    });

    on('audio_chunk', (chunk) => {
      if (chunk.v < lastAcceptedVersion) {
        setStaleDroppedCount((prev) => prev + 1);
        return;
      }
      if (!voiceEnabled) return;
      queueAudioChunk({ ...chunk, version: chunk.v }, () => { });
    });

    on('intervention_plan', (msg) => {
      if (msg.v < lastAcceptedVersion) return;

      if (planFallbackTimerRef.current) {
        clearTimeout(planFallbackTimerRef.current);
        planFallbackTimerRef.current = null;
      }

      const plan = msg.plan || { delayMs: 0, style: 'none' };
      const intent = pendingIntentRef.current;
      if (!intent) return;

      if (plan.delayMs > 0 && plan.style === 'micro_text') {
        setStatusText(plan.message || (uiLanguage === 'ar' ? 'خذ نفساً عميقاً..' : 'Take a breath...'));
      }
      setDirectorMove((prev) => (prev ? {
        ...prev,
        phase: plan.delayMs > 0 ? 'guiding' : 'queued',
        guidance: plan.message || '',
      } : prev));

      if (interventionDelayTimerRef.current) clearTimeout(interventionDelayTimerRef.current);

      interventionDelayTimerRef.current = setTimeout(() => {
        executePendingIntent(intent, plan.delayMs, false);
      }, plan.delayMs);
    });

    on('secret_ending_unlocked', (msg) => {
      setSecretEndingKey(msg.key || 'unknown');
    });

    on('redirect_ack', (msg) => {
      if (msg.v < lastAcceptedVersion) return;
      setLastAcceptedVersion(msg.v);
      stopVoice();
      setDirectorMove((prev) => (prev ? { ...prev, phase: 'acknowledged', acknowledgedAt: Date.now() } : prev));
      hapticRedirect();
    });

    on('audio_cancel', (msg) => {
      if (msg.v < lastAcceptedVersion) return;
      stopVoice();
    });

    on('timeline_reset', (msg) => {
      if (msg.v < lastAcceptedVersion) return;
      setSceneQueue([]);
      setTranscript([]);
      setStoryMoments([]);
      setDuoState((prev) => ({
        ...prev,
        votes: [],
        mismatch: false,
        readyCount: 0,
        selectedChoiceIndex: null,
      }));
    });

    return () => {
      off('status');
      off('memory_snapshot');
      off('whisper_interpreted');
      off('duo_state');
      off('notice');
      off('duo_vote_update');
      off('duo_closed');
      off('duo_story_reset');
      off('space_reading');
      off('scene');
      off('scene_image');
      off('story_complete');
      off('error');
      off('audio_chunk');
      off('secret_ending_unlocked');
      off('intervention_plan');
      off('redirect_ack');
      off('audio_cancel');
      off('timeline_reset');
    };
  }, [
    applyDuoState,
    appState,
    canvasRef,
    duoState.selfName,
    duoState.role,
    lastAcceptedVersion,
    lastWhisperText,
    mirrorMemory,
    off,
    on,
    pushToast,
    queueAudioChunk,
    resetRuntimeState,
    stopVoice,
    uiLanguage,
    uiText.loadingError,
    voiceEnabled,
  ]);

  useEffect(() => {
    if (sceneQueue.length > 0 && appState === APP_STATES.LOADING) {
      const nextScene = sceneQueue[0];
      setCurrentScene(nextScene);
      setCurrentMood(nextScene.audio_mood || 'ambient_calm');
      setAppState(APP_STATES.STORY);
      setSceneQueue((prev) => prev.slice(1));
    }
  }, [sceneQueue, appState]);

  useEffect(() => {
    if (!musicEnabled) {
      stopAudio();
    } else if (currentMood) {
      setMood(currentMood);
    }

    const moodPrefix = 'app--emotion-';
    const classesToRemove = Array.from(document.body.classList).filter((c) => c.startsWith(moodPrefix));
    classesToRemove.forEach((c) => document.body.classList.remove(c));

    const emotionMapping = {
      ambient_calm: 'joy',
      tense_mysterious: 'fear',
      intense_dramatic: 'anger',
      melancholic_soft: 'sadness',
      uplifting_heroic: 'hope',
      romantic_whimsical: 'love',
      tense_drone: 'fear',
      hopeful_strings: 'hope',
      mysterious_wind: 'love',
      triumphant_rise: 'joy',
    };

    const baseEmotion = emotionMapping[currentMood] || 'joy';
    document.body.classList.add(`${moodPrefix}${baseEmotion}`);
  }, [currentMood, musicEnabled, setMood, stopAudio]);

  useEffect(() => {
    if (appState === APP_STATES.LOADING || appState === APP_STATES.ENDING) {
      stopVoice();
    }
  }, [appState, stopVoice]);

  const handleNarrationBlock = useCallback((block) => {
    setTranscript((prev) => {
      const alreadyHas = prev.some((b) => b.text_ar === block.text_ar && b.kind === block.kind);
      if (alreadyHas) return prev;
      const next = [...prev, block];
      return next.slice(-30);
    });

    if (!voiceEnabled || !voiceSupported) return;
    if (!block?.text_ar) return;
    if (block.kind === 'visual') return;
    speakVoice(block.text_ar, { lang: getVoiceLang(storyMode) });
  }, [speakVoice, storyMode, voiceEnabled, voiceSupported]);

  const handleSelectEmotion = useCallback((emotionId, customContext = '') => {
    if (!canStartStory) return;

    setLastWhisperText('');
    prepareStoryStart(uiText.loadingStory, [emotionId]);
    const localHour = new Date().getHours();
    sendMessage('start_story', { emotion: emotionId, custom_context: customContext, output_mode: storyMode, localHour });
  }, [canStartStory, prepareStoryStart, sendMessage, storyMode, uiText.loadingStory]);

  const handleUploadSpace = useCallback((base64, mimeType) => {
    if (!canStartStory) return;

    setLastWhisperText('');
    prepareStoryStart(uiText.analyzingSpace, []);
    const localHour = new Date().getHours();
    sendMessage('start_story', { image: base64, mimeType, output_mode: storyMode, localHour });
  }, [canStartStory, prepareStoryStart, sendMessage, storyMode, uiText.analyzingSpace]);

  const handleChoose = useCallback((choice, choiceIndex = 0) => {
    if (!currentScene) return;

    const choiceText = choice?.text_ar || choice?.text_en || choice?.text || '';
    hapticChoiceMade();

    if (duoIsActive) {
      setStatusText(
        uiLanguage === 'en'
          ? `Vote sent. Waiting for ${duoState.partnerName || 'your partner'}...`
          : `تم إرسال صوتك. بانتظار ${duoState.partnerName || 'شريكك'}...`,
      );
      setDuoState((prev) => ({ ...prev, selectedChoiceIndex: choiceIndex }));
      sendMessage('duo_vote', {
        sceneId: currentScene.scene_id,
        choiceIndex,
        choice_text: choiceText,
        emotion_shift: choice.emotion_shift,
        output_mode: storyMode,
      });
      return;
    }

    setAppState(APP_STATES.LOADING);
    setStatusText(uiText.loadingNext);
    setCurrentScene(null);
    setSceneQueue([]);

    if (canvasRef.current) {
      canvasRef.current.clearImage();
    }
    stopVoice();

    sendMessage('choose', {
      choice_text: choiceText,
      emotion_shift: choice.emotion_shift,
      output_mode: storyMode,
    });
  }, [canvasRef, currentScene, duoIsActive, duoState.partnerName, sendMessage, stopVoice, storyMode, uiLanguage, uiText.loadingNext]);

  const executePendingIntent = useCallback((intent, appliedDelayMs, bypass) => {
    setStatusText(uiLanguage === 'ar' ? 'يتم تعديل المسار...' : 'Re-planning...');
    stopVoice();
    pendingIntentRef.current = null;
    setDirectorMove((prev) => (prev ? {
      ...prev,
      phase: 'executing',
      appliedDelayMs,
      bypass,
    } : prev));

    sendMessage('redirect_execute', {
      sceneId: intent.sceneId,
      atIndex: intent.atIndex,
      command: intent.command,
      intensity: intent.intensity,
      output_mode: intent.output_mode,
      v: intent.v,
      bypass,
      appliedDelayMs,
    });
  }, [sendMessage, stopVoice, uiLanguage]);

  const handleRedirect = useCallback((command, intensity = 0.8) => {
    if (!currentScene) return;
    if (duoIsActive && duoState.role !== 'host') return;

    setStatusText(uiLanguage === 'ar' ? 'تجهيز القرار...' : 'Preparing input...');
    setDirectorMove({
      command,
      intensity,
      phase: 'queued',
      guidance: '',
      ritualPhase: currentScene.ritual_phase || '',
      symbolicAnchor: currentScene.symbolic_anchor || '',
      carriedArtifact: currentScene.carried_artifact || '',
      requestedAt: Date.now(),
    });

    pendingIntentRef.current = {
      sceneId: currentScene.scene_id,
      atIndex: 0,
      command,
      intensity,
      output_mode: storyMode,
      v: lastAcceptedVersion,
    };

    if (intentThrottleRef.current) clearTimeout(intentThrottleRef.current);
    if (planFallbackTimerRef.current) clearTimeout(planFallbackTimerRef.current);
    if (interventionDelayTimerRef.current) clearTimeout(interventionDelayTimerRef.current);

    intentThrottleRef.current = setTimeout(() => {
      const intent = pendingIntentRef.current;
      if (!intent) return;

      sendMessage('redirect_intent', {
        sceneId: intent.sceneId,
        atIndex: intent.atIndex,
        command: intent.command,
        intensity: intent.intensity,
        output_mode: intent.output_mode,
        v: intent.v,
        context: {
          timeSinceLastRedirectMs: 0,
        },
      });

      planFallbackTimerRef.current = setTimeout(() => {
        if (pendingIntentRef.current) {
          executePendingIntent(pendingIntentRef.current, 0, true);
        }
      }, 800);
    }, 200);
  }, [currentScene, duoIsActive, duoState.role, executePendingIntent, lastAcceptedVersion, sendMessage, storyMode, uiLanguage]);

  useEffect(() => {
    window.runMarayaSpamTest = () => {
      let count = 0;
      const commands = ['Nightmare', 'Hope', 'Darker', 'Cinematic', 'Witty'];
      const interval = setInterval(() => {
        const cmd = commands[Math.floor(Math.random() * commands.length)];
        handleRedirect(cmd, 0.8);
        count += 1;
        if (count >= 10) {
          clearInterval(interval);
        }
      }, 1200);
    };
    return () => { delete window.runMarayaSpamTest; };
  }, [handleRedirect]);

  const handleRestart = useCallback(() => {
    if (duoIsActive) {
      sendMessage('duo_reset');
      return;
    }
    resetRuntimeState(APP_STATES.LANDING);
  }, [duoIsActive, resetRuntimeState, sendMessage]);

  const handleOnboardingNext = useCallback(() => {
    setOnboardingIndex((prev) => {
      if (prev >= 2) {
        localStorage.setItem('maraya_onboarding_seen', '1');
        setAppState(APP_STATES.LANDING);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const handleOnboardingBack = useCallback(() => {
    setOnboardingIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem('maraya_onboarding_seen', '1');
    setAppState(APP_STATES.LANDING);
  }, []);

  const handleModeChange = useCallback((nextMode) => {
    const normalized = normalizeMode(nextMode);
    setStoryMode(normalized);
    stopVoice();
  }, [stopVoice]);

  const handleToggleVoice = useCallback(() => {
    if (!voiceSupported) return;
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopVoice();
      }
      return next;
    });
  }, [stopVoice, voiceSupported]);

  const handleToggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopAudio();
      } else {
        unlockAudio();
        preloadMoods();
        if (currentMood) {
          setMood(currentMood);
        }
      }
      return next;
    });
  }, [currentMood, preloadMoods, setMood, stopAudio, unlockAudio]);

  const handleToggleBiometrics = useCallback(() => {
    setBiometricsEnabled((prev) => !prev);
  }, []);

  const handleToggleSpatialMode = useCallback(() => {
    setSpatialModeEnabled((prev) => !prev);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleResetSettings = useCallback(() => {
    localStorage.removeItem('maraya_music_enabled');
    localStorage.removeItem('maraya_voice_enabled');
    localStorage.removeItem('maraya_narration_speed');
    localStorage.removeItem('maraya_story_mode');
    localStorage.removeItem('maraya_settings_detent');
    localStorage.removeItem('maraya_biometrics');
    localStorage.removeItem('maraya_spatial_mode');

    setMusicEnabled(true);
    setVoiceEnabled(voiceSupported);
    setNarrationSpeed(45);
    setStoryMode('judge_en');
    setBiometricsEnabled(false);
    setSpatialModeEnabled(false);
  }, [voiceSupported]);

  const handleDuoNameChange = useCallback((name) => {
    const next = setStoredDisplayName(name);
    setDuoState((prev) => ({ ...prev, selfName: next }));
  }, []);

  const handleDuoJoinCodeChange = useCallback((value) => {
    setDuoJoinCode(normalizeRoomCode(value));
  }, []);

  const handleHostDuo = useCallback(() => {
    sendMessage('duo_host', { name: duoState.selfName });
  }, [duoState.selfName, sendMessage]);

  const handleJoinDuo = useCallback(() => {
    const roomId = normalizeRoomCode(duoJoinCode);
    if (!roomId) return;
    sendMessage('duo_join', { roomId, name: duoState.selfName });
  }, [duoJoinCode, duoState.selfName, sendMessage]);

  const handleLeaveDuo = useCallback(() => {
    sendMessage('duo_leave');
    setDuoState(createInitialDuoState(duoState.selfName));
    setDuoJoinCode('');
    if (appState === APP_STATES.STORY || appState === APP_STATES.ENDING) {
      resetRuntimeState(APP_STATES.LANDING);
    }
  }, [appState, duoState.selfName, resetRuntimeState, sendMessage]);

  useEffect(() => {
    const renderState = {
      mode: appState,
      currentScene: currentScene ? {
        id: currentScene.scene_id,
        storySceneNumber: currentScene.story_scene_number,
        choices: currentScene.choices?.map((choice) => choice.text_ar),
      } : null,
      duo: {
        role: duoState.role,
        roomId: duoState.roomId,
        partnerName: duoState.partnerName,
        readyCount: duoState.readyCount,
      },
      memoryCount: mirrorMemory?.rememberedCount || 0,
      storyMoments: storyMoments.length,
      transcriptBlocks: transcript.length,
      whisperReflection: whisperInterpretation?.reflection || '',
      judgeMode,
      statusText,
      coordinateSystem: 'UI state only; no world coordinates.',
    };

    window.render_game_to_text = () => JSON.stringify(renderState);
    window.advanceTime = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [appState, currentScene, duoState, judgeMode, mirrorMemory, statusText, storyMoments.length, transcript.length, whisperInterpretation?.reflection]);

  return {
    appState,
    setAppState,
    userId,
    showSpaceUpload,
    setShowSpaceUpload,
    statusText,
    currentScene,
    currentMood,
    endingMessage,
    spaceReading,
    spaceMyth,
    storyMode,
    musicEnabled,
    voiceEnabled,
    biometricsEnabled,
    spatialModeEnabled,
    narrationSpeed,
    settingsOpen,
    voiceSupported,
    imageStale,
    uiLanguage,
    uiText,
    isConnected,
    staleDroppedCount,
    lastAcceptedVersion,
    onboardingIndex,
    transcript,
    emotionJourney,
    sceneImageData,
    sceneImageMime,
    secretEndingKey,
    mirrorMemory,
    storyMoments,
    directorMove,
    lastWhisperText,
    whisperInterpretation,
    whisperInput,
    duoState,
    duoJoinCode,
    toasts,
    canStartStory,
    canRestartStory,
    judgeMode,
    handleNarrationBlock,
    handleOnboardingNext,
    handleOnboardingBack,
    handleOnboardingSkip,
    handleSelectEmotion,
    handleUploadSpace,
    handleChoose,
    handleRedirect,
    handleRestart,
    handleModeChange,
    handleToggleVoice,
    handleToggleMusic,
    handleToggleBiometrics,
    handleToggleSpatialMode,
    handleStartJudgeJourney,
    setNarrationSpeed,
    handleOpenSettings,
    handleCloseSettings,
    handleResetSettings,
    handleDuoNameChange,
    handleDuoJoinCodeChange,
    handleHostDuo,
    handleJoinDuo,
    handleLeaveDuo,
    dismissToast,
    setMusicVolume,
  };
}
