import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SceneRenderer from './SceneRenderer.jsx';

vi.mock('./NarrationText.jsx', () => ({
  default: () => <div>Narration</div>,
}));

vi.mock('./ChoiceButtons.jsx', () => ({
  default: () => <div>Choices</div>,
}));

describe('SceneRenderer', () => {
  it('renders directing UI with ritual chips and active move feedback', () => {
    render(
      <SceneRenderer
        scene={{
          scene_id: 'scene_1',
          story_scene_number: 1,
          story_total_scenes: 3,
          ritual_phase: 'invocation',
          symbolic_anchor: 'fragile clarity',
          carried_artifact: 'mirror shard',
          mythic_echo: 'The room remembers every threshold you survive.',
          choices: [{ text_ar: 'Open', emotion_shift: 'hope' }],
        }}
        onChoose={vi.fn()}
        onNarrationBlock={vi.fn()}
        onRedirect={vi.fn()}
        uiLanguage="en"
        directorMove={{
          command: 'More Hope',
          intensity: 0.6,
          phase: 'executing',
        }}
      />,
    );

    expect(screen.getByText('Directing Moves')).not.toBeNull();
    expect(screen.getByText('Invocation')).not.toBeNull();
    expect(screen.getByText('fragile clarity')).not.toBeNull();
    expect(screen.getByText('mirror shard')).not.toBeNull();
    expect(screen.getByText('The room remembers every threshold you survive.')).not.toBeNull();
    expect(screen.getAllByText('More Hope').length).toBeGreaterThan(0);
  });
});
