# User-Mode Safe Edit List

هذا المرجع يثبت أين نبدأ عندما يكون الطلب عن تجربة المستخدم النهائي في وضع `user` فقط.

القاعدة:
- نبدأ من المكونات الطرفية وملفات النصوص.
- لا نلمس طبقة orchestration أو gating أو admin إلا إذا كان الطلب عنها مباشرة.
- المرجع التشغيلي دائمًا هو `user` mode مع Phase One مفعّل افتراضيًا.

## Ranked Files

1. `src/copy/landing/*`
سبب الأمان: أقل blast radius، ومخصص للنصوص والرسائل العامة في الهبوط.

2. `src/copy/goalPicker/*`
سبب الأمان: مناسب لتعديل صياغات اختيار الهدف بدون تغيير منطق التنقل.

3. `src/copy/map/*`
سبب الأمان: يغيّر تجربة القراءة والإرشاد داخل الخريطة بدون لمس الحالة المركزية.

4. `src/components/Landing.tsx`
سبب الأمان: سطح user-mode واضح ومنفصل نسبيًا عن admin والبيئات الأخرى.

5. `src/components/OnboardingWelcomeBubble.tsx`
سبب الأمان: مناسب لتعديل الترحيب، النبرة، ورسائل المصدر AI/template.

6. `src/components/OnboardingFlow.tsx`
سبب الأمان: آمن نسبيًا عندما يكون المطلوب داخل onboarding نفسه لا في app flow العام.

7. `src/components/GoalPicker.tsx`
سبب الأمان: مكان مباشر لتعديلات اختيار الهدف، مع الانتباه فقط لأي goal gating موجود.

8. `src/components/CoreMapScreen.tsx`
سبب الأمان: عالي الأثر على المستخدم النهائي، لكنه يحتاج حذرًا أكبر من ملفات copy.

9. `src/components/JourneyToolsScreen.tsx`
سبب الأمان: مناسب لتعديلات العرض داخل الأدوات، لكن يجب التحقق من حالات القفل.

10. `src/components/FeatureLockedModal.tsx`
سبب الأمان: صالح لتحسين تجربة الرسائل المقفلة في Phase One دون تغيير قواعد القفل نفسها.

11. `src/components/AIChatbot.tsx`
سبب الأمان: آمن فقط إذا كان المطلوب UI/copy أو fallback display، وليس منطق التكامل.

12. `src/components/DynamicRecoveryPlan.tsx`
سبب الأمان: صالح لتوضيح التقديم البصري أو labeling بين AI والقالب الثابت.

## Guarded Boundaries

هذه الملفات لا نبدأ منها في أي شغل عادي على واجهة المستخدم:

- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/navigation/navigationMachine.ts`
- `src/config/appEnv.ts`
- `src/config/runtimeEnv.ts`
- `src/utils/featureFlags.ts`
- `src/state/authState.ts`
- `src/state/adminState.ts`

السبب: هذه الملفات تؤثر على التنقل، القفل، الأدوار، وخلط user/dev/owner معًا.

## Avoid By Default

- `app/admin/page.tsx`
- `src/components/admin/*`
- `app/coach/page.tsx`
- `app/debug-baseline/page.tsx`
- `app/api/*`
- `src/app/api/*`
- `middleware.ts`

هذه المناطق Owner/Admin/Debug/API/Infra وليست أهدافًا أولى لأي تعديل منتجي عادي.

## Known Hotspots

- `src/App.tsx`
أعلى ملف من حيث احتمالية كسر أكثر من مسار في نفس الوقت.

- `src/components/AppSidebar.tsx`
يجمع مداخل user مع admin/coach وبعض حالات القفل.

- `app/client-app-entry.tsx`
يوجد قربه تكرار مع `app/client-app.tsx`، لذلك لا يُفضّل فتحه في تعديلات المنتج اليومية.

- `app/api/gemini/[action]/route.ts`
يحتاج مراجعة منفصلة لاحقًا لأنه يبدو غير متوافق مع غرضه الحالي.

## Regression Checks

بعد أي تعديل user-facing:

1. تأكد أن الهبوط يعمل في `user` mode.
2. تأكد أن الانتقال من `landing` إلى `map` ما زال سليمًا.
3. تأكد أن الأدوات المقفلة ما زالت تعرض locked state الصحيح.
4. تأكد أن أي تجربة AI ما زالت توضّح هل المصدر AI أو template عند الحاجة.
5. تأكد أن أي تعديل لم يفتح مسار `admin` أو `coach` أو كسر redirect خاص بـ Phase One.

## Working Rule

إذا احتاج الطلب تعديلًا في التنقل أو القفل نفسه، يجب تحديث:

- `src/navigation/navigationMachine.ts`
- `src/App.tsx`

معًا، وليس أحدهما فقط.
