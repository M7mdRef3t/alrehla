/**
 * Shared — Events
 * Public API barrel export.
 */

export { eventBus } from "./bus";
export type { DomainEvents } from "./bus";
export { initEventEffects, teardownEventEffects } from "./eventEffects";
