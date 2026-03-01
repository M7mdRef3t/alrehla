import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Middleware for Dawayir Masafaty
 * Protects critical API endpoints and implements basic rate limiting.
 */

// Simple in-memory rate limiter for Edge Runtime (Best effort per instance)
const rateLimitMap = new Map<string, { count: number; start: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, start: now });
        return false;
    }

    record.count++;
    if (record.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.ip || 'unknown';

    // 1. Protect Admin / Cron Routes
    if (pathname.startsWith('/api/admin')) {
        const authHeader = request.headers.get('authorization') || '';
        const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET;

        // Admin routes must have correct Bearer token
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.warn(`[Security Alert] Unauthorized Admin access attempt from IP: ${ip}`);
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }
    }

    // 2. Protect Gemini AI Routes (Anti-Scraping / Anti-Drain)
    if (pathname.startsWith('/api/gemini')) {
        // Check for internal secret (for backend-to-backend or trusted automated tasks)
        const geminiSecret = request.headers.get('x-internal-secret');
        const isInternal = geminiSecret && geminiSecret === process.env.GEMINI_INTERNAL_SECRET;

        if (!isInternal) {
            // Basic rate limiting for public/client access
            if (isRateLimited(ip)) {
                return NextResponse.json(
                    { error: 'Too many requests. Please slow down.' },
                    { status: 429, headers: { 'Retry-After': '60' } }
                );
            }

            // FUTURE: Add Supabase session check here if frontend-only access is desired
            // const supabaseToken = request.cookies.get('sb-access-token');
            // if (!supabaseToken) ...
        }
    }

    return NextResponse.next();
}

// Ensure middleware only runs on relevant API paths to save execution time
export const config = {
    matcher: ['/api/gemini/:path*', '/api/admin/:path*', '/api/checkout/:path*'],
};
