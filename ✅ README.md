# Al-Rehla (الرحلة) — أداة دواير

---
**Dawayir v1.0 | Built to observe before it speaks.**
---

منصّة رحلات داخلية تساعد المستخدم "يشوف" حدوده في العلاقات ويأخذ قرار سريع بدون تحليل مُرهِق. أداة **دواير** هي البوصلة الأولى داخل الرحلة.

## Quick Links
- docs/index.md (مدخل الوثائق)
- docs/concept.md
- docs/user-journey.md
- docs/pitch.md

## Repo Sections
- docs/        : رؤية المنتج (Concept/Journey/Pitch)
- product/     : MVP + قصص المستخدم + معايير القبول
- design/      : Copy + Tone + Wireframes
- specs/       : Data model + Interactions + API contract
- prompts/     : برومبتات للـAI داخل Cursor
- .cursor/     : قواعد Cursor للمشروع

## Start Here
1) اقرأ docs/index.md  
2) افتح product/mvp-scope.md  
3) حوّل الـMVP لتاسكات على Cursor

## Local Env Notes
- انسخ [`.env.local.example`](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/.env.local.example) إلى `.env.local` واضبط القيم التي تحتاجها.
- `VITE_APP_ENV=dev` لتشغيل وضع التطوير، و`VITE_APP_ENV=user` لمحاكاة وضع المستخدم.
- `VITE_APP_CONTENT_REALTIME` و`NEXT_PUBLIC_APP_CONTENT_REALTIME` اختياريان:
  في `dev` يكون Realtime الخاص بـ `app_content` مطفأ افتراضيًا لتقليل ضوضاء الـ console، وفي `prod` يكون مفعّلًا افتراضيًا.
  فعّله يدويًا فقط لو كنت تحتاج مزامنة لحظية أثناء التطوير.
