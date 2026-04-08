'use client';

import { arrayBufferToBase64, base64ToArrayBuffer } from "./audioHelpers";

const LS_KEY = "dawayir_voice_tattoo";

export interface VoiceTattooEntry {
  audio: string;
  savedAt: string;
  nodeId?: number;
  label?: string;
  whyNowLine?: string | null;
}

function getAudioContextCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

function concatArrayBuffers(buffers: ArrayBuffer[]) {
  const total = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const buffer of buffers) {
    out.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return out.buffer;
}

function createWavBufferFromPcm16(pcmBuffer: ArrayBuffer, sampleRate: number) {
  const pcmLength = pcmBuffer.byteLength;
  const wavBuffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(wavBuffer);
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcmLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcmLength, true);
  new Uint8Array(wavBuffer, 44).set(new Uint8Array(pcmBuffer));

  return wavBuffer;
}

export function createVoiceTattooFromChunks(base64Chunks: string[], sampleRate: number) {
  if (!base64Chunks.length) return null;
  const pcmBuffer = concatArrayBuffers(base64Chunks.map((chunk) => base64ToArrayBuffer(chunk)));
  const wavBuffer = createWavBufferFromPcm16(pcmBuffer, sampleRate);
  return arrayBufferToBase64(wavBuffer);
}

export function readVoiceTattoo() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VoiceTattooEntry;
    if (!parsed?.audio) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasVoiceTattoo() {
  return Boolean(readVoiceTattoo());
}

export function saveVoiceTattoo(entry: VoiceTattooEntry) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}

export async function playVoiceTattoo() {
  const entry = readVoiceTattoo();
  const AudioContextCtor = getAudioContextCtor();
  if (!entry || !AudioContextCtor) return false;

  const ctx = new AudioContextCtor();
  try {
    const audioBuffer = await ctx.decodeAudioData(base64ToArrayBuffer(entry.audio));
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.72, ctx.currentTime + 0.25);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + audioBuffer.duration);
    source.buffer = audioBuffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.onended = () => {
      void ctx.close().catch(() => undefined);
    };
    return true;
  } catch {
    void ctx.close().catch(() => undefined);
    return false;
  }
}
