/**
 * 🌉 Dawayir ↔️ Tajmeed Bridge
 * 
 * المترجم الذي يربط أحداث "دواير" (الذكاء الاجتماعي) 
 * بنظام "تجميد" (المكافآت والألعبة).
 */

import { eventBus } from "@/shared/events/bus";
import { freezeRewardsService } from "../../gamification/services/freezeRewards";

let isBridgeInitialized = false;

export const initDawayirRewardsBridge = () => {
  if (isBridgeInitialized) return;
  
  // 1. عند إضافة شخص جديد للخريطة
  eventBus.on("dawayir:node_added", ({ ring: _ring, label: _label }) => {
    // مكافأة بسيطة للبدء
  });

  // 2. عند تغيير المدار (تطبيق حقيقي للسيادة العلائقية)
  eventBus.on("dawayir:ring_changed", ({ from, to }) => {
    freezeRewardsService.onRelationshipMoved(from, to);
  });

  // 3. عند وضع حدود حازمة (الأرشفة/التجميد)
  eventBus.on("dawayir:node_archived", ({ nodeId }) => {
    freezeRewardsService.onNodeFrozen(nodeId);
  });

  isBridgeInitialized = true;
};
