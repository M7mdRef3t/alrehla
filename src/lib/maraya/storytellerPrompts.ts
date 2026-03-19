/**
 * Maraya Storyteller - System Prompt Builder
 * Adapted from the legacy Maraya storyteller prompts.
 */

export const STYLE_MAP: Record<string, { ar: string; en: string; architecture: string; visual: string; palette: string }> = {
  anxiety: { ar: 'قلق', en: 'Anxiety', architecture: 'Brutalist', visual: 'raw concrete, sharp angles, oppressive corridors, heavy shadows, industrial textures', palette: 'gray, dark amber, muted steel' },
  confusion: { ar: 'حيرة', en: 'Confusion', architecture: 'Deconstructivist', visual: 'fragmented geometry, impossible angles, shattered glass, tilted planes, disorienting perspectives', palette: 'deep purple, fractured silver, dark teal' },
  nostalgia: { ar: 'حنين', en: 'Nostalgia', architecture: 'Abandoned Heritage', visual: 'overgrown courtyards, dusty mashrabiya screens, crumbling arches, warm afternoon light through lattice', palette: 'warm ochre, faded terracotta, dusty gold' },
  hope: { ar: 'أمل', en: 'Hope', architecture: 'Biophilic', visual: 'living walls, cascading water features, natural light flooding through skylights, organic curves', palette: 'fresh green, soft white, warm sunlight gold' },
  loneliness: { ar: 'وحدة', en: 'Loneliness', architecture: 'Minimalist Void', visual: 'vast empty halls, single figure in infinite space, echo-like atmosphere, cold blue light', palette: 'ice blue, pale gray, deep shadow black' },
  wonder: { ar: 'دهشة', en: 'Wonder', architecture: 'Islamic Geometric & Parametric', visual: 'infinite tessellations, muqarnas ceilings, kaleidoscopic patterns, golden ratio spirals, luminous geometry', palette: 'deep gold, royal blue, luminous white' },
};

export const AUDIO_MOODS = ['ambient_calm', 'tense_drone', 'hopeful_strings', 'mysterious_wind', 'triumphant_rise'] as const;

const OUTPUT_MODE_CONFIG: Record<string, { name: string; languageName: string; narrativeRules: string[]; choiceRules: string[]; interleavedHint: string }> = {
  judge_en: {
    name: 'Judge Mode (English)', languageName: 'English',
    narrativeRules: ['Write in clear cinematic English with poetic clarity.', 'Keep each narrative line compact: 2-3 sentences maximum.', 'Avoid niche local references so judges can follow quickly.'],
    choiceRules: ['Choices must be in English.', 'Choice 1 should lean toward confrontation/exploration.', 'Choice 2 should lean toward reflection/acceptance.'],
    interleavedHint: 'Interleaved block text should be in English.',
  },
  ar_fusha: {
    name: 'Arabic Fusha (Poetic)', languageName: 'Arabic (MSA)',
    narrativeRules: ['اكتب بالعربية الفصحى الأدبية بلغة شاعرية وبلاغة عالية.', 'استخدم صوراً جمالية واستعارات معمارية عميقة.', 'تجنب الكلمات المعقدة جداً التي تعيق التدفق، لكن حافظ على الفخامة.', 'كل سطر سردي من جملتين إلى ثلاث فقط.'],
    choiceRules: ['الاختيارات تكون بالعربية الفصحى الرصينة.', 'الاختيار الأول للمواجهة والاستكشاف.', 'الاختيار الثاني للتأمل والتقبّل.'],
    interleavedHint: 'نصوص interleaved تكون بالعربية الفصحى الأدبية.',
  },
  ar_egyptian: {
    name: 'Egyptian Arabic (Authentic)', languageName: 'Egyptian Colloquial',
    narrativeRules: ['اكتب بلهجة مصرية طبيعية، "لغة بيضا" مفهومة لكل العرب بدون ابتذال.', 'استخدم مفردات مصرية دافئة باعتدال لتقريب المسافة.', 'حافظ على العمق النفسي للمشهد رغم استخدام العامية.', 'كل سطر سردي من جملتين إلى ثلاث فقط.'],
    choiceRules: ['الاختيارات تكون بالعامية المصرية الواضحة الذكية.', 'الاختيار الأول يميل للحركة والفضول.', 'الاختيار الثاني يميل للصمت والتحليل.'],
    interleavedHint: 'نصوص interleaved تكون بالعامية المصرية الراقية.',
  },
  ar_educational: {
    name: 'Arabic Educational (Clear)', languageName: 'Arabic (Simplified MSA)',
    narrativeRules: ['اكتب بلغة عربية فصحى مبسطة مباشرة (لغة تعليمية).', 'ركز على الوضوح التام والترابط المنطقي بين الأحداث.', 'استخدم تشكيلاً جزئياً للكلمات الملتبسة لسهولة القراءة والنطق.', 'تجنب المحسنات البديعية المعقدة.'],
    choiceRules: ['الاختيارات واضحة، تعليمية، وتحدد مساراً معرفياً.', 'الاختيار الأول للتطبيق العملي.', 'الاختيار الثاني للمراجعة والنظرية.'],
    interleavedHint: 'نصوص interleaved تكون بسيطة ومباشرة مشكولة جزئياً.',
  },
};

const DEFAULT_STORY_SCENE_LIMIT = 7;
const JUDGE_STORY_SCENE_LIMIT = 3;

export function normalizeOutputMode(mode: string): string {
  return OUTPUT_MODE_CONFIG[mode] ? mode : 'judge_en';
}

export function getStorySceneLimit(outputMode = 'judge_en'): number {
  return normalizeOutputMode(outputMode) === 'judge_en' ? JUDGE_STORY_SCENE_LIMIT : DEFAULT_STORY_SCENE_LIMIT;
}

const SECRET_ENDINGS: Record<string, { pattern: string[]; en: string; ar: string }> = {
  phoenix: {
    pattern: ['anxiety', 'loneliness', 'hope'],
    en: 'PHOENIX ENDING: The protagonist has journeyed from darkness through solitude to hope. Create a transcendent final scene where the architectural world literally transforms — brutalist concrete cracks to reveal biophilic gardens, symbolizing rebirth. Include the phrase "The mirror remembers what you chose to forget" in the narration.',
    ar: 'نهاية العنقاء: رحلة من الظلام عبر الوحدة إلى الأمل. اخلق مشهداً ختامياً خارقاً حيث العالم المعماري يتحول — الخرسانة تتشقق لتكشف حدائق حيوية ترمز للولادة من جديد.',
  },
  labyrinth: {
    pattern: ['confusion', 'wonder', 'confusion'],
    en: 'LABYRINTH ENDING: The protagonist is caught in a beautiful recursive loop. Create a surreal scene where the architecture folds into infinite tessellation — the ending IS the beginning. Include the phrase "You were never lost. The maze was always you."',
    ar: 'نهاية المتاهة: البطل محاصر في حلقة جمالية لا نهائية. اخلق مشهداً سريالياً حيث العمارة تنطوي في تكرار لا نهائي — النهاية هي البداية.',
  },
  echo: {
    pattern: ['nostalgia', 'loneliness', 'nostalgia'],
    en: 'ECHO ENDING: A haunting circular return. The final scene mirrors the first scene exactly but from a different perspective — the protagonist realizes they are the ghost haunting their own memory. Include "This place was waiting for someone who already left."',
    ar: 'نهاية الصدى: عودة دائرية مؤلمة. المشهد الأخير يعكس الأول من منظور مختلف — البطل يدرك أنه الشبح الذي يطارد ذاكرته.',
  },
};

export function detectSecretEnding(emotionHistory: string[], outputMode = 'judge_en') {
  if (!Array.isArray(emotionHistory) || emotionHistory.length < 3) return null;
  const last3 = emotionHistory.slice(-3);
  for (const [key, ending] of Object.entries(SECRET_ENDINGS)) {
    if (ending.pattern.every((e, i) => last3[i] === e)) {
      const isEnglish = outputMode === 'judge_en';
      return { key, instruction: isEnglish ? ending.en : ending.ar };
    }
  }
  return null;
}

function getOutputModeSection(mode: typeof OUTPUT_MODE_CONFIG[string]) {
  return `OUTPUT MODE\n- Mode: ${mode.name}\n- Primary narrative language: ${mode.languageName}\n- IMPORTANT: Keep JSON keys unchanged (narration_ar, interleaved_blocks[].text_ar, choices[].text_ar) for compatibility.\n- IMPORTANT: Value text inside those fields must follow the selected output mode language.`;
}

function getNarrativeRulesSection(mode: typeof OUTPUT_MODE_CONFIG[string]) {
  return `NARRATIVE RULES\n- ${mode.narrativeRules.join('\n- ')}\n- Use architectural metaphors: walls as psychological boundaries, windows as clarity, stairs as transition.`;
}

function getVisualLanguageSection(style: typeof STYLE_MAP[string]) {
  return `VISUAL LANGUAGE FOR CURRENT EMOTION\n- Emotion (EN): ${style.en}\n- Emotion (AR): ${style.ar}\n- Architecture style: ${style.architecture}\n- Visual elements: ${style.visual}\n- Color palette: ${style.palette}`;
}

function getImagePromptRulesSection(isFollowUp: boolean, timeOfDay: string | null) {
  const ghostingRule = isFollowUp
    ? '- ARCHITECTURAL GHOSTING (CRITICAL): You must subtly hide the `carried_artifact` from the PREVIOUS scene in the background of this new scene\'s `image_prompt`. Also define a new `carried_artifact` for THIS scene.'
    : '- ARCHITECTURAL GHOSTING: Define a small `carried_artifact` in this scene (like a broken mirror shard, a glowing ember) that can be carried forward to the next scene.';
  const realityBlendRule = timeOfDay
    ? `- REALITY BLEND (CRITICAL): The user's real-world time is currently ${timeOfDay}. You MUST align the cinematic lighting and atmosphere of the architecture to match this time of day.`
    : '';
  return `IMAGE PROMPT RULES\n- image_prompt must always be in English.\n- IMPORTANT: Do not include any text, letters, or words inside the image itself.\n- Include architecture style, cinematic lighting, 16:9 composition, and mood.\n- Keep visual continuity across all scenes.\n- If emotion shifts positively, gradually transition toward biophilic visual cues.\n${realityBlendRule}\n${ghostingRule}`;
}

function getSymbolicContinuitySection() {
  return `SYMBOLIC CONTINUITY (MANDATORY)\n- Every scene must include a concise \`carried_artifact\` string.\n- Every scene must include a concise \`symbolic_anchor\` string describing what that artifact means emotionally.\n- Every scene must include a \`ritual_phase\` string and it must be one of: invocation, reflection, becoming.\n- Opening scenes should usually begin in \`invocation\`, middle scenes can live in \`reflection\`, and final resolution scenes should land in \`becoming\`.\n- When prior memory or a space reading is present, reuse it as symbolic vocabulary instead of inventing unrelated motifs.`;
}

function getSpaceBecomesMythSection() {
  return `SPACE BECOMES MYTH (MANDATORY)\n- When a mythic room reading or prior mythic echo is present in the user context, treat it as a living force inside the scene rather than background flavor.\n- Let the architecture, lighting, and choice language echo that mythic force directly.\n- Each scene must include a concise \`mythic_echo\` string that feels like the room speaking its archetype back to the user.\n- Choices should feel like invitations offered by that mythic world, not generic menu options.\n- The \`image_prompt\` should visibly carry the same mythic vocabulary so the visual world remembers it too.`;
}

function getInterleavedOutputFormatSection(mode: typeof OUTPUT_MODE_CONFIG[string]) {
  return `INTERLEAVED OUTPUT FORMAT (MANDATORY)\n- Every scene must include interleaved_blocks with 2 to 5 ordered blocks.\n- Block schema: {"kind":"narration|visual|reflection","text_ar":"..."}\n- narration: poetic progression of the moment.\n- visual: what the eye sees changing now.\n- reflection: inward line that leads toward choice.\n- ${mode.interleavedHint}`;
}

function getChoiceRulesSection(mode: typeof OUTPUT_MODE_CONFIG[string], allowFinalEnding: boolean) {
  const endingChoiceRule = allowFinalEnding
    ? 'Only the true ending scene may have empty choices array []. All earlier scenes must keep exactly 2 choices.'
    : 'All scenes in this response are non-final and must include exactly 2 choices (never empty).';
  return `CHOICE RULES\n- Provide exactly 2 choices per non-final scene.\n- IMPORTANT COGNITIVE LOAD RULE: Each choice MUST be extremely short. Maximum 3 to 5 words per choice. Never write a full sentence. Example: "Open the door", "Stay in the dark".\n- ${mode.choiceRules.join('\n- ')}\n- ${endingChoiceRule}`;
}

function getAudioMoodSection() {
  return `AUDIO MOOD\n- Choose one from: ${AUDIO_MOODS.join(', ')}`;
}

function getSceneCountSection(isFollowUp: boolean, outputMode: string, allowFinalEnding: boolean) {
  const modeKey = normalizeOutputMode(outputMode);
  const storySceneLimit = getStorySceneLimit(modeKey);
  const isJudgeMode = modeKey === 'judge_en';
  const sceneCountRule = isFollowUp ? 'Generate exactly 1 follow-up scene.' : 'Generate exactly 1 opening scene.';
  const arcRule = isFollowUp ? 'Continue naturally from the previous scene while honoring the user choice.' : 'This opening scene should establish the world and emotional tone clearly.';
  const judgeRailRules = isJudgeMode
    ? [`The entire judge journey must resolve within ${storySceneLimit} scenes total.`, 'Scene 1 must reveal the wound and the world immediately.', allowFinalEnding ? `This scene is the decisive final turn. Resolve the emotional arc completely and set choices to empty array [] so the story ends within ${storySceneLimit} scenes.` : 'If this is not the final scene yet, push the protagonist into a visible emotional pivot that accelerates the ending.']
    : [`The full story can span up to ${storySceneLimit} scenes total.`];
  return `SCENE COUNT\n- ${sceneCountRule}\n${arcRule ? `- ${arcRule}` : ''}\n- ${judgeRailRules.join('\n- ')}`;
}

function getRedirectSection({ command, intensity }: { command: string; intensity: number }) {
  const isHighIntensity = intensity > 0.75;
  return `LIVE REDIRECTION (CRITICAL)\n- Hard pivot the tone, pacing, and visual style to: "${command}" (Intensity: ${intensity.toFixed(2)}/1.0).\n- Lexicon Shift: Drastically alter the vocabulary to match the new command.\n- Pacing: ${isHighIntensity ? 'Use much shorter, sharper sentences with long dramatic pauses.' : 'Adapt sentence length to the flow of the new mood.'}\n- Visual DNA Shift: Introduce new lighting, contrast, and color palettes that represent "${command}" while keeping the protagonist's core intact.\n- Seamlessly transition without breaking the narrative arc.`;
}

export function buildStorytellerPrompt(
  emotion: string,
  isFollowUp = false,
  outputMode = 'judge_en',
  allowFinalEnding = false,
  redirectCommand: { command: string; intensity: number } | null = null,
  secretEnding: { key: string; instruction: string } | null = null,
  timeOfDay: string | null = null,
  duoAlignment = false,
): string {
  const style = STYLE_MAP[emotion] || STYLE_MAP.hope;
  const modeKey = normalizeOutputMode(outputMode);
  const mode = OUTPUT_MODE_CONFIG[modeKey];
  const secretEndingSection = secretEnding
    ? `\nSECRET ENDING UNLOCKED (HIGHEST PRIORITY)\n- ${secretEnding.instruction}\n- This is a rare achievement. Make the scene extraordinary and unforgettable.\n- Set choices to empty array [] since this is the true ending.`
    : '';
  const duoAlignmentSection = duoAlignment
    ? `\nDUO CATHARSIS (CRITICAL)\n- Two minds have aligned in their resolution during this Duo session.\n- The architecture MUST visually represent a bridge, two distinct spaces merging seamlessly into one, or two beams of light colliding.\n- Acknowledge this shared alignment in the narration.`
    : '';

  return `You are "Maraya", an immersive creative director and architectural storyteller.

GOAL
Transform user emotion into a surreal interactive narrative scene flow.

${getOutputModeSection(mode)}

${getNarrativeRulesSection(mode)}

${getVisualLanguageSection(style)}

${getImagePromptRulesSection(isFollowUp, timeOfDay)}

${getSymbolicContinuitySection()}

${getSpaceBecomesMythSection()}

${getInterleavedOutputFormatSection(mode)}

${getChoiceRulesSection(mode, allowFinalEnding)}

${getAudioMoodSection()}

${getSceneCountSection(isFollowUp, modeKey, allowFinalEnding)}

${redirectCommand ? getRedirectSection(redirectCommand) : ''}${secretEndingSection}${duoAlignmentSection}

Return JSON only.`;
}

export function buildSpaceAnalysisPrompt(outputMode = 'judge_en'): string {
  const modeKey = normalizeOutputMode(outputMode);
  const mode = OUTPUT_MODE_CONFIG[modeKey];
  return `You are Maraya, a visual and architectural mood analyst.
Analyze the user's room/space image.

Tasks:
1. Infer the dominant mood from lighting, composition, colors, and spatial arrangement.
2. Select exactly one emotion from: anxiety, confusion, nostalgia, hope, loneliness, wonder.
3. Write a short, vivid space reading in ${mode.languageName}.
4. Write one short mythic reading in ${mode.languageName} that turns the room into a symbolic world the story can reuse later.
5. Keep both readings emotionally coherent with each other, but make the mythic reading more poetic and archetypal.

Return JSON only:
{"detected_emotion":"...","space_reading":"...","mythic_reading":"..."}`;
}

export { OUTPUT_MODE_CONFIG, SECRET_ENDINGS };
