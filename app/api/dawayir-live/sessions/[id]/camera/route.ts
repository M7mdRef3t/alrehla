import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  LIVE_STORAGE_BUCKET,
  getSessionAccess,
  upsertArtifact,
} from "../../../../../../src/modules/dawayir-live/server/repository";

export const dynamic = "force-dynamic";

function inferExtension(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "bin";
}

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
    dataUrl?: string;
    mimeType?: string;
    filename?: string;
    title?: string;
  };

  if (!body.dataUrl || typeof body.dataUrl !== "string" || !body.dataUrl.includes(",")) {
    return NextResponse.json({ error: "Invalid image payload" }, { status: 400 });
  }

  const [meta, encoded] = body.dataUrl.split(",", 2);
  const mimeType = body.mimeType || meta.match(/data:(.*?);base64/)?.[1] || "image/png";
  const extension = inferExtension(mimeType);
  const filename = body.filename || `${Date.now()}.${extension}`;
  const path = `sessions/${id}/camera/${filename}`;
  const buffer = Buffer.from(encoded, "base64");

  const upload = await auth.client.storage.from(LIVE_STORAGE_BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const artifact = await upsertArtifact(auth.client, id, {
    artifactType: "camera_capture",
    title: body.title || "Camera Capture",
    storagePath: path,
    content: { mimeType, filename },
    createdBy: auth.userId,
  });

  return NextResponse.json({ artifact });
}
