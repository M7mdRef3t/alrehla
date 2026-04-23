import { fetchThemePalette as fetchThemePaletteSetting, type ThemePalette } from "./admin/adminSettings";
import { getDocumentOrNull } from "./clientRuntime";

function applyThemePaletteInternal(palette: ThemePalette | null) {
  const documentRef = getDocumentOrNull();
  if (!documentRef || !palette) return;
  const root = documentRef.documentElement;
  if (palette.primary) {
    root.style.setProperty("--soft-teal", palette.primary);
  }
  if (palette.accent) {
    root.style.setProperty("--warm-amber", palette.accent);
  }
  if (palette.nebulaBase) {
    root.style.setProperty("--space-mid", palette.nebulaBase);
    root.style.setProperty("--space-nebula", palette.nebulaBase);
  }
  if (palette.nebulaAccent) {
    root.style.setProperty("--space-aurora", palette.nebulaAccent);
  }
  if (palette.glassBackground) {
    root.style.setProperty("--glass-bg", palette.glassBackground);
  }
  if (palette.glassBorder) {
    root.style.setProperty("--glass-border", palette.glassBorder);
  }
}

export async function initThemePalette() {
  try {
    const palette = await fetchThemePaletteSetting();
    applyThemePaletteInternal(palette);
  } catch {
    // نتجاهل أي خطأ في تحميل الألوان — نرجع للقيم الافتراضية
  }
}

export function applyThemePalette(palette: ThemePalette) {
  applyThemePaletteInternal(palette);
}

