import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchTikTokViews } from '../tiktokViews';

const YOUTUBE_API_KEY = process.env.YOUTUBE_DATA_API_KEY;

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

function extractInstagramShortcode(url: string): string | null {
    try {
        const u = new URL(url);
        if (!u.hostname.includes('instagram.com')) return null;
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

        const insightsRes: Response = await fetch(
            `https://graph.instagram.com/${mediaId}/insights?metric=views&access_token=${token}`,
            { next: { revalidate: 3600 } }
        );
        if (!insightsRes.ok) return null;
        
        const insightsData = await insightsRes.json();
        const views = insightsData.data?.[0]?.values?.[0]?.value;
        
        return typeof views === 'number' ? views : null;
    } catch (e) {
        console.error('[sync] Instagram API error:', e);
        return null;
    }
}

async function resolveFacebookVideoId(url: string): Promise<string | null> {
    try {
        let finalUrl = url;
        if (url.includes('fb.watch')) {
            const res: Response = await fetch(url, { redirect: 'follow', method: 'HEAD' });
            finalUrl = res.url;
        }

        const u = new URL(finalUrl);
        
        const videoMatch = u.pathname.match(/\/videos\/(\d+)/);
        if (videoMatch) return videoMatch[1];
        
        const v = u.searchParams.get('v');
        if (v) return v;

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
        console.error('[sync] Facebook API error:', e);
        return null;
    }
}

export async function GET(req: Request) {
    // Note: In production, protect this endpoint with a cron secret token
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //    return new Response('Unauthorized', { status: 401 });
    // }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: videos, error } = await supabase
            .from('feedback')
            .select('id, content, metadata, created_at')
            .eq('source', 'illusion_dismantled_video');

        if (error) throw error;
        if (!videos || videos.length === 0) {
            return NextResponse.json({ success: true, message: "No videos to sync", updatedCount: 0 });
        }

        let updatedCount = 0;

        for (const video of videos) {
            const url = video.content || '';
            const meta = video.metadata || {};
            const platform = meta.platform || 'other';
            const publishedAt = meta.publishDate || video.created_at;

            let newViews = meta.views || 0;
            let shouldPersistViews = false;

            // ── 1. Try YouTube API ──
            const youtubeId = extractYouTubeId(url);
            if (youtubeId && YOUTUBE_API_KEY) {
                try {
                    const res: Response = await fetch(
                        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${youtubeId}&key=${YOUTUBE_API_KEY}`
                    );
                    const data = await res.json();
                    const viewCount = data?.items?.[0]?.statistics?.viewCount;
                    if (viewCount) newViews = parseInt(viewCount, 10);
                } catch (e) {
                    console.error(`[sync] YouTube API error for ${url}:`, e);
                }
            }
            // ── 2. Try TikTok Scraping (free) ──
            else if (url.includes('tiktok.com')) {
                const accurateViews = await fetchTikTokViews(url);
                if (typeof accurateViews === 'number' && accurateViews > 0) {
                    newViews = accurateViews;
                    meta.viewSource = 'tiktok_scraper';
                    shouldPersistViews = true;
                }
            }
            // ── 3. Try Meta (Instagram) API ──
            else if (url.includes('instagram.com')) {
                const igShortcode = extractInstagramShortcode(url);
                if (igShortcode) {
                    const apiViews = await fetchInstagramViewsApi(igShortcode);
                    if (apiViews !== null && apiViews > 0) {
                        newViews = apiViews;
                    }
                }
                
                // ── 3.1 Try Meta Scraping Fallback ──
                if (newViews === (meta.views || 0)) {
                    try {
                        const res: Response = await fetch(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9',
                            },
                        });
                        if (res.ok) {
                            const html = await res.text();
                            let scraped: number | null = null;
    
                            const ogMatch = html.match(/<meta property="og:description" content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i) || 
                                            html.match(/<meta name="description" content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i);
                            if (ogMatch) scraped = parseInt(ogMatch[1].replace(/[,.\s]/g, ''), 10);
    
                            if (!scraped) {
                                const fbMatch = html.match(/"play_count"\s*:\s*(\d+)/);
                                if (fbMatch) scraped = parseInt(fbMatch[1], 10);
                            }
                            
                            if (!scraped) {
                                const igMatch = html.match(/"video_view_count"\s*:\s*(\d+)/);
                                if (igMatch) scraped = parseInt(igMatch[1], 10);
                            }
    
                            if (scraped && !isNaN(scraped) && scraped > 0) newViews = scraped;
                        }
                    } catch (e) {
                        console.error(`[sync] Meta scrape error for ${url}:`, e);
                    }
                }
            }
            // ── 4. Try Facebook API ──
            else if (url.includes('facebook.com') || url.includes('fb.watch')) {
                const fbVideoId = await resolveFacebookVideoId(url);
                if (fbVideoId) {
                    const apiViews = await fetchFacebookViewsApi(fbVideoId);
                    if (apiViews !== null && apiViews > 0) {
                        newViews = apiViews;
                    }
                }

                // ── 4.1 Try Meta Scraping Fallback ──
                if (newViews === (meta.views || 0)) {
                    try {
                        const res: Response = await fetch(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9',
                            },
                        });
                        if (res.ok) {
                            const html = await res.text();
                            let scraped: number | null = null;
    
                            const ogMatch = html.match(/<meta property="og:description" content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i) || 
                                            html.match(/<meta name="description" content="[^"]*?(\d[\d,.]*)\s*(?:views|Views|مشاهدة|play)/i);
                            if (ogMatch) scraped = parseInt(ogMatch[1].replace(/[,.\s]/g, ''), 10);
    
                            if (!scraped) {
                                const fbMatch = html.match(/"play_count"\s*:\s*(\d+)/);
                                if (fbMatch) scraped = parseInt(fbMatch[1], 10);
                            }
                            
                            if (!scraped) {
                                const igMatch = html.match(/"video_view_count"\s*:\s*(\d+)/);
                                if (igMatch) scraped = parseInt(igMatch[1], 10);
                            }
    
                            if (scraped && !isNaN(scraped) && scraped > 0) newViews = scraped;
                        }
                    } catch (e) {
                        console.error(`[sync] Facebook scrape error for ${url}:`, e);
                    }
                }
            }
            // ── 4. Simulation fallback ──
            else {
                const now = new Date();
                const publishDate = new Date(publishedAt);
                const hoursElapsed = Math.max(0, (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60));

                let simulatedViews = 0;
                const p = platform.toLowerCase();
                if (p.includes('instagram') || url.includes('instagram.com')) {
                    simulatedViews = Math.floor(800 * Math.log10(hoursElapsed + 1) + hoursElapsed * 30);
                } else {
                    simulatedViews = Math.floor(200 * Math.log10(hoursElapsed + 1) + hoursElapsed * 5);
                }

                const urlHash = Array.from(url as string).reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
                const stableNoise = ((urlHash % 100) / 100) * 0.05;
                const simViews = Math.floor(simulatedViews * (1 + stableNoise));
                newViews = Math.max(meta.views || 0, simViews);
            }


            // Real platform reads can correct stale simulated values downward.
            if (shouldPersistViews || newViews > (meta.views || 0)) {
                meta.views = newViews;
                meta.lastViewSync = new Date().toISOString();
                
                await supabase
                    .from('feedback')
                    .update({ metadata: meta })
                    .eq('id', video.id);
                    
                updatedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Sync completed", 
            totalChecked: videos.length,
            updatedCount 
        });

    } catch (error: any) {
        console.error("Error syncing views:", error);
        return NextResponse.json({ error: error.message || "Failed to sync views" }, { status: 500 });
    }
}
