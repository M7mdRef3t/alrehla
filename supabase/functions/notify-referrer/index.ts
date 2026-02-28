import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { referrerCode, referredByCode } = await req.json();

    if (!referrerCode || !referredByCode) {
      throw new Error("Missing required fields: referrerCode or referredByCode");
    }

    // Here we would typically update a database or send an email/notification
    console.log(`Referral notification: User ${referredByCode} used referral code ${referrerCode}`);

    const data = {
      message: `Notification processed for code ${referrerCode}`,
    };

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
