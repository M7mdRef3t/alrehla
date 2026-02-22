/**
 * Performance Optimization Utilities
 * Helpers for common optimization patterns
 */

/**
 * Debounce utility - delays function execution
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Throttle utility - limits function execution frequency
 * @example
 * const throttledScroll = throttle(() => handleScroll(), 100);
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delayMs) {
      lastCallTime = now;
      fn(...args);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn(...args);
      }, delayMs - timeSinceLastCall);
    }
  };
}

/**
 * Memoize utility - caches function results
 * @example
 * const memoizedExpensive = memoize((x, y) => expensiveCalc(x, y));
 */
export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch DOM updates to minimize reflows
 * @example
 * batchDOMUpdates(() => {
 *   element.style.width = '100px';
 *   element.style.height = '100px';
 * });
 */
export function batchDOMUpdates(fn: () => void): void {
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(fn);
  } else {
    fn();
  }
}

/**
 * Performance marker for debugging
 * @example
 * mark('operation-start');
 * // ... do work ...
 * measure('operation', 'operation-start');
 */
export function mark(name: string): void {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
}

export function measure(name: string, startMark: string): void {
  if (typeof performance !== "undefined" && performance.measure) {
    performance.measure(name, startMark);
  }
}

/**
 * Get Web Vitals metrics
 * @example
 * const vitals = getWebVitals();
 * console.warn(vitals.lcp, vitals.fid, vitals.cls);
 */
export function getWebVitals(): {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
} {
  const results = {
    lcp: null as number | null,
    fid: null as number | null,
    cls: null as number | null,
    fcp: null as number | null
  };

  if (typeof window === "undefined") return results;

  try {
    const entries = performance.getEntriesByType("navigation");
    const navigationTiming = entries[0] as PerformanceNavigationTiming | undefined;

    if (navigationTiming) {
      // FCP - First Contentful Paint
      results.fcp = navigationTiming.responseStart - navigationTiming.fetchStart;
    }

    // LCP - Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & Partial<{ renderTime: number; loadTime: number }>;
        results.lcp = lastEntry.renderTime ?? lastEntry.loadTime ?? null;
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    setTimeout(() => observer.disconnect(), 5000);
  } catch {
    // Performance API not available
  }

  return results;
}

/**
 * Intersection Observer helper - for lazy loading
 * @example
 * observeIntersection(element, () => {
 *   element.classList.add('loaded');
 * });
 */
export function observeIntersection(
  element: Element,
  callback: () => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      callback();
      observer.unobserve(element);
    }
  }, options);

  observer.observe(element);
  return observer;
}

/**
 * Memory leak detector for debugging
 * @example
 * detectMemoryLeaks(component);
 */
export function detectMemoryLeaks(
  componentName: string
): {
  measure: () => number;
  report: () => void;
} {
  let initialMemory = 0;
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };

  if (perf.memory) {
    initialMemory = perf.memory.usedJSHeapSize;
  }

  return {
    measure(): number {
      if (perf.memory) {
        return perf.memory.usedJSHeapSize - initialMemory;
      }
      return 0;
    },
    report(): void {
      const delta = this.measure();
      console.warn(`[${componentName}] Memory delta: ${(delta / 1024 / 1024).toFixed(2)}MB`);
    }
  };
}

/**
 * CSS-in-JS optimization - extract and cache styles
 * @example
 * const cssString = extractStyles(component);
 */
export function extractStyles(element: HTMLElement): string {
  const styles = window.getComputedStyle(element);
  let cssString = "";

  for (let i = 0; i < styles.length; i++) {
    const property = styles[i];
    cssString += `${property}: ${styles.getPropertyValue(property)};`;
  }

  return cssString;
}

/**
 * Request Idle Callback polyfill
 * @example
 * requestIdleCallback(() => {
 *   // Low priority work
 * });
 */
type IdleCallback = (deadline?: { didTimeout: boolean; timeRemaining: () => number }) => void;
type IdleOptions = { timeout?: number };
type IdleWindow = Window & {
  requestIdleCallback?: (cb: IdleCallback, options?: IdleOptions) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function requestIdleCallback(callback: IdleCallback, options?: IdleOptions): number {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const idleWindow = window as IdleWindow;
    return idleWindow.requestIdleCallback ? idleWindow.requestIdleCallback(callback, options) : 0;
  }

  // Fallback for browsers without requestIdleCallback
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), 1000) as unknown as number;
}

/**
 * Cancel Idle Callback
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    const idleWindow = window as IdleWindow;
    idleWindow.cancelIdleCallback?.(id);
  } else {
    clearTimeout(id);
  }
}

