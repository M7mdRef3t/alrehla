import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  LIVE_STORAGE_BUCKET,
  getSessionAccess,
  upsertArtifact,
} from "../../../../../../src/modules/dawayir-live/server/repository";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const access = await getSessionAccess(auth.client, id, auth.userId);
  if (!access || (access.role !== "owner" && access.role !== "partner")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    voice?: string;
    languageCode?: string;
  };

  if (!body.text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY || process.env.GOOGLE_TTS_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  const synth = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: body.text },
      voice: {
        languageCode: body.languageCode || "ar-XA",
        name: body.voice || "ar-XA-Standard-A",
      },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  const payload = (await synth.json().catch(() => ({}))) as { audioContent?: string; error?: { message?: string } };
  if (!synth.ok || !payload.audioContent) {
    return NextResponse.json({ error: payload.error?.message || "TTS failed" }, { status: 500 });
  }

  const path = `sessions/${id}/tts/${Date.now()}.mp3`;
  const buffer = Buffer.from(payload.audioContent, "base64");
  const upload = await auth.client.storage.from(LIVE_STORAGE_BUCKET).upload(path, buffer, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const artifact = await upsertArtifact(auth.client, id, {
    artifactType: "tts_audio",
    title: "TTS Audio",
    storagePath: path,
    content: {
      text: body.text,
      voice: body.voice || "ar-XA-Standard-A",
    },
    createdBy: auth.userId,
  });

  return NextResponse.json({
    configured: true,
    audioContent: payload.audioContent,
    artifact,
  });
}
