/**
 * Domain: Consciousness — Soundscape Service
 *
 * مسؤول عن تشغيل الـ ambient audio بناءً على الحالة.
 * مفصول عن الـ engine لأنه له دورة حياة مستقلة.
 */

import type { ConsciousnessState } from "../types";

const TRACK_MAP: Record<ConsciousnessState, string> = {
  crisis: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  struggling: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  stable: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  thriving: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  flow: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
};

class SoundscapeService {
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  sync(state: ConsciousnessState, volume: number, enabled: boolean): void {
    if (typeof window === "undefined") return;

    if (!enabled || volume === 0) {
      this.audio?.pause();
      return;
    }

    const targetUrl = TRACK_MAP[state];
    if (this.currentUrl === targetUrl) {
      if (this.audio) this.audio.volume = volume;
      return;
    }

    // Fade out old track
    if (this.audio) {
      this.fadeOut(this.audio);
    }

    this.audio = new Audio(targetUrl);
    this.audio.loop = true;
    this.audio.volume = 0;
    this.currentUrl = targetUrl;

    this.audio.play().catch(() => {
      console.warn("[Soundscape] Autoplay blocked — user interaction required.");
    });

    this.fadeIn(this.audio, volume);
  }

  handleSensoryInput(type: "motion" | "scroll", value: number): void {
    if (!this.audio) return;
    try {
      if (type === "motion") {
        this.audio.playbackRate = 1 + value * 0.15;
      } else if (type === "scroll") {
        const docHeight = document.body.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          this.audio.volume = Math.max(0.1, 0.3 - (value / docHeight) * 0.1);
        }
      }
    } catch { /* ignore */ }
  }

  stop(): void { this.audio?.pause(); }

  private fadeOut(audio: HTMLAudioElement): void {
    let vol = audio.volume;
    const interval = setInterval(() => {
      vol = Math.max(0, vol - 0.1);
      audio.volume = vol;
      if (vol <= 0) { clearInterval(interval); audio.pause(); }
    }, 100);
  }

  private fadeIn(audio: HTMLAudioElement, targetVolume: number): void {
    let vol = 0;
    const interval = setInterval(() => {
      vol = Math.min(targetVolume, vol + 0.1);
      audio.volume = vol;
      if (vol >= targetVolume) clearInterval(interval);
    }, 100);
  }
}

export const soundscape = new SoundscapeService();
