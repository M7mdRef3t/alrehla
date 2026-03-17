/**
 * ════════════════════════════════════════════════════════════════════════════
 * Dawayir Live — Audio Helpers
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Audio pipeline utilities ported from dawayir-live-agent client.
 * Handles PCM ↔ Float32 ↔ Base64 conversions and resampling.
 */

export const INPUT_SAMPLE_RATE = 16_000;   // mic → server
export const OUTPUT_SAMPLE_RATE = 24_000;  // server → speakers

/* ── Base64 ↔ ArrayBuffer ─────────────────────────────────────────────── */

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/* ── PCM Int16 ↔ Float32 ──────────────────────────────────────────────── */

export function pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
  const view = new DataView(buffer);
  const out = new Float32Array(buffer.byteLength / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768;
  }
  return out;
}

export function float32ToPcm16(samples: Float32Array): ArrayBuffer {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return out.buffer;
}

/* ── Downsample ────────────────────────────────────────────────────────── */

export function downsampleFloat32(
  input: Float32Array,
  inputRate: number,
  outputRate = INPUT_SAMPLE_RATE,
): Float32Array {
  if (!input || input.length === 0) return new Float32Array(0);
  if (!Number.isFinite(inputRate) || inputRate <= 0) return input;
  if (inputRate === outputRate) return input;
  if (inputRate < outputRate) return input;

  const ratio = inputRate / outputRate;
  const len = Math.round(input.length / ratio);
  const out = new Float32Array(len);
  let outIdx = 0;
  let inIdx = 0;

  while (outIdx < len) {
    const next = Math.round((outIdx + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = inIdx; i < next && i < input.length; i++) {
      sum += input[i];
      count++;
    }
    out[outIdx] = count > 0 ? sum / count : 0;
    outIdx++;
    inIdx = next;
  }
  return out;
}

/* ── PCM sample rate from MIME type ────────────────────────────────────── */

export function parsePcmSampleRate(mimeType = ''): number {
  if (!mimeType) return OUTPUT_SAMPLE_RATE;
  const match = /rate=(\d+)/i.exec(mimeType);
  if (!match) return OUTPUT_SAMPLE_RATE;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : OUTPUT_SAMPLE_RATE;
}

/* ── Audio Playback Context ────────────────────────────────────────────── */

export class AudioOutputPlayer {
  private ctx: AudioContext | null = null;
  private queue: AudioBuffer[] = [];
  private playing = false;
  private nextStartTime = 0;
  onPlaybackStateChange?: (playing: boolean) => void;

  async enqueueBase64Pcm(base64: string, sampleRate = OUTPUT_SAMPLE_RATE) {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate });
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const raw = base64ToArrayBuffer(base64);
    const float32 = pcm16ToFloat32(raw);
    const buffer = this.ctx.createBuffer(1, float32.length, sampleRate);
    buffer.getChannelData(0).set(float32);
    this.queue.push(buffer);
    this.schedulePlayback();
  }

  private schedulePlayback() {
    if (!this.ctx || this.queue.length === 0) return;

    if (!this.playing) {
      this.playing = true;
      this.nextStartTime = this.ctx.currentTime;
      this.onPlaybackStateChange?.(true);
    }

    while (this.queue.length > 0) {
      const buf = this.queue.shift()!;
      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      source.connect(this.ctx.destination);
      source.start(this.nextStartTime);
      this.nextStartTime += buf.duration;
      source.onended = () => {
        if (this.queue.length === 0 && this.ctx && this.ctx.currentTime >= this.nextStartTime - 0.05) {
          this.playing = false;
          this.onPlaybackStateChange?.(false);
        }
      };
    }
  }

  stop() {
    this.queue = [];
    this.playing = false;
    this.onPlaybackStateChange?.(false);
  }

  dispose() {
    this.stop();
    if (this.ctx) {
      void this.ctx.close().catch(() => {/* ignore */});
      this.ctx = null;
    }
  }
}

/* ── Microphone Capture ────────────────────────────────────────────────── */

export class MicCapture {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  onAudioChunk?: (base64: string) => void;

  async start(deviceId?: string): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.ctx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    const source = this.ctx.createMediaStreamSource(this.stream);

    // ScriptProcessor (widely supported; AudioWorklet can be added later)
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const downsampled = this.ctx!.sampleRate !== INPUT_SAMPLE_RATE
        ? downsampleFloat32(float32, this.ctx!.sampleRate)
        : float32;
      const pcm = float32ToPcm16(downsampled);
      const b64 = arrayBufferToBase64(pcm);
      this.onAudioChunk?.(b64);
    };

    // Connect through a silent gain to avoid echo
    const silentGain = this.ctx.createGain();
    silentGain.gain.value = 0;
    source.connect(this.processor);
    this.processor.connect(silentGain);
    silentGain.connect(this.ctx.destination);
  }

  stop(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {/* ignore */});
      this.ctx = null;
    }
  }
}
