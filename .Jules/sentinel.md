# Sentinel Journal

## 2026-02-27 - Unbounded AI Payload Guard
**Vulnerability:** مسار `app/api/chat/agent` كان يستقبل payload غير محدود قبل استدعاء الـ LLM، ما يفتح باب استنزاف تكلفة التوكنز وطلبات DoS من أحجام رسائل ضخمة.
**Learning:** المسارات المرتبطة مباشرة بمزود AI تحتاج حدودًا صارمة عند حافة الـ API قبل أي منطق عمل أو استعلامات.
**Prevention:** فرض سقف `content-length` وحد أقصى لعدد الرسائل وطول الرسالة في كل Route يمرر بيانات إلى LLM.
