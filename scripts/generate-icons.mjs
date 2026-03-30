/**
 * Script لتوليد أيقونات PWA من SVG
 * 
 * Usage: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const ICONS_DIR = join(ROOT_DIR, 'public', 'icons');

// الأحجام المطلوبة للـ PWA
const SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

// SVG source - نستخدم الدوائر الثلاثة كأيقونة
const SVG_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc"/>
      <stop offset="100%" style="stop-color:#e2e8f0"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  
  <!-- الدائرة الحمراء (الخارجية) -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="#fca5a5" stroke-width="28" opacity="0.8"/>
  
  <!-- الدائرة الصفراء (الوسطى) -->
  <circle cx="256" cy="256" r="140" fill="none" stroke="#fcd34d" stroke-width="24" opacity="0.85"/>
  
  <!-- الدائرة الخضراء (الداخلية) -->
  <circle cx="256" cy="256" r="80" fill="none" stroke="#5eead4" stroke-width="20"/>
  
  <!-- المركز (أنا) -->
  <circle cx="256" cy="256" r="36" fill="#0D9488"/>
  
  <!-- نقاط تمثل الأشخاص -->
  <circle cx="256" cy="180" r="12" fill="#14b8a6"/>
  <circle cx="320" cy="220" r="10" fill="#fbbf24"/>
  <circle cx="192" cy="220" r="10" fill="#fbbf24"/>
  <circle cx="340" cy="310" r="8" fill="#f87171"/>
  <circle cx="172" cy="310" r="8" fill="#f87171"/>
</svg>
`;

async function generateIcons() {
  console.log('🎨 بدء توليد أيقونات PWA...\n');
  
  // إنشاء مجلد الأيقونات لو مش موجود
  await mkdir(ICONS_DIR, { recursive: true });
  
  // تحويل SVG إلى Buffer
  const svgBuffer = Buffer.from(SVG_ICON);
  
  // توليد كل الأحجام
  for (const size of SIZES) {
    const filename = size === 180 
      ? 'apple-touch-icon.png' 
      : `icon-${size}x${size}.png`;
    
    const outputPath = join(ICONS_DIR, filename);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ فشل في توليد ${filename}:`, error.message);
    }
  }
  
  // توليد favicon.ico (16x16 و 32x32)
  try {
    // نستخدم PNG 32x32 كـ favicon
    const faviconPath = join(ICONS_DIR, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconPath);
    console.log('✅ favicon.ico (32x32)');
  } catch (error) {
    console.error('❌ فشل في توليد favicon:', error.message);
  }
  
  // حفظ SVG الأصلي
  const svgPath = join(ICONS_DIR, 'icon.svg');
  await writeFile(svgPath, SVG_ICON.trim());
  console.log('✅ icon.svg (vector)');
  
  console.log('\n🎉 تم توليد جميع الأيقونات بنجاح!');
  console.log(`📁 المسار: ${ICONS_DIR}`);
}

generateIcons().catch(console.error);
