import { useEffect, useCallback } from 'react';
import { useMapState } from '@/domains/dawayir/store/map.store';
import { trackEvent } from '@/services/analytics';
import { getWindowOrNull } from '@/services/clientRuntime';

/**
 * useWeatherFunnelBridge — جسر طقس العلاقات
 * ==========================================
 * يقوم باستلام نتائج "طقس العلاقات" من الـ SessionStorage وتحويلها 
 * إلى رادار حي فور دخول المستخدم للنسخة الحديثة.
 */
export function useWeatherFunnelBridge() {
    const addNode = useMapState((s) => s.addNode);
    const resetMap = useMapState((s) => s.resetMap);

    const checkAndBridgeWeather = useCallback(async () => {
        const windowRef = getWindowOrNull();
        if (!windowRef) return;

        const searchParams = new URLSearchParams(windowRef.location.search);
        if (searchParams.get('surface') !== 'weather-funnel') return;

        const weatherContextRaw = windowRef.sessionStorage.getItem('weather_context');
        if (!weatherContextRaw) return;

        try {
            const weatherCtx = JSON.parse(weatherContextRaw);
            if (!weatherCtx || !weatherCtx.weatherLevel) return;

            // تنظيف الـ Storage لمنع التكرار
            windowRef.sessionStorage.removeItem('weather_context');
            
            console.log("🌦️ [Weather Bridge] Data detected. Initiating modern radar sync...");
            trackEvent("weather_bridge_initiated", { level: weatherCtx.weatherLevel });

            const aiAnswers = [
                `المجالات التي تشغل تفكيري: ${weatherCtx.dominantSource} (تحديداً العلاقات المستنزفة)`,
                `مستوى الاستنزاف: حالة ${weatherCtx.weatherLevel} - ${weatherCtx.overallHeadline}`,
                `الحاجة التي أتجنبها: ${weatherCtx.behavioralExplanation}`
            ];

            // استدعاء محرك التحليل
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: aiAnswers }),
            });

            if (!response.ok) throw new Error('Failed to analyze weather data');

            const result = await response.json();
            
            // تحديث الخريطة الحديثة
            if (result.nodes && result.nodes.length > 0) {
                // إغراق الخريطة الحالية (اختياري، بس أفضل عشان دي خريطة أولية)
                resetMap();
                
                // إضافة الأشخاص المكتشفين
                result.nodes.forEach((node: any) => {
                    addNode(node.label, node.color === 'danger' ? 'red' : node.color === 'core' ? 'green' : 'yellow');
                });

                trackEvent("weather_bridge_success", { nodeCount: result.nodes.length });
            }

        } catch (error) {
            console.error("❌ [Weather Bridge] Error:", error);
            trackEvent("weather_bridge_failed", { error: String(error) });
        }
    }, [addNode, resetMap]);

    useEffect(() => {
        void checkAndBridgeWeather();
    }, [checkAndBridgeWeather]);
}
