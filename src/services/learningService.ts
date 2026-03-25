/**
 * learningService.ts
 * Typed data access layer for all learning content stored in Supabase.
 * Falls back to mock data when the DB is empty or unavailable.
 */
import { supabase } from "./supabaseClient";
import { safeGetSession } from "./supabaseClient";

/* ══════════ Types ══════════ */
export interface DBCourse {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  instructor_bio: string | null;
  color: string;
  level: "beginner" | "intermediate" | "advanced";
  thumbnail_url: string | null;
  total_duration: string | null;
  status: string;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DBModule {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
}

export interface DBUnit {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  duration: string;
  video_url: string | null;
  is_locked: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
}

export interface DBQuizQuestion {
  id: string;
  course_id: string;
  question: string;
  options: string[];          // array of 4 options
  correct_index: number;      // 0-3
  explanation: string | null;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  sort_order: number;
}

export interface UserProgress {
  unit_id: string;
  course_id: string;
  completed_at: string | null;
}

/* ══════════ Fetch functions ══════════ */

/** Fetch all published courses ordered by sort_order */
export async function fetchCourses(): Promise<DBCourse[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  if (error) { console.error("[learningService] fetchCourses:", error.message); return []; }
  return (data ?? []) as DBCourse[];
}

/** Fetch a single course by ID */
export async function fetchCourse(id: string): Promise<DBCourse | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) { console.error("[learningService] fetchCourse:", error.message); return null; }
  return data as DBCourse;
}

/** Fetch modules for a course, ordered */
export async function fetchModules(courseId: string): Promise<DBModule[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order");
  if (error) { console.error("[learningService] fetchModules:", error.message); return []; }
  return (data ?? []) as DBModule[];
}

/** Fetch all units for a course (grouped by module_id client-side) */
export async function fetchUnits(courseId: string): Promise<DBUnit[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("course_units")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order");
  if (error) { console.error("[learningService] fetchUnits:", error.message); return []; }
  return (data ?? []) as DBUnit[];
}

/** Fetch quiz questions for a course */
export async function fetchQuizQuestions(courseId: string): Promise<DBQuizQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order");
  if (error) { console.error("[learningService] fetchQuizQuestions:", error.message); return []; }
  return (data ?? []) as DBQuizQuestion[];
}

/** Fetch completed unit IDs for the current user */
export async function fetchUserProgress(courseId: string): Promise<Set<string>> {
  const session = await safeGetSession();
  if (!session || !supabase) return new Set();
  const { data, error } = await supabase
    .from("user_course_progress")
    .select("unit_id")
    .eq("course_id", courseId)
    .eq("user_id", session.user.id)
    .not("completed_at", "is", null);
  if (error) { console.error("[learningService] fetchUserProgress:", error.message); return new Set(); }
  return new Set((data ?? []).map((r: { unit_id: string }) => r.unit_id));
}

/** Mark a unit as complete for the current user */
export async function markUnitComplete(courseId: string, unitId: string): Promise<void> {
  const session = await safeGetSession();
  if (!session || !supabase) return;
  const { error } = await supabase.from("user_course_progress").upsert({
    user_id: session.user.id,
    course_id: courseId,
    unit_id: unitId,
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,unit_id" });
  if (error) console.error("[learningService] markUnitComplete:", error.message);
}

/** Save a quiz session result */
export async function saveQuizSession(params: {
  courseId: string;
  answers: Record<string, number>;
  confidence: Record<string, number>;
  score: number;
  total: number;
  passed: boolean;
}): Promise<void> {
  const session = await safeGetSession();
  if (!session || !supabase) return;
  const { error } = await supabase.from("user_quiz_sessions").insert({
    user_id: session.user.id,
    course_id: params.courseId,
    answers: params.answers,
    confidence: params.confidence,
    score: params.score,
    total: params.total,
    passed: params.passed,
    completed_at: new Date().toISOString(),
  });
  if (error) console.error("[learningService] saveQuizSession:", error.message);
}

/** Fetch all content_items (for ResourcesCenter articles/exercises) */
export async function fetchContentItems(contentType?: string): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];
  let query = supabase
    .from("content_items")
    .select("id,title,content_type,estimated_minutes,difficulty,metadata,status")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (contentType) query = query.eq("content_type", contentType);
  const { data, error } = await query;
  if (error) { console.error("[learningService] fetchContentItems:", error.message); return []; }
  return (data ?? []) as Record<string, unknown>[];
}

/** Fetch article content_items (for ResourcesCenter articles tab) */
export async function fetchDBArticles(): Promise<Record<string, unknown>[]> {
  return fetchContentItems("article");
}

/** Fetch video-course content_items (for ResourcesCenter videos tab) */
export async function fetchDBVideoCourses(): Promise<Record<string, unknown>[]> {
  return fetchContentItems("video-course");
}

export interface UserProgressStats {
  totalCompleted: number;       // total units completed
  totalQuizSessions: number;    // total quiz attempts
  avgScore: number;             // average quiz score
  lastActivity: string | null;  // ISO timestamp
  passedCount: number;          // quizzes passed
}

/** Aggregate progress stats for the current user */
export async function fetchUserProgressStats(courseId: string): Promise<UserProgressStats | null> {
  const session = await safeGetSession();
  if (!session || !supabase) return null;
  const userId = session.user.id;

  const [progressRes, quizRes] = await Promise.all([
    supabase
      .from("user_course_progress")
      .select("unit_id, completed_at")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("user_quiz_sessions")
      .select("score, passed, completed_at")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
  ]);

  if (progressRes.error) console.error("[learningService] fetchStats progress:", progressRes.error.message);
  if (quizRes.error) console.error("[learningService] fetchStats quiz:", quizRes.error.message);

  const progress = (progressRes.data ?? []) as { unit_id: string; completed_at: string }[];
  const quizzes = (quizRes.data ?? []) as { score: number; passed: boolean; completed_at: string }[];

  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
    : 0;

  const allDates = [
    ...progress.map(p => p.completed_at),
    ...quizzes.map(q => q.completed_at),
  ].filter(Boolean).sort().reverse();

  return {
    totalCompleted: progress.length,
    totalQuizSessions: quizzes.length,
    avgScore,
    lastActivity: allDates[0] ?? null,
    passedCount: quizzes.filter(q => q.passed).length,
  };
}

/** Aggregate global progress stats for the current user across ALL courses */
export async function fetchGlobalUserProgressStats(): Promise<UserProgressStats | null> {
  const session = await safeGetSession();
  if (!session || !supabase) return null;
  const userId = session.user.id;

  const [progressRes, quizRes] = await Promise.all([
    supabase
      .from("user_course_progress")
      .select("unit_id, completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("user_quiz_sessions")
      .select("score, passed, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
  ]);

  if (progressRes.error) console.error("[learningService] fetchGlobalStats progress:", progressRes.error.message);
  if (quizRes.error) console.error("[learningService] fetchGlobalStats quiz:", quizRes.error.message);

  const progress = (progressRes.data ?? []) as { unit_id: string; completed_at: string }[];
  const quizzes = (quizRes.data ?? []) as { score: number; passed: boolean; completed_at: string }[];

  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
    : 0;

  const allDates = [
    ...progress.map(p => p.completed_at),
    ...quizzes.map(q => q.completed_at),
  ].filter(Boolean).sort().reverse();

  return {
    totalCompleted: progress.length,
    totalQuizSessions: quizzes.length,
    avgScore,
    lastActivity: allDates[0] ?? null,
    passedCount: quizzes.filter(q => q.passed).length,
  };
}

/** Fetch total count of articles and videos for social proof */
export async function fetchResourceCounts(): Promise<{ articles: number; videos: number }> {
  if (!supabase) return { articles: 0, videos: 0 };
  
  const [articlesRes, videosRes] = await Promise.all([
    supabase.from("content_items").select("id", { count: "exact", head: true }).eq("content_type", "article").eq("status", "active"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).eq("content_type", "video-course").eq("status", "active"),
  ]);

  return {
    articles: articlesRes.count ?? 0,
    videos: videosRes.count ?? 0,
  };
}

/** Check if a user is authenticated (for login prompts) */
export async function hasActiveSession(): Promise<boolean> {
  const session = await safeGetSession();
  return session !== null;
}

