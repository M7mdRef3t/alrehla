import { EcosystemData, ProductId } from "@/types/ecosystem";

export interface EcosystemRecommendation {
  satellite: ProductId;
  actionType: 'diagnose' | 'execute' | 'intervene' | 'regulate' | 'reflect';
  priority: 'critical' | 'high' | 'normal';
  title: string;
  description: string;
  ctaText: string;
  targetPath: string;
  reasoning: string;
}

/**
 * RoutingEngine ("المحرك الاستراتيجي")
 * 
 * Takes ecosystem data and returns the "Next Best Action" (NBA).
 * Evaluates based on First Principles:
 * 1. Regulation (Atmosfera)
 * 2. Intervention (Sessions)
 * 3. Execution (Masarat)
 * 4. Diagnosis (Dawayir)
 * 5. Reflection (Alrehla Hub)
 */
export class RoutingEngine {
  
  static getNextBestAction(
    data?: EcosystemData,
    localContext?: { hasLocalMap?: boolean; hasCompletedBaseline?: boolean }
  ): EcosystemRecommendation {
    // Default fallback (Reflection in Alrehla)
    const defaultAction: EcosystemRecommendation = {
      satellite: 'alrehla',
      actionType: 'reflect',
      priority: 'normal',
      title: 'استكشف خريطتك',
      description: 'راجع مستوى وعيك وتقدمك الشامل عبر المنظومة.',
      ctaText: 'ارجع للخريطة',
      targetPath: '/',
      reasoning: 'Default state. No acute pain or specific lack of clarity detected.'
    };

    if (!data) return defaultAction;

    const { satellite_metrics, awareness_vector } = data;

    // 1. State Regulation (Atmosphera)
    // If stress or cognitive load is high, regulate the nervous system first.
    // Example: If Atmosfera metrics show dominant state is "high_stress" or "dysregulated"
    if (satellite_metrics?.atmosfera?.dominant_state === 'dysregulated' || satellite_metrics?.atmosfera?.dominant_state === 'high_stress') {
      return {
        satellite: 'atmosfera',
        actionType: 'regulate',
        priority: 'critical',
        title: 'استعادة التوازن',
        description: 'يبدو أن مستوى الضغط مرتفع. دعنا نستعيد توازنك الداخلي أولاً قبل اتخاذ أي قرارات.',
        ctaText: 'ابدأ جلسة تفريغ',
        targetPath: 'https://atmosfera.alrehla.app/regulate',
        reasoning: 'State regulation precedes logic. High stress blocks healthy diagnosis and execution.'
      };
    }

    // 2. High-Touch Intervention (Sessions / Jalasat)
    // If Dawayir indicates relational "chaos" or extreme pain
    if (satellite_metrics?.dawayir?.diagnosis_level === 'chaos') {
      return {
        satellite: 'sessions',
        actionType: 'intervene',
        priority: 'high',
        title: 'تدخل متخصص',
        description: 'الخريطة تشير لتعقيدات أو صراعات حرجة في العلاقات. أنت لست وحدك، جلسة متخصصة ستساعدك على الفهم.',
        ctaText: 'احجز جلستك الآن',
        targetPath: 'https://sessions.alrehla.app/book',
        reasoning: 'Chaotic relational patterns require expert intervention to avoid further damage.'
      };
    }

    // 3. Execution (Masarat)
    // If diagnosis is "caution" or they have active paths but haven't engaged recently
    // Or if their awareness vector indicates high emotional pain
    if (satellite_metrics?.dawayir?.diagnosis_level === 'caution' || 
       (awareness_vector && awareness_vector[0] < 30)) { // Assuming index 0 is emotional stability, threshold < 30
      
      // Check if they are already in an active path
      if (satellite_metrics?.masarat?.active_paths && satellite_metrics.masarat.active_paths.length > 0) {
        return {
          satellite: 'masarat',
          actionType: 'execute',
          priority: 'high',
          title: 'واصل مسارك',
          description: 'لقد بدأت بتحديد الألم، الخطوة المنطقية القادمة هي استكمال مسارك لتحقيق التغيير.',
          ctaText: 'أكمل المسار',
          targetPath: 'https://masarat.alrehla.app/active',
          reasoning: 'User has identified pain and started a path. Focus should be on maintaining execution momentum.'
        };
      }

      return {
        satellite: 'masarat',
        actionType: 'execute',
        priority: 'normal',
        title: 'ارسم خطة للحل',
        description: 'الجزء الأصعب مر، أنت الآن تدرك مكمن الألم. دع مسارات يساعدك في تحويل الملاحظة لخطوات عملية.',
        ctaText: 'استكشف مسارات التحول',
        targetPath: 'https://masarat.alrehla.app/explore',
        reasoning: 'User identified pain but lacks execution. Masarat converts realization into action.'
      };
    }

    // 4. Diagnosis (Dawayir)
    // If Dawayir has 0 maps on server AND 0 maps locally (meaning they lack clarity)
    const hasMapOnServer = (satellite_metrics?.dawayir?.map_count || 0) > 0;
    const hasMapLocally = (localContext?.hasLocalMap || false);
    
    if (!hasMapOnServer && !hasMapLocally) {
      const isBaselineDone = localContext?.hasCompletedBaseline;
      return {
        satellite: 'dawayir',
        actionType: 'diagnose',
        priority: isBaselineDone ? 'high' : 'normal', // Higher priority if baseline is already done
        title: isBaselineDone ? 'ارسم خريطة وعيك' : 'اكتشف خريطتك',
        description: isBaselineDone 
          ? 'لقد انتهيت من التقييم، الآن حوّل البيانات لرؤية بصرية واضحة.'
          : 'لم ترسم أي خريطة لعلاقاتك بعد. ابدأ برسم وتصنيف خريطتك لاكتشاف الأنماط الخفية.',
        ctaText: 'ارسم أول خريطة',
        targetPath: '/onboarding?force=1',
        reasoning: isBaselineDone 
          ? 'Baseline finished. Natural next step is visual mapping.'
          : 'Foundational step. Without a relational map, true self-awareness is incomplete.'
      };
    }

    // 5. Default
    return defaultAction;
  }
}
