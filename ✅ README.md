# Al-Rehla (الرحلة) — منصة الوعي الذاتي 🧭

---
**Al-Rehla Platform | From MVP to Control Plane**
---

منصّة رحلات داخلية متكاملة تساعد المستخدم "يشوف" حدوده في العلاقات ويأخذ قرار سريع. النظام الآن يشمل (App Shell, AI Engine, Marketing Funnel, Admin Control, Manual Checkout).

## 🎯 الحقيقة الوحيدة (The Golden Path)
انظر [**`PRODUCT_TRUTH.md`**](/c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/PRODUCT_TRUTH.md) للحصول على المسار المعتمد للمنتج وتحقيق هدف الـ $1000.

## Quick Links
- docs/index.md (مدخل الوثائق الشامل)
- PRODUCT_TRUTH.md (الخطة الحالية للمبيعات)
- product/mvp-scope.md (المرجع التاريخي للـ MVP)

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
