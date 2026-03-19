import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import NarrationText from './NarrationText.jsx';
import ChoiceButtons from './ChoiceButtons.jsx';

const REDIRECT_COMMANDS = [
  { id: 'darker', icon: '🔥', label: { ar: 'أعمق', en: 'Darker' }, intensity: 0.55 },
  { id: 'hope', icon: '✨', label: { ar: 'أمل أكثر', en: 'More Hope' }, intensity: 0.6 },
  { id: 'nightmare', icon: '😱', label: { ar: 'كابوس', en: 'Nightmare' }, intensity: 0.85 },
  { id: 'witty', icon: '😄', label: { ar: 'أخف وأذكى', en: 'Lighter' }, intensity: 0.7 },
  { id: 'cinematic', icon: '🎬', label: { ar: 'أبطأ وأكثر سينما', en: 'More Cinema' }, intensity: 0.65 },
  { id: 'fast', icon: '⚡', label: { ar: 'إيقاع أسرع', en: 'Faster' }, intensity: 0.75 },
];

const RITUAL_PHASE_LABELS = {
  invocation: { en: 'Invocation', ar: 'الاستحضار' },
  reflection: { en: 'Reflection', ar: 'الانعكاس' },
  becoming: { en: 'Becoming', ar: 'التشكّل' },
};

function getDuoMessage(uiLanguage, duoState) {
  if (!duoState || duoState.role === 'solo') return '';
  if (duoState.status === 'reconnecting') {
    return uiLanguage === 'en'
      ? `Waiting for ${duoState.partnerName || 'your partner'} to reconnect.`
      : `بانتظار ${duoState.partnerName || 'شريكك'} ليعيد الاتصال.`;
  }
  if (duoState.mismatch) {
    return uiLanguage === 'en'
      ? 'Votes are split. Align on one path to move forward.'
      : 'الأصوات منقسمة. اتفقوا على مسار واحد للمتابعة.';
  }
  if (duoState.selectedChoiceIndex != null && duoState.readyCount < duoState.requiredVotes) {
    return uiLanguage === 'en'
      ? `Your vote is in. Waiting for ${duoState.partnerName || 'your partner'}.`
      : `تم تسجيل صوتك. بانتظار ${duoState.partnerName || 'شريكك'}.`;
  }
  if (duoState.readyCount > 0 && duoState.selectedChoiceIndex == null) {
    return uiLanguage === 'en'
      ? `${duoState.partnerName || 'Your partner'} has voted.`
      : `قام ${duoState.partnerName || 'شريكك'} بالتصويت.`;
  }
  return uiLanguage === 'en'
    ? 'Choose together to unlock the next scene.'
    : 'اختارا معًا لفتح المشهد التالي.';
}

function getDirectorMoveCopy(uiLanguage, directorMove) {
  if (!directorMove?.command) return null;

  const isEn = uiLanguage === 'en';
  const command = directorMove.command;
  const phase = directorMove.phase || 'queued';

  if (isEn) {
    const statusByPhase = {
      queued: `The director is preparing a move toward "${command}".`,
      guiding: directorMove.guidance || `Holding the breath before the move toward "${command}".`,
      executing: `The scene is bending live toward "${command}".`,
      acknowledged: `The redirect has been accepted. The new cadence is forming now.`,
      arrived: `The move landed. The architecture now carries "${command}".`,
    };
    return {
      eyebrow: 'Directing Move',
      title: command,
      body: statusByPhase[phase] || statusByPhase.queued,
      intensity: `Intensity ${Math.round((directorMove.intensity || 0) * 100)}%`,
    };
  }

  const statusByPhase = {
    queued: `يستعد المخرج لتحريك المشهد نحو "${command}".`,
    guiding: directorMove.guidance || `يتم احتواء الإيقاع قبل أن ينحني المشهد نحو "${command}".`,
    executing: `ينعطف المشهد الآن حيًا نحو "${command}".`,
    acknowledged: 'تم اعتماد التحويل. الإيقاع الجديد يتشكل الآن.',
    arrived: `وصلت الحركة. العمارة الآن تحمل أثر "${command}".`,
  };

  return {
    eyebrow: 'حركة إخراجية',
    title: command,
    body: statusByPhase[phase] || statusByPhase.queued,
    intensity: `الحدة ${Math.round((directorMove.intensity || 0) * 100)}%`,
  };
}

export default function SceneRenderer({
  scene,
  onChoose,
  isFinal,
  onNarrationBlock,
  onRedirect,
  narrationSpeed = 45,
  uiLanguage = 'ar',
  sceneWord = 'المشهد',
  staleDroppedCount = 0,
  version = 0,
  judgeMode = false,
  duoState = null,
  mood = 'hope',
  directorMove = null,
  onSetMusicVolume,
}) {
  const [showChoices, setShowChoices] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [showDirectorMove, setShowDirectorMove] = useState(false);

  const revealTimerRef = useRef(null);
  const debugTimerRef = useRef(null);
  const interruptTimerRef = useRef(null);
  const finalLabel = uiLanguage === 'en' ? '— End of Journey —' : '— نهاية الرحلة —';

  const progressCurrent = Number.isFinite(scene?.story_scene_number)
    ? scene.story_scene_number
    : (Number.isFinite(scene?.scene_index) ? scene.scene_index + 1 : null);

  const progressTotal = Number.isFinite(scene?.story_total_scenes)
    ? scene.story_total_scenes
    : (Number.isFinite(scene?.total_scenes) ? scene.total_scenes : null);

  const voteCounts = useMemo(() => {
    const next = {};
    for (const vote of duoState?.votes || []) {
      if (typeof vote.choiceIndex === 'number') {
        next[vote.choiceIndex] = (next[vote.choiceIndex] || 0) + 1;
      }
    }
    return next;
  }, [duoState?.votes]);

  const redirectCommands = useMemo(() => (
    judgeMode
      ? REDIRECT_COMMANDS.filter((cmd) => ['darker', 'hope', 'cinematic'].includes(cmd.id))
      : REDIRECT_COMMANDS
  ), [judgeMode]);

  const directorCopy = useMemo(
    () => getDirectorMoveCopy(uiLanguage, directorMove),
    [directorMove, uiLanguage],
  );

  const ritualPhaseLabel = useMemo(() => {
    const key = scene?.ritual_phase;
    if (!key) return '';
    return RITUAL_PHASE_LABELS[key]?.[uiLanguage] || RITUAL_PHASE_LABELS[key]?.en || key;
  }, [scene?.ritual_phase, uiLanguage]);

  const mythicEcho = useMemo(() => String(scene?.mythic_echo || '').trim(), [scene?.mythic_echo]);

  useEffect(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    setShowChoices(false);
  }, [scene?.scene_id]);

  useEffect(() => () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (debugTimerRef.current) clearTimeout(debugTimerRef.current);
  }, []);

  useEffect(() => {
    if (version > 0) {
      setShowDebug(true);
      if (debugTimerRef.current) clearTimeout(debugTimerRef.current);
      debugTimerRef.current = setTimeout(() => {
        setShowDebug(false);
      }, 3000);
    }
  }, [version]);

  useEffect(() => {
    if (!directorMove?.command) {
      setShowDirectorMove(false);
      return undefined;
    }

    setShowDirectorMove(true);

    if (directorMove.phase !== 'arrived') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowDirectorMove(false);
    }, 3600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [directorMove?.arrivedAt, directorMove?.command, directorMove?.phase]);

  const resetInterrupt = useCallback(() => {
    if (showInterrupt) {
      setShowInterrupt(false);
      if (onSetMusicVolume) onSetMusicVolume(1.0, 2.0);
    }
    if (interruptTimerRef.current) clearTimeout(interruptTimerRef.current);

    interruptTimerRef.current = setTimeout(() => {
      if (!isFinal) {
        setShowInterrupt(true);
        if (onSetMusicVolume) onSetMusicVolume(0.12, 4.0);
      }
    }, 15000);
  }, [showInterrupt, isFinal, onSetMusicVolume]);

  useEffect(() => {
    window.addEventListener('mousemove', resetInterrupt);
    window.addEventListener('keydown', resetInterrupt);
    window.addEventListener('touchstart', resetInterrupt);
    resetInterrupt();

    return () => {
      window.removeEventListener('mousemove', resetInterrupt);
      window.removeEventListener('keydown', resetInterrupt);
      window.removeEventListener('touchstart', resetInterrupt);
      if (interruptTimerRef.current) clearTimeout(interruptTimerRef.current);
    };
  }, [resetInterrupt]);

  const handleNarrationComplete = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
    }
    revealTimerRef.current = setTimeout(() => {
      setShowChoices(true);
      revealTimerRef.current = null;
    }, 800);
  }, []);

  if (!scene) return null;

  return (
    <div className={`scene-renderer scene-renderer--${String(mood || 'ambient_calm').replace(/_/g, '-')}`}>
      {progressCurrent && progressTotal ? (
        <div className="scene-progress">{sceneWord} {progressCurrent}/{progressTotal}</div>
      ) : null}

      <div className="scene-renderer__ritual-strip">
        {ritualPhaseLabel && (
          <span className="scene-renderer__ritual-chip scene-renderer__ritual-chip--phase">
            {ritualPhaseLabel}
          </span>
        )}
        {scene?.symbolic_anchor && (
          <span className="scene-renderer__ritual-chip">
            {scene.symbolic_anchor}
          </span>
        )}
        {scene?.carried_artifact && (
          <span className="scene-renderer__ritual-chip scene-renderer__ritual-chip--artifact">
            {scene.carried_artifact}
          </span>
        )}
      </div>

      {mythicEcho && (
        <div className="scene-renderer__mythic-thread" aria-label={uiLanguage === 'en' ? 'Mythic thread' : 'الخيط الأسطوري'}>
          <p className="scene-renderer__mythic-eyebrow">
            {uiLanguage === 'en' ? 'Mythic Thread' : 'الخيط الأسطوري'}
          </p>
          <p className="scene-renderer__mythic-copy">{mythicEcho}</p>
        </div>
      )}

      {!isFinal && onRedirect && (
        <div className={`live-redirect-shell ${judgeMode ? 'live-redirect-shell--judge' : ''}`}>
          <div className="live-redirect-shell__header">
            <p className="live-redirect-shell__heading">
              {uiLanguage === 'en' ? 'Directing Moves' : 'حركات الإخراج'}
            </p>
            <p className="live-redirect-shell__subheading">
              {judgeMode
                ? (uiLanguage === 'en'
                  ? 'Shift the scene live while it is still unfolding.'
                  : 'حرّك المشهد حيًا وهو ما يزال ينكشف.')
                : (uiLanguage === 'en'
                  ? 'Bend the scene without breaking its emotional continuity.'
                  : 'حرّك المشهد من دون كسر استمراريته العاطفية.')}
            </p>
          </div>

          <div className="live-redirect-bar">
            {redirectCommands.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                className={`live-redirect-btn ${judgeMode ? 'live-redirect-btn--judge' : ''} ${directorMove?.command === cmd.label.en ? 'live-redirect-btn--active' : ''}`}
                onClick={() => onRedirect(cmd.label.en, cmd.intensity)}
                title={cmd.label[uiLanguage]}
                aria-label={cmd.label[uiLanguage]}
              >
                <span className="live-redirect-btn__icon" aria-hidden="true">{cmd.icon}</span>
                <span className="live-redirect-btn__label">{cmd.label[uiLanguage]}</span>
              </button>
            ))}
          </div>

          {directorCopy && showDirectorMove && (
            <div className={`director-move-card director-move-card--${directorMove?.phase || 'queued'}`}>
              <p className="director-move-card__eyebrow">{directorCopy.eyebrow}</p>
              <div className="director-move-card__row">
                <h3 className="director-move-card__title">{directorCopy.title}</h3>
                <span className="director-move-card__intensity">{directorCopy.intensity}</span>
              </div>
              <p className="director-move-card__body">{directorCopy.body}</p>
            </div>
          )}
        </div>
      )}

      <NarrationText
        blocks={scene.interleaved_blocks}
        text={scene.narration_ar}
        uiLanguage={uiLanguage}
        onBlockStart={onNarrationBlock}
        onComplete={handleNarrationComplete}
        speed={narrationSpeed}
        mood={mood}
        ritualPhase={scene.ritual_phase}
        directorMovePhase={directorMove?.phase || ''}
      />

      {!isFinal && duoState?.role !== 'solo' && (
        <div className={`duo-scene-status ${duoState?.mismatch ? 'duo-scene-status--warning' : ''}`}>
          {getDuoMessage(uiLanguage, duoState)}
        </div>
      )}

      {!isFinal ? (
        <ChoiceButtons
          choices={scene.choices}
          uiLanguage={uiLanguage}
          onChoose={onChoose}
          visible={showChoices}
          selectedIndex={duoState?.selectedChoiceIndex ?? null}
          voteCounts={voteCounts}
        />
      ) : (
        <div className={`scene-final ${showChoices ? 'scene-final--visible' : ''}`}>
          <p className="scene-final__text">{finalLabel}</p>
        </div>
      )}

      <div className={`debug-tag ${showDebug ? 'debug-tag--visible' : ''}`}>
        <span className="debug-tag__version">v{version}</span>
        {staleDroppedCount > 0 && (
          <span className="debug-tag__stale"> • stale_dropped: {staleDroppedCount}</span>
        )}
      </div>

      <div className={`biometric-interrupt ${showInterrupt ? 'biometric-interrupt--visible' : ''}`} aria-hidden="true">
        {uiLanguage === 'en' ? 'Are you still here...?' : 'هل أنت لا تزال هنا...؟'}
      </div>
    </div>
  );
}
