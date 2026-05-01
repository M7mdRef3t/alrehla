import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Middleware for Dawayir Masafaty
 * Protects critical API endpoints and implements granular rate limiting.
 */

// Rate Limit Tiers (Requests per minute)
const LIMITS = {
    ANALYTICS: 120, // High-frequency telemetry
    AI_GEN: 10,     // Cost protection for Gemini/Maraya
    ADMIN: 30,      // Administrative operations
    DEFAULT: 60     // General API access
};

// Simple in-memory rate limiter for Edge Runtime (Best effort per instance)
const rateLimitMap = new Map<string, { count: number; start: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string, path: string): { limited: boolean; current: number; limit: number } {
    const now = Date.now();
    
    // Determine the tier based on path
    let limit = LIMITS.DEFAULT;
    if (path.startsWith('/api/analytics')) limit = LIMITS.ANALYTICS;
    else if (path.startsWith('/api/gemini') || path.startsWith('/api/maraya') || path.startsWith('/api/weather')) limit = LIMITS.AI_GEN;
    else if (path.startsWith('/api/admin')) limit = LIMITS.ADMIN;

    const key = `${ip}:${path.split('/')[2] || 'global'}`; // Segment by IP and root API category
    const record = rateLimitMap.get(key);

    if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(key, { count: 1, start: now });
        return { limited: false, current: 1, limit };
    }

    record.count++;
    if (record.count > limit) {
        return { limited: true, current: record.count, limit };
    }
    return { limited: false, current: record.count, limit };
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
    
    let limited = false;
    let current = 0;
    let limit = 0;

    // 1. Rate Limiting Protection (Applied to all matched API routes)
    // We bypass rate limiting in development mode or localhost to prevent HMR and dev server crashes
    if (!isLocalhost && process.env.NODE_ENV !== 'development') {
        const rateLimitResult = checkRateLimit(ip, pathname);
        limited = rateLimitResult.limited;
        current = rateLimitResult.current;
        limit = rateLimitResult.limit;
    } else {
        limit = LIMITS.DEFAULT; // Just for headers
    }
    
    if (limited) {
        return NextResponse.json(
            { error: 'Too many requests. Please slow down.' },
            { 
                status: 429, 
                headers: { 
                    'Retry-After': '60',
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': '0'
                } 
            }
        );
    }

    // 2. Protect Admin / Cron Routes
    if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
        const authHeader = request.headers.get('authorization') || '';
        const allowedSecrets = [process.env.CRON_SECRET, process.env.ADMIN_API_SECRET]
            .filter((value): value is string => Boolean(value && value.trim()))
            .map((value) => value.trim());

        const isSecretMatch = allowedSecrets.some((secret) => authHeader === `Bearer ${secret}`);

        if (!isSecretMatch) {
            // The cookie name pattern is `sb-<ref>-auth-token` OR the custom ecosystem key
            const cookieHeader = request.headers.get('cookie') || '';
            const hasSupabaseSession = /sb-[a-z0-9\-]+-auth-token/i.test(cookieHeader) || 
                                     /alrehla-ecosystem-auth/i.test(cookieHeader);

            // We bypass the cookie/bearer check completely for UI routes (/admin).
            // UI routes do not send Authorization headers during navigation, and Supabase 
            // session tokens are often in localStorage which this middleware cannot read.
            // Client-side access control is handled robustly by AdminGate instead.
            const isUiRoute = pathname.startsWith('/admin') && !pathname.startsWith('/api/admin');

            if (!hasSupabaseSession && !isUiRoute) {
                const hasBearer = authHeader.startsWith('Bearer ') && authHeader.length > 7;
                if (!hasBearer) {
                    console.warn(`[Security Alert] Unauthorized Admin access attempt from IP: ${ip} on path: ${pathname}`);
                    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
                }
            }
        }
    }

    // 3. Protect Gemini/Maraya AI Routes (Internal Secret check)
    if (pathname.startsWith('/api/gemini') || pathname.startsWith('/api/maraya') || pathname.startsWith('/api/weather')) {
        const geminiSecret = request.headers.get('x-internal-secret');
        const isInternal = geminiSecret && geminiSecret === process.env.GEMINI_INTERNAL_SECRET;

        if (!isInternal) {
            // Require at minimum a valid Supabase session cookie or bearer token
            const authHeader = request.headers.get('authorization') || '';
            const cookieHeader = request.headers.get('cookie') || '';
            // Match any Supabase auth cookie (sb-<any-ref>-auth-token) OR legacy/ecosystem names
            const hasSupabaseSession = /sb-[a-z0-9\-]+-auth-token/i.test(cookieHeader) ||
                                     /supabase-auth/i.test(cookieHeader) ||
                                     /alrehla-ecosystem-auth/i.test(cookieHeader) ||
                                     /sb-access-token/i.test(cookieHeader) ||
                                     /sb-refresh-token/i.test(cookieHeader) ||
                                     /sb-auth-token/i.test(cookieHeader);
            const hasBearer = authHeader.startsWith('Bearer ') && authHeader.length > 7;
            const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';

            if (!hasSupabaseSession && !hasBearer && !isLocalhost) {
                return NextResponse.json(
                    { error: 'Authentication required for AI services.' },
                    { status: 401 }
                );
            }
        }
    }

    const response = NextResponse.next();
    
    // Inject Rate Limit Info into headers for matched routes
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - current).toString());
    
    return response;
}

// Ensure middleware runs on all relevant API paths
export const config = {
    matcher: [
        '/api/gemini/:path*', 
        '/api/maraya/:path*', 
        '/api/weather/:path*',
        '/api/admin/:path*', 
        '/admin/:path*',
        '/api/analytics/:path*',
        '/api/checkout/:path*',
        '/api/recommendations/:path*'
    ],
};

