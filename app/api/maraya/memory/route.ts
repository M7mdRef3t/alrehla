/**
 * Maraya Mirror Memory API
 * GET /api/maraya/memory?userId=xxx  — get memory snapshot
 * POST /api/maraya/memory           — save journey
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSnapshot, rememberJourney } from '@/lib/maraya/mirrorMemory';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    const snapshot = await getSnapshot(userId);
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('[maraya/memory] GET Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, outputMode, seedEmotion, emotionHistory, whisperText, spaceReading, mythicReading, endingMessage, secretEndingKey, scenes } = body;
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });

    const snapshot = await rememberJourney({
      userId, outputMode: outputMode || 'judge_en',
      seedEmotion: seedEmotion || 'hope',
      emotionHistory: emotionHistory || [],
      whisperText: whisperText || '',
      spaceReading: spaceReading || '',
      mythicReading: mythicReading || '',
      endingMessage: endingMessage || '',
      secretEndingKey: secretEndingKey || null,
      scenes: scenes || [],
    });

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('[maraya/memory] POST Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
