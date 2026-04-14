import { useLayoutEffect } from 'react';

/**
 * useScrollLock
 * 
 * Prevents the main document body from scrolling when an overlay is active.
 * Uses useLayoutEffect to ensure the change is applied before the browser paints.
 * 
 * @param lock - Boolean to trigger the lock/unlock
 * @param dependency - Optional dependency to force re-run
 */
export const useScrollLock = (lock: boolean, dependency?: any) => {
  useLayoutEffect(() => {
    if (!lock) return;

    // Get original styles to restore them later
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPadding = window.getComputedStyle(document.body).paddingRight;

    // Calculate scrollbar width to prevent "layout shift"
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Apply lock
    document.body.style.overflow = 'hidden';
    
    // If scrollbar exists, add padding-right to body to prevent jumping
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPadding;
    };
  }, [lock, dependency]);
};
