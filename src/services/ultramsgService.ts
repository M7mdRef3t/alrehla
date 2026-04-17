export class UltramsgService {
  /**
   * Normalizes a phone number to standard international format (for Ultramsg)
   * Converts local Egyptian numbers (e.g., 01...) to 201...
   */
  static normalizePhoneNumber(phone: string): string {
    let clean = phone.replace(/\D/g, "");

    // Convert Egyptian numbers starting with 01 to 201
    if (clean.startsWith("01") && clean.length === 11) {
       clean = "2" + clean;
    }

    // Convert Egyptian numbers missing the leading zero
    if (clean.startsWith("1") && clean.length === 10) {
      clean = "20" + clean;
    }

    // Optional: add + for standard E.164, but Ultramsg often accepts it without +
    // We'll return just the digits as required by the Ultramsg `to` field
    return clean;
  }

  /**
   * Sends a standard text message via Ultramsg API
   */
  static async sendTextMessage(phone: string, text: string): Promise<boolean> {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) {
      console.warn("[Ultramsg] Credentials missing in environment variables. Skipping message.");
      return false;
    }

    const formattedPhone = this.normalizePhoneNumber(phone);
    if (!formattedPhone || formattedPhone.length < 8) {
      console.warn(`[Ultramsg] Invalid phone number provided: ${phone}`);
      return false;
    }

    try {
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      
      const params = new URLSearchParams();
      params.append("token", token);
      params.append("to", formattedPhone);
      params.append("body", text);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        let errorText = "";
        try {
          const errBody = await response.json();
          errorText = JSON.stringify(errBody);
        } catch {
          errorText = await response.text();
        }
        console.error(`[Ultramsg] API Error (Status ${response.status}):`, errorText);
        return false;
      }

      console.log(`[Ultramsg] Successfully sent message to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error("[Ultramsg] Internal Error sending message:", error);
      return false;
    }
  }

  /**
   * Helper specifically for activating a subscriber
   */
  static async sendSubscriberActivationMessage(phone: string): Promise<boolean> {
    const text = "أهلاً بك في «الرحلة»! تم تفعيل اشتراكك بنجاح.\n\nأربط حزامك، واستعد للغوص في الخريطة من هنا:\nhttps://alrehla.app/login";
    return this.sendTextMessage(phone, text);
  }
}
