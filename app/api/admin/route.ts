import { NextRequest, NextResponse } from "next/server";
import { overviewRouter } from "../../../server/admin/overview";
import { handleConfig } from "../../../server/admin/config";
import { handleUsers } from "../../../server/admin/users";
import { handleContent } from "../../../server/admin/content";
import { handleRoles } from "../../../server/admin/roles";
import { handleMissions } from "../../../server/admin/missions";
import { handleBroadcasts } from "../../../server/admin/broadcasts";
import { handleAiLogs } from "../../../server/admin/ai-logs";
import { handleJourneyMap } from "../../../server/admin/journey-map";
import { handleRadar } from "../../../server/admin/radar";
import { handleRadarContent } from "../../../server/admin/radar-content";
import { handleRadarGrants } from "../../../server/admin/radar-grants";
import { recordAdminAudit, verifyAdmin } from "../../../server/admin/_shared";

export const dynamic = "force-dynamic";

const ROUTES: Record<string, any> = {
    overview: overviewRouter,
    config: handleConfig,
    users: handleUsers,
    content: handleContent,
    roles: handleRoles,
    missions: handleMissions,
    broadcasts: handleBroadcasts,
    "ai-logs": handleAiLogs,
    "journey-map": handleJourneyMap,
    radar: handleRadar,
    "radar-content": handleRadarContent,
    "radar-grants": handleRadarGrants
};

const AUTH_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS_PER_WINDOW = 8;
const failedAttemptsByIp = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const firstForwarded = forwardedFor.split(",")[0]?.trim();
    if (firstForwarded) return firstForwarded;
    const realIp = req.headers.get("x-real-ip") || "";
    if (realIp.trim()) return realIp.trim();
    return "unknown";
}

function isCronSecretAuthorized(req: NextRequest, query: Record<string, string>): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const querySecret = query.secret;
    const headerSecret = req.headers.get("x-cron-secret") || "";
    return querySecret === secret || headerSecret === secret;
}

function compactAndCountAttempts(ip: string, now: number): number {
    const existing = failedAttemptsByIp.get(ip) ?? [];
    const compacted = existing.filter((ts) => now - ts <= AUTH_WINDOW_MS);
    failedAttemptsByIp.set(ip, compacted);
    return compacted.length;
}

function registerFailedAttempt(ip: string, now: number): number {
    const existing = failedAttemptsByIp.get(ip) ?? [];
    const compacted = existing.filter((ts) => now - ts <= AUTH_WINDOW_MS);
    compacted.push(now);
    failedAttemptsByIp.set(ip, compacted);
    return compacted.length;
}

export async function GET(req: NextRequest) { return runHandler(req); }
export async function POST(req: NextRequest) { return runHandler(req); }
export async function PUT(req: NextRequest) { return runHandler(req); }
export async function PATCH(req: NextRequest) { return runHandler(req); }
export async function DELETE(req: NextRequest) { return runHandler(req); }

async function runHandler(req: NextRequest) {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const path = query.path || "overview";
    const ip = getClientIp(req);
    const now = Date.now();

    const handler = ROUTES[path];
    if (!handler) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    const isCronOverviewRequest = path === "overview" && query.kind === "cron-report";
    const cronSecretAuthorized = isCronOverviewRequest && isCronSecretAuthorized(req, query);

    // Mock request object
    const mockReq: any = {
        method: req.method,
        url: req.url,
        query,
        headers: Object.fromEntries(req.headers.entries()),
        body: null
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
        try {
            mockReq.body = await req.json();
        } catch {
            mockReq.body = {};
        }
    }

    let status = 200;
    let jsonResponse: any = {};

    // Mock response object
    const mockRes: any = {
        status: (s: number) => { status = s; return mockRes; },
        json: (data: any) => { jsonResponse = data; return mockRes; },
        setHeader: (k: string, v: string) => { return mockRes; },
        end: () => mockRes
    };

    if (!cronSecretAuthorized) {
        const recentFailures = compactAndCountAttempts(ip, now);
        if (recentFailures >= MAX_FAILED_ATTEMPTS_PER_WINDOW) {
            await recordAdminAudit(mockReq, "admin_auth_rate_limited", {
                path,
                ip,
                attemptsInWindow: recentFailures,
                windowMs: AUTH_WINDOW_MS
            });
            return NextResponse.json(
                { error: "Too many failed attempts. Try again later." },
                { status: 429, headers: { "Retry-After": "600" } }
            );
        }

        // Defense-in-depth: enforce auth/role check at bridge level before routing.
        if (!(await verifyAdmin(mockReq, mockRes))) {
            const attempts = registerFailedAttempt(ip, now);
            await recordAdminAudit(mockReq, "admin_auth_failed", {
                path,
                ip,
                attemptsInWindow: attempts,
                windowMs: AUTH_WINDOW_MS,
                status
            });
            return NextResponse.json(jsonResponse || { error: "Unauthorized" }, { status: status || 401 });
        }
    }

    try {
        await handler(mockReq, mockRes);
    } catch (err: any) {
        console.error(`[Admin Bridge Error] ${path}:`, err);
        return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
    }

    return NextResponse.json(jsonResponse, { status });
}
