import { onCLS, onINP, onLCP } from 'web-vitals';
import { runtimeEnv } from '../../../config/runtimeEnv';

function report(metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    ts: Date.now(),
  };

  const endpoint = runtimeEnv.webVitalsEndpoint || (runtimeEnv.isProd ? '/telemetry/client' : '');
  if (endpoint) {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
    return;
  }

  // Fallback to console logging when no endpoint is configured.
  console.info('[web-vitals]', payload);
}

export function startWebVitals() {
  onCLS(report);
  onINP(report);
  onLCP(report);
}

export default startWebVitals;
