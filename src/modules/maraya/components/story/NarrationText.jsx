import React, { useState, useEffect, useRef, useMemo } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion.js';
import KineticText from '../ui/KineticText.jsx';

/**
 * NarrationText - interleaved RTL/LTR stream renderer.
 * Upgraded to use cinematic soft-fading transitions instead of rigid typewriters.
 */
const KIND_LABELS = {
  ar: {
    narration: 'السرد',
    visual: 'الصورة',
    reflection: 'الصدى',
  },
  en: {
    narration: 'Narration',
    visual: 'Visual',
    reflection: 'Reflection',
  },
};

const RITUAL_PHASE_LABELS = {
  ar: {
    invocation: 'الاستحضار',
    reflection: 'الانعكاس',
    becoming: 'التشكّل',
  },
  en: {
    invocation: 'Invocation',
    reflection: 'Reflection',
    becoming: 'Becoming',
  },
};

function normalizeBlocks(blocks, fallbackText) {
  if (Array.isArray(blocks) && blocks.length > 0) {
    const normalized = blocks
      .map((block) => {
        if (!block || typeof block !== 'object') return null;
        const kind = ['narration', 'visual', 'reflection'].includes(block.kind) ? block.kind : 'narration';
        const textAr = typeof block.text_ar === 'string' ? block.text_ar.trim() : '';
        if (!textAr) return null;
        return { kind, text_ar: textAr };
      })
      .filter(Boolean)
      .slice(0, 5);

    if (normalized.length > 0) return normalized;
  }

  const fallback = typeof fallbackText === 'string' ? fallbackText.trim() : '';
  if (!fallback) return [];
  return [{ kind: 'narration', text_ar: fallback }];
}

export default function NarrationText({
  text,
  blocks,
  uiLanguage = 'ar',
  onComplete,
  onBlockStart,
  speed = 45,
  mood = 'hope',
  ritualPhase = '',
  directorMovePhase = '',
}) {
  const prefersReducedMotion = useReducedMotion();
  const normalizedBlocks = useMemo(() => normalizeBlocks(blocks, text), [blocks, text]);
  const labels = KIND_LABELS[uiLanguage] || KIND_LABELS.en;

  const [isComplete, setIsComplete] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [activeWordCount, setActiveWordCount] = useState(0);

  const timerRef = useRef(null);
  const completionFiredRef = useRef(false);

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimers();
    setIsComplete(false);
    setActiveBlockIndex(0);
    setActiveWordCount(0);
    completionFiredRef.current = false;

    if (!normalizedBlocks.length) {
      setIsComplete(true);
      if (!completionFiredRef.current) {
        completionFiredRef.current = true;
        onComplete?.();
      }
      return () => { };
    }

    const finishAll = () => {
      setIsComplete(true);
      if (!completionFiredRef.current) {
        completionFiredRef.current = true;
        onComplete?.();
      }
    };

    const playBlock = (blockIndex) => {
      const block = normalizedBlocks[blockIndex];
      if (!block) {
        finishAll();
        return;
      }

      setActiveBlockIndex(blockIndex);
      setActiveWordCount(0);

      onBlockStart?.({
        index: blockIndex,
        kind: block.kind,
        text_ar: block.text_ar,
      });

      const words = block.text_ar.split(' ');
      const totalWords = words.length;

      let speedMultiplier = 1;
      const normalizedMood = (mood || '').toLowerCase();
      if (['anxiety', 'anger', 'confusion'].includes(normalizedMood)) {
        speedMultiplier = 0.6;
      } else if (['hope', 'wonder', 'nostalgia', 'loneliness'].includes(normalizedMood)) {
        speedMultiplier = 1.4;
      }

      const baseSpeed = Math.max(30, speed + (totalWords > 30 ? -10 : 0));
      const intervalMs = prefersReducedMotion ? 1 : Math.round(baseSpeed * speedMultiplier);

      timerRef.current = setInterval(() => {
        setActiveWordCount((prev) => {
          const next = prev + 1;
          if (next >= totalWords) {
            clearInterval(timerRef.current);

            setTimeout(() => {
              if (blockIndex >= normalizedBlocks.length - 1) {
                setActiveBlockIndex(normalizedBlocks.length);
                finishAll();
              } else {
                playBlock(blockIndex + 1);
              }
            }, prefersReducedMotion ? 0 : 600);
          }
          return next;
        });
      }, intervalMs);
    };

    playBlock(0);

    return () => {
      clearTimers();
    };
  }, [normalizedBlocks, speed, onComplete, onBlockStart, prefersReducedMotion, mood]);

  const handleClick = () => {
    if (!isComplete && normalizedBlocks.length > 0) {
      clearTimers();
      setActiveBlockIndex(normalizedBlocks.length);
      setIsComplete(true);
      if (!completionFiredRef.current) {
        completionFiredRef.current = true;
        onComplete?.();
      }
    }
  };

  const activeBlock = normalizedBlocks[activeBlockIndex];
  const completedBlocks = normalizedBlocks.slice(0, activeBlockIndex);
  const displayBlock = activeBlock || (completedBlocks.length > 0 ? completedBlocks[completedBlocks.length - 1] : null);
  const phaseLabel = RITUAL_PHASE_LABELS[uiLanguage]?.[ritualPhase] || RITUAL_PHASE_LABELS.en[ritualPhase] || '';
  const narrationClassName = [
    'narration-text',
    uiLanguage === 'ar' ? 'narration-text--arabic' : 'narration-text--english',
    ritualPhase ? `narration-text--phase-${ritualPhase}` : '',
    directorMovePhase ? `narration-text--director-${directorMovePhase}` : '',
    `narration-text--mood-${String(mood || 'hope').replace(/_/g, '-')}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={narrationClassName} onClick={handleClick} aria-live="polite" aria-atomic="false">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <filter id="ink-spread">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" mode="normal" />
        </filter>
      </svg>

      <div className="narration-text__stack" style={{ transition: 'all 0.5s var(--ease-spring)' }}>
        {phaseLabel && (
          <div className="narration-text__phase-echo" aria-hidden="true">
            {uiLanguage === 'ar' ? (
              <KineticText
                text={phaseLabel}
                uiLanguage={uiLanguage}
                className="narration-text__phase-echo-text"
                surface="scene"
                emphasis="soft"
              />
            ) : (
              <span className="narration-text__phase-echo-text">{phaseLabel}</span>
            )}
          </div>
        )}

        {displayBlock && (
          <p
            key={activeBlock ? `active_${activeBlockIndex}` : `last_${completedBlocks.length}`}
            className={`narration-text__block narration-text__block--${displayBlock.kind}`}
            style={{
              animation: 'fadeInUp 0.8s var(--ease-spring)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span className="narration-text__label">
              {uiLanguage === 'ar' ? (
                <KineticText
                  text={labels[displayBlock.kind] || labels.narration}
                  uiLanguage={uiLanguage}
                  className="narration-text__label-text"
                  surface="scene"
                  emphasis="soft"
                />
              ) : (
                labels[displayBlock.kind] || labels.narration
              )}
            </span>
            <span
              className="narration-text__content"
              style={{ filter: 'url(#ink-spread)', padding: '0.5rem' }}
            >
              {activeBlock ? (
                displayBlock.text_ar.split(' ').map((word, wIdx) => (
                  <React.Fragment key={wIdx}>
                    <span
                      style={{
                        opacity: wIdx < activeWordCount ? 1 : 0.05,
                        transform: wIdx < activeWordCount ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.5)',
                        fontVariationSettings: wIdx < activeWordCount ? '"wght" var(--font-wght)' : '"wght" 100',
                        transition: 'opacity 0.8s ease-out, transform 0.9s cubic-bezier(0.19, 1, 0.22, 1), font-variation-settings 1.2s ease',
                        display: 'inline-block',
                      }}
                    >
                      {word}
                    </span>{' '}
                  </React.Fragment>
                ))
              ) : (
                displayBlock.text_ar
              )}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
