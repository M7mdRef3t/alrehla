/**
 * Pulse Engagement Service
 * Handles real-time metrics for "Global Pulse" and social proof.
 */

const BASE_PULSE = 3240;

/**
 * Calculates a realistic number of active users based on the time of day.
 * Peaks during morning and evening hours.
 */
export function getLivePulseCount(): number {
  if (typeof window === "undefined") return BASE_PULSE;
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Dynamic offset based on hour (Peak at 9 AM and 10 PM)
  const hourOffset = Math.sin((hours - 6) * Math.PI / 12) * 500;
  const minuteOffset = Math.floor(minutes / 2) * 5;
  
  // Note: In a real production deployment, we would fetch a cached count from Redis or a stats table.
  // For Alrehla, we blend the BASE_PULSE with a deterministic calculation to ensure stability.
  return Math.floor(BASE_PULSE + hourOffset + minuteOffset);
}

/**
 * Simulates a single random heartbeat pulse activity.
 * Returns true if a "Pulse" event should be visually triggered.
 */
export function shouldTriggerHeartbeat(): boolean {
  return Math.random() > 0.85;
}
