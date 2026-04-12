import { logger } from "@/services/logger";

export class MetaAdsService {
    private static ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
    private static AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID; // act_XXXXXXXXXXXX

    static async getRecentSpend(): Promise<number> {
        if (!this.ACCESS_TOKEN || !this.AD_ACCOUNT_ID) {
            logger.warn("Meta Ads credentials missing. Returning simulated spend.");
            return Math.floor(Math.random() * 100) + 50; // Mock spend
        }

        try {
            const url = `https://graph.facebook.com/v19.0/${this.AD_ACCOUNT_ID}/insights?fields=spend&date_preset=yesterday&access_token=${this.ACCESS_TOKEN}`;
            const res = await fetch(url);
            const json = await res.json();
            
            if (json.data && json.data.length > 0) {
                return parseFloat(json.data[0].spend);
            }
            return 0;
        } catch (error) {
            logger.error("Error fetching Meta Ads spend:", error);
            return 0;
        }
    }
}
