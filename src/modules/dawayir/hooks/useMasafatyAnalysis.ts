import { useMemo, useState, useEffect } from 'react';
import { useMapState } from '../../../state/mapState';
import { geminiClient } from '../../../services/geminiClient';
import type { MapNode, FeelingCheckResult } from '../../map/mapTypes';

export type EntropyLevel = 0 | 1 | 2 | 3;

export interface Maneuver {
  id?: string;
  title: string;
  description: string;
  actionLabel: string;
  type: 'move' | 'pause' | 'protect';
}

export const useMasafatyAnalysis = () => {
  const { nodes, feelingResults, mapType } = useMapState();
  const [maneuvers, setManeuvers] = useState<Maneuver[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Calculate Local Entropy (Pre-AI)
  const entropyMap = useMemo(() => {
    const map: Record<string, EntropyLevel> = {};
    if (mapType !== 'masafaty' || !feelingResults) return map;

    nodes.forEach(node => {
      let level: EntropyLevel = 0;

      // Rule 1: Vulnerability (Green Node + Low Body/Energy)
      if (node.ring === 'green' && (feelingResults.body < 40 || feelingResults.energy < 40)) {
        level = 3;
      }
      // Rule 2: Boundary Breach (Red Node + Low Time/Space)
      else if (node.ring === 'red' && (feelingResults.time < 40 || feelingResults.space < 40)) {
        level = 2;
      }
      // Rule 3: Resource Strain (Yellow Node + Low Money)
      else if (node.ring === 'yellow' && feelingResults.money < 40) {
        level = 1;
      }

      map[node.id] = level;
    });

    return map;
  }, [nodes, feelingResults, mapType]);

  // 2. Fetch AI Maneuvers
  const fetchManeuvers = async () => {
    if (nodes.length === 0 || !feelingResults) return;
    setIsLoading(true);

    const prompt = `
      أنت "استشاري علاقات استراتيجي" متخصص في نظام "دواير".
      بناءً على البيانات التالية، اقترح 3 "مناورات استراتيجية" (Strategic Maneuvers) لمساعدة المستخدم.
      البيانات:
      1. حالة الأصول الـ 5 (من 100):
         - الجسم: ${feelingResults.body}
         - الوقت: ${feelingResults.time}
         - الطاقة: ${feelingResults.energy}
         - الفلوس: ${feelingResults.money}
         - المساحة: ${feelingResults.space}
      
      2. العلاقات في الخريطة:
         ${nodes.map(n => `- ${n.label}: في الدائرة ${n.ring === 'green' ? 'الخضراء (قريب)' : n.ring === 'yellow' ? 'الصفراء (متوسط)' : 'الحمراء (بعيد)'}`).join('\n')}

      المطلوب:
      أرجع JSON يحتوي على مصفوفة "maneuvers" بها 3 عناصر.
      كل عنصر لازم يحتوي على:
      - title: عنوان قصير وجذاب بالمصري.
      - description: شرح بسيط ليه المناورة دي مهمة دلوقتي.
      - actionLabel: نص قصير للزر (مثل: "تحريك للدائرة الصفراء").
      - type: واحد من (move, pause, protect).

      اجعل اللهجة مصرية بيضاء، قوية، وداعمة. ركز على "حماية الأصول" الضعيفة.
      أرجع JSON فقط.
    `;

    try {
      const result = await geminiClient.generateJSON<{ maneuvers: Maneuver[] }>(prompt);
      if (result?.maneuvers) {
        setManeuvers(result.maneuvers);
      }
    } catch (error) {
      console.error("AI Maneuvers Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch if things change and we have no maneuvers
  useEffect(() => {
    if (maneuvers.length === 0 && nodes.length > 0 && feelingResults) {
      fetchManeuvers();
    }
  }, [nodes.length, feelingResults]);

  return {
    entropyMap,
    maneuvers,
    isLoading,
    refreshManeuvers: fetchManeuvers
  };
};
