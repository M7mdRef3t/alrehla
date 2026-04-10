/**
 * Sovereign Chronicles Engine — Generative storytelling for milestones
 */

export interface ChronicleEntry {
    id: string;
    text: string;
    date: number;
    level: number;
}

const CHRONICLE_TEMPLATES = [
    "الليلة التي استعاد فيها {rank} سيطرته على مداراته. لم يكن مجرد صعود، بل كان إعلاناً للسيادة.",
    "مستوى جديد، وعي أعمق. {rank} الآن يرى ما لا يراه الآخرون في خريطة حياته.",
    "عندما اهتزت البوصلة، ثبت {rank} مكانه. هذا السجل يوثق لحظة التحول الكبرى.",
    "من مستكشف بسيط إلى {rank}... الرحلة بدأت تؤتي ثمارها بالوضوح والهدوء.",
    "في قلب العاصفة، وجد {rank} ملاذه. اليوم، السيادة ليست مجرد كلمة، بل واقع يعيشه."
];

export function generateChronicle(level: number, rank: string): ChronicleEntry {
    const template = CHRONICLE_TEMPLATES[Math.floor(Math.random() * CHRONICLE_TEMPLATES.length)];
    const text = template.replace("{rank}", rank);
    
    return {
        id: `chronicle_${Date.now()}`,
        text,
        date: Date.now(),
        level
    };
}
