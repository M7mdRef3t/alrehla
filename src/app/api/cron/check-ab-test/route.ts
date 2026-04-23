import { NextResponse } from 'next/server';
import { sendAdminTelegramNotice } from '@/server/telegramNotifier';
import { supabaseAdmin as supabase } from '@/infrastructure/database/client';

export async function GET(req: Request) {
  // Simple check to ensure only authorized cron can call this (Optional but recommended)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!supabase) {
      throw new Error("Supabase Admin client not configured.");
    }
    // 1. Fetch Funnel Metrics from Supabase
    // This assumes you have a table tracking variants/views/clicks
    const { data: metrics, error } = await supabase
      .from('funnel_metrics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Simple logic to detect a "Win" (e.g. CTR > Threshold)
    const significantWin = metrics?.find(m => m.ctr > 5 && m.views > 100);

    if (significantWin) {
      await sendAdminTelegramNotice(
        `🛡️ <b>Sovereign Monitor Alert</b>\n\nSignificant conversion win detected in Variant: <code>${significantWin.variant_id}</code>\nCTR: <b>${significantWin.ctr}%</b>\nTotal Views: ${significantWin.views}\n\n<i>Time to scale this variant.</i>`
      );
      return NextResponse.json({ success: true, alertSent: true });
    }

    return NextResponse.json({ success: true, alertSent: false, message: 'No significant wins detected.' });
  } catch (error) {
    console.error("[Cron Monitor] Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
