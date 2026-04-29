/**
 * Wrapped Components with Error Boundaries
 * مكونات مغلفة بـ Error Boundaries
 */

import { ErrorBoundary, MapErrorFallback, ChatErrorFallback, PulseErrorFallback } from '@/modules/action/ErrorBoundary';

import { lazy, Suspense, type ComponentProps } from "react";

// Lazy load components
const CoreMapScreen = lazy(() => import("../exploration/CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));
const AIChatbot = lazy(() => import("../action/AIChatbot").then((m) => ({ default: m.AIChatbot })));
const PulseCheckModal = lazy(() => import("../exploration/PulseCheckModal").then((m) => ({ default: m.PulseCheckModal })));

import { StandardLoadingFallback } from "./app-shell/StandardLoadingFallback";


// Extract prop types from components
type CoreMapScreenProps = ComponentProps<typeof CoreMapScreen>;
type AIChatbotProps = ComponentProps<typeof AIChatbot>;
type PulseCheckModalProps = ComponentProps<typeof PulseCheckModal>;

// Wrapped with Error Boundaries
export function SafeCoreMapScreen(props: CoreMapScreenProps) {
  return (
    <ErrorBoundary fallback={<MapErrorFallback />}>
      <Suspense fallback={
        <StandardLoadingFallback 
          color="teal" 
          message="جاري استحضار الخريطة..." 
          headerMode="none"
        />
      }>
        <CoreMapScreen {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Preload CoreMapScreen to eliminate loading flicker on first navigation
export function preloadCoreMapScreen() {
  void import("../exploration/CoreMapScreen");
}

export function SafeAIChatbot(props: AIChatbotProps) {
  return (
    <ErrorBoundary fallback={<ChatErrorFallback />}>
      <Suspense fallback={<StandardLoadingFallback color="indigo" message="جاري تحميل المحادثة..." fullScreen={false} />}>
        <AIChatbot {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

export function SafePulseCheckModal(props: PulseCheckModalProps) {
  return (
    <ErrorBoundary fallback={<PulseErrorFallback />}>
      <Suspense fallback={<StandardLoadingFallback color="orange" message="جاري تحميل البوصلة..." fullScreen={false} />}>
        <PulseCheckModal {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
