import { logger } from "@/services/logger";

export class GoogleAdsService {
    private static CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID; // XXXXXXXXXX (without dashes)
    private static DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    private static REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    private static CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
    private static CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;

    /**
     * Fetches yesterday's spend from Google Ads API.
     */
    static async getRecentSpend(): Promise<number> {
        if (!this.CUSTOMER_ID || !this.DEVELOPER_TOKEN || !this.REFRESH_TOKEN) {
            logger.warn("Google Ads credentials missing. Spend tracking might be incomplete.");
            return 0;
        }

        try {
            // 1. Get Access Token using Refresh Token
            const tokenUrl = 'https://oauth2.googleapis.com/token';
            const tokenRes = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: this.CLIENT_ID || '',
                    client_secret: this.CLIENT_SECRET || '',
                    refresh_token: this.REFRESH_TOKEN || ''
                })
            });
            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;

            if (!accessToken) {
                logger.error("Could not refresh Google Ads token", tokenData);
                throw new Error("Google Ads Auth Failure");
            }

            // 2. Query Google Ads API
            // Note: searchStream returns an array of objects representing rows.
            const queryUrl = `https://googleads.googleapis.com/v15/customers/${this.CUSTOMER_ID}/googleAds:searchStream`;
            const query = `
                SELECT metrics.cost_micros 
                FROM customer 
                WHERE segments.date DURING YESTERDAY
            `;

            const res = await fetch(queryUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': this.DEVELOPER_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!res.ok) {
                const errBody = await res.text();
                logger.error(`Google Ads API Failure (${res.status}):`, errBody);
                return 0;
            }

            const data = await res.json();
            let totalCostMicros = 0;

            // SearchStream response is an array of response batches
            if (Array.isArray(data)) {
                data.forEach((batch: any) => {
                    if (batch.results && Array.isArray(batch.results)) {
                        batch.results.forEach((row: any) => {
                            if (row.metrics && row.metrics.costMicros) {
                                totalCostMicros += parseInt(row.metrics.costMicros);
                            }
                        });
                    }
                });
            }

            // Google Ads returns cost in micros (1,000,000 = 1 currency unit)
            const finalSpend = totalCostMicros / 1000000;
            logger.info(`Google Ads Telemetry: Syncing ${finalSpend} spend for yesterday.`);
            return finalSpend;
        } catch (error) {
            logger.error("Error fetching Google Ads spend:", error);
            return 0;
        }
    }
}
