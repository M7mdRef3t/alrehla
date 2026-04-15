import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth, isAdminLikeRole } from "@/modules/dawayir-live/server/auth";
import { logger } from "@/services/logger";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_NAME = "alrehla";

export async function GET(req: NextRequest) {
  // 1. Authenticate user
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  // 2. Check authorization
  if (!isAdminLikeRole(auth.role)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // 3. Check configuration
  if (!VERCEL_TOKEN) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ status: "healthy", deploymentFrequency: "Dev Environment (Vercel Not Configured)" });
    }
    logger.warn("Vercel Integration: VERCEL_TOKEN is not configured on the server.");
    return NextResponse.json({ status: "unconfigured", deploymentFrequency: "Unknown" });
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${PROJECT_NAME}&limit=1${
        VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Vercel API returned ${response.status}`);
    }

    const data = await response.json();
    const lastDeployment = data.deployments?.[0];

    if (!lastDeployment) {
      return NextResponse.json({ status: "healthy", deploymentFrequency: "N/A" });
    }

    const status = lastDeployment.state === "READY" ? "healthy" : 
                  lastDeployment.state === "ERROR" ? "down" : 
                  "degraded";

    return NextResponse.json({
      status,
      lastDeployment: {
        id: lastDeployment.uid,
        name: lastDeployment.name,
        url: lastDeployment.url,
        state: lastDeployment.state,
        createdAt: lastDeployment.created,
      },
      deploymentFrequency: "Daily",
    });
  } catch (error) {
    logger.error("Vercel Pulse API Proxy Error:", error);
    return NextResponse.json({ status: "degraded", deploymentFrequency: "Error" }, { status: 500 });
  }
}
