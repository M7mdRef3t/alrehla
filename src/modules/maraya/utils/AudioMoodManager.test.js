import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioMoodManager } from './AudioMoodManager.js';

class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
  }

  resume() {
    return Promise.resolve();
  }

  decodeAudioData() {
    return Promise.resolve({});
  }

  createBufferSource() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      buffer: null,
      loop: false,
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 0,
      },
      connect: vi.fn(),
    };
  }

  close() {
    return Promise.resolve();
  }
}

describe('AudioMoodManager', () => {
  let manager;

  beforeEach(() => {
    global.window = {
      AudioContext: MockAudioContext,
      webkitAudioContext: MockAudioContext,
    };
    global.fetch = vi.fn();

    manager = new AudioMoodManager();
  });

  it('initializes with empty state', () => {
    expect(manager.context).toBeNull();
    expect(manager.currentMood).toBeNull();
    expect(manager.isUnlocked).toBe(false);
  });

  it('creates audio context on unlock', () => {
    manager.unlock();
    expect(manager.context).toBeInstanceOf(MockAudioContext);
    expect(manager.isUnlocked).toBe(true);
  });

  it('loads mood into buffer cache', async () => {
    manager.unlock();
    const moodId = 'test-mood';
    const url = 'http://example.com/test.mp3';

    global.fetch.mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await manager.loadMood(moodId, url);

    expect(manager.buffers.has(moodId)).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(url, expect.any(Object));
  });

  it('sets mood and starts playback when buffer exists', async () => {
    manager.unlock();
    const moodId = 'test-mood';
    manager.buffers.set(moodId, {});

    await manager.setMood(moodId);

    expect(manager.currentMood).toBe(moodId);
    expect(manager.currentSource).toBeTruthy();
    expect(manager.currentGain).toBeTruthy();
  });

  it('stops active playback', () => {
    manager.unlock();
    manager.currentSource = { stop: vi.fn() };
    manager.currentGain = {};
    manager.currentMood = 'playing';

    manager.stop();

    expect(manager.currentSource).toBeNull();
    expect(manager.currentGain).toBeNull();
    expect(manager.currentMood).toBeNull();
  });

  it('disposes and resets internal state', () => {
    manager.unlock();
    const closeSpy = vi.spyOn(manager.context, 'close');

    manager.dispose();

    expect(closeSpy).toHaveBeenCalled();
    expect(manager.context).toBeNull();
    expect(manager.buffers.size).toBe(0);
    expect(manager.moodUrls.size).toBe(0);
    expect(manager.loading.size).toBe(0);
    expect(manager.isUnlocked).toBe(false);
  });
});