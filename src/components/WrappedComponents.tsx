/**
 * Wrapped Components with Error Boundaries
 * مكونات مغلفة بـ Error Boundaries
 */

import { ErrorBoundary, MapErrorFallback, ChatErrorFallback, PulseErrorFallback } from "./ErrorBoundary";
import { lazy, Suspense, type ComponentProps } from "react";

// Lazy load components
const CoreMapScreen = lazy(() => import("./CoreMapScreen").then((m) => ({ default: m.CoreMapScreen })));
const AIChatbot = lazy(() => import("./AIChatbot").then((m) => ({ default: m.AIChatbot })));
const PulseCheckModal = lazy(() => import("./PulseCheckModal").then((m) => ({ default: m.PulseCheckModal })));

// Extract prop types from components
type CoreMapScreenProps = ComponentProps<typeof CoreMapScreen>;
type AIChatbotProps = ComponentProps<typeof AIChatbot>;
type PulseCheckModalProps = ComponentProps<typeof PulseCheckModal>;

// Wrapped with Error Boundaries
export function SafeCoreMapScreen(props: CoreMapScreenProps) {
  return (
    <ErrorBoundary fallback={<MapErrorFallback />}>
      <Suspense fallback={<div className="p-4 text-center">جاري تحميل الخريطة...</div>}>
        <CoreMapScreen {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

export function SafeAIChatbot(props: AIChatbotProps) {
  return (
    <ErrorBoundary fallback={<ChatErrorFallback />}>
      <Suspense fallback={<div className="p-4 text-center">جاري تحميل المحادثة...</div>}>
        <AIChatbot {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

export function SafePulseCheckModal(props: PulseCheckModalProps) {
  return (
    <ErrorBoundary fallback={<PulseErrorFallback />}>
      <Suspense fallback={<div className="p-4 text-center">جاري تحميل البوصلة...</div>}>
        <PulseCheckModal {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
