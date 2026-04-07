"use client";

import { Cloud, CloudLightning, CloudRain, Sun, SunDim } from "lucide-react";
import type { LiveLanguage } from '../types';

const WEATHER_STATES = [
  {
    id: "storm",
    ar: "عاصفة",
    en: "Storm",
    descAr: "عقلك كان في حالة عصف. الأفكار متشابكة وتحتاج لبعض الوقت لتهدأ قبل اتخاذ أي قرار.",
    descEn: "Your mind was in a storm. Thoughts are tangled, so give yourself time to settle before any decision.",
    glow: "rgba(255,120,50,0.4)",
    Icon: CloudLightning,
  },
  {
    id: "rain",
    ar: "مطر",
    en: "Rain",
    descAr: "المنطقة العاطفية كانت نشطة. اسمح لمشاعرك أن تأخذ مساحتها دون استعجال.",
    descEn: "Emotional processing was active. Let your feelings take their space without rushing.",
    glow: "rgba(0,200,255,0.4)",
    Icon: CloudRain,
  },
  {
    id: "cloudy",
    ar: "غيوم",
    en: "Cloudy",
    descAr: "التفكير التحليلي كان طاغيًا. الأمور ليست صافية بالكامل لكنك تربط الخيوط ببعض.",
    descEn: "Analytical thinking dominated. Things are not fully clear yet, but the dots are connecting.",
    glow: "rgba(180,180,220,0.4)",
    Icon: Cloud,
  },
  {
    id: "partly",
    ar: "مشمس جزئيًا",
    en: "Partly Sunny",
    descAr: "بدأت لحظات البصيرة في الظهور. هناك وضوح يتكوّن وسط المشهد.",
    descEn: "Moments of insight are emerging. Clarity is beginning to form.",
    glow: "rgba(255,220,80,0.4)",
    Icon: SunDim,
  },
  {
    id: "sunny",
    ar: "مشمس",
    en: "Sunny",
    descAr: "الرؤية أصبحت صافية. الحقيقة والوعي متوافقان، والوقت مناسب لخطوة عملية.",
    descEn: "Vision is clear. Truth and awareness are aligned, and this is a good time for action.",
    glow: "rgba(255,200,0,0.6)",
    Icon: Sun,
  },
] as const;

function getWeatherId(dominantNodeId: number, clarityDelta: number, overloadIndex: number) {
  if (dominantNodeId === 3 || clarityDelta > 0.05) return "sunny";
  if (dominantNodeId === 2) return clarityDelta > 0 ? "partly" : "cloudy";
  if (overloadIndex > 0.5) return "storm";
  return "rain";
}

export default function CognitiveWeatherSummary({
  dominantNodeId,
  clarityDelta,
  overloadIndex,
  language,
}: {
  dominantNodeId: number;
  clarityDelta: number;
  overloadIndex: number;
  language: LiveLanguage;
}) {
  const weatherId = getWeatherId(dominantNodeId, clarityDelta, overloadIndex);
  const weather = WEATHER_STATES.find((entry) => entry.id === weatherId) ?? WEATHER_STATES[0];
  const Icon = weather.Icon;

  return (
    <div className="cognitive-weather-summary" style={{ ["--weather-glow" as string]: weather.glow }}>
      <div className="weather-forecast-icon" role="img" aria-label={language === "ar" ? weather.ar : weather.en}>
        <Icon size={28} />
      </div>
      <div className="weather-forecast-content">
        <div className="weather-forecast-title">
          {language === "ar" ? "طقسك المعرفي:" : "Your Cognitive Weather:"}{" "}
          <span className="weather-forecast-name">{language === "ar" ? weather.ar : weather.en}</span>
        </div>
        <div className="weather-forecast-desc">{language === "ar" ? weather.descAr : weather.descEn}</div>
      </div>
    </div>
  );
}
