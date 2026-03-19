import { handleMarketingLeadImportPost } from "../../../../../src/server/marketingLeadApi";

export async function POST(req: Request) {
  return handleMarketingLeadImportPost(req);
}
