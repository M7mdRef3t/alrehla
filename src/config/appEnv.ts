/**
 * أوضاع التطبيق - فصل البيئات
 *
 * - وضع المستخدم (user): الواجهة المنشورة للجمهور، ثابتة وآمنة.
 * - وضع التطوير (dev): ميزات وتجارب داخلية قبل النقل لوضع المستخدم.
 * - وضع الأونر: صلاحيات كاملة بناءً على الدور (owner/superadmin) داخل نفس الكود.
 */

import { runtimeEnv } from "./runtimeEnv";

export type AppEnv = "user" | "dev";

const raw = runtimeEnv.appEnv;

/** الافتراضي: user. يتحول إلى dev فقط عند ضبط VITE_APP_ENV=dev صراحة. */
export const APP_ENV: AppEnv =
  raw === "dev" ? "dev" : "user";

export const isUserMode = APP_ENV === "user";
export const isDevMode = APP_ENV === "dev";

/**
 * Phase-1 flow lock:
 * - default ON in user mode
 * - can be explicitly disabled with VITE_PHASE_ONE_USER_FLOW=false
 */
const phaseOneRaw = runtimeEnv.phaseOneUserFlow;
export const isPhaseOneUserFlow = isUserMode && phaseOneRaw !== "false";
