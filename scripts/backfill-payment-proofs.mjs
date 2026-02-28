import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PAYMENT_PROOF_BUCKET = "payment-proofs";
const BATCH_SIZE = Math.max(1, Number(process.env.PAYMENT_PROOF_BACKFILL_BATCH_SIZE || 100));
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_PROOF_IMAGE_BYTES = 900_000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[payment-proof-backfill] Missing Supabase configuration.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function extensionForMime(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function decodeProofImage(dataUrl, type) {
  const prefix = `data:${type};base64,`;
  if (!dataUrl.startsWith(prefix)) return null;
  try {
    return Buffer.from(dataUrl.slice(prefix.length), "base64");
  } catch {
    return null;
  }
}

async function ensureBucket() {
  const { data, error } = await admin.storage.getBucket(PAYMENT_PROOF_BUCKET);
  if (data?.name === PAYMENT_PROOF_BUCKET) return true;

  const errorMessage = String(error?.message ?? "").toLowerCase();
  if (errorMessage && !errorMessage.includes("not found")) return false;

  const { error: createError } = await admin.storage.createBucket(PAYMENT_PROOF_BUCKET, {
    public: false,
    fileSizeLimit: MAX_PROOF_IMAGE_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES)
  });

  if (!createError) return true;
  return String(createError.message ?? "").toLowerCase().includes("already");
}

function extractCandidate(row) {
  const metadata = row?.metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const proofImage = metadata.proof_image;
  if (!proofImage || typeof proofImage !== "object") return null;

  const name = String(proofImage.name ?? "").trim();
  const type = String(proofImage.type ?? "").trim().toLowerCase();
  const dataUrl = String(proofImage.data_url ?? "").trim();
  const storagePath = String(proofImage.storage_path ?? "").trim();
  const bytes = Number(proofImage.bytes ?? 0);
  const userId = String(metadata.user_id ?? "").trim() || "guest";

  if (storagePath || !dataUrl) return null;
  if (!name || !type || !ALLOWED_IMAGE_TYPES.has(type)) return null;
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_PROOF_IMAGE_BYTES) return null;

  const buffer = decodeProofImage(dataUrl, type);
  if (!buffer || buffer.byteLength <= 0 || buffer.byteLength > MAX_PROOF_IMAGE_BYTES) return null;

  return { metadata, proofImage, name, type, dataUrl, bytes, buffer, userId };
}

async function uploadCandidate(ticketId, candidate) {
  const storagePath = `${candidate.userId}/${Date.now()}-${ticketId}.${extensionForMime(candidate.type)}`;
  const { error } = await admin.storage.from(PAYMENT_PROOF_BUCKET).upload(storagePath, candidate.buffer, {
    contentType: candidate.type,
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw new Error(error.message || "storage upload failed");

  const updatedMetadata = {
    ...candidate.metadata,
    proof_image: {
      ...candidate.proofImage,
      storage_bucket: PAYMENT_PROOF_BUCKET,
      storage_path: storagePath,
      data_url: null
    }
  };

  const { error: updateError } = await admin
    .from("support_tickets")
    .update({ metadata: updatedMetadata })
    .eq("id", ticketId);

  if (updateError) {
    await admin.storage.from(PAYMENT_PROOF_BUCKET).remove([storagePath]);
    throw new Error(updateError.message || "metadata update failed");
  }

  return storagePath;
}

async function main() {
  const bucketReady = await ensureBucket();
  if (!bucketReady) {
    console.error("[payment-proof-backfill] Failed to prepare storage bucket.");
    process.exit(1);
  }

  let offset = 0;
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  while (true) {
    const { data, error } = await admin
      .from("support_tickets")
      .select("id,metadata,source,category,created_at")
      .or("source.eq.checkout_manual_proof,category.eq.payment_activation")
      .order("created_at", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("[payment-proof-backfill] Failed to fetch batch:", error.message);
      process.exit(1);
    }

    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) break;

    for (const row of rows) {
      scanned += 1;
      const candidate = extractCandidate(row);
      if (!candidate) {
        skipped += 1;
        continue;
      }

      try {
        const storagePath = await uploadCandidate(String(row.id), candidate);
        migrated += 1;
        console.log(`[payment-proof-backfill] migrated ${row.id} -> ${storagePath}`);
      } catch (migrationError) {
        failed += 1;
        console.error(`[payment-proof-backfill] failed ${row.id}:`, migrationError instanceof Error ? migrationError.message : migrationError);
      }
    }

    offset += rows.length;
    if (rows.length < BATCH_SIZE) break;
  }

  console.log(
    JSON.stringify(
      {
        scanned,
        migrated,
        skipped,
        failed,
        bucket: PAYMENT_PROOF_BUCKET
      },
      null,
      2
    )
  );
}

await main();
