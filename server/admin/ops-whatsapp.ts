import { AdminRequest, AdminResponse, recordAdminAudit } from "./_shared";

export async function handleWhatsAppWebhookOps(req: AdminRequest, res: AdminResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body as { action?: string; callbackUrl?: string };
    const { action, callbackUrl } = body || {};

    if (action === "register_webhook") {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const verifyToken = process.env.META_WA_VERIFY_TOKEN;

        if (!appId || !appSecret || !verifyToken || !callbackUrl) {
            return res.status(400).json({ error: "Missing required configuration (META_APP_ID, META_APP_SECRET, META_WA_VERIFY_TOKEN) or callbackUrl" });
        }

        try {
            // 1. Get App Access Token
            const tokenResponse = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`);
            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                return res.status(500).json({ error: "Failed to obtain access token", details: tokenData });
            }

            const appAccessToken = tokenData.access_token;

            // 2. Register Webhook
            const formData = new URLSearchParams();
            formData.append("object", "whatsapp_business_account");
            formData.append("callback_url", callbackUrl);
            formData.append("verify_token", verifyToken);
            formData.append("fields", "messages,message_template_status_update");

            const subscribeResponse = await fetch(`https://graph.facebook.com/v21.0/${appId}/subscriptions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${appAccessToken}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData.toString()
            });

            const subscribeData = await subscribeResponse.json();

            await recordAdminAudit(req, "whatsapp_webhook_registration", { success: subscribeResponse.ok, callbackUrl });

            if (!subscribeResponse.ok) {
                return res.status(500).json({ error: "Failed to subscribe webhook", details: subscribeData });
            }

            return res.status(200).json({ success: true, details: subscribeData });

        } catch (error) {
            return res.status(500).json({ error: "Internal server error", details: String(error) });
        }
    }

    return res.status(400).json({ error: "Invalid action" });
}
