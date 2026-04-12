/**
 * @deprecated Bridge — استخدم @/domains/dawayir بدلاً منه
 *
 * useDawayirEngine → useCloudMap (أقوى: تدعم loadMap + clearError)
 */

export { useCloudMap as useDawayirEngine } from "@/domains/dawayir";
export type { DawayirMapState as DawayirState, NodeData, EdgeData } from "@/domains/dawayir";
