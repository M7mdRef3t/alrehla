/**
 * Diplomacy Service — خدمة الدبلوماسية الاستراتيجية ✉️
 * ==========================================
 * توفر قوالب رسائل (برقيات) ذكية للتعامل مع المواقف المعقدة.
 */

export type CableCategory = "boundary" | "de-escalation" | "clarity" | "distancing";

export interface DiplomaticCable {
    id: string;
    category: CableCategory;
    title: string;
    template: string; // {name} will be replaced
    jarvisNote: string;
}

const CABLES: DiplomaticCable[] = [
    {
        id: "boundary-1",
        category: "boundary",
        title: "رسم حدود الطاقة",
        template: "مرحباً {name}، أقدر تواصلك، لكني حالياً أركز على بعض الأمور الشخصية وبحاجة لتقليل الالتزامات الخارجية لفترة. شكراً لتفهمك.",
        jarvisNote: "استخدم هذا القالب عندما تشعر بضغط اجتماعي لا تملك طاقة له."
    },
    {
        id: "work-boundary-1",
        category: "boundary",
        title: "فصل العمل عن الهدوء",
        template: "أهلاً {name}، استلمت رسالتك. سأقوم بالرد عليها خلال ساعات العمل الرسمية لضمان جودة التركيز الآن. شكراً لتقديرك لوقتي الخاص.",
        jarvisNote: "يحمي مساحتك المسائية من استباحة المهام الوظيفية."
    },
    {
        id: "distancing-1",
        category: "distancing",
        title: "الانسحاب التكتيكي",
        template: "يا {name}، يبدو أننا نمر بفترة من عدم التفاهم. أظن أن من الأفضل للطرفين أخذ مساحة لبعض الوقت لنعود برؤية أوضح.",
        jarvisNote: "مثالي لصد هجمات 'الصمت العقابي' أو الصراعات الدورية."
    },
    {
        id: "clarity-1",
        category: "clarity",
        title: "طلب الوضوح الاستراتيجي",
        template: "مرحباً {name}، لاحظت بعض الغموض في تعاملنا الأخير. يهمني أن يكون تواصلنا مبنياً على وضوح التوقعات. هل يمكننا تحديد مسار واضح للعلاقة؟",
        jarvisNote: "استخدمه عندما تشعر أن الطرف الآخر يستخدم 'الغموض' كأداة تلاعب."
    },
    {
        id: "de-escalation-1",
        category: "de-escalation",
        title: "تفريغ شحنة الصراع",
        template: "يا {name}، أرى أن النقاش بدأ يتخذ مساراً انفعالياً لا يخدم مصلحة أحد. لنؤجل الحديث حتى تهدأ الأمور لنستطيع اتخاذ قرار عقلاني.",
        jarvisNote: "يمنع وقوعك في فخ 'الاستدراج' العاطفي."
    },
    {
        id: "family-1",
        category: "clarity",
        title: "توضيح التوقعات العائلية",
        template: "أقدر اهتمامك يا {name}، لكن هذا القرار خاص بي وبحياتي حالياً. سأشارككم النتائج عندما أكون مستعداً. أحتاج دعمكم في هذه المساحة.",
        jarvisNote: "يضع حداً للتدخلات العائلية 'الحميدة' لكن المستنزفة."
    }
];

export function getCablesByCategory(category?: CableCategory): DiplomaticCable[] {
    if (!category) return CABLES;
    return CABLES.filter(c => c.category === category);
}

export function generateCableContent(cableId: string, personName: string): string {
    const cable = CABLES.find(c => c.id === cableId);
    if (!cable) return "";
    return cable.template.replace(/{name}/g, personName);
}
