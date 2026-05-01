import { NextResponse } from 'next/server';
import { fetchTikTokViews as fetchAccurateTikTokViews } from '../tiktokViews';

const YOUTUBE_API_KEY = process.env.YOUTUBE_DATA_API_KEY;

// ═══════════════════════════════════════════
// YouTube — Official API (free, 10k/day)
// ═══════════════════════════════════════════

function extractYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
        const v = u.searchParams.get('v');
        if (v) return v;
        const shortsMatch = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (shortsMatch) return shortsMatch[1];
    } catch {
        // Ignore invalid URLs and let callers fall back.
    }
    return null;
}

async function fetchYouTubeViews(videoId: string): Promise<number | null> {
    if (!YOUTUBE_API_KEY) return null;
    try {
        const res: Response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`,
            { next: { revalidate: 3600 } }
        );
        const data = await res.json();
        const viewCount = data?.items?.[0]?.statistics?.viewCount;
        return viewCount ? parseInt(viewCount, 10) : null;
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════
// TikTok — Free Scraping (no API key needed)
// ═══════════════════════════════════════════

function isTikTokUrl(url: string): boolean {
    return url.includes('tiktok.com');
}

async function fetchTikTokViews(url: string): Promise<number | null> {
    try {
        // Fetch the TikTok page HTML — server-side only
        const res: Response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                'Accept-Encoding': 'identity',
            },
            redirect: 'follow',
        });

        if (!res.ok) return null;

        const html = await res.text();

        // ── Method 1: __UNIVERSAL_DATA_FOR_REHYDRATION__ ──
        const universalMatch = html.match(/<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (universalMatch) {
            try {
                const json = JSON.parse(universalMatch[1]);
                const defaultScope = json?.['__DEFAULT_SCOPE__'];
                const videoDetail = defaultScope?.['webapp.video-detail'] || defaultScope?.['webapp.video.detail'];
                const playCount = videoDetail?.itemInfo?.itemStruct?.stats?.playCount
                    ?? videoDetail?.itemStruct?.stats?.playCount
                    ?? videoDetail?.itemInfo?.itemStruct?.stats?.play_count;
                if (typeof playCount === 'number') return playCount;
            } catch {
                // Ignore malformed TikTok hydration payload.
            }
        }

        // ── Method 2: Raw playCount Regex (Often works even if JSON parsing fails) ──
        const playCountMatch = html.match(/"playCount":(\d+)/) || html.match(/"play_count":(\d+)/);
        if (playCountMatch) {
            const num = parseInt(playCountMatch[1], 10);
            if (!isNaN(num) && num > 0) return num;
        }

        // ── Method 3: SIGI_STATE ──
        const sigiMatch = html.match(/<script\s+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
        if (sigiMatch) {
            try {
                const json = JSON.parse(sigiMatch[1]);
                const items = json?.ItemModule;
                if (items) {
                    const firstKey = Object.keys(items)[0];
                    const playCount = items[firstKey]?.stats?.playCount || items[firstKey]?.stats?.play_count;
                    if (typeof playCount === 'number') return playCount;
                }
            } catch {
                // Ignore malformed TikTok SIGI payload.
            }
        }

        // ── Method 4: JSON-LD ──
        const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
        if (jsonLdMatch) {
            try {
                const json = JSON.parse(jsonLdMatch[1]);
                const count = json?.interactionStatistic?.find?.(
                    (s: any) => s?.interactionType?.['@type'] === 'WatchAction'
                )?.userInteractionCount;
                if (count) return parseInt(count, 10);
            } catch {
                // Ignore malformed JSON-LD payload.
            }
        }

        // ── Method 5: Meta Description Fallback ──
        const metaMatch = html.match(/content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i) ||
                          html.match(/(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i);
        if (metaMatch) {
            const cleaned = metaMatch[1].replace(/[,.\s]/g, '');
            const num = parseInt(cleaned, 10);
            if (!isNaN(num) && num > 0) return num;
        }

        return null;
    } catch (e) {
        console.error('[TikTok Scraper] Error:', e);
        return null;
    }
}

// ═══════════════════════════════════════════
// Instagram — Official Graph API
// ═══════════════════════════════════════════

function extractInstagramShortcode(url: string): string | null {
    try {
        const u = new URL(url);
        if (!u.hostname.includes('instagram.com')) return null;
        // Match /reel/SHORTCODE/ or /p/SHORTCODE/
        const match = u.pathname.match(/\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
        if (match) return match[1];
    } catch {
        // Ignore invalid Instagram URLs and let callers fall back.
    }
    return null;
}

async function fetchInstagramViewsApi(shortcode: string): Promise<number | null> {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) return null;

    try {
        // Step 1: Find the media node ID matching the shortcode
        // Search through recent media (up to 3 pages to avoid timeouts)
        let nextUrl: string | null = `https://graph.instagram.com/me/media?fields=id,shortcode&access_token=${token}`;
        let mediaId: string | null = null;

        for (let i = 0; i < 3; i++) {
            if (!nextUrl) break;
            const res: Response = await fetch(nextUrl, { next: { revalidate: 3600 } });
            if (!res.ok) break;
            const data = await res.json();
            
            const match = data.data?.find((m: any) => m.shortcode === shortcode);
            if (match) {
                mediaId = match.id;
                break;
            }
            nextUrl = data.paging?.next || null;
        }

        if (!mediaId) return null;

        // Step 2: Fetch views insight for this media node
        const insightsRes = await fetch(
            `https://graph.instagram.com/${mediaId}/insights?metric=views&access_token=${token}`,
            { next: { revalidate: 3600 } }
        );
        if (!insightsRes.ok) return null;
        
        const insightsData = await insightsRes.json();
        const views = insightsData.data?.[0]?.values?.[0]?.value;
        
        return typeof views === 'number' ? views : null;
    } catch (e) {
        console.error('[Instagram API] Error:', e);
        return null;
    }
}

// ═══════════════════════════════════════════
// Facebook — Official Graph API
// ═══════════════════════════════════════════

async function resolveFacebookVideoId(url: string): Promise<string | null> {
    try {
        let finalUrl = url;
        if (url.includes('fb.watch')) {
            const res: Response = await fetch(url, { redirect: 'follow', method: 'HEAD' });
            finalUrl = res.url;
        }

        const u = new URL(finalUrl);
        
        // Case 1: facebook.com/PAGE/videos/VIDEO_ID
        const videoMatch = u.pathname.match(/\/videos\/(\d+)/);
        if (videoMatch) return videoMatch[1];
        
        // Case 2: facebook.com/watch/?v=VIDEO_ID
        const v = u.searchParams.get('v');
        if (v) return v;

        // Case 3: facebook.com/story.php?story_fbid=VIDEO_ID
        const storyFbid = u.searchParams.get('story_fbid');
        if (storyFbid) return storyFbid;

    } catch {
        // Ignore invalid Facebook URLs and let callers fall back.
    }
    return null;
}

async function fetchFacebookViewsApi(videoId: string): Promise<number | null> {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!token) return null;

    try {
        const res: Response = await fetch(
            `https://graph.facebook.com/v20.0/${videoId}?fields=views&access_token=${token}`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return null;
        
        const data = await res.json();
        const views = data.views;
        
        return typeof views === 'number' ? views : null;
    } catch (e) {
        console.error('[Facebook API] Error:', e);
        return null;
    }
}

// ═══════════════════════════════════════════
// Meta (Instagram / Facebook) — Best Effort Scraping
// Note: Meta aggressively blocks scrapers. This is a best-effort approach.
// ═══════════════════════════════════════════

function isMetaUrl(url: string): boolean {
    return url.includes('instagram.com') || url.includes('facebook.com') || url.includes('fb.watch');
}

async function fetchMetaViews(url: string): Promise<number | null> {
    try {
        const res: Response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        if (!res.ok) return null;
        const html = await res.text();

        // Method 1: Look for og:description "X Likes, Y Comments, Z Views" (Instagram)
        const ogMatch = html.match(/<meta property="og:description" content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i) || 
                        html.match(/<meta name="description" content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i);
        if (ogMatch) {
            const num = parseInt(ogMatch[1].replace(/[,.\s]/g, ''), 10);
            if (!isNaN(num) && num > 0) return num;
        }

        // Method 2: Look for play_count in JSON data (Facebook)
        const fbMatch = html.match(/"play_count"\s*:\s*(\d+)/);
        if (fbMatch) {
            const num = parseInt(fbMatch[1], 10);
            if (!isNaN(num) && num > 0) return num;
        }
        
        // Method 3: Look for video_view_count (Instagram alternative)
        const igMatch = html.match(/"video_view_count"\s*:\s*(\d+)/);
        if (igMatch) {
            const num = parseInt(igMatch[1], 10);
            if (!isNaN(num) && num > 0) return num;
        }

        return null;
    } catch (e) {
        console.error('[Meta Scraper] Error:', e);
        return null;
    }
}

// ═══════════════════════════════════════════
// Simulation fallback (for platforms without API)
// ═══════════════════════════════════════════

function simulateViews(url: string, platform: string, publishedAt?: string): number {
    const publishDate = publishedAt ? new Date(publishedAt) : new Date();
    const hoursElapsed = Math.max(0, (Date.now() - publishDate.getTime()) / (1000 * 60 * 60));

    let base = 0;
    const p = (platform || '').toLowerCase();
    if (p.includes('tiktok') || url.includes('tiktok.com')) {
        base = Math.floor(1500 * Math.log10(hoursElapsed + 1) + hoursElapsed * 50);
    } else if (p.includes('instagram') || url.includes('instagram.com')) {
        base = Math.floor(800 * Math.log10(hoursElapsed + 1) + hoursElapsed * 30);
    } else {
        base = Math.floor(200 * Math.log10(hoursElapsed + 1) + hoursElapsed * 5);
    }

    const urlHash = Array.from(url).reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
    const stableNoise = ((urlHash % 100) / 100) * 0.05;
    return Math.max(120, Math.floor(base * (1 + stableNoise)));
}

// ═══════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════

export async function POST(req: Request) {
    try {
        const { url, platform, publishedAt } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // ── 1. YouTube (Official API) ──
        const youtubeId = extractYouTubeId(url);
        if (youtubeId) {
            const realViews = await fetchYouTubeViews(youtubeId);
            if (realViews !== null) {
                return NextResponse.json({ success: true, views: realViews, isSimulated: false, source: 'youtube_api' });
            }
        }

        // ── 2. TikTok (Free Scraping) ──
        if (isTikTokUrl(url)) {
            const realViews = await fetchAccurateTikTokViews(url);
            if (realViews !== null) {
                return NextResponse.json({ success: true, views: realViews, isSimulated: false, source: 'tiktok_scraper' });
            }
        }

        // ── 3. Meta (Instagram) — Official API ──
        const igShortcode = extractInstagramShortcode(url);
        if (igShortcode) {
            const apiViews = await fetchInstagramViewsApi(igShortcode);
            if (apiViews !== null) {
                return NextResponse.json({ success: true, views: apiViews, isSimulated: false, source: 'instagram_api' });
            }
        }

        // ── 4. Facebook — Official API ──
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            const fbVideoId = await resolveFacebookVideoId(url);
            if (fbVideoId) {
                const apiViews = await fetchFacebookViewsApi(fbVideoId);
                if (apiViews !== null) {
                    return NextResponse.json({ success: true, views: apiViews, isSimulated: false, source: 'facebook_api' });
                }
            }
        }

        // ── 5. Meta (Instagram / Facebook - Best Effort) ──
        if (isMetaUrl(url)) {
            const realViews = await fetchMetaViews(url);
            if (realViews !== null) {
                return NextResponse.json({ success: true, views: realViews, isSimulated: false, source: 'meta_scraper' });
            }
        }

        // ── 6. Fallback: simulation ──
        const simViews = simulateViews(url, platform, publishedAt);
        return NextResponse.json({ success: true, views: simViews, isSimulated: true, source: 'simulation' });

    } catch (error) {
        console.error('Error fetching views:', error);
        return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
    }
}
