import LiveReplayPage from "../../../../src/modules/dawayir-live/pages/LiveReplayPage";

export default async function DawayirLiveReplayRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <LiveReplayPage sessionId={sessionId} />;
}
