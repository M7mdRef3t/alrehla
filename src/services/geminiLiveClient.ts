/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🌐 GEMINI LIVE API CLIENT — WebSocket Connection Manager
 * ════════════════════════════════════════════════════════════════════════════
 *
 * يدير الاتصال المباشر مع Gemini Multimodal Live API عبر WebSocket
 *
 * المرجع التقني:
 * - API Endpoint: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
 * - Model: gemini-2.5-flash-native-audio-latest (أو الإصدار المدعوم للـ Live API)
 * - Protocol: WebSocket (bidirectional streaming)
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * رسالة إعداد الجلسة (Setup Message)
 * تُرسل في بداية الاتصال لتكوين الموديل
 */
export interface SetupMessage {
  setup: {
    model: string;
    generation_config?: {
      response_modalities?: string[];
      speech_config?: {
        voice_config?: {
          prebuilt_voice_config?: {
            voice_name?: string;
          };
        };
      };
    };
    system_instruction?: {
      parts: Array<{
        text: string;
      }>;
    };
  };
}

/**
 * رسالة إدخال صوتي (Realtime Input)
 * تُرسل باستمرار مع chunks الصوت من المستخدم
 */
export interface RealtimeInputMessage {
  realtime_input: {
    media_chunks: Array<{
      mime_type: string;
      data: string; // Base64 encoded PCM audio
    }>;
  };
}

/**
 * رسالة محتوى نصي/JSON (Client Content)
 * لإرسال بيانات إضافية (مثل حالة الخريطة)
 */
export interface ClientContentMessage {
  client_content: {
    turns: Array<{
      role: "user";
      parts: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
      }>;
    }>;
    turn_complete: boolean;
  };
}

/**
 * رسالة من السيرفر (Server Message)
 */
export interface ServerMessage {
  // Setup acknowledgment
  setupComplete?: Record<string, never>;

  // Audio response
  serverContent?: {
    model_turn?: {
      parts?: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string; // Base64 audio
        };
      }>;
    };
    turn_complete?: boolean;
  };

  // Error
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Event Handlers للـ WebSocket Client
 */
export interface GeminiLiveClientHandlers {
  onConnected?: () => void;
  onSetupComplete?: () => void;
  onAudioResponse?: (base64Audio: string) => void;
  onTextResponse?: (text: string) => void;
  onError?: (error: Error) => void;
  onDisconnected?: () => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GEMINI LIVE CLIENT CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;
  private handlers: GeminiLiveClientHandlers;
  private systemInstruction: string;
  private isSetupComplete = false;

  constructor(
    apiKey: string,
    systemInstruction: string,
    handlers: GeminiLiveClientHandlers,
    model = "gemini-2.5-flash-native-audio-latest"
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.systemInstruction = systemInstruction;
    this.handlers = handlers;
  }

  /**
   * فتح الاتصال مع Gemini Live API
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    // بناء URL مع API Key
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected to Gemini Live API');
      this.handlers.onConnected?.();
      this.sendSetupMessage();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data as string);
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Failed to parse server message:', error);
      }
    };

    this.ws.onerror = (event) => {
      console.error('❌ WebSocket error:', event);
      this.handlers.onError?.(new Error('WebSocket connection error'));
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.isSetupComplete = false;
      this.handlers.onDisconnected?.();
    };
  }

  /**
   * إرسال رسالة الإعداد الأولية
   */
  private sendSetupMessage(): void {
    const setupMessage: SetupMessage = {
      setup: {
        model: `models/${this.model}`,
        generation_config: {
          response_modalities: ["AUDIO"], // نريد رد صوتي
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Aoede" // صوت هادئ ومتعاطف (يمكن تغييره)
              }
            }
          }
        },
        system_instruction: {
          parts: [
            {
              text: this.systemInstruction
            }
          ]
        }
      }
    };

    this.send(setupMessage);
  }

  /**
   * معالجة الرسائل الواردة من السيرفر
   */
  private handleServerMessage(message: ServerMessage): void {
    // Setup complete
    if (message.setupComplete) {
      console.log('✅ Setup complete - ready to stream');
      this.isSetupComplete = true;
      this.handlers.onSetupComplete?.();
      return;
    }

    // Server content (audio/text response)
    if (message.serverContent?.model_turn?.parts) {
      for (const part of message.serverContent.model_turn.parts) {
        // Text response
        if (part.text) {
          this.handlers.onTextResponse?.(part.text);
        }

        // Audio response
        if (part.inline_data?.mime_type === "audio/pcm" && part.inline_data.data) {
          this.handlers.onAudioResponse?.(part.inline_data.data);
        }
      }
    }

    // Error
    if (message.error) {
      console.error('❌ Server error:', message.error);
      this.handlers.onError?.(
        new Error(`[${message.error.code}] ${message.error.message}`)
      );
    }
  }

  /**
   * إرسال chunk صوتي (من المايكروفون)
   */
  sendAudio(base64Audio: string): void {
    if (!this.isSetupComplete) {
      console.warn('Cannot send audio - setup not complete');
      return;
    }

    const audioMessage: RealtimeInputMessage = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm",
            data: base64Audio
          }
        ]
      }
    };

    this.send(audioMessage);
  }

  /**
   * إرسال بيانات نصية/JSON (مثل حالة الخريطة)
   */
  sendContext(contextData: string): void {
    if (!this.isSetupComplete) {
      console.warn('Cannot send context - setup not complete');
      return;
    }

    const contextMessage: ClientContentMessage = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [
              {
                text: contextData
              }
            ]
          }
        ],
        turn_complete: true
      }
    };

    console.log('📤 Sending Context Payload:', contextData);
    this.send(contextMessage);
  }

  /**
   * إرسال رسالة عامة للـ WebSocket
   */
  private send(message: SetupMessage | RealtimeInputMessage | ClientContentMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send - WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * قطع الاتصال
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isSetupComplete = false;
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.isSetupComplete;
  }
}
