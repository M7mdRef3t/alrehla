const TIKTOK_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
  "Accept-Encoding": "identity",
};

function extractTikTokVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/video\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseCompactCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;

  const normalized = raw
    .replace(/&nbsp;/g, " ")
    .replace(/,/g, "")
    .trim()
    .match(/(\d+(?:\.\d+)?)\s*([KMB])?/i);

  if (!normalized) return null;

  const value = Number(normalized[1]);
  if (!Number.isFinite(value)) return null;

  const suffix = normalized[2]?.toUpperCase();
  const multiplier = suffix === "B" ? 1_000_000_000 : suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1;
  return Math.round(value * multiplier);
}

function getStatsViews(node: any): number | null {
  const stats = node?.stats ?? node?.statsV2 ?? node?.itemInfo?.itemStruct?.stats ?? node?.itemStruct?.stats;
  return parseCompactCount(stats?.playCount ?? stats?.play_count ?? stats?.video_view_count);
}

function findViewsInTree(node: unknown, videoId: string | null): number | null {
  const candidates: number[] = [];
  const seen = new WeakSet<object>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    const current = value as any;
    const currentId = String(current.id ?? current.itemId ?? current.videoId ?? current.aweme_id ?? "");
    const directViews = getStatsViews(current);

    if (directViews !== null && (!videoId || currentId === videoId || String(current?.itemStruct?.id ?? "") === videoId)) {
      candidates.push(directViews);
    }

    if (current.itemStruct) visit(current.itemStruct);
    if (current.itemInfo) visit(current.itemInfo);

    for (const child of Object.values(current)) {
      if (child && typeof child === "object") visit(child);
    }
  };

  visit(node);

  if (!candidates.length) return null;
  return Math.max(...candidates);
}

export function parseTikTokViewsFromHtml(html: string, url: string): number | null {
  const videoId = extractTikTokVideoId(url);
  console.log(`[TikTok Scraper] Parsing URL: ${url}, Video ID: ${videoId}`);

  const scriptIds = ["__UNIVERSAL_DATA_FOR_REHYDRATION__", "SIGI_STATE", "__NEXT_DATA__"];
  for (const scriptId of scriptIds) {
    const scriptMatch = html.match(new RegExp(`<script\\s+id="${scriptId}"[^>]*>([\\s\\S]*?)<\\/script>`));
    if (!scriptMatch) continue;
    try {
      const parsed = JSON.parse(scriptMatch[1]);
      const views = findViewsInTree(parsed, videoId);
      if (views !== null && views > 0) {
        console.log(`[TikTok Scraper] Found views in ${scriptId}: ${views}`);
        return views;
      }
    } catch {
      console.warn(`[TikTok Scraper] Failed to parse JSON from ${scriptId}`);
    }
  }

  const jsonLdMatches = Array.from(html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi));
  for (const match of jsonLdMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      const stats = Array.isArray(parsed?.interactionStatistic)
        ? parsed.interactionStatistic
        : [parsed?.interactionStatistic].filter(Boolean);
      const watchStat = stats.find((stat: any) => stat?.interactionType?.["@type"] === "WatchAction");
      const views = parseCompactCount(watchStat?.userInteractionCount);
      if (views !== null && views > 0) {
        console.log(`[TikTok Scraper] Found views in JSON-LD: ${views}`);
        return views;
      }
    } catch {
      console.warn(`[TikTok Scraper] Failed to parse JSON-LD`);
    }
  }

  const metaMatch =
    html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["'][^"']*?(\d+(?:[,.]\d+)?\s*[KMB]?)\s*(?:views|Views|مشاهدة|play)/i) ??
    html.match(/(\d+(?:[,.]\d+)?\s*[KMB]?)\s*(?:views|Views|مشاهدة|play)/i);
  const metaViews = parseCompactCount(metaMatch?.[1]);
  if (metaViews && metaViews > 0) {
    console.log(`[TikTok Scraper] Found views in Meta: ${metaViews}`);
    return metaViews;
  }

  console.error(`[TikTok Scraper] No views found for ${url}`);
  return null;
}

export async function fetchTikTokViews(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      headers: TIKTOK_FETCH_HEADERS,
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseTikTokViewsFromHtml(html, url);
  } catch (error) {
    console.error("[TikTok Scraper] Error:", error);
    return null;
  }
}
