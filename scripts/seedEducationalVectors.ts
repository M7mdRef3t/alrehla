/**
 * 🛰️ Seed Educational Vectors — حقن محتوى المعرفة في فضاء الوعي
 * ========================================================
 * يستهدف تحويل المكتبة التعليمية (فيديوهات، قصص، أسئلة) إلى Vectors
 * وتخزينها في Supabase لتمكين البحث الدلالي.
 */

import { videos, successStories, faqs } from "../src/data/educationalContent";
import { consciousnessService } from "../src/services/consciousnessService";

// ملاحظة: هذا السكريبت يُفترض تشغيله في بيئة Node أو عبر أداة التطوير
async function seed() {
    console.log("🚀 Starting Educational Vector Seeding...");

    // 1. فيديوهات
    for (const v of videos) {
        const content = `فيديو تعليمي: ${v.title}. ${v.description}. التصنيف: ${v.category}. الكلمات المفتاحية: ${v.tags?.join(", ")}`;
        console.log(`- Ingesting Video: ${v.title}`);
        await consciousnessService.saveMoment(null, content, "note");
    }

    // 2. قصص نجاح
    for (const s of successStories) {
        const content = `قصة نجاح (Anonymous): ${s.title}. الملخص: ${s.summary}. التجربة: ${s.journey.challenge} -> ${s.journey.action} -> ${s.journey.after}`;
        console.log(`- Ingesting Story: ${s.title}`);
        await consciousnessService.saveMoment(null, content, "note");
    }

    // 3. أسئلة شائعة
    for (const f of faqs) {
        const content = `سؤال شائع: ${f.question}. الإجابة: ${f.answer}. التصنيف: ${f.category}`;
        console.log(`- Ingesting FAQ: ${f.question}`);
        await consciousnessService.saveMoment(null, content, "note");
    }

    console.log("✅ Seeding Complete!");
}

seed().catch(console.error);
