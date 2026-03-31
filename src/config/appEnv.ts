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
 * Revenue Mode (وضع التركيز التجاري)
 * مفعل تلقائياً في وضع المستخدم، لإلغاء أي تشتت بصري.
 */
export const isRevenueMode = isUserMode;

/**
 * Phase-1 flow lock:
 * DISABLED — all users now have full access to goals, guided, mission, tools.
 * Was: isUserMode && phaseOneRaw !== "false"
 */
export const isPhaseOneUserFlow = false;
