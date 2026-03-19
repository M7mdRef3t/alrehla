'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MarayaApp to avoid SSR issues (WebAudio, window, etc.)
const MarayaApp = dynamic(
  () => import('@/modules/maraya/MarayaApp.jsx'),
  { ssr: false }
);

export default function MarayaPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0f', color: '#ffd700',
        fontFamily: 'Inter, sans-serif', fontSize: '1.2rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>مرايا</div>
          <div>Loading Maraya...</div>
        </div>
      </div>
    }>
      <MarayaApp />
    </Suspense>
  );
}
