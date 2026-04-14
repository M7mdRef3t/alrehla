import React, { useEffect, useRef, useState } from 'react';
import './styles/tokens.css';
import './styles/maraya.css';
import StoryCanvas from './components/StoryCanvas.jsx';
import EmotionPicker from './components/emotion/EmotionPicker.jsx';
import SpaceUpload from './components/SpaceUpload.jsx';
import SceneRenderer from './components/story/SceneRenderer.jsx';
import SceneCardShare from './components/story/SceneCardShare.jsx';
import StoryReelExport from './components/story/StoryReelExport.jsx';
import EmotionJourneyMap from './components/story/EmotionJourneyMap.jsx';
import LoadingMirror from './components/layout/LoadingMirror.jsx';
import Transcript from './components/Transcript.jsx';
import BrandMark from './components/BrandMark.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import OnboardingCarousel from './components/OnboardingCarousel.jsx';
import SettingsSheet from './components/layout/SettingsSheet.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';
import KineticText from './components/ui/KineticText.jsx';
import useMarayaRuntime from './hooks/useMarayaRuntime.js';
import { APP_STATES, JUDGE_MODE_QUERY_PARAM } from './utils/constants.js';
import { buildTransformationSummary, toDisplayEmotionLabel } from './utils/transformation.js';
import { useAdminState } from '@/domains/admin/store/admin.store';
import { trackingService } from '@/domains/journey';
import {
  getMarayaStoryPath,
  getMarayaStoryRestartLabel,
  getMarayaStoryReturnLabel,
  launchMarayaStoryReturn
} from '@/utils/marayaStoryJourney';

const EMOTION_COLORS = {
  hope: '#5effb3',
  anxiety: '#8b7355',
  confusion: '#7b68ee',
  nostalgia: '#daa520',
  loneliness: '#4682b4',
  wonder: '#ffd700',
};

function findLastVisualMoment(moments = []) {
  for (let index = moments.length - 1; index >= 0; index -= 1) {
    if (moments[index]?.imageData) return moments[index];
  }
  return null;
}

function loadMomentImage(moment) {
  return new Promise((resolve) => {
    if (!moment?.imageData) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = `data:${moment.imageMimeType || 'image/png'};base64,${moment.imageData}`;
  });
}

async function extractSceneAccentColor(moment) {
  const image = await loadMomentImage(moment);
  if (!image) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 18;
  canvas.height = 18;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 24) continue;

    const pixelRed = data[index];
    const pixelGreen = data[index + 1];
    const pixelBlue = data[index + 2];
    const brightness = (pixelRed + pixelGreen + pixelBlue) / 3;
    if (brightness < 18) continue;

    red += pixelRed;
    green += pixelGreen;
    blue += pixelBlue;
    count += 1;
  }

  if (!count) return null;

  return `rgb(${Math.min(255, Math.round((red / count) * 1.08))}, ${Math.min(255, Math.round((green / count) * 1.08))}, ${Math.min(255, Math.round((blue / count) * 1.08))})`;
}

export function buildJudgeFinaleStingProfile(fromEmotion, toEmotion) {
  const pair = `${String(fromEmotion || '').trim().toLowerCase()}->${String(toEmotion || '').trim().toLowerCase()}`;

  const profiles = {
    'confusion->hope': { freqs: [196, 293.66, 440, 659.25], masterGain: 0.078, duration: 0.68 },
    'anxiety->hope': { freqs: [174.61, 261.63, 392, 587.33], masterGain: 0.08, duration: 0.72 },
    'loneliness->hope': { freqs: [164.81, 246.94, 369.99, 554.37], masterGain: 0.076, duration: 0.72 },
    'nostalgia->wonder': { freqs: [220, 329.63, 493.88, 659.25], masterGain: 0.07, duration: 0.7 },
    'hope->wonder': { freqs: [261.63, 392, 523.25, 783.99], masterGain: 0.074, duration: 0.66 },
    'wonder->hope': { freqs: [233.08, 349.23, 523.25, 698.46], masterGain: 0.074, duration: 0.68 },
  };

  if (profiles[pair]) {
    return profiles[pair];
  }

  if (String(toEmotion || '').trim().toLowerCase() === 'hope') {
    return { freqs: [196, 293.66, 392, 587.33], masterGain: 0.074, duration: 0.66 };
  }

  if (String(toEmotion || '').trim().toLowerCase() === 'wonder') {
    return { freqs: [220, 329.63, 493.88, 739.99], masterGain: 0.07, duration: 0.68 };
  }

  return { freqs: [196, 246.94, 311.13, 392], masterGain: 0.062, duration: 0.62 };
}

function playJudgeFinaleSting(stingProfile) {
  if (typeof window === 'undefined') return () => { };
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return () => { };

  const profile = stingProfile || buildJudgeFinaleStingProfile('confusion', 'hope');
  const audioContext = new AudioCtor();
  const now = audioContext.currentTime;
  const master = audioContext.createGain();
  master.connect(audioContext.destination);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(profile.masterGain, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);

  profile.freqs.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index === 0 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(index === 0 ? 0.035 : 0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.5, profile.duration - 0.08));
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now + (index * 0.015));
    oscillator.stop(now + Math.max(0.5, profile.duration - 0.08));
  });

  const closeTimer = window.setTimeout(() => {
    audioContext.close().catch(() => { });
  }, Math.ceil((profile.duration * 1000) + 280));

  return () => {
    window.clearTimeout(closeTimer);
    audioContext.close().catch(() => { });
  };
}

export default function App() {
  const canvasRef = useRef(null);
  const judgeFinaleVoiceKeyRef = useRef('');
  const judgeFinaleStingKeyRef = useRef('');
  const [imageAnnouncement, setImageAnnouncement] = useState('');
  const [judgeEndingSceneAccent, setJudgeEndingSceneAccent] = useState('');
  const [endingActionsVisible, setEndingActionsVisible] = useState(false);
  const [isIsolated, setIsIsolated] = useState(false);
  const [hrvValue, setHrvValue] = useState(68);
  const longPressTimerRef = useRef(null);
  const hideUiTimerRef = useRef(null);
  const hrvIntervalRef = useRef(null);
  const judgeMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(JUDGE_MODE_QUERY_PARAM) === '1' : false;
  const journeyPaths = useAdminState((state) => state.journeyPaths);
  const marayaPath = getMarayaStoryPath(journeyPaths);

  const handlePointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsIsolated((prev) => !prev);
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const {
    appState,
    showSpaceUpload,
    setShowSpaceUpload,
    statusText,
    currentScene,
    currentMood,
    endingMessage,
    spaceReading,
    spaceMyth,
    transcript,
    storyMode,
    musicEnabled,
    voiceEnabled,
    biometricsEnabled,
    spatialModeEnabled,
    settingsOpen,
    narrationSpeed,
    voiceSupported,
    uiLanguage,
    uiText,
    isConnected,
    handleNarrationBlock,
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
    setNarrationSpeed,
    handleOpenSettings,
    handleCloseSettings,
    handleResetSettings,
    imageStale,
    staleDroppedCount,
    lastAcceptedVersion,
    onboardingIndex,
    handleOnboardingNext,
    handleOnboardingBack,
    handleOnboardingSkip,
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
    handleStartJudgeJourney,
    handleDuoNameChange,
    handleDuoJoinCodeChange,
    handleHostDuo,
    handleJoinDuo,
    handleLeaveDuo,
    dismissToast,
    setMusicVolume,
  } = useMarayaRuntime(canvasRef, { judgeMode });

  const transformationSummary = buildTransformationSummary({
    emotionJourney,
    endingMessage,
    whisperText: lastWhisperText,
    spaceReading,
    spaceMyth,
    storyMoments,
    uiLanguage,
  });

  useEffect(() => {
    if (!currentScene) return;
    const alt = currentScene.visual_desc || currentScene.visual_prompt || currentScene.narration_ar || '';
    const prefix = uiLanguage === 'en' ? 'New scene generated: ' : 'تم توليد مشهد جديد: ';
    if (alt.trim()) {
      setImageAnnouncement(`${prefix}${alt}`);
    }
  }, [currentScene, uiLanguage]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (appState === APP_STATES.STORY) {
        const message = uiLanguage === 'en'
          ? 'Your story progress will be lost. Are you sure you want to leave?'
          : 'ستفقد تقدمك في القصة. هل أنت متأكد من المغادرة؟';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appState, uiLanguage]);

  const currentEmotionColor = emotionJourney.length > 0
    ? EMOTION_COLORS[emotionJourney[emotionJourney.length - 1]] || '#ffd700'
    : '#ffd700';
  const judgeEndingFromEmotion = toDisplayEmotionLabel(emotionJourney[0], uiLanguage);
  const judgeEndingToEmotion = toDisplayEmotionLabel(
    emotionJourney[emotionJourney.length - 1],
    uiLanguage,
  );
  const judgeEndingLine = transformationSummary.transformationLine || (uiLanguage === 'en'
    ? `From ${judgeEndingFromEmotion} to ${judgeEndingToEmotion}`
    : `من ${judgeEndingFromEmotion} إلى ${judgeEndingToEmotion}`);
  const judgeEndingCaption = uiLanguage === 'en'
    ? 'A judge-only ending burst that makes the transformation feel like a reveal, not a fade-out.'
    : 'خاتمة تحكيمية خاصة تجعل التحوّل يبدو ككشفٍ بصري لا كتلاشي هادئ.';

  const judgeEndingAccent = judgeEndingSceneAccent || currentEmotionColor;
  const returnToJourneyLabel = getMarayaStoryReturnLabel(marayaPath);
  const restartJourneyLabel = getMarayaStoryRestartLabel(marayaPath);

  const judgeFinaleVoiceLine = uiLanguage === 'en'
    ? `Transformation complete. ${judgeEndingLine}.`
    : `اكتمل التحول. ${judgeEndingLine}.`;

  useEffect(() => {
    if (appState === APP_STATES.ENDING) {
      trackingService.recordFlow('mirror_journey_completed', {
        meta: { surface: 'maraya' },
      });
    }
  }, [appState]);

  useEffect(() => {
    if (!biometricsEnabled || appState !== APP_STATES.STORY || judgeMode) {
      if (hrvIntervalRef.current) clearInterval(hrvIntervalRef.current);
      setHrvValue(68);
      return undefined;
    }

    hrvIntervalRef.current = setInterval(() => {
      setHrvValue((prev) => {
        if (prev < 40) return prev; // If already dropped, keep it low for a bit

        // ~4% chance of a sudden stress drop every 2s
        if (Math.random() < 0.04) {
          setTimeout(() => {
            handleNarrationBlock({
              id: 'biometric_interrupt',
              text_ar: 'الرصد الحيوي سجل انكمافاً في معدل الـ HRV... المشهد يتوقف ليعكس هذه اللحظة، خذ نفساً عميقاً.',
              text_en: 'Biometrics detected an HRV crash... The architecture is halting to reflect this moment. Breathe.',
              trigger_reason: 'biometric_spike',
            }, true);
          }, 1200);
          return 31;
        }

        const fluctuation = Math.floor(Math.random() * 5) - 2;
        return Math.min(Math.max(prev + fluctuation, 60), 85);
      });
    }, 2000);

    return () => {
      if (hrvIntervalRef.current) clearInterval(hrvIntervalRef.current);
    };
  }, [appState, biometricsEnabled, handleNarrationBlock, judgeMode]);

  useEffect(() => {
    if (appState !== APP_STATES.ENDING) {
      judgeFinaleVoiceKeyRef.current = '';
      judgeFinaleStingKeyRef.current = '';
      setEndingActionsVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setEndingActionsVisible(true);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [appState, endingMessage, secretEndingKey]);

  const wakeUpUi = React.useCallback(() => {
    setIsIsolated(false);
    if (hideUiTimerRef.current) clearTimeout(hideUiTimerRef.current);
    hideUiTimerRef.current = setTimeout(() => {
      setIsIsolated(true);
    }, 7000);
  }, []);

  useEffect(() => {
    if (appState !== APP_STATES.STORY) {
      if (hideUiTimerRef.current) clearTimeout(hideUiTimerRef.current);
      setIsIsolated(false);
      return undefined;
    }

    wakeUpUi();

    window.addEventListener('mousemove', wakeUpUi);
    window.addEventListener('mousedown', wakeUpUi);
    window.addEventListener('touchstart', wakeUpUi, { passive: true });
    window.addEventListener('keydown', wakeUpUi);

    return () => {
      window.removeEventListener('mousemove', wakeUpUi);
      window.removeEventListener('mousedown', wakeUpUi);
      window.removeEventListener('touchstart', wakeUpUi);
      window.removeEventListener('keydown', wakeUpUi);
      if (hideUiTimerRef.current) clearTimeout(hideUiTimerRef.current);
    };
  }, [appState, wakeUpUi]);

  useEffect(() => {
    let active = true;

    if (!judgeMode || appState !== APP_STATES.ENDING) {
      setJudgeEndingSceneAccent('');
      return undefined;
    }

    const lastVisualMoment = findLastVisualMoment(storyMoments);
    if (!lastVisualMoment) {
      setJudgeEndingSceneAccent('');
      return undefined;
    }

    extractSceneAccentColor(lastVisualMoment)
      .then((accent) => {
        if (active) {
          setJudgeEndingSceneAccent(accent || '');
        }
      })
      .catch(() => {
        if (active) {
          setJudgeEndingSceneAccent('');
        }
      });

    return () => {
      active = false;
    };
  }, [appState, judgeMode, storyMoments]);

  useEffect(() => {
    if (!judgeMode || appState !== APP_STATES.ENDING || !voiceEnabled || !voiceSupported) {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined' || !window.speechSynthesis) {
      return undefined;
    }

    const voiceKey = `${judgeEndingLine}|${endingMessage}|${uiLanguage}`;
    if (judgeFinaleVoiceKeyRef.current === voiceKey) {
      return undefined;
    }
    judgeFinaleVoiceKeyRef.current = voiceKey;

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(judgeFinaleVoiceLine);
    utterance.lang = uiLanguage === 'en' ? 'en-US' : 'ar-EG';
    utterance.rate = 1.04;
    utterance.pitch = 1.02;

    const timer = window.setTimeout(() => {
      synth.cancel();
      synth.speak(utterance);
    }, 180);

    return () => {
      window.clearTimeout(timer);
      synth.cancel();
    };
  }, [
    appState,
    endingMessage,
    judgeEndingLine,
    judgeFinaleVoiceLine,
    judgeMode,
    uiLanguage,
    voiceEnabled,
    voiceSupported,
  ]);

  useEffect(() => {
    if (!judgeMode || appState !== APP_STATES.ENDING || !musicEnabled) {
      return undefined;
    }

    const stingKey = `${judgeEndingLine}|${endingMessage}`;
    if (judgeFinaleStingKeyRef.current === stingKey) {
      return undefined;
    }
    judgeFinaleStingKeyRef.current = stingKey;

    return playJudgeFinaleSting(
      buildJudgeFinaleStingProfile(
        emotionJourney[0],
        emotionJourney[emotionJourney.length - 1],
      ),
    );
  }, [appState, emotionJourney, endingMessage, judgeEndingLine, judgeMode, musicEnabled]);

  return (
    <div
      className={`app app--maraya ${judgeMode ? 'app--judge' : ''} ${spatialModeEnabled ? 'app--spatial' : ''}`}
      dir={uiLanguage === 'en' ? 'ltr' : 'rtl'}
      aria-hidden={settingsOpen ? "true" : null}
    >
      <StoryCanvas
        ref={canvasRef}
        mood={currentMood}
        isStale={imageStale}
        uiLanguage={uiLanguage}
        sceneAltText={currentScene?.visual_desc || currentScene?.visual_prompt || currentScene?.narration_ar || ''}
      />

      <div
        className={`app__overlay ${isIsolated && appState === APP_STATES.STORY ? 'app__overlay--hidden' : ''}`}
        onPointerDown={appState === APP_STATES.STORY ? handlePointerDown : undefined}
        onPointerUp={appState === APP_STATES.STORY ? handlePointerUp : undefined}
        onPointerCancel={appState === APP_STATES.STORY ? handlePointerUp : undefined}
        onPointerLeave={appState === APP_STATES.STORY ? handlePointerUp : undefined}
      >
        {appState === 'SPLASH' && (
          <SplashScreen
            uiLanguage={uiLanguage}
            title={uiText.title}
          />
        )}

        {appState === 'ONBOARDING' && (
          <OnboardingCarousel
            uiLanguage={uiLanguage}
            index={onboardingIndex}
            onNext={handleOnboardingNext}
            onBack={handleOnboardingBack}
            onSkip={handleOnboardingSkip}
          />
        )}

        {(appState === APP_STATES.STORY || appState === APP_STATES.ENDING) && (
          <div className="story-brand">
            <BrandMark compact />
          </div>
        )}

        {appState === APP_STATES.LANDING && !showSpaceUpload && (
          <EmotionPicker
            mode={storyMode}
            uiLanguage={uiLanguage}
            uiText={uiText}
            musicEnabled={musicEnabled}
            voiceEnabled={voiceEnabled}
            voiceSupported={voiceSupported}
            canStartStory={canStartStory}
            mirrorMemory={mirrorMemory}
            whisperInput={whisperInput}
            judgeMode={judgeMode}
            duoState={duoState}
            duoJoinCode={duoJoinCode}
            onModeChange={handleModeChange}
            onToggleMusic={handleToggleMusic}
            onToggleVoice={handleToggleVoice}
            onSelectEmotion={handleSelectEmotion}
            onUploadSpace={() => setShowSpaceUpload(true)}
            onStartJudgeJourney={handleStartJudgeJourney}
            onDuoNameChange={handleDuoNameChange}
            onDuoJoinCodeChange={handleDuoJoinCodeChange}
            onHostDuo={handleHostDuo}
            onJoinDuo={handleJoinDuo}
            onLeaveDuo={handleLeaveDuo}
          />
        )}

        {appState === APP_STATES.LANDING && showSpaceUpload && (
          <SpaceUpload
            uiLanguage={uiLanguage}
            uiText={uiText}
            onUpload={handleUploadSpace}
            onBack={() => setShowSpaceUpload(false)}
            disabled={!canStartStory}
          />
        )}

        {appState === APP_STATES.LOADING && (
          <LoadingMirror
            statusText={statusText}
            uiLanguage={uiLanguage}
            whisperText={lastWhisperText}
            whisperReflection={whisperInterpretation?.reflection}
            spaceReading={spaceReading}
            spaceMyth={spaceMyth}
          />
        )}

        {appState === APP_STATES.STORY && (
          <>
            <Transcript
              blocks={transcript}
              uiLanguage={uiLanguage}
              visible={true}
            />
            {currentScene && (
              <>
                <SceneRenderer
                  scene={currentScene}
                  uiLanguage={uiLanguage}
                  sceneWord={uiText.sceneWord}
                  onNarrationBlock={handleNarrationBlock}
                  onChoose={handleChoose}
                  onRedirect={duoState.role === 'guest' ? null : handleRedirect}
                  narrationSpeed={narrationSpeed}
                  isFinal={currentScene.is_final}
                  staleDroppedCount={staleDroppedCount}
                  version={lastAcceptedVersion}
                  judgeMode={judgeMode}
                  duoState={duoState}
                  mood={currentMood}
                  directorMove={directorMove}
                  onSetMusicVolume={setMusicVolume}
                />
                <SceneCardShare
                  scene={currentScene}
                  sceneNumber={currentScene.story_scene_number}
                  emotionColor={currentEmotionColor}
                  imageData={sceneImageData}
                  imageMimeType={sceneImageMime}
                  uiLanguage={uiLanguage}
                  isCatharsis={currentScene.is_final}
                />
              </>
            )}
          </>
        )}

        {appState === APP_STATES.ENDING && (
          <div
            className={`ending ${secretEndingKey ? 'ending--secret' : ''} ${judgeMode ? 'ending--judge' : ''}`}
            style={judgeMode ? { '--judge-ending-accent': judgeEndingAccent } : undefined}
          >
            {judgeMode && (
              <div className="ending__judge-hero">
                <div className="ending__judge-aura ending__judge-aura--outer" aria-hidden="true" />
                <div className="ending__judge-aura ending__judge-aura--inner" aria-hidden="true" />
                <p className="ending__judge-badge">
                  {uiLanguage === 'en' ? 'Judge Finale' : 'نهاية التحكيم'}
                </p>
                <h2 className="ending__judge-shift">{judgeEndingLine}</h2>
                <p className="ending__judge-caption">{judgeEndingCaption}</p>
              </div>
            )}
            {secretEndingKey && (
              <p className="ending__secret-badge">
                {uiLanguage === 'en'
                  ? `Secret Ending Unlocked: ${secretEndingKey.toUpperCase()}`
                  : `نهاية سرية: ${secretEndingKey.toUpperCase()}`}
              </p>
            )}
            <div className={`ending__afterglow ${endingActionsVisible ? 'ending__afterglow--settled' : ''}`}>
              <p className="ending__proof-title">{transformationSummary.proofTitle}</p>
              <h3 className={`ending__proof-line ${uiLanguage === 'ar' ? 'ending__proof-line--kinetic' : ''}`}>
                {uiLanguage === 'ar' ? (
                  <KineticText
                    text={transformationSummary.proofLine}
                    uiLanguage={uiLanguage}
                    className="ending__proof-line-text"
                    surface="afterglow"
                    emphasis="intense"
                  />
                ) : (
                  transformationSummary.proofLine
                )}
              </h3>
              <p className="ending__arc">{transformationSummary.arcLine}</p>
              {transformationSummary.originLine && (
                <p className={`ending__origin ${uiLanguage === 'ar' ? 'ending__origin--kinetic' : ''}`}>
                  {uiLanguage === 'ar' ? (
                    <KineticText
                      text={transformationSummary.originLine}
                      uiLanguage={uiLanguage}
                      className="ending__origin-text"
                      surface="afterglow"
                      emphasis="soft"
                    />
                  ) : (
                    transformationSummary.originLine
                  )}
                </p>
              )}
              <p className={`ending__afterglow-line ${uiLanguage === 'ar' ? 'ending__afterglow-line--kinetic' : ''}`}>
                {uiLanguage === 'ar' ? (
                  <KineticText
                    text={transformationSummary.afterglowLine}
                    uiLanguage={uiLanguage}
                    className="ending__afterglow-text"
                    surface="afterglow"
                    emphasis="soft"
                  />
                ) : (
                  transformationSummary.afterglowLine
                )}
              </p>
            </div>
            <p className="ending__message">{endingMessage}</p>
            <div
              className={`ending__actions-shell ${endingActionsVisible ? 'ending__actions-shell--visible' : 'ending__actions-shell--waiting'}`}
              aria-live="polite"
            >
              {!endingActionsVisible && (
                <p className="ending__pause-note">
                  {uiLanguage === 'en'
                    ? 'Let the afterglow settle before you carry it onward.'
                    : 'اترك أثر التحوّل يهدأ قليلًا قبل أن تحمله معك.'}
                </p>
              )}
              {endingActionsVisible && (
                <>
                  <StoryReelExport
                    moments={storyMoments}
                    uiLanguage={uiLanguage}
                    endingMessage={endingMessage}
                    emotionJourney={emotionJourney}
                    spaceReading={spaceReading}
                    spaceMyth={spaceMyth}
                  />
                  <EmotionJourneyMap
                    journey={emotionJourney}
                    uiLanguage={uiLanguage}
                    storyMoments={storyMoments}
                    endingMessage={endingMessage}
                    summary={transformationSummary}
                  />
                  <button
                    type="button"
                    className="ending__restart"
                    onClick={() => launchMarayaStoryReturn(marayaPath)}
                  >
                    {returnToJourneyLabel}
                  </button>
                  {canRestartStory ? (
                    <button type="button" className="ending__restart" onClick={handleRestart}>
                      {restartJourneyLabel || uiText.restart}
                    </button>
                  ) : (
                    <p className="ending__duo-note">
                      {uiLanguage === 'en'
                        ? `Waiting for ${duoState.partnerName || 'the host'} to start the next duo journey.`
                        : `بانتظار ${duoState.partnerName || 'المضيف'} لبدء الرحلة الثنائية التالية.`}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <ToastContainer
          toasts={[
            ...toasts,
            ...(!isConnected ? [{
              id: 'connection-lost',
              type: 'warning',
              message: uiText.reconnecting,
              duration: 10000,
            }] : []),
          ]}
          onDismiss={dismissToast}
        />

        {!(judgeMode && appState === APP_STATES.LANDING) && (
          <div className="audio-hud">
            {biometricsEnabled && (
              <div
                className={`audio-hud__btn ${hrvValue < 40 ? 'audio-hud__btn--warning' : ''}`}
                style={{ cursor: 'default', pointerEvents: 'none', gap: '0.4rem' }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                aria-label={uiLanguage === 'en' ? `Heart Rate Variability is at ${hrvValue} milliseconds` : `معدل تقلب نبضات القلب عند ${hrvValue} ملي ثانية`}
              >
                <span aria-hidden="true">HRV: {hrvValue}ms {hrvValue < 40 ? '🔴' : '🟢'}</span>
              </div>
            )}
            <button
              type="button"
              className="audio-hud__btn"
              onClick={handleOpenSettings}
              aria-label={uiLanguage === 'en' ? 'Open settings' : 'فتح الإعدادات'}
            >
              {uiLanguage === 'en' ? 'Settings' : 'الإعدادات'}
            </button>
            <button
              type="button"
              className={`audio-hud__btn cursor-pointer ${musicEnabled ? 'audio-hud__btn--on' : ''}`}
              onClick={handleToggleMusic}
              aria-label={`${uiText.musicLabel}: ${musicEnabled ? uiText.musicOn : uiText.musicOff}`}
            >
              {uiText.musicLabel}: {musicEnabled ? uiText.musicOn : uiText.musicOff}
            </button>
            <button
              type="button"
              className={`audio-hud__btn cursor-pointer ${voiceEnabled ? 'audio-hud__btn--on' : ''}`}
              onClick={handleToggleVoice}
              disabled={!voiceSupported}
              title={!voiceSupported ? uiText.voiceUnavailable : ''}
              aria-label={`${uiText.voiceLabel}: ${voiceEnabled ? uiText.voiceOn : uiText.voiceOff}`}
            >
              {uiText.voiceLabel}: {voiceEnabled ? uiText.voiceOn : uiText.voiceOff}
            </button>
          </div>
        )}

        <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {imageAnnouncement}
        </div>

        <SettingsSheet
          open={settingsOpen}
          uiLanguage={uiLanguage}
          musicEnabled={musicEnabled}
          voiceEnabled={voiceEnabled}
          onToggleMusic={handleToggleMusic}
          onToggleVoice={handleToggleVoice}
          biometricsEnabled={biometricsEnabled}
          onToggleBiometrics={handleToggleBiometrics}
          spatialModeEnabled={spatialModeEnabled}
          onToggleSpatialMode={handleToggleSpatialMode}
          narrationSpeed={narrationSpeed}
          onNarrationSpeedChange={setNarrationSpeed}
          onClose={handleCloseSettings}
          onReset={handleResetSettings}
        />
      </div>
    </div>
  );
}
