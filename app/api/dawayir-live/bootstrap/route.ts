import { NextRequest, NextResponse } from "next/server";
import {
  getLiveApiKey,
  getLiveFeatureFlag,
  getLiveModel,
  getLiveVoice,
  getOptionalLiveAuthContext,
} from "../../../../src/modules/dawayir-live/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await getOptionalLiveAuthContext(req);

  return NextResponse.json({
    enabled: getLiveFeatureFlag("DAWAYIR_LIVE_ENABLED"),
    requiresAuth: !auth,
    apiConfigured: Boolean(getLiveApiKey()),
    model: getLiveModel(),
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
