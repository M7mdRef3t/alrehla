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

    // Sovereign Filters
    this.lowPassNode = null;
    this.brownNoiseSource = null;
    this.brownNoiseGain = null;
    this.brownNoiseBuffer = null;
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

      // Initialize permanent low-pass filter
      this.lowPassNode = this.context.createBiquadFilter();
      this.lowPassNode.type = 'lowpass';
      this.lowPassNode.frequency.setValueAtTime(22000, this.context.currentTime);
      this.lowPassNode.connect(this.context.destination);

      this.createBrownNoiseBuffer();
    } catch (err) {
      console.error('[audio] Failed to create AudioContext:', err);
    }
  }

  createBrownNoiseBuffer() {
    if (!this.context) return;
    const bufferSize = this.context.sampleRate * 2; // 2 seconds
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // weight
    }
    this.brownNoiseBuffer = buffer;
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
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + FADE_DURATION);

    source.connect(gain);
    // Connect through LowPass filter instead of direct destination
    if (this.lowPassNode) {
      gain.connect(this.lowPassNode);
    } else {
      gain.connect(ctx.destination);
    }
    
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
    this.stopBrownNoise();
  }

  stopBrownNoise() {
    if (this.brownNoiseSource) {
      this.brownNoiseGain?.gain.linearRampToValueAtTime(0, this.context.currentTime + 1);
      setTimeout(() => {
        try { this.brownNoiseSource?.stop(); } catch(e) {}
        this.brownNoiseSource = null;
        this.brownNoiseGain = null;
      }, 1100);
    }
  }

  startBrownNoise() {
    if (!this.context || this.brownNoiseSource || !this.brownNoiseBuffer) return;
    
    const source = this.context.createBufferSource();
    source.buffer = this.brownNoiseBuffer;
    source.loop = true;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, this.context.currentTime + 3);

    source.connect(gain);
    gain.connect(this.context.destination);
    source.start(0);

    this.brownNoiseSource = source;
    this.brownNoiseGain = gain;
  }

  // Deep interaction: Update aesthetics based on Pulse Energy
  updateSovereignAesthetics(energy) {
    if (!this.context || !this.lowPassNode) return;
    const now = this.context.currentTime;

    // Filter Logic:
    // Energy 10 -> 22000Hz (Bypass)
    // Energy 1 -> 400Hz (Heavy muffling)
    const freq = Math.max(400, Math.min(22000, (energy * energy * 200) + 400));
    this.lowPassNode.frequency.setTargetAtTime(freq, now, 1.5);

    // Brown Noise Logic:
    // energy < 4 -> gradual fade in
    if (energy < 4) {
      this.startBrownNoise();
    } else {
      this.stopBrownNoise();
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
      console.error('[audio] Duo sync sound failed:', e);
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