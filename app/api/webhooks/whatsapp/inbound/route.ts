/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from "next/server";
import { WhatsAppCloudService } from "@/services/whatsappCloudService";
// @ts-ignore — external package may not be installed locally
import { quickAnalyze, getStaticQuickPath } from "@alrehla/masarat";

const WEBHOOK_VERIFY_TOKEN = process.env.META_WA_WEBHOOK_VERIFY_TOKEN || "alrehla_sovereign_token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
      const message = messages[0];
      const fromPhone = message.from;
      const messageText = message.text?.body;

      if (messageText) {
        console.log(`[WhatsApp Webhook] Received message from ${fromPhone}: ${messageText}`);

        let aiReply = "أهلًا بك في منصة الرحلة. رسالتك وصلت، وجاري تحليلها.";

        try {
          const analysis = quickAnalyze ? (quickAnalyze(messageText) as any) : { patterns: [] };

          if (analysis && Array.isArray(analysis.patterns) && analysis.patterns.length > 0) {
            const primaryPattern = analysis.patterns[0];
            aiReply = `رصدنا نمط ضغط: ${primaryPattern.type}. من فضلك خد نفس عميق.. تذكر إن "لا" هي جملة كاملة.`;
          } else {
            const staticPath = getStaticQuickPath ? (getStaticQuickPath("red" as any) as any) : null;
            if (staticPath) {
              aiReply = `${staticPath.exitPhrase ?? staticPath.title ?? "خذ نفسًا عميقًا."}\n\n${staticPath.breathingCue ?? staticPath.mantra ?? "اهدأ وارجع لخطوة واحدة آمنة."}`;
            }
          }
        } catch (engineError) {
          console.error("[WhatsApp Webhook] Engine inference failed:", engineError);
        }

        await WhatsAppCloudService.sendFreeText(fromPhone, "system-bot", aiReply);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
