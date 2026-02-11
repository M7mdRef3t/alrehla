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
