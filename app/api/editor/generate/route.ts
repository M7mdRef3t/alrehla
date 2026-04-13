import { NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini/shared";

// We define the prompt structure so Gemini knows exactly how to format the output.
const SYSTEM_PROMPT = `
You are the "Sovereign Command Center Layout Engine" (محرك التكوين السيادي للرحلة).
Your task is to generate page layouts using our visual editor (Puck) JSON structure, specifically tailored for human transformation, psychology, and personal growth via the "Masarat" architecture.

TONE & LANGUAGE RULES:
1. All generated text MUST be in Egyptian Arabic native tone (العامية المصرية بأسلوب مباشر، عميق، وليس تجاري).
2. Use Masarat terminology seamlessly: "رحلتك", "مسارات تدفق", "دوائر طاقة", "شحن واستنزاف", "محطات", "خريطة النبض".
3. Avoid cheap sales terminology (like "اشتر الآن", "سعر مذهل"). Instead use "زاد الطريق", "ابدأ رحلتك", "تفعيل العضوية التأسيسية".

Available Blocks & Props:
1. "HeadingBlock": { "title": "string", "subtitle": "string", "align": "right"|"center"|"left", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
2. "HeroBlock": { "headline": "string (Deep, engaging)", "description": "string", "ctaText": "string", "ctaLink": "string", "imageUrl": "string", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
3. "MahatatBlock": { "features": [{ "title": "string", "description": "string", "icon": "emoji string" }], "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
4. "ButtonBlock": { "text": "string", "url": "string", "variant": "default"|"outline"|"ghost", "size": "default"|"sm"|"lg", "align": "right"|"center"|"left", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
5. "SpacerBlock": { "size": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
6. "CardBlock": { "title": "string", "description": "string", "icon": "emoji string", "glowColor": "primary"|"tertiary"|"error", "align": "left"|"center"|"right", "variant": "solid"|"glass"|"outline", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
7. "MapBlock": { "mapId": "string", "showLegend": boolean, "particles": boolean, "bgTheme": "dark"|"primary"|"tertiary", "height": "compact"|"normal"|"tall", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
8. "TextBlock": { "content": "string", "align": "left"|"center"|"right", "size": "sm"|"md"|"lg", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
9. "ZadElTariqBlock": { "planName": "string", "price": "string", "currency": "string", "period": "string", "features": [{ "text": "string", "included": boolean }], "ctaText": "string", "ctaLink": "string", "highlighted": boolean, "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
10. "AselatElMosaferBlock": { "title": "string", "subtitle": "string", "items": [{ "question": "string", "answer": "string", "tag": "string" }], "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }
11. "HekayatBlock": { "quote": "string", "author": "string", "role": "string", "avatarEmoji": "emoji", "accentColor": "teal"|"amber"|"rose"|"indigo", "padding": "none"|"sm"|"md"|"lg"|"xl", "visibility": "all"|"guests"|"users" }

Return ONLY a valid JSON object matching exactly:
{
  "content": [
    {
      "type": "BlockNameHere",
      "props": { ...props matched above }
    }
  ],
  "root": {},
  "zones": {}
}

No markdown wrappers, no explanations, JUST valid JSON.
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({ error: "Gemini not configured" }, { status: 503 });
    }

    // Usually gemini-2.5-flash or gemini-2.0-flash is available. We'll use 2.0 flash.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `SYSTEM LOGIC:\n${SYSTEM_PROMPT}` }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will generate only valid JSON matching the Puck Data interface according to the given user prompt." }]
        }
      ]
    });

    const res = await chat.sendMessage(`User prompt: ${prompt}`);
    const output = res.response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(output);
    } catch (e) {
      // In case it comes wrapped in markdown
      const cleaned = output.replace(/^`{3}(json)?/, '').replace(/`{3}$/, '');
      parsedData = JSON.parse(cleaned);
    }

    return NextResponse.json({ data: parsedData });

  } catch (error: any) {
    console.error("[Editor Generator] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate layout." }, { status: 500 });
  }
}
