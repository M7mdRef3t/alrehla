/**
 * 🎙️ AudioStreamer.ts
 * 
 * High-performance audio capture using AudioWorklet and 16kHz PCM.
 * Designed for Gemini Multimodal Live API.
 */

export class AudioStreamer {
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private onAudioChunk: (base64Data: string) => void;

    constructor(onAudioChunk: (base64Data: string) => void) {
        this.onAudioChunk = onAudioChunk;
    }

    /**
     * Start the audio stream
     */
    public async start(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            this.audioContext = new AudioContext({ sampleRate: 16000 });

            // Load the worklet from the public folder
            await this.audioContext.audioWorklet.addModule('/pcm-processor.js');

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

            this.workletNode.port.onmessage = (event) => {
                const pcmBuffer = event.data; // ArrayBuffer of Int16
                const base64 = this.arrayBufferToBase64(pcmBuffer);
                this.onAudioChunk(base64);
            };

            this.source.connect(this.workletNode);
            // No need to connect to destination as we only want to process, not play back locally

            console.log("🎤 [AudioStreamer] Capture started at 16kHz.");
        } catch (error) {
            console.error("❌ [AudioStreamer] Failed to start:", error);
            throw error;
        }
    }

    /**
     * Stop the audio stream and cleanup
     */
    public stop(): void {
        this.workletNode?.disconnect();
        this.source?.disconnect();
        this.stream?.getTracks().forEach(track => track.stop());

        if (this.audioContext?.state !== 'closed') {
            void this.audioContext?.close();
        }

        this.workletNode = null;
        this.source = null;
        this.stream = null;
        this.audioContext = null;

        console.log("🛑 [AudioStreamer] Capture stopped.");
    }

    /**
     * Helper to convert ArrayBuffer to Base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
