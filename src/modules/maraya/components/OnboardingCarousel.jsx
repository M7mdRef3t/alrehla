import React from 'react';
import BrandMark from './BrandMark.jsx';

const SLIDES = {
  en: [
    {
      title: 'Begin with what you carry, not what you type.',
      body: 'Maraya opens as a ritual. A feeling, a whisper, or a room is enough to start.',
    },
    {
      title: 'The mirror turns emotion into cinema.',
      body: 'Each step reframes the feeling as image, narration, and choice until the shape becomes visible.',
    },
    {
      title: 'You leave with proof, not just a scene.',
      body: 'Every journey closes with a transformation you can revisit, remember, and carry forward.',
    },
  ],
  ar: [
    {
      title: 'ابدأ بما تحمله داخلك، لا بما تكتبه.',
      body: 'تبدأ مرايا كطقس شخصي. يكفي شعور أو همسة أو صورة مكان لتبدأ الرحلة.',
    },
    {
      title: 'تحوّل المرآة الشعور إلى سينما.',
      body: 'كل خطوة تعيد تشكيل الإحساس إلى صورة وسرد واختيار حتى يظهر شكل التحول بوضوح.',
    },
    {
      title: 'تغادر ومعك أثر واضح، لا مشهد عابر.',
      body: 'كل رحلة تنتهي بدليل تحول يمكنك أن تتذكره وتعود إليه وتحمله معك.',
    },
  ],
};

export default function OnboardingCarousel({
  uiLanguage = 'ar',
  index = 0,
  onNext,
  onBack,
  onSkip,
}) {
  const isEn = uiLanguage === 'en';
  const slides = isEn ? SLIDES.en : SLIDES.ar;
  const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
  const isLast = index >= slides.length - 1;

  return (
    <section
      className="onboarding"
      aria-label={isEn ? 'Onboarding' : 'التعريف'}
      onTouchStart={(e) => {
        const x = e.touches?.[0]?.clientX ?? 0;
        e.currentTarget.dataset.touchX = String(x);
      }}
      onTouchEnd={(e) => {
        const startX = Number(e.currentTarget.dataset.touchX || 0);
        const endX = e.changedTouches?.[0]?.clientX ?? startX;
        const delta = endX - startX;
        if (delta < -40) onNext?.();
        if (delta > 40) onBack?.();
      }}
    >
      <div className="onboarding__media">
        <BrandMark className="onboarding__brand" withWordmark />
      </div>

      <div className="onboarding__content glass-card">
        <p className="onboarding__eyebrow">
          {isEn ? `Ritual 0${index + 1}` : `الطقس 0${index + 1}`}
        </p>
        <h2 className="onboarding__title">{slide.title}</h2>
        <p className="onboarding__body">{slide.body}</p>

        <div className="onboarding__dots" role="tablist" aria-label={isEn ? 'Slides' : 'الشرائح'}>
          {slides.map((_, i) => (
            <span key={i} className={`onboarding__dot ${i === index ? 'onboarding__dot--active' : ''}`} />
          ))}
        </div>

        <div className="onboarding__actions">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onSkip}>
            {isEn ? 'Skip' : 'تخطي'}
          </button>
          <button type="button" className="ds-btn ds-btn--primary" onClick={onNext}>
            {isLast ? (isEn ? 'Start' : 'ابدأ') : (isEn ? 'Continue' : 'متابعة')}
          </button>
        </div>
      </div>
    </section>
  );
}
