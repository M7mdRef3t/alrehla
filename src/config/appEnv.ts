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
 * يمكن تفعيله يدوياً في وضع التطوير للاختبار.
 */
export const isRevenueMode = isUserMode || runtimeEnv.publicPaymentsEnabled === "true";

/**
 * Phase-1 flow lock:
 * يتحكم في ظهور الميزات الأساسية لرواد "الرحلة" الأوائل.
 */
const phaseOneRaw = runtimeEnv.phaseOneUserFlow;
export const isPhaseOneUserFlow = phaseOneRaw === "true";
