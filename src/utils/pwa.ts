import { getWindowOrNull } from "../services/clientRuntime";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isStandaloneDisplay(): boolean {
  const windowRef = getWindowOrNull();
  if (!windowRef) return false;
  const nav = windowRef.navigator as Navigator & { standalone?: boolean };
  return windowRef.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function isLikelyInAppBrowser(ua: string): boolean {
  return /(FBAN|FBAV|Instagram|Line|TikTok|Snapchat|wv)/i.test(ua);
}

export function showInstallInstructions(options: {
  isAndroid: boolean;
  isIOS: boolean;
  isInAppBrowser: boolean;
}) {
  const windowRef = getWindowOrNull();
  if (!windowRef) return;

  if (options.isInAppBrowser) {
    windowRef.alert('متصفح التطبيق الحالي لا يدعم التثبيت مباشرة. افتح الصفحة في Chrome أو Safari ثم اختر "إضافة إلى الشاشة الرئيسية".');
    return;
  }

  if (options.isAndroid) {
    windowRef.alert('على Android: افتح قائمة المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home screen).');
    return;
  }

  if (options.isIOS) {
    windowRef.alert('على iPhone/iPad: اضغط زر المشاركة ثم اختر "إضافة إلى الشاشة الرئيسية".');
    return;
  }

  windowRef.alert('على Chrome أو Edge من الكمبيوتر: افتح قائمة المتصفح ثم اختر "Install app" أو "تثبيت التطبيق".');
}
