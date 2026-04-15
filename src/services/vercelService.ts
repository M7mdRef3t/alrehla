import { logger } from "./logger";
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";

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

export const vercelService = {
  getPulse: async (): Promise<VercelPulse> => {
    try {
      const authToken = getAuthToken();
      const adminCode = useAdminState.getState().adminCode;
      const bearer = authToken ?? adminCode;

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (bearer) {
        headers["Authorization"] = `Bearer ${bearer}`;
      }

      // Direct call to Vercel API from the browser is insecure as it exposes VERCEL_TOKEN.
      // We now proxy this through our internal API.
      const response = await fetch("/api/admin/infrastructure/vercel-pulse", {
        headers
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { status: "unconfigured", deploymentFrequency: "Forbidden" };
        }
        throw new Error(`Proxy API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Vercel Pulse Client Fetch Error:", error);
      return { status: "degraded", deploymentFrequency: "Error" };
    }
  },
};
