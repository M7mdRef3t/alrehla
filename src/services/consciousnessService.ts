import { geminiClient } from './geminiClient';
import { AICache } from './geminiEnhancements';

export interface ConsciousnessInsight {
  emotionalState: string;
  underlyingPattern: string;
  suggestedAction: string;
  intensity: number; // 1-10
}

class ConsciousnessService {
  private cache = new AICache();
  private memory: string[] = [];

  /**
   * إضافة حدث أو شعور لذاكرة الوعي (محاكاة لذاكرة الـ Vector)
   */
  addToMemory(event: string) {
    this.memory.push(`${new Date().toISOString()}: ${event}`);
    if (this.memory.length > 50) this.memory.shift(); // الحفاظ على آخر 50 ذكرى
  }

  /**
   * تحليل الحالة الشعورية والوعي بناءً على المدخلات والذاكرة
   */
  async analyzeConsciousness(input: string): Promise<ConsciousnessInsight | null> {
    const memoryContext = this.memory.join('\n');
    const prompt = `
      بصفتك خبير في الوعي والذكاء الاصطناعي لمرافق "الرحلة".
      حلل النص التالي مع مراعاة سياق الذاكرة الأخير للمستخدم.
      
      سياق الذاكرة:
      ${memoryContext}
      
      المدخل الحالي:
      "${input}"
      
      المطلوب: تحليل دقيق للحالة الشعورية، النمط المتكرر، واقتراح عملي للتعامل مع هذا الشعور (توظيفه وليس إصلاحه).
      رد بتنسيق JSON فقط:
      {
        "emotionalState": "الحالة الشعورية المكتشفة",
        "underlyingPattern": "النمط اللاشعوري الذي يفسر هذا الشعور",
        "suggestedAction": "اقتراح لتوظيف هذا الشعور في النمو الشخصي",
        "intensity": 7
      }
    `;

    try {
      const response = await geminiClient.generateJSON<ConsciousnessInsight>(prompt);
      if (response) {
        this.addToMemory(`تحليل: ${response.emotionalState} - ${response.underlyingPattern}`);
      }
      return response;
    } catch (error) {
      console.error("Consciousness Analysis Error:", error);
      return null;
    }
  }

  getMemory() {
    return [...this.memory];
  }
}

export const consciousnessService = new ConsciousnessService();
