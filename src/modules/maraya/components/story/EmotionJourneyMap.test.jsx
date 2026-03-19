import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmotionJourneyMap from './EmotionJourneyMap.jsx';

describe('EmotionJourneyMap', () => {
  it('renders the textual catharsis summary even when the journey path is too short for a chart', () => {
    render(
      <EmotionJourneyMap
        journey={['hope']}
        uiLanguage="en"
        endingMessage="The light stayed."
        storyMoments={[{ symbolicAnchor: 'the open window' }]}
      />,
    );

    expect(screen.getByText('Your Catharsis Map')).not.toBeNull();
    expect(screen.getByText('Start')).not.toBeNull();
    expect(screen.getByText('Arrival')).not.toBeNull();
    expect(screen.getAllByText('the open window')).toHaveLength(2);
    expect(screen.getByText('The light stayed.')).not.toBeNull();
    expect(document.querySelector('.emotion-journey-map__canvas')).toBeNull();
  });

  it('renders the mythic thread when symbolic continuity is present', () => {
    render(
      <EmotionJourneyMap
        journey={['confusion', 'hope']}
        uiLanguage="en"
        endingMessage="The corridor opened."
        summary={{
          fromEmotion: 'confusion',
          toEmotion: 'hope',
          arcLine: 'It opened in confusion and settled in hope.',
          finalLine: 'The corridor opened.',
          turningPoints: [{ kind: 'symbol', label: 'the open window' }],
          mythicLine: 'A threshold that remembers who crosses it.',
        }}
        storyMoments={[
          { symbolicAnchor: 'fragile clarity', carriedArtifact: 'mirror shard' },
          { symbolicAnchor: 'stored warmth', carriedArtifact: 'glowing ember' },
        ]}
      />,
    );

    expect(screen.getByText('Mythic Thread')).not.toBeNull();
    expect(screen.getByText((_, element) => element?.textContent === 'A threshold that remembers who crosses it.')).not.toBeNull();
    expect(screen.getByText('fragile clarity')).not.toBeNull();
    expect(screen.getByText('glowing ember')).not.toBeNull();
  });
});
