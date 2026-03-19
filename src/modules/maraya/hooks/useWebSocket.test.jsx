import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useWebSocket from './useWebSocket';

vi.mock('@/services/supabaseClient', () => ({
  supabase: null,
}));

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn(async (input, init = {}) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.includes('/api/maraya/memory')) {
        return {
          ok: true,
          json: async () => ({ success: true, snapshot: { rememberedCount: 2 } }),
        };
      }

      if (url.includes('/api/maraya/story/start') && method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            emotion: 'hope',
            scenes: [
              {
                scene_id: 'scene_1',
                narration_ar: 'A scene appears.',
                image_prompt: '',
                audio_mood: 'ambient_calm',
                interleaved_blocks: [{ kind: 'narration', text_ar: 'A scene appears.' }],
                choices: [{ text_ar: 'Continue', emotion_shift: 'hope' }],
                story_scene_number: 1,
                story_total_scenes: 3,
                is_final: false,
              },
            ],
            conversationHistory: [{ role: 'user', parts: [{ text: 'start' }] }],
            whisperInterpretation: null,
            memorySnapshot: { rememberedCount: 2 },
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWebSocket({ query: { userId: 'u1', sessionId: 's1' } }));
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should connect successfully and refresh mirror memory', async () => {
    const { result } = renderHook(() => useWebSocket({ query: { userId: 'u1', sessionId: 's1' } }));
    const memoryHandler = vi.fn();

    act(() => {
      result.current.on('memory_snapshot', memoryHandler);
      result.current.connect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(memoryHandler).toHaveBeenCalledWith(
        expect.objectContaining({ snapshot: { rememberedCount: 2 } }),
      );
    });
  });

  it('should start a story through the API transport and emit a scene', async () => {
    const { result } = renderHook(() => useWebSocket({ query: { userId: 'u1', sessionId: 's1' } }));
    const sceneHandler = vi.fn();

    act(() => {
      result.current.on('scene', sceneHandler);
    });

    act(() => {
      result.current.sendMessage('start_story', {
        emotion: 'hope',
        output_mode: 'judge_en',
      });
    });

    await waitFor(() => {
      expect(sceneHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: expect.objectContaining({ scene_id: 'scene_1' }),
        }),
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/maraya/story/start',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
