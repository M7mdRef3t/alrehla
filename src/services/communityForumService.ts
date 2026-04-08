import { logger } from "@/services/logger";
import { supabase } from "./supabaseClient";

/* ══════════════════════════════════════════
   Community Forum Service
   ══════════════════════════════════════════ */

export interface CommunityPost {
  id: string;
  display_name: string;
  category: "success" | "advice" | "lesson";
  content: string;
  reactions: number;
  created_at: string;
}

export interface CommunityStats {
  totalAnalyses: number;
  totalComparisons: number;
  avgCompatibility: number;
  strongestDim: { id: string; avg: number } | null;
  weakestDim: { id: string; avg: number } | null;
  dimAverages: Record<string, number>;
}

const ANON_NAMES = [
  "مسافر", "بوصلة", "نجمة", "قمر", "فراشة", "موجة", "سحابة",
  "زهرة", "طائر", "شمعة", "رحّالة", "نسمة", "لؤلؤة", "صدى",
];

/** Generate anonymous display name */
export function generateAnonName(): string {
  const name = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${name} #${num}`;
}

/** Fetch latest posts */
export async function fetchPosts(limit = 20): Promise<CommunityPost[]> {
  if (!supabase) return SEED_POSTS;
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return SEED_POSTS;
  return data as CommunityPost[];
}

/** Create a new post */
export async function createPost(
  displayName: string,
  category: CommunityPost["category"],
  content: string,
): Promise<CommunityPost | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("community_posts")
    .insert({ display_name: displayName, category, content })
    .select()
    .single();

  if (error) {
    logger.error("[Community] Create post error:", error);
    return null;
  }
  return data as CommunityPost;
}

/** React to a post (increment) */
export async function reactToPost(postId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc("increment_reactions", { post_id: postId });
  if (error) {
    // Fallback: manual increment
    const { data } = await supabase
      .from("community_posts")
      .select("reactions")
      .eq("id", postId)
      .single();
    if (data) {
      await supabase
        .from("community_posts")
        .update({ reactions: (data.reactions ?? 0) + 1 })
        .eq("id", postId);
    }
  }
  return true;
}

/** Fetch aggregate stats from analysis_results */
export async function fetchCommunityStats(): Promise<CommunityStats> {
  const fallback: CommunityStats = {
    totalAnalyses: 0, totalComparisons: 0,
    avgCompatibility: 0, strongestDim: null, weakestDim: null,
    dimAverages: {},
  };

  if (!supabase) return fallback;

  // Total analyses
  const { count: totalCount } = await supabase
    .from("analysis_results")
    .select("id", { count: "exact", head: true });

  // Comparisons (pairs)
  const { count: compCount } = await supabase
    .from("analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("role", "partner");

  // Get all results for averaging
  const { data: allResults } = await supabase
    .from("analysis_results")
    .select("scores, role, share_code")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!allResults || allResults.length === 0) return { ...fallback, totalAnalyses: totalCount ?? 0 };

  // Compute dim averages
  const dimTotals: Record<string, { sum: number; count: number }> = {};
  const DIMS = ["attachment", "boundaries", "codependency", "communication", "selfawareness"];

  for (const r of allResults) {
    const scores = r.scores as Record<string, number> | null;
    if (!scores) continue;
    for (const d of DIMS) {
      if (scores[d] !== undefined) {
        if (!dimTotals[d]) dimTotals[d] = { sum: 0, count: 0 };
        dimTotals[d].sum += scores[d];
        dimTotals[d].count += 1;
      }
    }
  }

  const dimAverages: Record<string, number> = {};
  let strongest: { id: string; avg: number } | null = null;
  let weakest: { id: string; avg: number } | null = null;

  for (const d of DIMS) {
    const t = dimTotals[d];
    if (!t || t.count === 0) continue;
    const avg = Math.round((t.sum / t.count / 12) * 100);
    dimAverages[d] = avg;
    if (!strongest || avg > strongest.avg) strongest = { id: d, avg };
    if (!weakest || avg < weakest.avg) weakest = { id: d, avg };
  }

  // Avg compatibility from paired results
  let avgCompat = 0;
  if (compCount && compCount > 0) {
    // Group by share_code
    const pairs = new Map<string, { a?: Record<string, number>; b?: Record<string, number> }>();
    for (const r of allResults) {
      const code = r.share_code as string;
      if (!pairs.has(code)) pairs.set(code, {});
      const pair = pairs.get(code)!;
      if (r.role === "initiator") pair.a = r.scores as Record<string, number>;
      else pair.b = r.scores as Record<string, number>;
    }
    let compatSum = 0, compatCount = 0;
    for (const [, pair] of pairs) {
      if (pair.a && pair.b) {
        let diff = 0;
        for (const d of DIMS) diff += Math.abs((pair.a[d] ?? 0) - (pair.b[d] ?? 0));
        compatSum += Math.round((1 - diff / (DIMS.length * 12)) * 100);
        compatCount++;
      }
    }
    if (compatCount > 0) avgCompat = Math.round(compatSum / compatCount);
  }

  return {
    totalAnalyses: totalCount ?? 0,
    totalComparisons: compCount ?? 0,
    avgCompatibility: avgCompat,
    strongestDim: strongest,
    weakestDim: weakest,
    dimAverages,
  };
}

/* ══════════════════════════════════════════
   Seed Posts (fallback)
   ══════════════════════════════════════════ */

const SEED_POSTS: CommunityPost[] = [
  {
    id: "seed-1", display_name: "مسافر #7", category: "success",
    content: "بعد التحليل اكتشفنا إن مشكلتنا الأساسية في 'التعبير العاطفي' مش في الحب نفسه. بدأنا نخصص 15 دقيقة يومياً للمشاعر والنتيجة مذهلة.",
    reactions: 23, created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "seed-2", display_name: "نجمة #42", category: "advice",
    content: "محتاجة نصيحة — الشريك بتاعي حصل على درجة عالية في الاستقلالية وأنا في التعلق. إزاي نلاقي نقطة وسط؟",
    reactions: 15, created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "seed-3", display_name: "بوصلة #18", category: "lesson",
    content: "أهم درس تعلمته: الفجوة في النتائج مش معناها خلاف — معناها فرصة نتعلم من بعض. شريكتي عندها وعي ذاتي أعلى وبدأت أتعلم منها.",
    reactions: 31, created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "seed-4", display_name: "قمر #5", category: "success",
    content: "استخدمنا خارطة النمو المشترك — الأسبوع الأول من 'ساعة الأمان' غيّر حياتنا فعلاً. الحوار بقى أعمق.",
    reactions: 19, created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "seed-5", display_name: "فراشة #33", category: "lesson",
    content: "اكتشفت إن 'الحدود' مش رفض — هي احترام. لما فهمت ده، العلاقة اتحسنت 180 درجة.",
    reactions: 27, created_at: new Date(Date.now() - 432000000).toISOString(),
  },
];
