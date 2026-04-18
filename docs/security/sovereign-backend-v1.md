# Sovereign Backend Architecture (v1.0) - Django Edition

هذا المستند يحدد المعايير المعمارية لـ "البنك السيادي للمعلومات" في مشروع الرحلة، بإستخدام Django كمحرك خلفي (Backend Engine).

## 1. فلسفة الأمان (Security Philosophy)
الأمان في "الرحلة" مش مجرد جدران حماية، ده **عهد (Contract)** بيننا وبين المسافر. إحنا بنضمن له إن بصيرته (Insights) وتاريخه الشخصي مأمنين بمبادئ "المبادئ الأولى".

## 2. الهيكلية المقترحة (Proposed Structure)

### أ. طبقة تشفير البيانات (Data Encryption Layer)
- **At-Rest Encryption**: استخدام `django-cryptography` أو `cryptography.fernet` لتشفير حقول الـ `TextField` اللي بتحتوي على مشاعر أو أفكار المستخدم.
- **Key Rotation**: مفتاح التشفير لازم يتم تغييره دورياً عن طريق الـ Environment variables.

### ب. نظام الصلاحيات السيادي (Sovereign RBAC)
| الدور (Role) | الصلاحيات (Permissions) |
|---|---|
| **Traveler (User)** | قراءة وكتابة بياناته الشخصية فقط. لا وصول للـ Admin. |
| **Guardian (Moderator)** | مراجعة البلاغات والتعامل مع المحتوى المرفوض بدون رؤية البيانات الشخصية المشفرة. |
| **Owner (Architect)** | تحكم كامل في الإعدادات والـ System Prompts بدون الوصول المباشر لـ "أسرار" المستخدمين. |

### ج. الـ API Gateway و الأمان
- **JWT with Strict Expiry**: استخدام `djangorestframework-simplejwt` مع مدة صلاحية قصيرة (15 دقيقة) وتجديد بالـ Refresh Token.
- **Rate Limiting**: تطبيق `django-ratelimit` على كل مسارات الـ AI والـ Login.

## 3. التكامل مع الـ AI (Secure AI Bridge)
- **Orchestrator Pattern**: الـ Django Backend هو اللي بيعمل "طبخ" للـ Prompt. بيشيل أي بيانات شخصية (PII) ويحط مكانها IDs مؤقتة قبل ما يبعتها للـ AI.
- **Response Validation**: كل مخرجات الـ AI لازم تتفلتّر من أي محاولات لسرقة البيانات أو الـ Scripting.

---
**إمضاء: خبير أمان Django (Sovereign Intelligence Unit)**
