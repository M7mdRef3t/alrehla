/**
 * Maraya Story API — Start a new story
 * POST /api/maraya/story/start
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateScenes, type MarayaScene } from '@/lib/maraya/gemini';
import { buildStorytellerPrompt, normalizeOutputMode, getStorySceneLimit } from '@/lib/maraya/storytellerPrompts';
import { buildFallbackScenes } from '@/lib/maraya/storyFallback';
import { validateEmotion } from '@/lib/maraya/validators';
import { inferEmotionFromWhisper } from '@/lib/maraya/whisperEmotion';
import { getSnapshot, buildPromptMemory } from '@/lib/maraya/mirrorMemory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      emotion: rawEmotion,
      outputMode: rawMode,
      whisperText,
      userId,
      sessionId,
      timeOfDay,
      customContext,
      spaceReading,
      mythicReading,
    } = body;

    const outputMode = normalizeOutputMode(rawMode || 'judge_en');
    let emotion = validateEmotion(rawEmotion || 'hope');

    // If whisper text provided, infer emotion from it
    let whisperInterpretation = null;
    if (whisperText && typeof whisperText === 'string' && whisperText.trim()) {
      const inference = inferEmotionFromWhisper(whisperText);
      if (inference.confidence > 0.3) {
        emotion = inference.emotion;
      }
      whisperInterpretation = {
        inferredEmotion: inference.emotion,
        confidence: inference.confidence,
        matchedKeywords: inference.matchedKeywords,
        reflection: getWhisperReflection(inference.emotion, outputMode),
      };
    }

    // Get mirror memory for prompt context
    let memoryContext = '';
    let memorySnapshot = null;
    if (userId) {
      try {
        memorySnapshot = await getSnapshot(userId);
        memoryContext = buildPromptMemory(memorySnapshot);
      } catch { /* no memory yet */ }
    }

    // Build system prompt
    const systemPrompt = buildStorytellerPrompt(emotion, false, outputMode, false, null, null, timeOfDay || null, false);

    // Build conversation history with memory context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationHistory: any[] = [];
    if (memoryContext) {
      conversationHistory.push({ role: 'user', parts: [{ text: memoryContext }] });
      conversationHistory.push({ role: 'model', parts: [{ text: 'I remember. Let this journey build on what came before.' }] });
    }

    const introParts = [
      {
        text: whisperText
          ? `The user whispered: "${whisperText}". Their inferred emotion is: ${emotion}. Start the story.`
          : `The user chose the emotion: ${emotion}. Start the story.`,
      },
    ];

    if (customContext && typeof customContext === 'string' && customContext.trim()) {
      introParts.push({ text: `Custom emotional context from the user: "${customContext.trim()}".` });
    }

    if (spaceReading && typeof spaceReading === 'string' && spaceReading.trim()) {
      introParts.push({ text: `Space reading: ${spaceReading.trim()}` });
    }

    if (mythicReading && typeof mythicReading === 'string' && mythicReading.trim()) {
      introParts.push({ text: `Mythic reading: ${mythicReading.trim()}` });
    }

    conversationHistory.push({ role: 'user', parts: introParts });

    // Generate scenes with fallback
    let scenes;
    try {
      scenes = await generateScenes(systemPrompt, conversationHistory, outputMode);
      if (!scenes || scenes.length === 0) throw new Error('No scenes generated');
    } catch (error) {
      console.error('[maraya] Scene generation failed, using fallback:', (error as Error).message);
      scenes = buildFallbackScenes({ emotion, outputMode, stage: 'opening' });
    }

    // Normalize choices and check story limits
    const storySceneLimit = getStorySceneLimit(outputMode);
    const processedScenes = scenes.map((scene: MarayaScene, i: number) => {
      const storySceneNumber = i + 1;
      const reachedStoryLimit = storySceneNumber >= storySceneLimit;
      const hasChoices = Array.isArray(scene.choices) && scene.choices.length > 0;
      const normalizedChoices = reachedStoryLimit ? [] : (hasChoices ? scene.choices.slice(0, 2) : buildFallbackChoices(outputMode));
      const shouldEnd = reachedStoryLimit || normalizedChoices.length === 0;
      return {
        ...scene,
        choices: normalizedChoices,
        story_scene_number: storySceneNumber,
        story_total_scenes: storySceneLimit,
        is_final: shouldEnd,
      };
    });

    return NextResponse.json({
      success: true,
      scenes: processedScenes,
      emotion,
      outputMode,
      sessionId: sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      conversationHistory: [...conversationHistory, { role: 'model', parts: [{ text: JSON.stringify({ scenes }) }] }],
      whisperInterpretation,
      memorySnapshot,
    });
  } catch (error) {
    console.error('[maraya/story/start] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

function buildFallbackChoices(outputMode: string) {
  if (outputMode === 'judge_en') {
    return [
      { text_ar: 'Walk toward the brighter corridor and face what is waiting.', emotion_shift: 'hope' },
      { text_ar: 'Stay still and listen to the echo before moving.', emotion_shift: 'nostalgia' },
    ];
  }
  return [
    { text_ar: 'تمضي نحو الممر الأكثر نورًا وتواجه ما ينتظرك.', emotion_shift: 'hope' },
    { text_ar: 'تتريّث لحظة وتنصت لصدى المكان قبل المتابعة.', emotion_shift: 'nostalgia' },
  ];
}

function getWhisperReflection(emotion: string, outputMode: string): string {
  const reflections: Record<string, { en: string; ar: string }> = {
    anxiety: { en: 'I hear your thoughts circling the dark until one true direction begins to answer.', ar: 'أسمع أفكارك تدور في العتمة حتى يبدأ اتجاه واحد حقيقي بالإجابة.' },
    confusion: { en: 'I hear the questions layering inside you like glass upon glass.', ar: 'أسمع الأسئلة تتراكم بداخلك كطبقات من الزجاج.' },
    nostalgia: { en: 'I hear you reaching for something that once existed and still echoes.', ar: 'أسمعك تمد يدك نحو شيء كان موجوداً وما زال يتردد صداه.' },
    hope: { en: 'Whatever is still reaching for light in you is already alive.', ar: 'كل ما يمد يده نحو النور بداخلك هو حي بالفعل.' },
    loneliness: { en: 'I hear the silence you carry like architecture of your own making.', ar: 'أسمع الصمت الذي تحمله كعمارة من صنعك.' },
    wonder: { en: 'Your curiosity opens rooms that were sealed before you spoke.', ar: 'فضولك يفتح غرفاً كانت مغلقة قبل أن تتكلم.' },
  };
  const r = reflections[emotion] || reflections.hope;
  return outputMode === 'judge_en' ? r.en : r.ar;
}
