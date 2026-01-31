import { useCallback } from "react";
import type { PanInfo } from "framer-motion";

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeConfig {
  threshold?: number; // الحد الأدنى للمسافة لاعتبار الحركة swipe (بالبكسل)
  velocityThreshold?: number; // الحد الأدنى للسرعة
}

const DEFAULT_CONFIG: Required<SwipeConfig> = {
  threshold: 50,
  velocityThreshold: 500
};

/**
 * Hook لإضافة swipe gestures باستخدام framer-motion
 * 
 * @example
 * const swipeHandlers = useSwipeGesture({
 *   onSwipeLeft: () => console.log('swiped left'),
 *   onSwipeRight: () => console.log('swiped right')
 * });
 * 
 * <motion.div
 *   drag="x"
 *   dragConstraints={{ left: 0, right: 0 }}
 *   dragElastic={0.2}
 *   onDragEnd={swipeHandlers.onDragEnd}
 * >
 *   Content
 * </motion.div>
 */
export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold, velocityThreshold } = { ...DEFAULT_CONFIG, ...config };

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      
      // Horizontal swipe
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (offset.x > threshold && velocity.x > velocityThreshold) {
          handlers.onSwipeRight?.();
        } else if (offset.x < -threshold && velocity.x < -velocityThreshold) {
          handlers.onSwipeLeft?.();
        }
      }
      // Vertical swipe
      else {
        if (offset.y > threshold && velocity.y > velocityThreshold) {
          handlers.onSwipeDown?.();
        } else if (offset.y < -threshold && velocity.y < -velocityThreshold) {
          handlers.onSwipeUp?.();
        }
      }
    },
    [handlers, threshold, velocityThreshold]
  );

  return { onDragEnd };
}

/**
 * Hook مبسط للـ horizontal swipe فقط
 */
export function useHorizontalSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  config?: SwipeConfig
) {
  return useSwipeGesture({ onSwipeLeft, onSwipeRight }, config);
}

/**
 * Hook مبسط للـ vertical swipe فقط
 */
export function useVerticalSwipe(
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config?: SwipeConfig
) {
  return useSwipeGesture({ onSwipeUp, onSwipeDown }, config);
}
