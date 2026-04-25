/**
 * Generate PWA icons from the falcon SVG logo
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SVG_PATH = join(ROOT, 'public', 'logo-icon.svg');
const ICONS_DIR = join(ROOT, 'public', 'icons');

const SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

const svgBuffer = readFileSync(SVG_PATH);

async function generate() {
  console.log('🦅 Generating Peregrine Falcon PWA icons...\n');

  for (const size of SIZES) {
    const outputPath = join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 10, g: 22, b: 40, alpha: 1 } })
      .png({ quality: 100 })
      .toFile(outputPath);
    console.log(`  ✅ icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const applePath = join(ICONS_DIR, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 10, g: 22, b: 40, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(applePath);
  console.log('  ✅ apple-touch-icon.png (180x180)');

  // Copy to icons/icon.svg  
  const iconSvgDest = join(ICONS_DIR, 'icon.svg');
  writeFileSync(iconSvgDest, svgBuffer);
  console.log('  ✅ icon.svg (updated)');

  console.log('\n🎉 All icons generated successfully!');
}

generate().catch(console.error);
