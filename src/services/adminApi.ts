/**
 * adminApi.ts — Backward-compatible barrel re-export.
 *
 * The original monolithic file (2090 lines) has been split into 16 domain-focused
 * modules inside ./admin/. This file re-exports everything so that existing consumers
 * (50+ files) continue to work without any import changes.
 *
 * New code should import directly from "@/services/admin" or specific modules like
 * "@/services/admin/adminAlerts" for better tree-shaking.
 */

export * from "./admin";
