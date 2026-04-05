import { handleMarketingLeadPost } from "../../../../../src/server/marketingLeadApi";

/**
 * Facebook/Meta Lead Ads Endpoint
 * 
 * هذا ال endpoint مخصص لاستقبال الليدز من Facebook Lead Ads
 * عبر Zapier أو Make. أي ليد يوصل هنا يتم تصنيفه تلقائياً كـ meta_instant_form
 * 
 * Usage: POST /api/marketing/lead/meta
 * Zapier/Make should send leads to this URL instead of /api/marketing/lead
 */
export async function POST(req: Request) {
  return handleMarketingLeadPost(req, "meta_instant_form");
}
