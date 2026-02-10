// Supabase Edge Function: Gemini Embeddings → vector(768)
// الإدخال: { text: string }
// الإخراج: { embedding: number[] }

const GEMINI_EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Only POST supported", { status: 405 });
  }

  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    return new Response("Missing GOOGLE_API_KEY", { status: 500 });
  }

  try {
    const body = await req.json() as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return new Response("Missing `text`", { status: 400 });
    }

    const res = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "text-embedding-004",
        content: { parts: [{ text }] }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(errText, { status: res.status });
    }

    const data = await res.json();
    const embedding: number[] =
      data.embedding?.values ??
      data.embeddings?.[0]?.values ??
      [];

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      return new Response("Invalid embedding size", { status: 500 });
    }

    return new Response(JSON.stringify({ embedding }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(err);
    return new Response("Internal error", { status: 500 });
  }
});

