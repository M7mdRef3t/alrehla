/* eslint-disable react-refresh/only-export-components */
export const dynamic = "force-dynamic";
import React from 'react';
import DawayirLiveApp from '../../src/modules/dawayir-live/DawayirLiveApp';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'دواير لايف — المرآة المعرفية الحية',
  description: 'تحدث بصوتك وشاهد عقلك يتغير أمامك — تجربة حية بالذكاء الاصطناعي لاستكشاف أفكارك ومشاعرك في الوقت الحقيقي.',
  alternates: { canonical: "https://www.alrehla.app/dawayir-live" },
  openGraph: {
    title: 'دواير لايف — المرآة المعرفية الحية | الرحلة',
    description: 'تحدث بصوتك وشاهد عقلك يتغير أمامك — تجربة ذكاء اصطناعي حية.',
    url: 'https://www.alrehla.app/dawayir-live',
    siteName: 'الرحلة',
    locale: 'ar_AR',
    type: 'website',
    images: [{ url: '/og-home-optimized.jpg', width: 1200, height: 630, alt: 'دواير لايف — المرآة المعرفية' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دواير لايف — المرآة المعرفية الحية | الرحلة',
    description: 'تحدث بصوتك وشاهد عقلك يتغير أمامك.',
    images: ['/og-home-optimized.jpg'],
  },
};

export default function DawayirLivePage() {
  return <DawayirLiveApp />;
}
