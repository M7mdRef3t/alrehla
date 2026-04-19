import { NextResponse } from 'next/server';
import { sendAdminTelegramNotice } from '@/server/telegramNotifier';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Simple Webhook Handler for Sovereign Alerts
    if (body.type === 'TEST_TRIGGER') {
      await sendAdminTelegramNotice("🚀 <b>Dawayir Sovereign System</b>\nTest trigger successful. Connection is ACTIVE.");
      return NextResponse.json({ success: true, message: 'Test notice sent' });
    }

    if (body.type === 'CONVERSION_WIN') {
      const { variant, stats } = body.payload;
      await sendAdminTelegramNotice(
        `🏆 <b>Conversion Win Detected!</b>\n\nVariant: <code>${variant}</code>\nCTR: <b>${stats.ctr}%</b>\nViews: ${stats.views}`
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown trigger type' }, { status: 400 });
  } catch (error) {
    console.error("[Sovereign API] Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
