/**
 * Mirror Memory Service for Maraya — Supabase version
 * Ported from maraya-storyteller/server/services/mirrorMemory.js
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!url || !key) throw new Error('Supabase not configured for Maraya Mirror Memory');
    supabase = createClient(url, key);
  }
  return supabase;
}

function normalizeEmotion(emotion: string) { return String(emotion || '').trim().toLowerCase(); }
function normalizeSymbol(value: string) { return String(value || '').replace(/\s+/g, ' ').trim(); }

function uniqueJourney(history: string[]) {
  const compact: string[] = [];
  for (const emotion of history) {
    const n = normalizeEmotion(emotion);
    if (!n) continue;
    if (compact[compact.length - 1] === n) continue;
    compact.push(n);
  }
  return compact;
}

function buildTransformation({ seedEmotion, finalEmotion, emotionHistory = [] }: { seedEmotion: string; finalEmotion: string; emotionHistory?: string[] }) {
  const compact = uniqueJourney([seedEmotion, ...emotionHistory, finalEmotion]);
  const fromEmotion = compact[0] || normalizeEmotion(seedEmotion) || 'hope';
  const toEmotion = compact[compact.length - 1] || normalizeEmotion(finalEmotion) || fromEmotion;
  return { fromEmotion, toEmotion, line: `From ${fromEmotion} to ${toEmotion}` };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectJourneySymbols({ scenes = [], mythicReading = '' }: { scenes?: any[]; mythicReading?: string }) {
  const values: string[] = [];
  for (const scene of scenes) {
    const artifact = normalizeSymbol(scene?.carried_artifact);
    const anchor = normalizeSymbol(scene?.symbolic_anchor);
    if (artifact) values.push(artifact);
    if (anchor && anchor !== artifact) values.push(anchor);
  }
  const mythic = normalizeSymbol(mythicReading);
  if (mythic) values.push(mythic);
  return [...new Set(values)].slice(0, 6);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSignature(journeys: any[]) {
  const totals = new Map<string, number>();
  for (const journey of journeys) {
    for (const emotion of journey.emotionHistory || []) { totals.set(emotion, (totals.get(emotion) || 0) + 1); }
    if (journey.seedEmotion) { totals.set(journey.seedEmotion, (totals.get(journey.seedEmotion) || 0) + 1); }
  }
  const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  return { dominantEmotion: entries[0]?.[0] || 'hope', counts: Object.fromEntries(entries) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRecurringSymbols(journeys: any[]) {
  const counts = new Map<string, number>();
  for (const j of journeys) {
    for (const symbol of j.symbols || []) {
      const n = normalizeSymbol(symbol);
      if (!n) continue;
      counts.set(n, (counts.get(n) || 0) + 1);
    }
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 4);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildArcSummary(journeys: any[], signature: any) {
  const latestJourney = journeys[journeys.length - 1] || null;
  const latestMythicJourney = [...journeys].reverse().find(j => j?.mythicReading || j?.spaceReading) || null;
  if (!latestJourney) {
    return { recentArc: '', dominantEmotion: signature?.dominantEmotion || 'hope', lastMythicReading: '' };
  }
  const path = uniqueJourney([latestJourney.seedEmotion, ...(latestJourney.emotionHistory || []), latestJourney.finalEmotion]);
  return {
    recentArc: path.length > 0 ? `Your recurring arc recently moved through ${path.join(' -> ')}.` : '',
    dominantEmotion: signature?.dominantEmotion || latestJourney.finalEmotion || latestJourney.seedEmotion || 'hope',
    lastMythicReading: latestMythicJourney?.mythicReading || latestMythicJourney?.spaceReading || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MirrorMemorySnapshot {
  userId: string;
  rememberedCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentJourneys: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signature: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastTransformation: any;
  recurringSymbols: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arcSummary: any;
}

export async function getProfile(userId: string) {
  const sb = getSupabase();
  const { data } = await sb.from('maraya_mirror_memory').select('*').eq('user_id', userId).single();
  if (data) return { userId: data.user_id, journeys: data.journeys || [], createdAt: data.created_at, updatedAt: data.updated_at };
  return { userId, journeys: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveProfile(profile: { userId: string; journeys: any[] }) {
  const sb = getSupabase();
  await sb.from('maraya_mirror_memory').upsert({
    user_id: profile.userId,
    journeys: profile.journeys,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function rememberJourney({
  userId, outputMode, seedEmotion, emotionHistory, whisperText, spaceReading, mythicReading, endingMessage, secretEndingKey, scenes,
}: {
  userId: string; outputMode: string; seedEmotion: string; emotionHistory: string[];
  whisperText: string; spaceReading: string; mythicReading: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  endingMessage: string; secretEndingKey: string | null; scenes: any[];
}): Promise<MirrorMemorySnapshot> {
  const profile = await getProfile(userId);
  const finalEmotion = Array.isArray(emotionHistory) && emotionHistory.length > 0 ? emotionHistory[emotionHistory.length - 1] : seedEmotion;
  const transformation = buildTransformation({ seedEmotion, finalEmotion, emotionHistory });
  const normalizedMythicReading = normalizeSymbol(mythicReading || spaceReading);
  const symbols = collectJourneySymbols({ scenes, mythicReading: normalizedMythicReading });

  profile.journeys.push({
    id: `journey_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    outputMode, seedEmotion, finalEmotion,
    emotionHistory: Array.isArray(emotionHistory) ? emotionHistory.slice(-12) : [],
    whisperText: whisperText || '', spaceReading: spaceReading || '',
    mythicReading: normalizedMythicReading, symbols,
    summary: Array.isArray(scenes) && scenes.length > 0 ? scenes.map((s: Record<string, string>) => s.narration_ar).join(' ').slice(0, 420) : '',
    endingMessage: endingMessage || '', lastTransformation: transformation,
    secretEndingKey: secretEndingKey || null,
    sceneCount: Array.isArray(scenes) ? scenes.length : 0,
    endedAt: new Date().toISOString(),
  });

  profile.journeys = profile.journeys.slice(-16);
  await saveProfile(profile);
  return getSnapshot(userId);
}

export async function getSnapshot(userId: string): Promise<MirrorMemorySnapshot> {
  const profile = await getProfile(userId);
  const recentJourneys = [...profile.journeys].reverse().slice(0, 4);
  const signature = buildSignature(profile.journeys);
  return {
    userId, rememberedCount: profile.journeys.length, recentJourneys, signature,
    lastTransformation: recentJourneys[0]?.lastTransformation || null,
    recurringSymbols: buildRecurringSymbols(profile.journeys),
    arcSummary: buildArcSummary(profile.journeys, signature),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPromptMemory(snapshot: MirrorMemorySnapshot | null): string {
  if (!snapshot || snapshot.rememberedCount < 1) return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = (snapshot.recentJourneys || []).slice(0, 3).map((j: any, i: number) =>
    `- Memory ${i + 1}: ${j.lastTransformation?.line || `began in ${j.seedEmotion}, ended in ${j.finalEmotion}`}. Ending note: "${j.endingMessage || j.summary}".`
  );
  const recurringSymbols = (snapshot.recurringSymbols || []).slice(0, 3).join(', ');
  return [
    'Mirror Memory Context:',
    `- Remembered journeys: ${snapshot.rememberedCount}`,
    `- Dominant emotional signature: ${snapshot.signature?.dominantEmotion || 'hope'}`,
    snapshot.lastTransformation?.line ? `- Last transformation: ${snapshot.lastTransformation.line}` : '',
    snapshot.arcSummary?.recentArc ? `- Recurring arc: ${snapshot.arcSummary.recentArc}` : '',
    recurringSymbols ? `- Recurring symbols: ${recurringSymbols}` : '',
    snapshot.arcSummary?.lastMythicReading ? `- Last mythic reading: ${snapshot.arcSummary.lastMythicReading}` : '',
    ...lines,
  ].filter(Boolean).join('\n');
}
