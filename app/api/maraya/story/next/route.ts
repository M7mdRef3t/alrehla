/**
 * Maraya Story API — Next scene
 * POST /api/maraya/story/next
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateScenes, type MarayaScene } from '@/lib/maraya/gemini';
import { buildStorytellerPrompt, normalizeOutputMode, detectSecretEnding, getStorySceneLimit } from '@/lib/maraya/storytellerPrompts';
import { buildFallbackScenes } from '@/lib/maraya/storyFallback';
import { validateEmotion, validateChoiceText } from '@/lib/maraya/validators';
import { rememberJourney } from '@/lib/maraya/mirrorMemory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      emotion: rawEmotion, outputMode: rawMode, choiceText: rawChoiceText,
      choiceIndex, emotionShift, sceneCount: rawSceneCount,
      conversationHistory: rawHistory, timeOfDay, userId,
      redirectCommand, emotionHistory: rawEmotionHistory,
      journeyScenes: rawJourneyScenes, whisperText, spaceReading, mythicReading,
    } = body;

    const outputMode = normalizeOutputMode(rawMode || 'judge_en');
    const choiceText = validateChoiceText(rawChoiceText || '');
    const currentEmotion = validateEmotion(emotionShift || rawEmotion || 'hope');
    const sceneCount = Number(rawSceneCount) || 0;
    const storySceneLimit = getStorySceneLimit(outputMode);
    const emotionHistory: string[] = Array.isArray(rawEmotionHistory) ? rawEmotionHistory : [];

    // Check for secret ending
    const updatedEmotionHistory = [...emotionHistory, currentEmotion];
    const secretEnding = detectSecretEnding(updatedEmotionHistory, outputMode);
    const allowFinalEnding = (sceneCount + 1) >= storySceneLimit || !!secretEnding;

    // Build redirect command if present
    let redirect = null;
    if (redirectCommand && typeof redirectCommand === 'object') {
      redirect = { command: redirectCommand.command || '', intensity: Number(redirectCommand.intensity) || 0.5 };
    }

    // Build system prompt
    const systemPrompt = buildStorytellerPrompt(
      currentEmotion, true, outputMode, allowFinalEnding,
      redirect, secretEnding, timeOfDay || null, false,
    );

    // Rebuild conversation history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationHistory: any[] = Array.isArray(rawHistory) ? rawHistory : [];

    const choiceMessage = redirect
      ? `LIVE REDIRECT: The user commands "${redirect.command}" with intensity ${redirect.intensity.toFixed(2)}.`
      : `The user chose: "${choiceText || `Choice ${choiceIndex}`}". The emotion shifts to: ${currentEmotion}. Continue the story.`;

    conversationHistory.push({ role: 'user', parts: [{ text: choiceMessage }] });

    // Generate scenes with fallback
    let scenes;
    try {
      scenes = await generateScenes(systemPrompt, conversationHistory, outputMode);
      if (!scenes || scenes.length === 0) throw new Error('No scenes generated');
    } catch (error) {
      console.error('[maraya] Next scene generation failed, using fallback:', (error as Error).message);
      scenes = buildFallbackScenes({
        emotion: currentEmotion, outputMode,
        stage: redirect ? 'redirect' : 'continue',
        choiceText, sceneNumber: sceneCount + 1,
        allowFinalEnding,
        redirectCommand: redirect?.command || '',
        mythicReading: mythicReading || '',
      });
    }

    // Process scenes
    const processedScenes = scenes.map((scene: MarayaScene, i: number) => {
      const storySceneNumber = sceneCount + i + 1;
      const reachedStoryLimit = storySceneNumber >= storySceneLimit;
      const hasChoices = Array.isArray(scene.choices) && scene.choices.length > 0;
      const normalizedChoices = reachedStoryLimit ? [] : (hasChoices ? scene.choices.slice(0, 2) : []);
      const shouldEnd = reachedStoryLimit || normalizedChoices.length === 0;
      return { ...scene, choices: normalizedChoices, story_scene_number: storySceneNumber, story_total_scenes: storySceneLimit, is_final: shouldEnd };
    });

    const isFinal = processedScenes.some((s: MarayaScene & { is_final?: boolean }) => s.is_final);
    const updatedHistory = [...conversationHistory, { role: 'model', parts: [{ text: JSON.stringify({ scenes }) }] }];

    // If final, persist mirror memory
    let endingMessage = '';
    if (isFinal) {
      endingMessage = outputMode === 'judge_en'
        ? 'You have reached the end of this journey. But mirrors never truly end...'
        : 'وصلتَ إلى نهاية هذه الرحلة الروحية. لكنّ المرايا لا تنتهي...';

      if (userId) {
        try {
          await rememberJourney({
            userId, outputMode, seedEmotion: emotionHistory[0] || currentEmotion,
            emotionHistory: updatedEmotionHistory, whisperText: whisperText || '',
            spaceReading: spaceReading || '', mythicReading: mythicReading || '',
            endingMessage, secretEndingKey: secretEnding?.key || null,
            scenes: [...(Array.isArray(rawJourneyScenes) ? rawJourneyScenes : []), ...scenes],
          });
        } catch (e) { console.error('[maraya] Failed to persist memory:', e); }
      }
    }

    return NextResponse.json({
      success: true,
      scenes: processedScenes,
      emotion: currentEmotion,
      emotionHistory: updatedEmotionHistory,
      conversationHistory: updatedHistory,
      isFinal,
      endingMessage: isFinal ? endingMessage : null,
      secretEndingKey: secretEnding?.key || null,
    });
  } catch (error) {
    console.error('[maraya/story/next] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
