import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  getLiveApiKey,
  getLiveFeatureFlag,
  getLiveModel,
  getLiveVoice,
  getOptionalLiveAuthContext,
} from "../../../../src/modules/dawayir-live/server/auth";

export const dynamic = "force-dynamic";

async function createEphemeralToken(apiKey: string, model: string) {
  try {
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1alpha",
    });

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: `models/${model}`,
        },
      },
    });

    return token.name || undefined;
  } catch (error) {
    console.warn("Failed to create Dawayir Live ephemeral token:", error);
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  const auth = await getOptionalLiveAuthContext(req);
  const apiKey = getLiveApiKey();
  const model = getLiveModel();
  const ephemeralToken = apiKey ? await createEphemeralToken(apiKey, model) : undefined;

  return NextResponse.json({
    enabled: getLiveFeatureFlag("DAWAYIR_LIVE_ENABLED"),
    requiresAuth: !auth,
    apiConfigured: Boolean(apiKey),
    apiKey: apiKey || undefined,
    ephemeralToken,
    model,
    voice: getLiveVoice(),
    featureFlags: {
      live: getLiveFeatureFlag("DAWAYIR_LIVE_ENABLED"),
      couple: getLiveFeatureFlag("DAWAYIR_LIVE_COUPLE"),
      coach: getLiveFeatureFlag("DAWAYIR_LIVE_COACH"),
      camera: getLiveFeatureFlag("DAWAYIR_LIVE_CAMERA"),
    },
    userId: auth?.userId ?? null,
  });
}
