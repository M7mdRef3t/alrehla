import { runtimeEnv } from "./runtimeEnv";

/**
 * Public payment UI is controlled explicitly by env.
 * This allows manual / concierge activation to be visible even when
 * automated gateways are still disabled.
 */
export const isPublicPaymentsEnabled =
  runtimeEnv.publicPaymentsEnabled === "true";
