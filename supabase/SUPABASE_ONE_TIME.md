# تشغيل Supabase مرة واحدة

مطلوب منك **ثلاث خطوات فقط** داخل لوحة Supabase (ما نقدرش ننفذها عنك من هنا).

---

## 1) تشغيل الـ SQL

1. افتح [Supabase](https://supabase.com/dashboard) → مشروعك.
2. من القائمة: **SQL Editor**.
3. **New query**.
4. انسخ **كل** محتوى الملف `supabase/full-setup.sql` والصقه في الاستعلام.
5. اضغط **Run**.

---

## 2) تفعيل Realtime لـ `app_content`

1. من القائمة: **Database** → **Replication**.
2. جدول **app_content** → فعّل **Realtime** (لو مش مفعّل).

كده التعديلات على النصوص هتظهر فوراً لكل من فاتح الموقع.

---

## 3) جعل حسابك Owner (لو محتاج تعدّل النصوص من الواجهة)

1. من القائمة: **Authentication** → **Users**.
2. اختر حسابك وانسخ **User UID** (شكل UUID).
3. روح **SQL Editor** → استعلام جديد.
4. نفّذ (واستبدل `YOUR_USER_ID` بالـ UUID اللي نسخته):

```sql
update public.profiles set role = 'owner' where id = 'YOUR_USER_ID';
```

---

بعد كده مفيش حاجة إضافية على Supabase من جهتك.
