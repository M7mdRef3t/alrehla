import { useEffect, useRef } from 'react';

export function useShakeDetection(onShake: () => void, threshold = 15) {
  const lastUpdate = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const current = Date.now();
      if ((current - lastUpdate.current) > 100) {
        const diffTime = (current - lastUpdate.current);
        lastUpdate.current = current;

        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        const x = acceleration.x || 0;
        const y = acceleration.y || 0;
        const z = acceleration.z || 0;

        const speed = Math.abs(x + y + z - lastX.current - lastY.current - lastZ.current) / diffTime * 10000;

        if (speed > threshold) {
          onShake();
        }

        lastX.current = x;
        lastY.current = y;
        lastZ.current = z;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [onShake, threshold]);
}
