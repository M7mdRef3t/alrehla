# أيقونات PWA

## الملفات المطلوبة

لتفعيل PWA بشكل كامل، تحتاج إنشاء الأيقونات التالية من ملف `icon.svg`:

### أيقونات عامة
- `icon-16x16.png`
- `icon-32x32.png`
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### أيقونات Apple
- `apple-touch-icon.png` (180x180)

### أيقونات Safari
- `safari-pinned-tab.svg` (أبيض وأسود فقط)

## كيفية التوليد

### خيار 1: استخدام أداة أونلاين
1. افتح [realfavicongenerator.net](https://realfavicongenerator.net/)
2. ارفع ملف `icon.svg`
3. حمّل الأيقونات الناتجة وضعها في هذا المجلد

### خيار 2: استخدام أداة CLI
```bash
# تثبيت pwa-asset-generator
npm install -g pwa-asset-generator

# توليد الأيقونات
pwa-asset-generator icon.svg ./icons --icon-only --favicon
```

### خيار 3: استخدام ImageMagick
```bash
# تحويل SVG إلى PNG بأحجام مختلفة
for size in 16 32 72 96 128 144 152 192 384 512; do
  convert -background none -resize ${size}x${size} icon.svg icon-${size}x${size}.png
done

# Apple Touch Icon
convert -background none -resize 180x180 icon.svg apple-touch-icon.png
```

## ملاحظة

التطبيق سيعمل بدون الأيقونات، لكن:
- لن يظهر بشكل صحيح عند التثبيت على الموبايل
- لن يظهر في شاشة Splash عند فتح التطبيق

يُنصح بإنشاء الأيقونات قبل نشر التطبيق.
