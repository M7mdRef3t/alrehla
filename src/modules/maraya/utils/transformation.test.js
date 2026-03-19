import { describe, expect, it } from 'vitest';
import { buildTransformationSummary } from './transformation.js';

describe('buildTransformationSummary', () => {
  it('builds proof and arc copy from the emotional journey', () => {
    const summary = buildTransformationSummary({
      emotionJourney: ['confusion', 'anxiety', 'hope'],
      endingMessage: 'The threshold opened and stayed open.',
      whisperText: 'I feel lost, but I still want the light.',
      uiLanguage: 'en',
    });

    expect(summary.transformationLine).toBe('From confusion to hope');
    expect(summary.proofLine).toBe('What entered as confusion left as hope.');
    expect(summary.arcLine).toContain('moved through anxiety');
    expect(summary.afterglowLine).toBe('The whisper that opened this ritual is still glowing inside the ending.');
    expect(summary.finalLine).toBe('The threshold opened and stayed open.');
  });

  it('collects turning points from symbolic story moments when available', () => {
    const summary = buildTransformationSummary({
      emotionJourney: ['anxiety', 'hope'],
      storyMoments: [
        { symbolicAnchor: 'a cracked mirror shard' },
        { carriedArtifact: 'a glowing ember' },
      ],
      uiLanguage: 'en',
    });

    expect(summary.turningPoints).toEqual([
      { kind: 'symbol', label: 'a cracked mirror shard' },
      { kind: 'symbol', label: 'a glowing ember' },
    ]);
  });

  it('prefers mythic space reading when building the afterglow origin', () => {
    const summary = buildTransformationSummary({
      emotionJourney: ['wonder', 'hope'],
      spaceReading: 'A calm room with late light.',
      spaceMyth: 'A threshold that remembers who crosses it.',
      uiLanguage: 'en',
    });

    expect(summary.afterglowLine).toBe('The room now lingers as a myth your inner map can return to.');
    expect(summary.originLine).toBe('A threshold that remembers who crosses it.');
  });
});
