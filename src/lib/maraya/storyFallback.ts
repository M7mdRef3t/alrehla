/**
 * Story Fallback Service for Maraya
 * Adapted from the legacy Maraya story fallback runtime.
 */

import type { MarayaScene } from './gemini';

const EMOTION_TO_AUDIO: Record<string, string> = {
  anxiety: 'tense_drone', confusion: 'mysterious_wind', nostalgia: 'ambient_calm',
  hope: 'hopeful_strings', loneliness: 'ambient_calm', wonder: 'triumphant_rise',
};

function isEnglishMode(outputMode: string) { return outputMode === 'judge_en'; }

function defaultChoices(outputMode: string) {
  if (isEnglishMode(outputMode)) {
    return [
      { text_ar: 'Keep moving toward the light that still answers you.', emotion_shift: 'hope' },
      { text_ar: 'Pause and listen to what the room is trying to reveal.', emotion_shift: 'nostalgia' },
    ];
  }
  return [
    { text_ar: 'واصل السير نحو الضوء الذي ما زال يجيبك.', emotion_shift: 'hope' },
    { text_ar: 'توقف قليلًا وأنصت لما يحاول المكان أن يكشفه.', emotion_shift: 'nostalgia' },
  ];
}

function buildNarration({ outputMode, emotion, stage, choiceText, redirectCommand }: {
  outputMode: string; emotion: string; stage: string; choiceText: string; redirectCommand: string;
}) {
  if (isEnglishMode(outputMode)) {
    if (stage === 'redirect') return { narration: `The mirror steadies itself and bends toward "${redirectCommand || 'a new path'}". The scene reforms without breaking your journey.`, visual: 'The architecture shifts in one visible breath, as if the walls agreed to begin again.', reflection: 'A rerouted story can still arrive somewhere true.' };
    if (stage === 'continue') return { narration: `Your last choice${choiceText ? `, "${choiceText},"` : ''} leaves a clear imprint on the room. The next chamber opens with controlled grace instead of collapse.`, visual: 'Edges soften, light returns to the corners, and the corridor keeps its promise.', reflection: 'Even when the system stumbles, the journey can continue.' };
    return { narration: `Maraya regains its footing around your ${emotion} and builds a stable opening scene. The story resumes with intention instead of silence.`, visual: 'A calm architectural frame settles into focus, ready to carry the next choice.', reflection: 'This path is reconstructed, but it is still yours.' };
  }
  if (stage === 'redirect') return { narration: `تستعيد مرايا توازنها وتميل نحو "${redirectCommand || 'مسار جديد'}". يعاد تشكيل المشهد من غير أن تنكسر الرحلة.`, visual: 'يتبدل الضوء دفعة واحدة، كأن الجدران وافقت على بداية أخرى.', reflection: 'حتى المسار المعاد توجيهه يستطيع أن يصل إلى معنى صادق.' };
  if (stage === 'continue') return { narration: `يترك اختيارك${choiceText ? ` "${choiceText}"` : ''} أثرًا واضحًا في المكان. تنفتح الحجرة التالية بثبات بدل أن يبتلعها التعثر.`, visual: 'تلين الحواف ويعود الضوء إلى الزوايا، كأن الممر يفي بوعده أخيرًا.', reflection: 'حتى لو اهتز النظام قليلًا، يمكن للرحلة أن تواصل طريقها.' };
  return { narration: `تستعيد مرايا توازنها حول شعورك بـ${emotion}. يبدأ المشهد الأول بثبات بدل الصمت.`, visual: 'يتشكل إطار معماري هادئ أمامك، جاهز لحمل الاختيار التالي.', reflection: 'هذا المسار أعيد بناؤه، لكنه ما زال مسارك.' };
}

function buildMythicEcho({ outputMode, mythicReading = '', emotion = 'hope', stage = 'opening' }: { outputMode: string; mythicReading?: string; emotion?: string; stage?: string }) {
  const n = String(mythicReading || '').trim();
  if (n) return n;
  if (isEnglishMode(outputMode)) {
    if (stage === 'redirect') return 'The room changes its legend without letting go of your thread.';
    if (stage === 'continue') return `The architecture keeps reshaping ${emotion} into a path you can still enter.`;
    return 'The room opens like a threshold that already knows your name.';
  }
  if (stage === 'redirect') return 'يبدّل المكان أسطورته من غير أن يقطع خيطك معه.';
  if (stage === 'continue') return `تواصل العمارة تشكيل ${emotion} في هيئة طريق ما زال يفتح لك بابه.`;
  return 'يفتح المكان نفسه كعتبة تعرف اسمك قبل أن تعبرها.';
}

function getFallbackRitualPhase(stage: string, allowFinalEnding: boolean) {
  if (allowFinalEnding) return 'becoming';
  if (stage === 'opening') return 'invocation';
  if (stage === 'redirect') return 'becoming';
  return 'reflection';
}

export function buildFallbackScenes({
  emotion = 'hope', outputMode = 'judge_en', stage = 'opening', choiceText = '', sceneNumber = 1,
  allowFinalEnding = false, redirectCommand = '', mythicReading = '',
} = {}): MarayaScene[] {
  const blockText = buildNarration({ outputMode, emotion, stage, choiceText, redirectCommand });
  const mythicEcho = buildMythicEcho({ outputMode, mythicReading, emotion, stage });
  const narration = `${blockText.narration} ${mythicEcho}`.trim();
  const isFinal = Boolean(allowFinalEnding);
  return [{
    scene_id: `fallback_scene_${sceneNumber}`, narration_ar: narration,
    image_prompt: `cinematic interior architecture, resilient emotional atmosphere, ${emotion} mood, warm recovery lighting, mythic continuity, ${mythicEcho}, 16:9 composition`,
    audio_mood: EMOTION_TO_AUDIO[emotion] || 'ambient_calm',
    carried_artifact: isEnglishMode(outputMode) ? 'a mirrored ember' : 'جمرة مرآوية',
    symbolic_anchor: isEnglishMode(outputMode) ? 'a small proof that the shift is still alive' : 'أثر صغير يدل على أن التحول ما زال حيًا',
    ritual_phase: getFallbackRitualPhase(stage, allowFinalEnding),
    mythic_echo: mythicEcho,
    interleaved_blocks: [
      { kind: 'narration', text_ar: narration },
      { kind: 'visual', text_ar: blockText.visual },
      { kind: 'reflection', text_ar: blockText.reflection },
    ],
    choices: isFinal ? [] : defaultChoices(outputMode),
  }];
}
