import { NextResponse } from "next/server";
import { whatsappAutomationService } from "@/services/whatsappAutomationService";

/**
 * Debug Endpoint to Mock WhatsApp Inbound Messages
 * Usage: /api/debug/whatsapp-mock?type=inquiry&phone=201140111147
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "inquiry"; // inquiry | payment
  const phone = searchParams.get("phone") || "201140111147";

  const payloads = {
    inquiry: {
      from: phone,
      name: "Mock User Inquiry",
      text: "عايز أعرف تفاصيل أكتر عن الرحلة وازاي أبدأ؟",
      timestamp: Date.now().toString(),
      messageId: "mock_msg_" + Date.now(),
      gateway: "meta" as const
    },
    payment: {
      from: phone,
      name: "Mock User Payment",
      text: "عايز أشترك.. فودافون كاش متاح؟",
      timestamp: Date.now().toString(),
      messageId: "mock_msg_pay_" + Date.now(),
      gateway: "meta" as const
    }
  };

  const payload = payloads[type as keyof typeof payloads] || payloads.inquiry;

  try {
    const result = await whatsappAutomationService.processInboundMessage(payload);
    return NextResponse.json({ 
      ok: true, 
      message: `Simulated ${type} message processed.`,
      result, 
      payload 
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
