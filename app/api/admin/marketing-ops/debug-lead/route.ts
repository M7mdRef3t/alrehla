import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import fs from "fs";

export async function GET(req: Request) {
  const path = 'C:\\Users\\ty\\Downloads\\energy_map_eg_v1_ad_01_Leads_2026-03-19_2026-04-10.xls';
  if (!fs.existsSync(path)) return NextResponse.json({ error: "File not found" });

  const xml = fs.readFileSync(path, 'utf8');
  
  // Facebook XML Spreadsheet format parsing
  const rowRegex = /<Row>([\s\S]*?)<\/Row>/g;
  const cellRegex = /<Data ss:Type=".*?">(.*?)<\/Data>/g;

  let rows = [];
  let match;
  while ((match = rowRegex.exec(xml)) !== null) {
    const rowContent = match[1];
    let cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1].replace(/&#10;/g, ' ').trim());
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length < 2) return NextResponse.json({ error: "No data found", rowCount: rows.length });

  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    let obj: any = {};
    headers.forEach((h: string, i: number) => {
      // Decode typical XML entities just in case
      let content = (row[i] || "").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      obj[h] = content;
    });
    return obj;
  });

  const { sanitizePhone } = await import("../../../../../src/server/marketingLeadUtils");
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // 1. Fetch all leads that might need updates
  const { data: dbLeads, error } = await supabase.from('marketing_leads')
      .select('id, email, phone, phone_normalized, metadata, source_type, campaign, adset, ad')
      .eq('source_type', 'meta_instant_form');

  let updatedCount = 0;
  let updateLog = [];

  for (const xlsRow of data) {
      if (!xlsRow.email) continue;
      
      const emailLower = xlsRow.email.toLowerCase().trim();
      const dbMatch = dbLeads?.find(l => l.email && l.email.toLowerCase().trim() === emailLower);
      
      if (dbMatch) {
          // If the DB match is missing phone, meta_id, OR tracking data!
          const hasPhone = !!dbMatch.phone_normalized;
          const hasMetaId = !!dbMatch.metadata?.meta_lead_id || !!dbMatch.metadata?.leadgen_id;
          const hasTracking = !!dbMatch.campaign && !!dbMatch.adset && !!dbMatch.ad;
          
          if (!hasPhone || !hasMetaId || !hasTracking) {
              const phoneParsed = sanitizePhone(xlsRow.phone_number);
              const nextMetadata = {
                  ...(dbMatch.metadata || {}),
                  meta_lead_id: xlsRow.id,
                  form_id: xlsRow.form_id,
                  form_name: xlsRow.form_name,
                  raw_fields: {
                      email: xlsRow.email,
                      full_name: xlsRow.full_name,
                      phone_number: xlsRow.phone_number
                  },
                  missing_phone: !phoneParsed?.normalized && !dbMatch.phone_normalized
              };

              const newCampaign = dbMatch.campaign || xlsRow.campaign_name || null;
              const newAdset = dbMatch.adset || xlsRow.adset_name || null;
              const newAd = dbMatch.ad || xlsRow.ad_name || null;

              const { error: updateErr } = await supabase.from('marketing_leads').update({
                  phone: phoneParsed?.normalized || dbMatch.phone || null,
                  phone_normalized: phoneParsed?.normalized || dbMatch.phone_normalized || null,
                  phone_raw: phoneParsed?.raw || xlsRow.phone_number || null,
                  campaign: newCampaign,
                  adset: newAdset,
                  ad: newAd,
                  metadata: nextMetadata
              }).eq('id', dbMatch.id);
              
              if (!updateErr) {
                  updatedCount++;
                  updateLog.push(`Updated ${emailLower}: phone, Meta ID, campaign="${newCampaign}"`);
              } else {
                  updateLog.push(`Error updating ${emailLower}: ${updateErr.message}`);
              }
          }
      }
  }

  return NextResponse.json({ 
    totalExcelRows: data.length, 
    dbMetaLeadsFound: dbLeads?.length || 0,
    updatedCount: updatedCount, 
    logs: updateLog 
  });
}
