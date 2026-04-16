import { create } from "zustand";
import { GrowthArea } from "../../sullam/store/sullam.store";

export interface InsightThread {
  id: string;
  areaA: GrowthArea;
  areaB: GrowthArea;
  message: string;
}

// Heuristic templates mapping a pair of areas to a profound insight.
// Keys are formatted as sorted area combinations: "area1|area2"
const HEURISTICS: Record<string, string> = {
  "health|spiritual": "على مدار صعودك، لاحظنا أن ركود المسار (الصحي) ارتبط دائماً بوهن مسارك (الروحاني). الجسد لا يثقل إلا إذا تثاقلت الروح أولاً.. عالج جذرك ينهض جذعك.",
  "creative|personal": "كلما خفت بريقك (الإبداعي)، لاحظنا تراجعاً في تطورك (الشخصي). إبداعك ليس ترفاً، بل هو لغتك للتعبير عن نفسك. لا تكتم صوتك.",
  "career|social": "تعثر مسارك (المهني) يتزامن بشكل غامض مع انقطاعك (الاجتماعي). ربما أنت تحارب وحدك أكثر من اللازم، النجاح المهني يحتاج إلى قبيلة تسنده.",
  "creative|health": "هنالك خيط رفيع يربط (إبداعك) بمسارك (الصحي). عندما تهمل جسدك، يَصدأ خيالك. تحرك لتتحرك أفكارك.",
  "health|personal": "عندما تتخلى عن (جسدك)، تنهار أهدافك (الشخصية). الجسد هو وعاء إرادتك، إذا انكسر الوعاء تسربت منه العزيمة.",
  "personal|social": "انعزالك (الاجتماعي) يتبعه دائماً توقف في نموك (الشخصي). الإنسان مرآة أخيه، لا تختبئ ظناً منك أن العزلة قوة المطلقة.",
  "career|spiritual": "في كل مرة يزدحم فيها مسارك (المهني) ويختنق، نجد أنك قطعت حبالك (الروحانية). أنت لست آلة.. العمل بلا روح يُعمي البصيرة.",
  "creative|spiritual": "جفاف قلمك (الإبداعي) مرتبط بانقطاع غيثك (الروحاني). المبدع يستمد من السماء ليرسم على الأرض، اتصل لتتدفق.",
  "career|personal": "تعثرك (المهني) يتزامن مع توقف بنائك (الشخصي). أنت تحاول تغيير الخارج بنفس الأدوات القديمة في الداخل.",
  "creative|social": "كلما ابتعدت عن الناس (اجتماعياً)، ذبل (إبداعك). الإلهام يُولد من الاحتكاك بأرواح الآخرين، لا في العزلة التامة."
};

interface ObservatoryState {
  discoveredInsights: InsightThread[];
  generateInsights: (stuckAreas: GrowthArea[]) => void;
  clearInsights: () => void;
}

export const useObservatoryState = create<ObservatoryState>((set) => ({
  discoveredInsights: [],

  generateInsights: (stuckAreas) => {
    if (stuckAreas.length < 2) {
      set({ discoveredInsights: [] });
      return;
    }

    const insights: InsightThread[] = [];
    
    // Evaluate pairs among stuck areas
    for (let i = 0; i < stuckAreas.length; i++) {
      for (let j = i + 1; j < stuckAreas.length; j++) {
        const a = stuckAreas[i];
        const b = stuckAreas[j];
        
        // Sort to match keys in HEURISTICS
        const key = [a, b].sort().join("|");
        
        // If we have a custom profound message, use it; otherwise fallback to a generic pattern
        const message = HEURISTICS[key] || 
          `مرصدنا يحذرك: هناك تلازم غامض بين ركود مسارك (${a}) وتوقف مسارك (${b}). كلاهما يسرق طاقة الآخر، فكك هذه العقدة بمواجهة أحدهما.`;
          
        insights.push({
          id: `thread_${a}_${b}`,
          areaA: a,
          areaB: b,
          message
        });

        // Limit to 2 maximum profound insights per session so the user isn't overwhelmed
        if (insights.length >= 2) break;
      }
      if (insights.length >= 2) break;
    }

    set({ discoveredInsights: insights });
  },

  clearInsights: () => set({ discoveredInsights: [] })
}));
