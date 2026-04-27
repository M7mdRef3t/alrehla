/**
 * Maraya Image Generation API
 * POST /api/maraya/image/generate
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/maraya/imagen';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imagePrompt, sceneId, aspectRatio } = body;

    if (!imagePrompt || typeof imagePrompt !== 'string') {
      return NextResponse.json({ success: false, error: 'imagePrompt is required' }, { status: 400 });
    }

    const image = await generateImage(imagePrompt, aspectRatio || '16:9');

    return NextResponse.json({
      success: true,
      sceneId: sceneId || null,
      image: image ? { base64: image.base64, mimeType: image.mimeType } : null,
    });
  } catch (error) {
    console.error('[maraya/image/generate] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
