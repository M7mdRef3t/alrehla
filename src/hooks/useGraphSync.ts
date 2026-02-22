import { useEffect } from "react";
import { subscribeToDawayirSignals } from "../modules/recommendation/recommendationBus";
import { useMapState } from "../state/mapState";
import { GraphProjectionEngine } from "../services/graphProjectionEngine";
import { supabase } from "../services/supabaseClient";

/**
 * useGraphSync — خطاف المزامنة الشبكية
 * ==========================================
 * يستمع لأي تغييرات في "دواير" ويقوم بتحديث الـ Consciousness Graph تلقائياً.
 */
export function useGraphSync() {
    const nodes = useMapState((s) => s.nodes);

    useEffect(() => {
        // ننتظر أي إشارة تدل على تغيير جوهري في الخريطة
        const unsubscribe = subscribeToDawayirSignals(async (event) => {
            if (
                event.type === "node_added" ||
                event.type === "ring_changed" ||
                event.type === "detachment_toggled" ||
                event.type === "symptoms_updated"
            ) {
                // استرجاع المستخدم الحالي
                const { data } = await supabase!.auth.getUser();
                const userId = data.user?.id;

                if (userId) {
                    // نقوم بإسقاط الجراف بشكل غير متزامن لتجنب تعطيل الـ UI
                    // نستخدم debounce بسيط (اختياري، هنا نعتمد على استدعاء مباشر)
                    console.log(`📡 [Sync Hook] Signal ${event.type} received. Syncing Graph...`);
                    void GraphProjectionEngine.projectMapToGraph(userId, nodes);
                }
            }
        });

        return () => unsubscribe();
    }, [nodes]);
}
