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
      <div className="maraya-fallback">
        <div className="maraya-fallback-inner">
          <div className="maraya-fallback-title">مرايا</div>
          <div>Loading Maraya...</div>
        </div>
      </div>
    }>
      <MarayaApp />
    </Suspense>
  );
}
