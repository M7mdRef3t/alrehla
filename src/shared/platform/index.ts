/**
 * Platform Intelligence — الجهاز العصبي المركزي
 * ══════════════════════════════════════════════════
 *
 * Usage (non-reactive — services, engines, etc.):
 *   import { platform, actions } from "@/shared/platform";
 *
 *   const wird = platform.wird();
 *   const all  = platform.snapshot();
 *   actions.logActivity({ source: "khalwa", action: "completed" });
 *
 * Usage (reactive — React components):
 *   import { usePlatform, usePlatformModule } from "@/shared/platform";
 *
 *   const p = usePlatform();           // full snapshot, reactive
 *   const wird = usePlatformModule("wird"); // single module, reactive
 */

export { platform, type PlatformSnapshot } from "./platformIntelligence";
export { actions } from "./platformActions";
export { usePlatform, usePlatformModule } from "./usePlatform";
