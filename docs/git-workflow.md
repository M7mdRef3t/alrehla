# سير العمل: تطوير vs نشر

## المساران

| المسار | الفرع | متى نستخدمه | النشر على Vercel |
|--------|--------|-------------|-------------------|
| **تطوير** | `develop` | العمل اليومي، تجارب، ميزات تحت التطوير | لا (أو Preview فقط لو ضبطته) |
| **نشر** | `main` | عند قرار "نشر للمستخدمين" | نعم (Production تلقائي) |

## إعداد مرة واحدة

```bash
# إنشاء فرع التطوير من main الحالي
git checkout -b develop
git push -u origin develop
```

في **Vercel → Project → Settings → Git**:  
اترك **Production Branch** = `main`.  
(اختياري: فعّل Preview Deployments لبقية الفروع عشان كل push على `develop` يطلع لك رابط preview.)

## العمل اليومي (تطوير)

- اعمل على الفرع `develop`:
  ```bash
  git checkout develop
  # ... تعديلات ...
  git add .
  git commit -m "وصف التعديل"
  git push origin develop
  ```
- الرفع على `develop` **لا** ينشر على الموقع الحقيقي (إلا لو عندك Preview لفرع develop).

## عند قرار النشر

- دمج `develop` في `main` ورفع `main`:
  ```bash
  git checkout main
  git pull origin main
  git merge develop
  git push origin main
  ```
- بعد الـ push على `main`، Vercel ينشر تلقائيًا (Production).

## أوامر سريعة (اختياري)

- `npm run push:dev` — رفع التعديلات على `develop`.
- `npm run release` — دمج `develop` في `main` ورفع للنشر (يحتاج أنك على `develop` ومُحدَّث).
