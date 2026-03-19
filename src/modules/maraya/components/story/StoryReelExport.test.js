import { describe, expect, it, vi } from 'vitest';
import { buildJourneyFileStem, buildShareMeta } from './StoryReelExport.jsx';

describe('buildJourneyFileStem', () => {
  it('builds a readable per-journey filename stem', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T21:45:00.000Z'));

    const stem = buildJourneyFileStem({
      emotionJourney: ['confusion', 'hope'],
      endingMessage: 'You reached a bright threshold the mirror will remember.',
    });

    expect(stem).toBe(
      'maraya-confusion-to-hope-you-reached-a-bright-20260308-2145',
    );

    vi.useRealTimers();
  });
});

describe('buildShareMeta', () => {
  it('builds proof-first share metadata and a copy-ready caption', () => {
    const meta = buildShareMeta({
      endingMessage: 'The threshold opened and stayed open.',
      emotionJourney: ['confusion', 'hope'],
      uiLanguage: 'en',
      spaceMyth: 'A threshold that remembers who crosses it.',
    });

    expect(meta.title).toBe('From confusion to hope | Maraya');
    expect(meta.headline).toBe('What entered as confusion left as hope.');
    expect(meta.reelTitle).toBe('What entered as confusion left as hope.');
    expect(meta.caption).toContain('From confusion to hope');
    expect(meta.caption).toContain('A threshold that remembers who crosses it.');
    expect(meta.captionActionLabel).toBe('Copy caption');
  });
});
