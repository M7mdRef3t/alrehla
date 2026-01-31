import type { Ring } from "../modules/map/mapTypes";

// Pattern types we can detect
export type PatternType = 
  | 'timing'        // Timing-based patterns (e.g., late night calls)
  | 'financial'     // Money-related patterns
  | 'emotional'     // Emotional manipulation
  | 'behavioral'    // Specific behaviors
  | 'boundary';     // Boundary violations

export interface DetectedPattern {
  type: PatternType;
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
  triggers: string[];
  frequency: number;
}

export interface PatternAnalysisResult {
  patterns: DetectedPattern[];
  primaryPattern: DetectedPattern | null;
  insights: string[];
}

// Keywords and patterns for detection
const PATTERNS_CONFIG = {
  timing: {
    keywords: [
      /\b(بالليل|الساعة \d+|متأخر|نايم|الفجر|منتصف الليل)\b/gi,
      /\b(12|1|2|3) (بالليل|الفجر)\b/gi
    ],
    description: "انتهاك الحدود الزمنية - اتصالات أو طلبات في أوقات غير مناسبة"
  },
  
  financial: {
    keywords: [
      /\b(فلوس|مصاري|قرض|عايز|محتاج|دين|اديني|ادفع|فلوسي)\b/gi,
      /\b(طلب (مني|فلوس)|محتاج فلوس)\b/gi
    ],
    description: "طلبات مالية متكررة أو ضغط مالي"
  },
  
  emotional: {
    keywords: [
      /\b(مش بتحبني|مش بتهتم|أناني|مش بتقدر|زعلان|زعل|متضايق|متغاظ)\b/gi,
      /\b(لو كنت بتحب|لو فعلا|عشاني|عشانك)\b/gi,
      /\b(ذنب|حرام عليك|معقول|ازاي)\b/gi
    ],
    description: "استخدام الذنب أو المشاعر كسلاح للضغط"
  },
  
  behavioral: {
    keywords: [
      /\b(دايماً|عمره ما|كل مرة|في كل مرة|مش بيسمع|مش بيفهم)\b/gi,
      /\b(بيصرخ|بيزعق|بيضرب|بيكسر|بيرمي)\b/gi
    ],
    description: "سلوكيات متكررة أو عدوانية"
  },
  
  boundary: {
    keywords: [
      /\b(رفضت|قولتله لأ|مش عايز|مش هقدر|معنديش وقت)\b/gi,
      /\b(فضل|استمر|ملّ|مبطلش|كمل)\b/gi
    ],
    description: "عدم احترام الحدود الشخصية أو الرفض"
  }
};

// Emotional state detection
const EMOTIONAL_STATES = {
  stress: /\b(ضغط|توتر|قلق|متوتر|مش مرتاح|تعبان نفسياً)\b/gi,
  fear: /\b(خايف|خوف|رعب|قلقان|متردد)\b/gi,
  guilt: /\b(حاسس بذنب|ذنب|حرام|معقول)\b/gi,
  exhaustion: /\b(استنزاف|تعبان|مرهق|مش قادر|خلاص)\b/gi,
  anger: /\b(زعلان|غضبان|متضايق|مستفز|عصبي)\b/gi
};

/**
 * Analyze user's written situations to detect patterns
 */
export function analyzeSituations(situations: string[]): PatternAnalysisResult {
  const detectedPatterns: DetectedPattern[] = [];
  const allText = situations.join(' ').toLowerCase();
  
  // Detect each pattern type
  Object.entries(PATTERNS_CONFIG).forEach(([type, config]) => {
    const matches: string[] = [];
    const matchedSituations: string[] = [];
    
    config.keywords.forEach(regex => {
      situations.forEach(situation => {
        if (regex.test(situation)) {
          const match = situation.match(regex);
          if (match) {
            matches.push(...match);
            if (!matchedSituations.includes(situation)) {
              matchedSituations.push(situation);
            }
          }
        }
      });
    });
    
    if (matches.length > 0) {
      // Determine severity based on frequency and context
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (matches.length >= 3) severity = 'high';
      else if (matches.length >= 2) severity = 'medium';
      
      // Emotional manipulation is always critical if detected multiple times
      if (type === 'emotional' && matches.length >= 2) {
        severity = 'critical';
      }
      
      // Extract triggers
      const triggers = extractTriggers(matchedSituations);
      
      detectedPatterns.push({
        type: type as PatternType,
        pattern: config.description,
        description: config.description,
        severity,
        examples: matchedSituations.slice(0, 3), // Max 3 examples
        triggers,
        frequency: matches.length
      });
    }
  });
  
  // Sort by severity and frequency
  detectedPatterns.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.frequency - a.frequency;
  });
  
  // Generate insights
  const insights = generateInsights(detectedPatterns, allText);
  
  return {
    patterns: detectedPatterns,
    primaryPattern: detectedPatterns[0] || null,
    insights
  };
}

/**
 * Extract triggers from situations
 */
function extractTriggers(situations: string[]): string[] {
  const triggers: Set<string> = new Set();
  
  // Common trigger patterns
  const triggerPatterns = [
    { pattern: /لما (.*?)،/g, label: 'timing' },
    { pattern: /بعد (.*?)،/g, label: 'after' },
    { pattern: /عشان (.*?)،/g, label: 'reason' }
  ];
  
  situations.forEach(situation => {
    triggerPatterns.forEach(({ pattern, label }) => {
      const matches = situation.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length < 50) {
          triggers.add(match[1].trim());
        }
      }
    });
  });
  
  return Array.from(triggers).slice(0, 5); // Max 5 triggers
}

/**
 * Generate insights based on detected patterns
 */
function generateInsights(patterns: DetectedPattern[], allText: string): string[] {
  const insights: string[] = [];
  
  if (patterns.length === 0) {
    insights.push("لسه محتاجين مواقف أكتر عشان نحلل الأنماط");
    return insights;
  }
  
  // Primary pattern insight
  const primary = patterns[0];
  if (primary.severity === 'critical' || primary.severity === 'high') {
    insights.push(`الأنماط بتشير إن في مشكلة رئيسية في: ${primary.description}`);
  }
  
  // Multiple patterns
  if (patterns.length >= 3) {
    insights.push("في أكتر من نمط ضغط متداخلين - ده بيفسر ليه الاستنزاف كبير");
  }
  
  // Emotional state detection
  let emotionalStates: string[] = [];
  Object.entries(EMOTIONAL_STATES).forEach(([state, regex]) => {
    if (regex.test(allText)) {
      emotionalStates.push(state);
    }
  });
  
  if (emotionalStates.length >= 2) {
    insights.push("الاستجابة العاطفية بتاعتك بتشير لاستنزاف نفسي حقيقي");
  }
  
  // Boundary issues
  const hasBoundaryPattern = patterns.some(p => p.type === 'boundary');
  const hasEmotionalPattern = patterns.some(p => p.type === 'emotional');
  
  if (hasBoundaryPattern && hasEmotionalPattern) {
    insights.push("في ربط بين محاولات وضع حدود واستخدام الذنب ضدك");
  }
  
  return insights;
}

/**
 * Quick analysis for real-time feedback
 */
export function quickAnalyze(text: string): {
  hasPattern: boolean;
  patternType?: PatternType;
  feedback: string;
} {
  if (!text || text.trim().length < 10) {
    return { hasPattern: false, feedback: '' };
  }
  
  // Check each pattern type
  for (const [type, config] of Object.entries(PATTERNS_CONFIG)) {
    for (const regex of config.keywords) {
      if (regex.test(text)) {
        return {
          hasPattern: true,
          patternType: type as PatternType,
          feedback: `تم رصد نمط: ${config.description}`
        };
      }
    }
  }
  
  return { hasPattern: false, feedback: '' };
}
