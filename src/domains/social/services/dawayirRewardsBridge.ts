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
  
  console.log("🌉 Dawayir Rewards Bridge Initialized");

  // 1. عند إضافة شخص جديد للخريطة
  eventBus.on("dawayir:node_added", ({ ring, label }) => {
    // مكافأة بسيطة للبدء
    console.log(`🎁 Reward for adding node: ${label}`);
    // يمكن تفعيل مكافأة هنا لو رغبت
  });

  // 2. عند تغيير المدار (تطبيق حقيقي للسيادة العلائقية)
  eventBus.on("dawayir:ring_changed", ({ from, to }) => {
    console.log(`🔄 Relationship moved from ${from} to ${to}`);
    freezeRewardsService.onRelationshipMoved(from, to);
  });

  // 3. عند وضع حدود حازمة (الأرشفة/التجميد)
  eventBus.on("dawayir:node_archived", ({ nodeId }) => {
    console.log(`❄️ Node archived/frozen: ${nodeId}`);
    freezeRewardsService.onNodeFrozen(nodeId);
  });

  isBridgeInitialized = true;
};
