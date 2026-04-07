import { logger } from "../../../services/logger";
/**
 * Audio mood crossfade system.
 * Manages ambient background audio that changes based on story mood.
 */

const FADE_DURATION = 2; // seconds

export class AudioMoodManager {
  constructor() {
    this.context = null;
    this.currentSource = null;
    this.currentGain = null;
    this.currentMood = null;
    this.buffers = new Map();
    this.moodUrls = new Map();
    this.loading = new Map();
    this.pendingMood = null;
    this.isUnlocked = false;
  }

  // Unlock audio context on first user interaction
  unlock() {
    if (this.isUnlocked) return;
    this.isUnlocked = true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioCtx();
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
    } catch (err) {
      logger.error('[audio] Failed to create AudioContext:', err);
    }
  }

  async decodeMood(moodId, url) {
    if (!this.context || !url) return null;

    if (this.buffers.has(moodId)) {
      return this.buffers.get(moodId);
    }

    const inFlight = this.loading.get(moodId);
    if (inFlight) return inFlight;

    const promise = (async () => {
      const candidates = [];
      const seen = new Set();
      const addCandidate = (candidate) => {
        if (!candidate || seen.has(candidate)) return;
        seen.add(candidate);
        candidates.push(candidate);
      };

      addCandidate(url);
      addCandidate(url.includes('?') ? `${url}&cb=${Date.now()}` : `${url}?cb=${Date.now()}`);

      if (url.endsWith('.wav')) {
        addCandidate(url.replace(/\.wav(\?.*)?$/, '.mp3'));
      } else if (url.endsWith('.mp3')) {
        addCandidate(url.replace(/\.mp3(\?.*)?$/, '.wav'));
      }

      let lastError = null;
      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, {
            cache: 'no-store',
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
          this.buffers.set(moodId, audioBuffer);
          return audioBuffer;
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('Audio fetch/decode failed');
    })();

    this.loading.set(moodId, promise);

    try {
      return await promise;
    } finally {
      this.loading.delete(moodId);
    }
  }

  async playMood(moodId) {
    if (!this.context) return;
    if (moodId === this.currentMood) return;

    const buffer = this.buffers.get(moodId);
    if (!buffer) return;

    const ctx = this.context;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    const now = ctx.currentTime;

    // Fade out current
    if (this.currentGain) {
      this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now);
      this.currentGain.gain.linearRampToValueAtTime(0, now + FADE_DURATION);

      const oldSource = this.currentSource;
      setTimeout(() => {
        try {
          oldSource?.stop();
        } catch {
          // already stopped
        }
      }, FADE_DURATION * 1000 + 100);
    }

    // Fade in next
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45, now + FADE_DURATION);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    this.currentSource = source;
    this.currentGain = gain;
    this.currentMood = moodId;
    this.pendingMood = null;
  }

  // Pre-load an audio file
  async loadMood(moodId, url) {
    if (url) {
      this.moodUrls.set(moodId, url);
    }

    if (!this.context) return;

    try {
      await this.decodeMood(moodId, this.moodUrls.get(moodId));
      if (this.pendingMood === moodId) {
        await this.playMood(moodId);
      }
    } catch (err) {
      console.warn(`[audio] Failed to load mood "${moodId}":`, err.message);
    }
  }

  // Crossfade to a new mood (auto-load if not ready)
  async setMood(moodId) {
    if (!this.context) return;
    if (!moodId) return;
    if (moodId === this.currentMood) return;

    if (!this.buffers.has(moodId)) {
      this.pendingMood = moodId;
      const url = this.moodUrls.get(moodId);
      if (url) {
        try {
          await this.decodeMood(moodId, url);
        } catch (err) {
          console.warn(`[audio] Deferred load failed for mood "${moodId}":`, err.message);
          return;
        }
      }
    }

    await this.playMood(moodId);
  }

  // Stop all audio
  stop() {
    this.pendingMood = null;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // already stopped
      }
      this.currentSource = null;
      this.currentGain = null;
      this.currentMood = null;
    }
  }

  // Brand Sound for Duo Catharsis Sync
  playDuoSyncSound() {
    if (!this.context) return;
    try {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      const now = this.context.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 (C Major triad)

      freqs.forEach((freq, i) => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq + (i * 2), now + 3);

        gain.gain.setValueAtTime(0, now);
        const attackTime = now + 0.1 + (i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, attackTime + 3);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start(now);
        osc.stop(attackTime + 3);
      });
    } catch (e) {
      logger.error('[audio] Duo sync sound failed:', e);
    }
  }

  // Adjust volume multiplier (1.0 = normal, 0.1 = quiet)
  setVolume(multiplier = 1.0, duration = 1.0) {
    if (!this.context || !this.currentGain) return;
    const now = this.context.currentTime;
    const targetVolume = 0.45 * multiplier;
    this.currentGain.gain.cancelScheduledValues(now);
    this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now);
    this.currentGain.gain.linearRampToValueAtTime(targetVolume, now + duration);
  }

  dispose() {
    this.stop();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.buffers.clear();
    this.moodUrls.clear();
    this.loading.clear();
    this.isUnlocked = false;
  }
}