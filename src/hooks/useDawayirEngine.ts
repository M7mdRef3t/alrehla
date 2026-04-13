/**
 * @deprecated Bridge — استخدم @/domains/dawayir بدلاً منه
 *
 * useDawayirEngine → useCloudMap (أقوى: تدعم loadMap + clearError)
 */

export { useCloudMap as useDawayirEngine } from '@/modules/map/dawayirIndex';
export type { DawayirMapState as DawayirState, NodeData, EdgeData } from '@/modules/map/dawayirIndex';
