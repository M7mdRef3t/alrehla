# تقرير شامل — مشروع الرحلة (أداة دواير)

تاريخ إعداد التقرير: 2026-02-04

هذا التقرير يغطي:
1. مراجعة معمارية + تدفّق البيانات + اعتماديات المشروع
2. تحليل جودة الكود + المخاطر + الديون التقنية
3. أمن وأداء مع توصيات عملية
4. تغطية الاختبارات + فجوات الاختبار + خطة اختبار
5. توثيق شامل + خريطة ملفات + تشغيل سريع
6. ملخص تنفيذي وإجراءات مقترحة

---

**ملخص تنفيذي**

- التطبيق واجهة أمامية فقط (React + Vite + TypeScript + Tailwind) مع تخزين محلي في المتصفح (localStorage) وتكامل اختياري مع Gemini AI وGoogle Analytics وPWA.
- البنية غنية وظيفيا (خريطة علاقات، رحلة تعافٍ، خطط ديناميكية، مساعد ذكاء اصطناعي، إشعارات محلية، تصدير/استيراد بيانات).
- المخاطر الأهم حاليا:
  - الخصوصية: البيانات الحساسة مخزنة في `localStorage` بدون تشفير.
  - مفتاح Gemini موجود في الواجهة (VITE_*) وبالتالي مكشوف للعميل.
  - احتمال تخزين/كاش ردود الذكاء الاصطناعي عبر PWA runtime caching.
  - الاعتماد على متصفح المستخدم في الإشعارات بدون Service Worker مخصص للجدولة الفعلية.
- جودة الكود جيدة هيكليا، مع وجود بعض فرص لتحسين الفصل، تقليل تكرار البيانات، وتوحيد الممارسات.
- الاختبارات قليلة جدا مقارنة بحجم المشروع (اختباران فقط).

---

**1) نظرة عامة على المشروع**

- الاسم: `dawayir-masafaty-mvp`
- نوع التطبيق: تطبيق ويب تفاعلي (SPA) مخصص لدعم رحلة التعافي من العلاقات المستنزفة.
- التقنيات الأساسية:
  - React 18 + TypeScript (Strict)
  - Vite 6 + SWC
  - Tailwind CSS v4
  - Zustand لإدارة الحالة
  - Framer Motion للحركات
  - @google/generative-ai (Gemini)
  - PWA عبر vite-plugin-pwa
  - Vercel Analytics + Speed Insights

---

**2) خريطة الملفات (Structure Map)**

- الجذر:
  - `package.json` إعدادات المشروع والاعتماديات والسكربتات
  - `vite.config.ts` إعداد Vite + PWA + Vitest
  - `tsconfig.json` إعداد TypeScript (strict)
  - `.env.local.example` متغيرات البيئة (Gemini/GA)
  - `DEPLOY.md`, `REFACTORING_REPORT.md`, `Project_Spec_Dawayir_Masafaty.md` وثائق داعمة
- `src/`
  - `App.tsx` نقطة تنسيق الشاشات (landing/goal/map + overlays)
  - `main.tsx` التهيئة + Analytics + ErrorBoundary
  - `components/` مكونات واجهة المستخدم
  - `state/` Stores على Zustand
  - `services/` خدمات (analytics, gemini, export, pdf, localStorage, notifications)
  - `agent/` منطق أدوات المساعد الذكي + النظام
  - `data/` بيانات ثابتة (أسئلة/خطط/محتوى)
  - `modules/` وحدات: map, pathEngine, personView
  - `utils/` مساعدات منطقية مختلفة
  - `hooks/` hooks خاصة
  - `copy/` نصوص واجهة المستخدم

---

**3) البنية المعمارية (Architecture)**

- نمط SPA أحادي الصفحة.
- شاشة App تنقل بين ثلاث حالات رئيسية:
  - `landing` → بداية
  - `goal` → اختيار الهدف/الفئة
  - `map` → شاشة الخريطة المركزية
- الحالة العامة موزعة على عدة Stores في `src/state/`:
  - `mapState` (العُقد، السجل، التقدم…)
  - `journeyState` (مسار المستخدم)
  - `notificationState`, `themeState`, `meState`, `emergencyState`, `achievementState`
- تخزين البيانات محلي عبر `localStorage` مع طبقة حفظ في `services/localStore.ts`.
- الذكاء الاصطناعي:
  - `services/geminiClient.ts` كعميل للواجهة
  - `agent/` لأدوات function-calling وربطها بسلوكيات التطبيق

ملاحظة: يوجد اتساع كبير في `mapState` (وظائف كثيرة)، ويمكن لاحقا تقسيمه إلى slices أو stores فرعية لتحسين القابلية للصيانة.

---

**4) تدفقات المستخدم الأساسية**

1. البدء:
   - شاشة Landing → اختيار هدف → انتقال إلى Map.
2. إنشاء/إدارة أشخاص على الخريطة:
   - إضافة أشخاص (modal)
   - تحديد المنطقة (أحمر/أصفر/أخضر)
   - تسجيل أعراض/مواقف/ملاحظات
3. رحلة التعافي:
   - خطط استرداد، خطوات، تمارين، تتبع تقدّم
4. مساعد الذكاء الاصطناعي:
   - واجهة محادثة + أدوات داخلية للتنقل والتسجيل
5. إشعارات:
   - تذكير يومي
   - تذكير بعدم النشاط
6. تصدير/استيراد:
   - JSON Export/Import
   - PDF Export (موجود كخدمة)

---

**5) إدارة الحالة والبيانات**

- `mapState.ts` هو المحور:
  - تخزين الأشخاص، الملاحظات، السجل، الخطط، تقييمات الأعراض.
  - حفظ تلقائي إلى localStorage مع debounce 100ms.
  - توليد ID داخلي.
- `journeyState.ts` (غير مفصل هنا) غالبا مسؤول عن تقدم الرحلة.
- البيانات المرجعية محفوظة في `src/data/` (تعريفات ثابتة).

التوصية:
- إضافة طبقة تطبيع (normalized state) لعُقد الخريطة بدل الكائنات العميقة لتسهيل التحديثات.
- توحيد نمط التخزين (key naming / schema version).

---

**6) الذكاء الاصطناعي (Gemini + Agent Tools)**

- `geminiClient.ts`:
  - ترتيب نماذج احتياطي (fallback)
  - دعم generate و generateStream
  - دعم function calling للأدوات
- `agent/`:
  - تعريف أدوات (log situation, update symptoms, navigate, showCard, generate custom exercise)
  - بناء System Prompt يشتمل على سياق المستخدم

المخاطر:
- سابقًا كان المفتاح في الواجهة، والآن الخطة تعتمد Proxy سيرفر لتخفيف المخاطر (GEMINI_API_KEY على السيرفر).
- في وضع PWA، قد يتم تخزين ردود API في الـ cache.

توصيات:
- نقل Gemini API إلى backend proxy مع حماية المفتاح.
- وضع سياسة عدم التخزين في cache للطلبات الحساسة أو تعطيل runtime caching لمسار Gemini.

---

**7) التخزين المحلي والنسخ الاحتياطي**

- `services/dataExport.ts`:
  - Export جميع بيانات localStorage الخاصة بالمشروع.
  - Import والتحقق من نسخة JSON.
  - Restore شامل لكل المسارات (`map`, `journey`, `notification`).

ملاحظات:
- لا يوجد تشفير أو توقيع للنسخ.
- أي ملف JSON صحيح الشكل سيُستورد بدون تحقق أمني عميق.

اقتراحات:
- إضافة versioning أوسع للـ schema.
- إضافة checksum أو signature اختيارية.

---

**8) التحليلات والقياس**

- `services/analytics.ts`:
  - GA4 مع consent من localStorage.
  - trackPageView و trackEvent.
  - anonymize_ip مفعّل.

نقطة تحتاج تأكيد:
- أين يتم منح الموافقة (UI)؟ إذا لم توجد شاشة صريحة، يفضل إضافة موافقة واضحة (cookie consent).

---

**9) الإشعارات**

- `services/notifications.ts`:
  - يعتمد على Notifications API فقط.
  - تذكير يومي + تذكير عدم النشاط.
- `notificationState.ts` يهيئ الحالة تلقائيا عند تحميل الصفحة.

ملاحظة:
- إشعارات فعلية في الخلفية تحتاج Service Worker + Push API.
- حاليا التذكيرات تعتمد على فتح التطبيق.

---

**10) PWA**

- `vite.config.ts`:
  - Workbox runtimeCaching للخطوط وGemini API.
  - manifest من `public/manifest.json`.

توصية مهمة:
- تعطيل caching لمسارات الذكاء الاصطناعي إن كانت البيانات حساسة.

---

**11) الاختبارات**

الحالي:
- `src/services/dataExport.test.ts`
- `src/utils/scoreHelpers.test.ts`

الفجوات:
- لا توجد اختبارات للمكونات الرئيسية (Map, Journey, AIChatbot).
- لا توجد اختبارات تكامل لتدفق المستخدم الأساسي.

خطة اختبار مقترحة:
1. اختبارات وحدات للـ stores (mapState/journeyState).
2. اختبارات وحدات للخدمات (analytics/notifications).
3. اختبارات مكونات للمسارات الأساسية (Landing, GoalPicker, CoreMapScreen).
4. اختبارات E2E (Playwright/Cypress) على التدفق الكامل.

---

**12) الأداء**

إيجابيات:
- Vite + ESBuild
- تقسيم chunks (vendor, motion, dnd, zustand)
- Debounce لتخزين localStorage

مخاطر:
- حجم JS كبير بسبب كثرة المكونات والبيانات.
- بعض المكونات تحمل بيانات ثابتة كبيرة في runtime.
- استخدام `localStorage` مكثف قد يسبب بطء مع البيانات الكبيرة.

تحسينات ممكنة:
- lazy loading للمكونات الثانوية
- memoization أوسع في map view
- نقل البيانات الكبيرة إلى JSON منفصل وتحميلها عند الحاجة

---

**13) الأمن والخصوصية**

مشاكل محتملة:
- بيانات حساسة محفوظة في `localStorage` غير مشفرة.
- مفتاح Gemini مكشوف للعميل.
- عدم وجود سياسة واضحة لحذف البيانات.

توصيات:
- تشفير client-side أو تخزين حساس في backend.
- استخدام backend proxy للذكاء الاصطناعي.
- إضافة شاشة واضحة للخصوصية والحذف.

---

**14) جودة الكود والديون التقنية**

الإيجابيات:
- TypeScript strict
- تنظيم منطقي في مجلدات واضحة
- وجود خدمات منفصلة (analytics, export, notifications)

نقاط تحتاج تحسين:
- `mapState` ضخم جدا ويجمع مهام كثيرة.
- نصوص عربية تظهر في بعض الملفات بشكل ترميز غير واضح في الإخراج النصي (قد يشير لاختلاف Encoding).
- تكرار بعض البيانات في `data/` و `copy/` يمكن توحيده.

---

**15) تشغيل وبناء**

أوامر مهمة:
- `npm run dev` تشغيل التطوير
- `npm run build` بناء الإنتاج
- `npm run preview` معاينة الإنتاج
- `npm run test` تشغيل الاختبارات
- `npm run generate-icons` توليد الأيقونات

---

**16) مخاطر عالية (High-Risk Items)**

1. كشف مفتاح Gemini في الواجهة.
2. تخزين بيانات المستخدم الحساسة بدون تشفير.
3. احتمالية caching لطلبات Gemini داخل PWA.
4. قلة الاختبارات مقارنة بحجم الوظائف.

---

**17) توصيات التنفيذ السريع (Quick Wins)**

1. تعطيل caching على مسارات Gemini في `vite.config.ts`.
2. نقل مفتاح Gemini إلى backend proxy.
3. إضافة طبقة مسح للبيانات (Clear all user data).
4. بناء 3-5 اختبارات للمكونات الأساسية.

---

**18) الخطوات المقترحة (Roadmap مختصر)**

1. أمن وخصوصية:
   - Proxy للذكاء الاصطناعي + تشفير أساسي للتخزين.
2. اختبار وضمان:
   - بناء قاعدة اختبارات للمسارات الرئيسية.
3. أداء وتجربة مستخدم:
   - lazy loading + تحسين الذاكرة.
4. منتج:
   - إضافة شاشة إعدادات شاملة (خصوصية، تصدير، حذف).

---

**ملاحظات نهائية**

- التطبيق غني جدًا ويظهر نضج في التصميم والتجربة.
- التركيز القادم الأفضل: تأمين البيانات وحماية المفتاح، ثم رفع مستوى الاختبارات.
