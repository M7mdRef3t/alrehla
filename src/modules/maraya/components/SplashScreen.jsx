import React from 'react';
import BrandMark from './BrandMark.jsx';

export default function SplashScreen({ uiLanguage = 'ar', title = 'Maraya', tagline = '' }) {
  const isEn = uiLanguage === 'en';
  return (
    <section className="splash-screen" aria-label={isEn ? 'Splash screen' : 'شاشة البداية'}>
      <BrandMark className="splash-screen__brand" withWordmark />
      <h1 className="splash-screen__title">{title}</h1>
      <p className="splash-screen__tagline">
        {tagline || (isEn ? 'Your emotions become cinema.' : 'مشاعرك تصبح سينما.')}
      </p>
    </section>
  );
}
