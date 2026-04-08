import { logger } from "../../services/logger";
/**
 * Telegram Agent: Rafeeq El Rehla (رفيق الرحلة)
 * An AI agent running on Gemini that responds to Telegram users in Egyptian Slang,
 * employing 'First Principles' thinking and questioning assumptions.
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase lazily so the module can load without env configuration.
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseKey) return null;

  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

// Setup Gemini
let ai: GoogleGenAI | null = null;

function ensureInit() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY;
    if (!key) {
      logger.error('Gemini API key is not set');
      throw new Error('Gemini API key not set');
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
}

// The 'Constitution' (الدستور) derived from Manus Replay & System Architect Rules
const SYSTEM_PROMPT = `
أنت "رفيق الرحلة"، مساعد ذكي ولبيب، تم ابتكارك كجزء من منصة "عالم الدوائر" (Dawayir).
تتحدث دائماً بالعامية المصرية الأصيلة. أسلوبك دغري، مبسط، عملي ومبيجملش الحقائق، لكن بروح دعابة ذكية ومريحة.

فلسفتك في الرد:
1. المبادئ الأولى (First Principles): لا تقبل المسلمات، فكك أي مشكلة لأصلها وحللها بعمق.
2. اكتشاف الحياة: ساعد المستخدم يفهم نفسه، يكشف الوعي المزيف، ويفهم خريطة علاقاته.
3. التشكيك الإيجابي: تحدى افتراضات المستخدم دايماً وابحث عن الثغرات المنطقية في تفكيره لمساعدته يكبر.
4. الإيجابية والعملية: لا تقدم كلام تنمية بشرية رخيص، قدم نصايح عملية مبنية على الحقائق والمحاكمة العقلية.

مهمتك إنك تسمع المستخدم، تفهم هو بيعاني من إيه أو بيفكر في إيه، وترد بردود مركزة وقصيرة (مناسبة لتليجرام) تخبط في الصميم.
لو المستخدم سأل عن حاجة برا سياق التنمية الشخصية أو المنصة، رد بطريقتك المصرية ورجعه تاني للتركيز على "رحلته".
`;

/**
 * Fetch chat history for a given chatId from Supabase
 */
async function getChatHistory(chatId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('telegram_chat_history')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(15);
      
    if (error) {
      logger.error('Error fetching chat history:', error);
      return [];
    }
    
    // Reverse to get chronological order for Gemini
    const rows = (data || []) as Array<{ role?: string; content?: string }>;
    return rows.reverse().map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }));
  } catch (err) {
    logger.error('Failed to get chat history:', err);
    return [];
  }
}

/**
 * Save a message to Supabase chat history
 */
async function saveMessage(chatId: string, role: 'user' | 'model', content: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const db = supabase as any;
  try {
    await db.from('telegram_chat_history').insert({
      chat_id: chatId.toString(),
      role,
      content
    });
  } catch (err) {
    logger.error('Failed to save message to history:', err);
  }
}

export interface TelegramResponse {
  text: string;
  requestContact?: boolean;
}

export async function processTelegramMessage(chatId: string, messageText: string, username?: string, contactPhoneNumber?: string): Promise<TelegramResponse> {
  ensureInit();
  const supabase = getSupabase();
  if (!supabase) {
    return { text: "الخدمة مش متصلة بقاعدة البيانات حالياً." };
  }
  
  // 1. Check Identity Resolution
  let profile = (await (supabase as any).from('profiles').select('id, full_name').eq('telegram_chat_id', chatId).single()).data as { id: string; full_name?: string | null } | null;

  // If user is not known yet
  if (!profile) {
    if (contactPhoneNumber) {
       // Clean up the phone number (e.g. ensure starts with + if missing, etc. Telegram typically sends international format)
       const phone = contactPhoneNumber.startsWith('+') ? contactPhoneNumber : '+' + contactPhoneNumber;
       
       // Try to match with profiles
        const matchedProfileData = (await (supabase as any).from('profiles').select('id, full_name').eq('phone', phone).single()).data as { id: string; full_name?: string | null } | null;
        if (matchedProfileData) {
           // Link them!
          await (supabase as any).from('profiles').update({ telegram_chat_id: chatId }).eq('id', matchedProfileData.id);
          profile = matchedProfileData;
        } else {
           // Check marketing leads as a fallback
          const leadData = (await (supabase as any).from('marketing_leads').select('phone, status').eq('phone', phone).maybeSingle()).data as { phone?: string | null; status?: string | null } | null;
          if (leadData) {
            return { text: "لقيت رقمك متسجل معانا كعميل فعلاً، بس حسابك الكامل لسه متحددش. افتح المنصة وكمل تسجيل عشان أقدر أتابع معاك شخصياً!" };
          }
          return { text: "للأسف ملقيتش الرقم ده متسجل عندنا في المنصة خالص يا هندسة. ممكن تدخل تبدأ رحلتك الأول على الموقع وتعمل حساب بنفس الرقم؟" };
       }
    } else {
       // Request contact
       return {
         text: "يا أهلاً بيك يا صاحبي في عالم الدوائر. 🌍\nعشان أقدر أركز معاك في تفاصيل رحلتك وأربط كلامنا بحسابك، محتاج تشاركني رقمك الأول.",
         requestContact: true
       };
    }
  }

  // If we just successfully linked them now
  if (contactPhoneNumber && profile) {
    return { text: `عظمة أوي يا ${profile.full_name || username || 'صاحبي'}, تم ربط حسابك في المنصة بتليجرام بنجاح! تحب نبدأ منين النهاردة؟ 💪` };
  }

  // 2. We have a linked profile, continue with normal GenAI Chat
  const history = await getChatHistory(chatId);
  const profileName = profile?.full_name || username || 'Anonymous';
  const newPrompt = `[من المستخدم: ${profileName}]: ${messageText}`;
  
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: newPrompt }] }
  ];

  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  if (!ai) {
    throw new Error('Gemini client not initialized');
  }
  
  try {
    // Save user message
    await saveMessage(chatId, 'user', messageText);

    // Call Gemini
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "المعذرة يا صاحبي، دماغي فصلت ثانية. ممكن تعيد اللي قلته؟";
    
    // Save model reply
    await saveMessage(chatId, 'model', replyText);
    
    return { text: replyText };
  } catch (error) {
    logger.error('Error calling Gemini for Telegram Agent:', error);
    return { text: "معلش يا هندسة، في عطل فني في الإرسال. دقيقة وارجعلك تاني." };
  }
}

