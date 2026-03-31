# Alrehla WhatsApp Automation Blueprint (V1)
**Goal**: Convert Meta Ads leads into paying customers with a target of $1000/month.

## 1. The Persona: "الرفيق الذكي" (The Smart Companion)
- **Voice**: Pure Egyptian Ammiya (عامية مصرية فصيحة).
- **Tone**: Empathetic, calm, non-judgmental, and "Sovereign" (سيادي).
- **Style**: Short messages, uses supportive emojis (✨, 🌊), avoids robotic formalities.

## 2. Automation Stack
- **Lead Capture**: Meta Lead Forms → Webhook.
- **AI Orchestrator**: Botpress (Cloud) for the conversation logic.
- **CRM Integration**: Supabase (Existing `marketing_leads` table).
- **Messaging Gateway**: WhatsApp Cloud API / Twilio.

## 3. The 6-Node Conversion Flow
1. **Trigger [New Lead]**: 
   - Instant response (within 2 mins).
   - "يا أهلا بك يا [Name].. نورت الرحلة. شفت إنك مهتم بالسيادة الإدراكية؟"
2. **Qualification [The Pain]**:
   - Ask about the biggest cognitive distraction.
   - "إيه أكتر حاجة شاغلة بالك اليومين دول وبتحس إنها بتسحب طاقتك؟"
3. **The Solution [Micro-Compass]**:
   - Offer a quick 3-minute "Sanctuary Pulse" preview via WhatsApp text.
4. **Social Proof [The Mirror]**:
   - Share a success story from another "Voyager" (مسافر).
5. **The Offer [Premium Access]**:
   - Pitch the Pro subscription with a "Sovereign Discount".
   - "بما إنك لسة بتبدأ، عندي ليك عرض خاص لدخول الـ Sanctuary الكامل."
6. **Handover [Human Sync]**:
   - If user asks complex questions, notify the Owner (Mohamed) immediately.

## 4. KPI Tracking
- **Initial Response Rate**: Target > 90%.
- **Engagement (3+ messages)**: Target > 40%.
- **Conversion (Payment)**: Target > 5%.

---
> [!TIP]
> Use the existing `marketingLeadApi` to sync WhatsApp interaction states back to the platform dashboard.
