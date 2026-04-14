import { logger } from "./logger";

export interface VercelDeployment {
  id: string;
  name: string;
  url: string;
  state: "READY" | "ERROR" | "BUILDING" | "INITIALIZING";
  createdAt: number;
}

export interface VercelPulse {
  status: "healthy" | "degraded" | "down" | "unconfigured";
  lastDeployment?: VercelDeployment;
  deploymentFrequency: string;
}

const VERCEL_TOKEN = process.env.NEXT_PUBLIC_VERCEL_TOKEN || process.env.VITE_VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.NEXT_PUBLIC_VERCEL_TEAM_ID || process.env.VITE_VERCEL_TEAM_ID || "";
const PROJECT_NAME = "alrehla"; // Should match your Vercel project name

/**
 * Service to bridge Alrehla with Vercel Infrastructure
 * Provides real-time pulse for the Sovereign Admin Dashboard
 */
export const vercelService = {
  getPulse: async (): Promise<VercelPulse> => {
    if (!VERCEL_TOKEN) {
      logger.warn("Vercel Integration: VITE_VERCEL_TOKEN is not configured.");
      return { status: "unconfigured", deploymentFrequency: "Unknown" };
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
        return { status: "healthy", deploymentFrequency: "N/A" };
      }

      const status = lastDeployment.state === "READY" ? "healthy" : 
                    lastDeployment.state === "ERROR" ? "down" : 
                    "degraded";

      return {
        status,
        lastDeployment: {
          id: lastDeployment.uid,
          name: lastDeployment.name,
          url: lastDeployment.url,
          state: lastDeployment.state,
          createdAt: lastDeployment.created,
        },
        deploymentFrequency: "Daily", // This could be calculated from history
      };
    } catch (error) {
      logger.error("Vercel Pulse Fetch Error:", error);
      return { status: "degraded", deploymentFrequency: "Error" };
    }
  },
};
