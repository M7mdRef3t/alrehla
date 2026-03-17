import LiveSessionCompletePage from "../../../../src/modules/dawayir-live/pages/LiveSessionCompletePage";

export default async function DawayirLiveCompleteRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <LiveSessionCompletePage sessionId={sessionId} />;
}
