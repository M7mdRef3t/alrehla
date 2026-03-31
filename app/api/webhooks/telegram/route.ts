import { NextResponse } from 'next/server';
import { processTelegramMessage } from '@/lib/maraya/telegramAgent';

// Force dynamic since it depends on incoming request bodies
export const dynamic = 'force-dynamic';

function isAuthorizedDryRun(req: Request) {
  const url = new URL(req.url);
  const wantsDryRun = url.searchParams.get('dryRun') === '1' || req.headers.get('x-telegram-dry-run') === '1';
  if (!wantsDryRun) {
    return false;
  }

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const adminSecret = process.env.ADMIN_API_SECRET;
  const providedSecret = req.headers.get('x-admin-secret');
  return Boolean(adminSecret && providedSecret && adminSecret === providedSecret);
}

export async function POST(req: Request) {
  try {
    const dryRun = isAuthorizedDryRun(req);
    const payload = await req.json();

    // Basic structure of a Telegram Update object
    const message = payload.message;
    if (!message || (!message.text && !message.contact)) {
      // 200 OK because Telegram will keep retrying if we send errors for supported but unhandled updates
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const contactPhoneNumber = message.contact?.phone_number;
    const username = message.from?.username || message.from?.first_name || 'Anonymous';

    // Call the Agent to generate response (in Egyptian Slang, First Principles)
    const agentResponse = await processTelegramMessage(chatId.toString(), text, username, contactPhoneNumber);

    // Prepare payload
    const replyPayload: any = {
      chat_id: chatId,
      text: agentResponse.text,
      parse_mode: 'Markdown'
    };

    // If requestContact is true, add the keyboard button
    if (agentResponse.requestContact) {
      replyPayload.reply_markup = {
        keyboard: [
          [{ text: "📞 شارك رقمك عشان نبدأ الرحلة", request_contact: true }]
        ],
        one_time_keyboard: true,
        resize_keyboard: true
      };
    } else {
      // Clean up previous keyboards if we are chatting normally
      replyPayload.reply_markup = { remove_keyboard: true };
    }

    if (dryRun) {
      return NextResponse.json(
        {
          status: 'dry-run',
          agentResponse,
          replyPayload,
        },
        { status: 200 },
      );
    }

    // Send the response back to Telegram via HTTP request
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Telegram bot token environment variable is not defined.');
      return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replyPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send message to Telegram:', errorData);
      return NextResponse.json({ error: 'failed to send to telegram' }, { status: 500 });
    }

    // Acknowledge Telegram webhook received
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    // Return 200 OK so Telegram doesn't retry infinitely on fatal backend errors
    return NextResponse.json({ status: 'error', message: 'internal server error' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram Webhook is active' }, { status: 200 });
}
