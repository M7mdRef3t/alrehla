/**
 * Maraya Space Analysis API
 * POST /api/maraya/space/analyze
 */
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpace } from '@/lib/maraya/gemini';
import { buildSpaceAnalysisPrompt, normalizeOutputMode } from '@/lib/maraya/storytellerPrompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, outputMode: rawMode } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ success: false, error: 'imageBase64 is required' }, { status: 400 });
    }

    const outputMode = normalizeOutputMode(rawMode || 'judge_en');
    const systemPrompt = buildSpaceAnalysisPrompt(outputMode);
    const result = await analyzeSpace(systemPrompt, imageBase64, mimeType || 'image/jpeg');

    return NextResponse.json({
      success: true,
      detected_emotion: result.detected_emotion,
      space_reading: result.space_reading,
      mythic_reading: result.mythic_reading,
    });
  } catch (error) {
    console.error('[maraya/space/analyze] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
