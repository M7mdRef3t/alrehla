export async function sendAdminTelegramNotice(message: string): Promise<boolean> {
  const token = process.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.VITE_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram Notifier] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env.");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Telegram Notifier] Failed to send message:", errBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram Notifier] Exception:", error);
    return false;
  }
}
