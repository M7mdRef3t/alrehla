---
name: django-security-expert
description: Expert security guidance for Django backends, focusing on data protection, RBAC, and secure AI integration.
license: MIT
metadata:
  version: "1.0.0"
  path: "Backend/Django-Best-Practices"
  author: "Dawayir Sovereign Intelligence"
---

# Django Security Expert Skill

هذه المهارة تُمكّن الوكيل من تطبيق أعلى معايير الأمان في بيئة Django، مع التركيز الخاص على مشروع "الرحلة" وحماية بيانات المستخدمين (الأرواح المسافرة).

## المبادئ الأساسية (Principles)

1. **السيادة قبل كل شيء**: البيانات ملك للمستخدم. الـ Backend هو مجرد "حارس" (Guardian) وليس مالكاً.
2. **الحد الأدنى من الوصول (Least Privilege)**: لا تمنح أي صلاحية إلا لمن يحتاجها فعلياً.
3. **الدفاع المتعدد (Defense in Depth)**: لا تعتمد على طبقة أمان واحدة (مثلاً: لا تكتفي بـ Supabase RLS).

## أفضل الممارسات الأمنية (Best Practices)

### 1. الإعدادات والبيئة (Settings & Env)
- **DEBUG = False**: دائماً في الإنتاج.
- **SECRET_KEY**: يجب أن يكون مخفياً في `.env` ولا يُرفع أبداً.
- **Security Headers**: تفعيل `SECURE_BROWSER_XSS_FILTER`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS = 'DENY'`.

### 2. الوصول والصلاحيات (Auth & Permissions)
- استخدام **Custom User Model** من البداية للتحكم في الحقول السيادية.
- تطبيق **Role-Based Access Control (RBAC)** بناءً على أدوار (Owner, Traveler, Guardian).
- تفعيل **Two-Factor Authentication (2FA)** لمسارات القيادة (Admin).

### 3. معالجة البيانات (Data Handling)
- **Field-level Encryption**: تشفير الحقول الحساسة (مثل "البصيرة" أو "المخاوف") قبل حفظها في قاعدة البيانات.
- **Data Anonymization**: مسح البيانات الشخصية من الـ AI Logs فور الانتهاء من المعالجة.

### 4. حماية الـ AI Integration
- **Sanitizing AI Inputs**: فحص المدخلات قبل إرسالها للـ LLM لمنع الـ Prompt Injection.
- **Validating Structure**: استخدام `Pydantic` أو `Zod` (عبر أدوات التحويل) للتأكد من أن مخرجات الـ AI لا تحتوي على أكواد خبيثة.

## روابط مرجعية
- [Django Security Docs](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Django Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html) (Adapting concepts)
