import { useEffect } from "react";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

/**
 * usePersonalizedBiometrics
 * ========================
 * يربط الحالة النفسية ومستوى الطاقة (النبضة الأخيرة) بالخصائص الفيزيائية للواجهة.
 * هذا هو معالج نفسي صامت (Silent Therapist) يتفاعل مع جسد ووعي الزائر.
 */
export function usePersonalizedBiometrics() {
  const lastPulse = usePulseState((s) => s.lastPulse);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!lastPulse) {
      // إزالة التأثير لو مفيش نبضة
      document.documentElement.style.removeProperty("--personal-speed-mod");
      document.documentElement.classList.remove("bio-mode-frantic", "bio-mode-withdrawn");
      return;
    }

    const { mood, energy } = lastPulse;

    const isFrantic = ["anxious", "angry", "tense", "overwhelmed"].includes(mood) && energy > 6;
    const isWithdrawn = ["sad", "overwhelmed", "anxious"].includes(mood) && energy < 4;
    const isZen = ["calm", "bright", "hopeful"].includes(mood) && energy >= 5;

    let speedModifier = 1.0;

    // إزالة الحالات السابقة
    document.documentElement.classList.remove("bio-mode-frantic", "bio-mode-withdrawn", "bio-mode-zen");

    if (isFrantic) {
      // طاقة عالية جداً وغضب/استياء -> الواجهة تمتصه وتبطئ عشان تهدّيه
      speedModifier = 1.5; // (مدة أكبر = سرعة أبطأ)
      document.documentElement.classList.add("bio-mode-frantic");
    } else if (isWithdrawn) {
      // طاقة منعدمة وحزن -> الواجهة تسرع بخفة عشان تدي حيوية بدون إزعاج
      speedModifier = 0.8;
      document.documentElement.classList.add("bio-mode-withdrawn");
    } else if (isZen) {
      // متصالح وفي حالة سريان -> الواجهة تتناغم وتصبح سلسة جداً
      speedModifier = 1.1;
      document.documentElement.classList.add("bio-mode-zen");
    }

    // تطبيق المعدل المخصص
    document.documentElement.style.setProperty("--personal-speed-mod", `${speedModifier}`);

  }, [lastPulse]);
}
