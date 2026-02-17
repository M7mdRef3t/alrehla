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
    "journey-map": handleJourneyMap
};

export async function GET(req: NextRequest) { return runHandler(req); }
export async function POST(req: NextRequest) { return runHandler(req); }
export async function PUT(req: NextRequest) { return runHandler(req); }
export async function PATCH(req: NextRequest) { return runHandler(req); }
export async function DELETE(req: NextRequest) { return runHandler(req); }

async function runHandler(req: NextRequest) {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const path = query.path || "overview";

    // Debug logging for the bridge
    const code = req.headers.get("x-admin-code") || req.headers.get("X-Admin-Code");
    console.log(`[Admin Bridge] ${req.method} ${path}`, {
        hasCode: !!code,
        hasAuth: !!req.headers.get("authorization")
    });

    const handler = ROUTES[path] || overviewRouter;

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

    try {
        await handler(mockReq, mockRes);
    } catch (err: any) {
        console.error(`[Admin Bridge Error] ${path}:`, err);
        return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
    }

    return NextResponse.json(jsonResponse, { status });
}
