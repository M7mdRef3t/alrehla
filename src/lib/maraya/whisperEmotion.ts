/**
 * Whisper Emotion Inference for Maraya
 * Adapted from the legacy Maraya whisper emotion analyzer.
 */

const EMOTION_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'anxiety', 'worried', 'worry', 'stress', 'stressed', 'panic', 'قلق', 'متوتر', 'خايف', 'خوف', 'مرعوب'],
  confusion: ['confused', 'confusion', 'lost', 'unclear', 'unsure', 'حائر', 'حيرة', 'محتار', 'مش فاهم', 'تايه'],
  nostalgia: ['nostalgia', 'nostalgic', 'memory', 'remember', 'home', 'past', 'حنين', 'مشتاق', 'ذكريات', 'زمان'],
  hope: ['hope', 'healing', 'better', 'light', 'tomorrow', 'أمل', 'شفاء', 'بكرة', 'نور', 'أفضل'],
  loneliness: ['alone', 'lonely', 'isolated', 'empty', 'وحيد', 'وحدة', 'لوحدي', 'فاضي', 'معزول'],
  wonder: ['wonder', 'curious', 'magic', 'dream', 'stars', 'دهشة', 'منبهر', 'فضولي', 'سحر', 'حلم'],
};

function normalizeText(text: string) {
  return String(text || '').toLowerCase().normalize('NFKC');
}

export function inferEmotionFromWhisper(text: string): { emotion: string; confidence: number; matchedKeywords: string[] } {
  const normalized = normalizeText(text);
  if (!normalized.trim()) return { emotion: 'hope', confidence: 0, matchedKeywords: [] };

  const scores = Object.entries(EMOTION_KEYWORDS).map(([emotion, keywords]) => {
    const matchedKeywords = keywords.filter(kw => normalized.includes(kw));
    return { emotion, matchedKeywords, score: matchedKeywords.length };
  });
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  if (!winner || winner.score < 1) return { emotion: 'hope', confidence: 0.2, matchedKeywords: [] };
  return { emotion: winner.emotion, confidence: Math.min(1, 0.35 + (winner.score * 0.2)), matchedKeywords: winner.matchedKeywords };
}
