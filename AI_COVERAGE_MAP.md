# خريطة تغطية الذكاء الاصطناعي (AI Coverage Map)

> هذا الملف يوضح أين يتم استخدام الذكاء الاصطناعي داخل المنصة، وما هو الـ fallback في حال عدم توفره.

---

## 1) المساعد الذكي (Chatbot)

- **المسار**: `src/components/AIChatbot.tsx`
- **العميل**: `src/services/geminiClient.ts`
- **نمط العمل**:
  - Streaming عند توفر AI
  - Function Calling مع الأدوات عند توفر السياق
- **Fallback**:
  - إذا `geminiClient.isAvailable()` = false → واجهة توضيحية + تعطيل المحادثة

---

## 2) الخطط الديناميكية للتعافي

- **المسار**: `src/components/DynamicRecoveryPlan.tsx`
- **الوحدات المرتبطة**:
  - `src/utils/aiPatternAnalyzer.ts`
  - `src/utils/aiPlanGenerator.ts`
  - `src/utils/pathGenerator.ts`
- **Fallback**:
  - تحليل Regex عند عدم توفر AI
  - توليد خطة ثابتة (Template-based)

---

## 3) تحليل الأنماط والتغذية الراجعة

- **المسار**: `src/utils/aiPatternAnalyzer.ts`
- **الوظائف**:
  - `analyzeWithAI`
  - `quickAIFeedback`
- **Fallback**:
  - تحليل Regex
  - ردود ثابتة مبسطة

---

## 4) رؤى الشخص (Person View)

- **المسار**: `src/utils/personViewAI.ts`
- **المسار المكمل**: `src/utils/personSolutionAI.ts`
- **الدمج**: `src/components/ViewPersonModal.tsx`
- **Fallback**:
  - بيانات ثابتة من `personViewData.ts`
  - عدم عرض شارات AI

---

## 5) مسارات التعافي والتمارين

- **المسار**: `src/utils/pathGenerator.ts`
- **Fallback**:
  - الرجوع إلى مسارات ثابتة أو مسارات مخزنة بدون AI

---

## 6) فك الارتباط النفسي (Detachment Curriculum)

- **المسار**: `src/utils/detachmentCurriculumGenerator.ts`
- **Fallback**:
  - محتوى ثابت

---

## 7) تسكين الضوضاء النفسية

- **المسار**: `src/utils/noiseSilencingAI.ts`
- **Fallback**:
  - ردود ثابتة أو إرشادات عامة

---

## 8) ربط الأدوات (Agent Tools)

- **المسار**: `src/agent/*`
- **الأدوات**:
  - تسجيل موقف
  - تحديث أعراض
  - تحريك شخص بين الدوائر
  - فتح شاشات
  - إنشاء تمرين مخصص
- **Fallback**:
  - أدوات لا تعمل إلا في وضع AI فعّال (لا تنفيذ بدون AI)

---

## متى يعتبر الـ AI متاح؟

- الشرط:
  - `VITE_GEMINI_AI_ENABLED !== "false"`
  - استجابة الـ Proxy على `/api/gemini/*`

---

## ملخص سريع (Coverage Table)

- المساعد الذكي: ✅ AI + ❌ بدون AI
- الخطط الديناميكية: ✅ AI + ✅ fallback
- تحليل الأنماط: ✅ AI + ✅ fallback
- رؤى الشخص: ✅ AI + ✅ fallback
- مسارات التعافي: ✅ AI + ✅ fallback
- فك الارتباط: ✅ AI + ✅ fallback
- تسكين الضوضاء: ✅ AI + ✅ fallback
- أدوات الـ Agent: ✅ AI فقط

