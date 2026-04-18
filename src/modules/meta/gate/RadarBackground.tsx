import React from 'react';
import { AppAtmosphere } from '@/components/shared/AppAtmosphere';

/**
 * RadarBackground — نسخة غلاف للـ AppAtmosphere في وضع الرادار
 * تحافظ على الـ Imports القديمة مع توحيد المنطق البصري.
 */
export default function RadarBackground() {
  return (
    <AppAtmosphere mode="radar" intensity={1} />
  );
}
