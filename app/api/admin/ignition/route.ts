import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';
import { WhatsAppCloudService } from '@/services/whatsappCloudService';
import { requireLiveAuth } from '@/modules/dawayir-live/server/auth';

export async function POST(req: Request) {
  try {
    // Ensure sovereign authentication
    const authResult = await requireLiveAuth(req as any);
    if (authResult instanceof NextResponse) return authResult;

    const { marketId } = await req.json();

    if (!marketId) {
      return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
    }

    // Find leads for this market (e.g. source_type matching marketId) that haven't been contacted in 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // We fetch a batch of leads to ignite (e.g., max 50 at a time)
    const { data: leads, error } = await supabase
      .from('marketing_leads')
      .select('id, phone_normalized, name')
      .ilike('source_type', `%${marketId}%`)
      .or(`last_contacted_at.lt.${yesterday},last_contacted_at.is.null`)
      .limit(50);

    if (error) {
      console.error('[Ignition API] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
       return NextResponse.json({ success: true, count: 0, message: 'No eligible leads found for ignition in this market.' });
    }

    let successCount = 0;
    
    // Dispatch Ignition Messages
    for (const lead of leads) {
       if (!lead.phone_normalized) continue;
       
       const message = `مرحباً يا ${lead.name || 'صديقي'}.. هل أنت مستعد للبدء في رحلة استكشاف الذات وإعادة بناء دوائرك؟ لدينا مساحة لك في "الملاذ" الآن.`;
       
       const result = await WhatsAppCloudService.sendFreeText(lead.phone_normalized, lead.id, message);
       
       if (result.success) {
         // Update last_contacted_at
         await supabase.from('marketing_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead.id);
         successCount++;
       }
    }

    return NextResponse.json({ success: true, count: successCount, total_attempted: leads.length });

  } catch (error: any) {
    console.error('[Ignition API] Fatal error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
