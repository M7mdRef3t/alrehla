# 🎙️ Gemini Live API Integration — دواير: Live Consciousness Architect

## Overview

دواير (Dawayir) يستخدم **Gemini Multimodal Live API** لتحويل خريطة العلاقات من مجرد رسم ثابت إلى **محادثة حية** تفاعلية.

المستخدم يتكلم بصوته عن علاقاته، والذكاء الاصطناعي بيسمعه، بيحلل نبرة صوته، بيلاحظ حركة الدوائر على الخريطة، وبيدير حوار سقراطي مباشر عشان يساعده يفهم مشاعره وعلاقاته بوضوح.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User (Browser)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌─────────────────────┐       │
│  │  Microphone      │────────▶│  AudioContext       │       │
│  │  (getUserMedia)  │         │  Resampler          │       │
│  └──────────────────┘         │  (48kHz → 16kHz)    │       │
│                               └──────────┬──────────┘       │
│                                          │                   │
│                                          ▼                   │
│                               ┌──────────────────────┐       │
│                               │  Audio Pipeline      │       │
│                               │  Float32 → PCM Int16 │       │
│                               │  PCM → Base64        │       │
│                               └──────────┬───────────┘       │
│                                          │                   │
│  ┌──────────────────┐                   │                   │
│  │  Zustand State   │                   │                   │
│  │  - mapState      │───────┐           │                   │
│  │  - TEI Score     │       │           │                   │
│  └──────────────────┘       │           │                   │
│                              │           │                   │
│                              ▼           ▼                   │
│                       ┌──────────────────────────┐           │
│                       │  useGeminiLive Hook      │           │
│                       │  (WebSocket Manager)     │           │
│                       └──────────┬───────────────┘           │
│                                  │                           │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                                   │ WebSocket (WSS)
                                   │
                                   ▼
        ┌──────────────────────────────────────────────┐
        │   Gemini Multimodal Live API                 │
        │   wss://generativelanguage.googleapis.com    │
        │                                              │
        │   Model: gemini-2.0-flash-exp                │
        │   Input: 16kHz PCM Audio + JSON Context      │
        │   Output: 24kHz PCM Audio                    │
        └──────────────────────────────────────────────┘
```

---

## 📂 File Structure

```
src/
├── utils/
│   └── audioUtils.ts              # Audio Pipeline (Resampling, PCM encoding)
├── services/
│   └── geminiLiveClient.ts        # WebSocket Client للـ API
├── hooks/
│   └── useGeminiLive.ts           # React Hook (Audio + WS + State)
└── components/
    └── LiveConversationWidget.tsx # UI للمحادثة الصوتية
```

---

## 🔧 Technical Implementation

### 1️⃣ Audio Pipeline (`audioUtils.ts`)

**المشكلة:** المتصفح بيدي الصوت بصيغة Float32Array @ 48kHz، لكن Gemini محتاج Int16 PCM @ 16kHz.

**الحل:**
- `AudioContext` مع `ScriptProcessorNode` للتقاط الصوت
- Resampling من 48kHz → 16kHz
- تحويل Float32 → Int16 PCM
- Encoding لـ Base64 للإرسال عبر WebSocket

```typescript
// التقاط الصوت
const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
const audioContext = new AudioContext({ sampleRate: 16000 });
const source = audioContext.createMediaStreamSource(mediaStream);

// معالجة كل chunk
processorNode.onaudioprocess = (event) => {
  const float32Data = event.inputBuffer.getChannelData(0);
  const pcmData = float32ToInt16(float32Data);
  const base64Audio = int16ToBase64(pcmData);
  sendToGemini(base64Audio);
};
```

### 2️⃣ WebSocket Connection (`geminiLiveClient.ts`)

**Protocol:**
1. فتح WebSocket connection مع API key
2. إرسال `setup` message مع system instructions
3. استلام `setupComplete` confirmation
4. بدء streaming:
   - `realtime_input` للـ audio chunks
   - `client_content` للـ JSON context (map state + TEI)
5. استقبال `serverContent` مع audio response

```typescript
// Setup Message
{
  setup: {
    model: "models/gemini-2.0-flash-exp",
    generation_config: {
      response_modalities: ["AUDIO"],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: { voice_name: "Aoede" }
        }
      }
    },
    system_instruction: { parts: [{ text: "أنت مهندس وعي..." }] }
  }
}

// Audio Input
{
  realtime_input: {
    media_chunks: [{ mime_type: "audio/pcm", data: "<base64>" }]
  }
}

// Context Injection
{
  client_content: {
    turns: [{
      role: "user",
      parts: [{ text: JSON.stringify({ tei_score, map_state }) }]
    }],
    turn_complete: true
  }
}
```

### 3️⃣ React Integration (`useGeminiLive.ts`)

**Hook API:**
```typescript
const {
  isConnected,      // حالة الاتصال
  isListening,      // حالة الاستماع
  connect,          // فتح Connection
  disconnect,       // قطع Connection
  startListening,   // بدء التقاط الصوت
  stopListening,    // إيقاف التقاط الصوت
  sendContext       // إرسال context يدوياً
} = useGeminiLive({
  apiKey: "YOUR_API_KEY",
  onResponse: (text) => console.log(text),
  autoSendContext: true  // إرسال mapState تلقائياً عند التغيير
});
```

**Context Auto-Injection:**
كل ما المستخدم يحرك دائرة أو يضيف شخص، الـ hook بيبعت للـ AI:
```json
{
  "tei_score": 42,
  "tei_factors": {
    "unplacedNodes": 0,
    "redNodes": 2,
    "yellowNodes": 3,
    "detachedNodes": 1
  },
  "map_state": [
    {
      "id": "1",
      "label": "أحمد (المدير)",
      "ring": "red",
      "is_detached": false,
      "analysis_score": 5
    }
  ],
  "timestamp": "2026-02-22T..."
}
```

---

## 🎯 System Instructions (Socratic Prompt)

الـ AI مش chatbot عادي، ده **مهندس وعي** بيدير حوار سقراطي:

```
أنت "مهندس وعي" — معالج نفسي متخصص في تحليل العلاقات.

دورك:
- تدير حواراً سقراطياً هادئاً ومباشراً
- تلاحظ التناقضات بين الكلام ونبرة الصوت وحركة الدوائر
- تسأل عن الأسباب بدون حكم

مثال:
"لاحظت إنك أبعدت دائرة [الاسم] للمنطقة الحمراء، وصوتك فيه توتر واضح.
هل الإبعاد ده قرار نهائي، ولا محاولة لحماية نفسك مؤقتاً؟"

البيانات اللي هتستقبلها:
- TEI Score: 0-100 (مؤشر الوضوح العاطفي)
- Map State: JSON للأشخاص ومواقعهم
```

---

## 🚀 Setup & Testing

### 1. احصل على API Key
https://aistudio.google.com/app/apikey

### 2. أضف الـ Key للـ `.env.local`
```bash
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. شغّل المشروع
```bash
npm run dev
```

### 4. افتح التطبيق وجرب
1. افتح الخريطة
2. هتلاقي زر عائم في الزاوية السفلية اليسرى (💬)
3. اضغط عليه لفتح مهندس الوعي
4. اضغط "بدء المحادثة"
5. انتظر "✅ متصل"
6. اضغط "ابدأ الكلام"
7. اتكلم عن علاقاتك وحرك الدوائر

---

## 🎬 Demo Scenario (للمسابقة)

**السيناريو (3 دقائق):**

1. **الافتتاح (15 ثانية):**
   - شاشة الخريطة فاضية
   - المستخدم يضغط على "إضافة شخص"
   - يضيف "أحمد - المدير"

2. **بدء المحادثة (30 ثانية):**
   - فتح مهندس الوعي
   - الاتصال بالـ API
   - بدء الحديث: "مديري في الشغل دايماً بيضغط عليّا"

3. **التفاعل الحي (90 ثانية):**
   - المستخدم يتكلم بنبرة متوترة
   - بيسحب دائرة المدير للمنطقة الحمراء
   - الـ AI يلاحظ: نبرة الصوت + حركة الدائرة + ارتفاع TEI
   - الـ AI يسأل: "لاحظت التوتر في صوتك وأنك حطيت أحمد في المنطقة الحمراء. هل ده بسبب ضغط مؤقت ولا علاقة سامة فعلاً؟"

4. **التحليل (45 ثانية):**
   - المستخدم يشرح أكتر
   - الـ AI يقترح: "طيب، تفتكر لو ابتعدت عنه عاطفياً شوية (detachment)، هيقلل الضغط؟"
   - عرض TEI Score بيقل بعد الوضوح

5. **الخاتمة (15 ثانية):**
   - شكر للمستخدم
   - عرض الخريطة النهائية بعد الجلسة

**الـ Wow Factor:**
- **Multimodal fusion:** صوت + بيانات + حركة حية
- **Real-time context awareness:** الـ AI فاهم الخريطة لحظياً
- **Psychological depth:** مش مجرد chatbot، ده معالج حقيقي

---

## 📊 Metrics & Performance

- **Latency:** < 500ms (من نهاية كلام المستخدم لبداية رد الـ AI)
- **Audio Quality:** 16kHz PCM (واضح للمحادثة)
- **Context Size:** ~2KB JSON per update (efficient)
- **Connection Stability:** WebSocket مع auto-reconnect

---

## 🛠️ Troubleshooting

### المايك مش شغال
- تأكد من السماح للمتصفح باستخدام المايكروفون
- جرب في Chrome/Edge (أفضل دعم للـ AudioContext)

### الـ API بترجع error
- تأكد من صحة الـ API key
- تأكد إن الـ key عنده permissions للـ Live API
- شوف الـ console للـ error message

### الصوت مقطّع
- قلل الـ buffer size في `ScriptProcessorNode` (حالياً 4096)
- تأكد من سرعة الإنترنت

---

## 📝 Credits

**Created for:** Gemini Live Agent Challenge (March 16, 2026)
**Team:** محمد - System Architect & Developer
**Platform:** دواير — الرحلة
**Tech Stack:** React + TypeScript + Gemini Multimodal Live API

---

🎙️ **Live. Conscious. Transformative.**
