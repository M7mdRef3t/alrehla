import { useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export type NodeData = {
    id: string;
    label: string;
    size: 'small' | 'medium' | 'large';
    color: 'core' | 'danger' | 'ignored' | 'neutral';
    mass: number;
};

export type EdgeData = {
    source: string;
    target: string;
    type: 'draining' | 'stable' | 'ignored' | 'conflict';
    animated: boolean;
};

export type DawayirState = {
    id?: string;
    nodes: NodeData[];
    edges: EdgeData[];
    insight_message: string;
    detected_symptoms?: string[];
    metadata?: Record<string, any>;
};

export function useDawayirEngine() {
    const [data, setData] = useState<DawayirState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeAnswers = async (answers: string[], maxNodes: number = 50) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers }),
            });

            if (!response.ok) {
                throw new Error('حدث استنزاف مفاجئ في الاتصال، حاول مرة أخرى.');
            }

            const result: DawayirState = await response.json();

            // Limit nodes if necessary
            if (result.nodes.length > maxNodes) {
                result.nodes = result.nodes.slice(0, maxNodes);
                result.insight_message += " (وصلت للحد الأقصى المسموح به في خطتك)";
            }

            setData(result);
        } catch (err: any) {
            setError(err.message || 'فشل الاتصال بمحرك الوعي.');
        } finally {
            setIsLoading(false);
        }
    };

    const saveMap = async (title: string = "خريطتي") => {
        if (!data || !supabase) return;

        setIsSaving(true);
        setError(null);

        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error("يجب تسجيل الدخول لحفظ الخريطة");

            const { data: savedMap, error: saveError } = await supabase
                .from('dawayir_maps')
                .upsert({
                    user_id: userData.user.id,
                    title,
                    nodes: data.nodes,
                    edges: data.edges,
                    insight_message: data.insight_message,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (saveError) throw saveError;

            setData({ ...data, id: savedMap.id });
            return savedMap;
        } catch (err: any) {
            setError(err.message || 'فشل حفظ الخريطة.');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        data,
        isLoading,
        isSaving,
        error,
        analyzeAnswers,
        saveMap
    };
}
