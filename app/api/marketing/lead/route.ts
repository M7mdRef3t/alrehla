import { handleMarketingLeadGet, handleMarketingLeadPost } from "../../../../src/server/marketingLeadApi";

export async function GET(req: Request) {
  return handleMarketingLeadGet(req);
}

export async function POST(req: Request) {
  return handleMarketingLeadPost(req);
}
