import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ALLOWED_METHODS = new Set([
  "instapay",
  "vodafone_cash",
  "etisalat_cash",
  "bank_transfer",
  "fawry",
  "paypal"
]);
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_PROOF_IMAGE_BYTES = 900_000;
const MAX_PROOF_IMAGE_DATA_URL_LENGTH = 1_600_000;
const PAYMENT_PROOF_BUCKET = "payment-proofs";

let paymentProofBucketReady: Promise<boolean> | null = null;

function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeProofImage(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const name = sanitizeText(raw.name, 120);
  const type = sanitizeText(raw.type, 60).toLowerCase();
  const dataUrl = sanitizeText(raw.dataUrl, MAX_PROOF_IMAGE_DATA_URL_LENGTH);
  const bytes = Number(raw.bytes ?? 0);

  if (!name || !type || !dataUrl) return null;
  if (!ALLOWED_IMAGE_TYPES.has(type)) return null;
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_PROOF_IMAGE_BYTES) return null;
  if (!dataUrl.startsWith(`data:${type};base64,`)) return null;

  return { name, type, bytes: Math.round(bytes), dataUrl };
}

function extensionForMime(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function decodeProofImage(proofImage: { type: string; dataUrl: string }): Buffer | null {
  const prefix = `data:${proofImage.type};base64,`;
  if (!proofImage.dataUrl.startsWith(prefix)) return null;
  try {
    return Buffer.from(proofImage.dataUrl.slice(prefix.length), "base64");
  } catch {
    return null;
  }
}

async function ensurePaymentProofBucket(admin: SupabaseClient): Promise<boolean> {
  if (!paymentProofBucketReady) {
    paymentProofBucketReady = (async () => {
      const { data, error } = await admin.storage.getBucket(PAYMENT_PROOF_BUCKET);
      if (data?.name === PAYMENT_PROOF_BUCKET) return true;

      const errorMessage = String(error?.message ?? "").toLowerCase();
      const shouldCreate = !errorMessage || errorMessage.includes("not found");
      if (!shouldCreate) return false;

      const { error: createError } = await admin.storage.createBucket(PAYMENT_PROOF_BUCKET, {
        public: false,
        fileSizeLimit: MAX_PROOF_IMAGE_BYTES,
        allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES)
      });

      if (!createError) return true;
      return String(createError.message ?? "").toLowerCase().includes("already");
    })().catch(() => false);
  }

  return paymentProofBucketReady;
}

async function uploadProofImage(
  admin: SupabaseClient,
  authUserId: string | null,
  proofImage: { name: string; type: string; bytes: number; dataUrl: string }
) {
  const imageBuffer = decodeProofImage(proofImage);
  if (!imageBuffer || imageBuffer.byteLength <= 0 || imageBuffer.byteLength > MAX_PROOF_IMAGE_BYTES) return null;

  const bucketReady = await ensurePaymentProofBucket(admin);
  if (!bucketReady) return null;

  const folder = authUserId || "guest";
  const storagePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extensionForMime(proofImage.type)}`;
  const { error } = await admin.storage.from(PAYMENT_PROOF_BUCKET).upload(storagePath, imageBuffer, {
    contentType: proofImage.type,
    cacheControl: "3600",
    upsert: false
  });

  if (error) return null;
  return {
    bucket: PAYMENT_PROOF_BUCKET,
    path: storagePath
  };
}

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data?.user?.id ? null : data.user.id;
}

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Manual activation is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const email = sanitizeText(body?.email, 160).toLowerCase();
  const phone = sanitizeText(body?.phone || body?.phone_number, 40);
  const method = sanitizeText(body?.method, 40).toLowerCase();
  const reference = sanitizeText(body?.reference, 120);
  const amount = sanitizeText(body?.amount, 60);
  const note = sanitizeText(body?.note, 600);
  const proofImage = normalizeProofImage(body?.proofImage);

  // Requirement: EITHER valid email OR valid phone (at least 8 digits for safety)
  const hasEmail = email && isValidEmail(email);
  const hasPhone = phone && phone.replace(/\D/g, "").length >= 8;

  if (!hasEmail && !hasPhone) {
    return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
  }
  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
  }
  if (reference.length < 4 && !proofImage) {
    return NextResponse.json({ error: "Payment reference or screenshot is required." }, { status: 400 });
  }

  const authUserId = await getAuthUserId(req);
  const uploadedProof = proofImage ? await uploadProofImage(admin, authUserId, proofImage) : null;
  const methodLabel = method.replace(/_/g, " ");
  const identifier = hasEmail ? email : phone;
  const message = [
    hasEmail ? `email: ${email}` : `phone: ${phone}`,
    `method: ${methodLabel}`,
    reference ? `reference: ${reference}` : "",
    amount ? `amount: ${amount}` : "",
    proofImage ? `proof_image: ${proofImage.name} (${proofImage.type}, ${proofImage.bytes} bytes)` : "",
    note ? `note: ${note}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  // Keep support_tickets lightweight by storing the screenshot in Storage first.
  // If Storage is unavailable, fall back to inline data_url so activation never blocks.
  const { error } = await admin.from("support_tickets").insert({
    source: "activation_manual_proof",
    status: "open",
    priority: "high",
    category: "payment_activation",
    title: `Manual payment proof - ${methodLabel} (${identifier})`,
    message,
    session_id: authUserId,
    metadata: {
      email: hasEmail ? email : null,
      phone: hasPhone ? phone : null,
      method,
      reference: reference || null,
      amount: amount || null,
      note: note || null,
      user_id: authUserId,
      origin: req.headers.get("origin") || null,
      proof_image: proofImage
        ? {
            name: proofImage.name,
            type: proofImage.type,
            bytes: proofImage.bytes,
            storage_bucket: uploadedProof?.bucket ?? null,
            storage_path: uploadedProof?.path ?? null,
            data_url: uploadedProof ? null : proofImage.dataUrl
          }
        : null
    }
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit payment proof." }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        "\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062f\u0641\u0639. \u0633\u0646\u0631\u0627\u062c\u0639 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0648\u0646\u0641\u0639\u0651\u0644 \u0627\u0644\u0631\u062d\u0644\u0629 \u064a\u062f\u0648\u064a\u064b\u0627."
    },
    { status: 200 }
  );
}
