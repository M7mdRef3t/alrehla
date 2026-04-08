import { logger } from "../services/logger";
/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🎙️ AUDIO UTILITIES — Gemini Live API Audio Pipeline
 * ════════════════════════════════════════════════════════════════════════════
 *
 * يوفر الأدوات اللازمة لمعالجة الصوت للتكامل مع Gemini Multimodal Live API:
 *
 * - Resampling: تحويل الصوت من sample rate المتصفح الافتراضي (48kHz) إلى 16kHz
 * - PCM Encoding: تحويل Float32 audio data إلى Int16 PCM
 * - Base64 Encoding: تحويل binary audio data إلى Base64 للإرسال عبر WebSocket
 *
 * المتطلبات التقنية لـ Gemini Live API:
 * - Input Audio: 16-bit PCM @ 16kHz (mono)
 * - Output Audio: 16-bit PCM @ 24kHz (mono)
 */

/**
 * تحويل Float32Array (من AudioContext) إلى Int16Array (PCM)
 *
 * @param float32Array - البيانات الصوتية من AudioContext
 * @returns Int16Array جاهز للإرسال
 */
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values to [-1, 1] range
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer range [-32768, 32767]
    int16Array[i] = clamped < 0
      ? clamped * 0x8000  // -32768
      : clamped * 0x7FFF; // 32767
  }

  return int16Array;
}

/**
 * تحويل Int16Array إلى Base64 string
 *
 * @param int16Array - البيانات الصوتية بصيغة PCM
 * @returns Base64 encoded string
 */
export function int16ToBase64(int16Array: Int16Array): string {
  // Convert Int16Array to Uint8Array (byte representation)
  const uint8Array = new Uint8Array(int16Array.buffer);

  // Convert to Base64
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }

  return btoa(binaryString);
}

/**
 * تحويل Base64 إلى Float32Array للتشغيل
 * (للـ audio output من Gemini)
 *
 * @param base64 - Base64 encoded PCM audio
 * @param sampleRate - Sample rate (24000 for Gemini output)
 * @returns Float32Array جاهز للتشغيل في AudioContext
 */
export function base64ToFloat32(base64: string): Float32Array {
  // Decode Base64 to binary string
  const binaryString = atob(base64);

  // Convert to Uint8Array
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  // Convert to Int16Array
  const int16Array = new Int16Array(uint8Array.buffer);

  // Convert to Float32Array (normalize to [-1, 1])
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
  }

  return float32Array;
}

/**
 * إنشاء AudioContext Resampler
 * يحول الصوت من sample rate المتصفح (عادة 48kHz) إلى 16kHz
 *
 * @param sourceBuffer - AudioBuffer من المايكروفون
 * @param targetSampleRate - Sample rate المطلوب (16000 for Gemini)
 * @returns Promise<AudioBuffer> بالـ sample rate الجديد
 */
export async function resampleAudioBuffer(
  audioContext: AudioContext,
  sourceBuffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  // إذا كان الـ sample rate نفسه، لا داعي للـ resampling
  if (sourceBuffer.sampleRate === targetSampleRate) {
    return sourceBuffer;
  }

  // إنشاء offline context بالـ sample rate المطلوب
  const offlineContext = new OfflineAudioContext(
    1, // mono
    (sourceBuffer.duration * targetSampleRate), // length بالـ samples
    targetSampleRate
  );

  // إنشاء source من الـ buffer الأصلي
  const source = offlineContext.createBufferSource();
  source.buffer = sourceBuffer;
  source.connect(offlineContext.destination);
  source.start(0);

  // Render الصوت بالـ sample rate الجديد
  return await offlineContext.startRendering();
}

/**
 * Audio Stream Processor
 * يعالج الصوت من المايكروفون بشكل مستمر ويحوله لـ 16kHz PCM Base64
 */
export class AudioStreamProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private onAudioData: ((base64Audio: string) => void) | null = null;

  constructor(onAudioData: (base64Audio: string) => void) {
    this.onAudioData = onAudioData;
  }

  /**
   * بدء التقاط الصوت من المايكروفون
   */
  async start(): Promise<void> {
    try {
      // طلب إذن المايكروفون
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // mono
          sampleRate: 16000, // نحاول نطلب 16kHz مباشرة
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // إنشاء AudioContext
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // إنشاء source من الـ stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // إنشاء processor (4096 samples buffer)
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      // معالجة كل chunk من الصوت
      this.processorNode.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0); // Float32Array

        // تحويل لـ Int16 PCM
        const pcmData = float32ToInt16(inputData);

        // تحويل لـ Base64
        const base64Audio = int16ToBase64(pcmData);

        // إرسال للـ callback
        if (this.onAudioData) {
          this.onAudioData(base64Audio);
        }
      };

      // ربط العقد
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

    } catch (error) {
      logger.error('فشل في بدء التقاط الصوت:', error);
      throw error;
    }
  }

  /**
   * إيقاف التقاط الصوت وتنظيف الموارد
   */
  stop(): void {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Audio Player للـ output من Gemini
 * يشغل الصوت المستلم من الـ API (24kHz PCM Base64)
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  public onPlaybackStateChange?: (isPlaying: boolean) => void;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  /**
   * إضافة chunk صوتي للـ queue
   */
  async enqueueAudio(base64Audio: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      // تحويل Base64 إلى Float32Array
      const float32Data = base64ToFloat32(base64Audio);

      // إنشاء AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        float32Data.length,
        24000 // Gemini output sample rate
      );

      audioBuffer.getChannelData(0).set(float32Data);

      // إضافة للـ queue
      this.audioQueue.push(audioBuffer);

      // بدء التشغيل إذا لم يكن جارياً
      if (!this.isPlaying) {
        void this.playNext();
      }
    } catch (error) {
      logger.error('فشل في معالجة الصوت المستلم:', error);
    }
  }

  /**
   * تشغيل الـ chunk التالي من الـ queue
   */
  private async playNext(): Promise<void> {
    if (this.audioQueue.length === 0) {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.onPlaybackStateChange?.(false);
      }
      return;
    }

    if (!this.audioContext) return;

    this.isPlaying = true;
    const buffer = this.audioQueue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      void this.playNext();
    };

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.onPlaybackStateChange?.(true);
    }
    source.start();
  }

  /**
   * مسح الـ queue وإيقاف التشغيل
   */
  stop(): void {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * تنظيف الموارد
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}
