# Roles And Access (وثيقة الأدوار والصلاحيات)

هذه الوثيقة هي مرجع سريع "Source of Truth" لأدوار المستخدم (Roles) داخل المنصة: ما هي، ماذا تفتح، وأين يتم تعديلها في الكود عند أي تغيير مستقبلي.

## User Access Roles (أدوار الصلاحيات)

الأدوار الفعلية المتداولة داخل النظام حاليًا:
- `user`
- `admin`
- `developer`
- `owner`
- `superadmin`

ملاحظات:
- أي قيمة دور غير معروفة للنظام يتم التعامل معها كـ "غير مميّز" (غير privileged) في منطق الـ features.
- `user` هو الافتراضي عند غياب الدور في بيانات المستخدم في لوحة الأدمن API.

## Privileged Roles (أدوار مميّزة)

الأدوار المميّزة تفعّل "God Mode" لميزات المنصة (تجاوز feature flags):
- المصدر: `src/utils/featureFlags.ts`
- التعريف: `PRIVILEGED_ROLES = ["admin", "owner", "superadmin", "developer"]`

النتيجة:
- أي مستخدم بدور ضمن `PRIVILEGED_ROLES` يحصل على `godMode = true` وبالتالي كل الـ feature flags تصبح `true`.

## Admin Panel Gate (من يستطيع فتح /admin)

الدخول للوحة الأدمن يتم عبر قائمة أدوار مسموح بها:
- المصدر: `src/components/admin/AdminDashboard.tsx`
- المتغير: `VITE_ADMIN_ALLOWED_ROLES`
- الافتراضي عند عدم تحديده: `admin,owner,superadmin,developer`

ملاحظة:
- وجود الدور في `PRIVILEGED_ROLES` لا يكفي وحده لفتح `/admin` إذا تم تقييد `VITE_ADMIN_ALLOWED_ROLES` بقيم مختلفة.

## Role Options In Admin UI (خيارات تغيير الدور)

قائمة الأدوار التي تظهر في dropdown لتغيير دور المستخدم:
- المصدر: `src/components/admin/AdminDashboard.tsx`
- التعريف: `ROLE_OPTIONS = ["user", "admin", "developer", "owner", "superadmin"]`

هذه القائمة يجب أن تبقى متسقة مع:
- `PRIVILEGED_ROLES` في `src/utils/featureFlags.ts`
- `VITE_ADMIN_ALLOWED_ROLES` الافتراضي أو المخصص

## Where Roles Come From (مصدر الدور)

قراءة الدور تتم عبر:
- `profiles.role` من Supabase (إذا كان Supabase متاح)
- أو `user_metadata.role` / `app_metadata.role` (fallback)

المصدر: `src/state/authState.ts`

## Dev Testing Links (روابط اختبار الأدوار في التطوير)

مهم:
- `asRole` يعمل فقط في وضع التطوير (DEV) حسب `src/state/authState.ts`.

روابط سريعة:
- `/?asRole=user`
- `/?asRole=admin`
- `/?asRole=developer`
- `/?asRole=owner`
- `/?asRole=superadmin`

لوحة الأدمن:
- `/admin?asRole=admin`
- `/admin?asRole=developer`
- `/admin?asRole=owner`
- `/admin?asRole=superadmin`

## Change Checklist (عند إضافة/تعديل Role)

عند إدخال Role جديد أو تعديل سلوك الأدوار:
1. قرّر هل الدور "privileged" أم لا. عدّل `src/utils/featureFlags.ts` لو لزم.
2. عدّل `VITE_ADMIN_ALLOWED_ROLES` الافتراضي أو وثّق قيمة الإنتاج المطلوبة في `.env`/إعدادات النشر.
3. حدّث `ROLE_OPTIONS` في `src/components/admin/AdminDashboard.tsx` إذا كان يجب أن يظهر الدور في dropdown.
4. تأكد من كتابة الدور في `profiles.role` أو metadata في Supabase بما يتسق مع سياساتكم.
5. راجع الاختبارات: `src/utils/featureFlags.test.ts` (أضف حالة للدور الجديد إن لزم).

## Not User Roles (أدوار ليست صلاحيات)

يوجد مصطلح "role" أيضًا لمعنى "نوع علاقة/مجال" داخل المنتج. هذه ليست صلاحيات مستخدم:
- أطلس/إحصائيات الخريطة: `family`, `work`, `love`, `money`, `unknown` في `src/services/atlasAggregation.ts`
- توليد مسار التعافي: `family`, `work`, `love`, `money`, `general`, `unknown` في `src/utils/pathGenerator.ts`
- سيناريوهات التدريب: `family`, `work`, `partner`, `all` في `src/data/symptomScenarios.ts`

