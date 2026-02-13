/**
 * أوضاع التطبيق — فصل البيئات
 *
 * - وضع المستخدم (user): اللي يُنشر للجمهور — واجهة ثابتة وآمنة.
 * - وضع التطوير (dev): كل الميزات والتجريب؛ للتجربة الداخلية قبل النقل لوضع المستخدم.
 * - وضع الأونر: صلاحيات كاملة (يُحدد بدور المستخدم owner/superadmin)، نفس الكود.
 */

export type AppEnv = "user" | "dev";

const raw = import.meta.env.VITE_APP_ENV as string | undefined;

/** افتراضي: وضع المستخدم (العيلة فقط). وضع التطوير فقط لو VITE_APP_ENV=dev صراحة. */
export const APP_ENV: AppEnv =
  raw === "dev" ? "dev" : "user";

export const isUserMode = APP_ENV === "user";
export const isDevMode = APP_ENV === "dev";

/**
 * Phase-1 flow lock:
 * - default ON in user mode
 * - can be explicitly disabled with VITE_PHASE_ONE_USER_FLOW=false
 */
const phaseOneRaw = import.meta.env.VITE_PHASE_ONE_USER_FLOW as string | undefined;
export const isPhaseOneUserFlow = isUserMode && phaseOneRaw !== "false";
