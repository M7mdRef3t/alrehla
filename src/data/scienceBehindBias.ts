/**
 * 🔬 Science Behind Bias — العلم وراء كل وهم
 * =============================================
 * خريطة بيانات علمية لكل نوع تحيز معرفي تكشفه المنصة.
 * كل سجل يربط بين:
 * 1. البحث النفسي/المعرفي الأصلي
 * 2. الآية القرآنية المرتبطة
 * 3. شرح مبسط بالعامية المصرية
 */

import type { BiasType } from "@/services/cognitiveBiasEngine";

export interface ScienceNote {
    biasType: BiasType;
    /** الاسم بالعربي */
    titleAr: string;
    /** الاسم الإنجليزي */
    titleEn: string;
    /** شرح البحث العلمي الأصلي — جملتين */
    researchSummary: string;
    /** اسم الباحث */
    researcher: string;
    /** السنة */
    year: number;
    /** الجامعة/المؤسسة */
    institution: string;
    /** الآية القرآنية المرتبطة (مع التشكيل) */
    relatedAyah: string;
    /** مرجع الآية */
    ayahReference: string;
    /** شرح الربط بين العلم والآية */
    connectionExplanation: string;
    /** رسالة مبسطة للمستخدم */
    userFriendlyInsight: string;
}

/**
 * Mirror Insight types → science mapping
 */
export type MirrorInsightType =
    | "emotional_denial"
    | "reality_detachment"
    | "placement_anxiety"
    | "false_support"
    | "love_drain"
    | "paper_boundaries"
    | "false_recovery"
    | "connection_illusion";

export interface MirrorScienceNote {
    type: MirrorInsightType;
    titleAr: string;
    researchSummary: string;
    researcher: string;
    year: number;
    relatedAyah: string;
    ayahReference: string;
    userFriendlyInsight: string;
}

// ═══════════════════════════════════════════════
// Cognitive Bias Science Data
// ═══════════════════════════════════════════════

export const BIAS_SCIENCE: Record<BiasType, ScienceNote> = {
    sunk_cost: {
        biasType: "sunk_cost",
        titleAr: "مغالطة التكلفة الغارقة",
        titleEn: "Sunk Cost Fallacy",
        researchSummary:
            "اكتشف الباحثان Arkes و Blumer إن الناس بتكمل في قرارات خسرانة لمجرد إنها \"استثمرت كتير\" — حتى لو الاستمرار هيكلّف أكتر. المخ بيكره الاعتراف بالخسارة لأن ده بيجرح الـ Ego.",
        researcher: "Hal R. Arkes & Catherine Blumer",
        year: 1985,
        institution: "Ohio University",
        relatedAyah: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تُلْهِكُمْ أَمْوَالُكُمْ وَلَا أَوْلَادُكُمْ عَن ذِكْرِ اللَّهِ﴾",
        ayahReference: "المنافقون: ٩",
        connectionExplanation:
            "الآية بتحذر من إن اللي استثمرت فيه (مال، وقت، علاقة) يشغلك عن الحقيقة. العلم بيأكد نفس الحاجة: الاستثمار السابق مش مبرر للاستمرار في الخطأ.",
        userFriendlyInsight:
            "عقلك بيقنعك تكمل عشان \"خسرت كتير\" — لكن العلم بيقول: اللي فات مات. القرار الصح مبني على المستقبل مش الماضي.",
    },

    confirmation: {
        biasType: "confirmation",
        titleAr: "تحيز التأكيد",
        titleEn: "Confirmation Bias",
        researchSummary:
            "Peter Wason أثبت في تجربته الشهيرة إن الناس بتدور على أدلة تثبت اللي هي عايزة تصدقه — وبتتجاهل أي دليل عكسي. المخ بيحب الراحة أكتر من الحقيقة.",
        researcher: "Peter Cathcart Wason",
        year: 1960,
        institution: "University College London",
        relatedAyah: "﴿بَلِ الْإِنسَانُ عَلَىٰ نَفْسِهِ بَصِيرَةٌ ۝ وَلَوْ أَلْقَىٰ مَعَاذِيرَهُ﴾",
        ayahReference: "القيامة: ١٤-١٥",
        connectionExplanation:
            "القرآن بيقول إن الإنسان عارف الحقيقة جوّاه — لكنه بيختلق أعذار. والعلم بيقول نفس الكلام: إنت مش بتدور على الحقيقة، إنت بتدور على اللي يريحك.",
        userFriendlyInsight:
            "مش كل ما تلاقي دليل إن العلاقة كويسة يبقى ده حقيقي. ممكن عقلك بيفلتر وبيوريك بس اللي عايز يشوفه.",
    },

    familiarity: {
        biasType: "familiarity",
        titleAr: "تأثير الألفة",
        titleEn: "Familiarity Effect / Mere Exposure",
        researchSummary:
            "Robert Zajonc اكتشف إن مجرد التعرض المتكرر لحاجة بيخلينا نحبها — حتى لو مالهاش قيمة فعلية. العادة بتتحول لمشاعر وهمية.",
        researcher: "Robert Zajonc",
        year: 1968,
        institution: "University of Michigan",
        relatedAyah: "﴿وَإِذَا قِيلَ لَهُمُ اتَّبِعُوا مَا أَنزَلَ اللَّهُ قَالُوا بَلْ نَتَّبِعُ مَا أَلْفَيْنَا عَلَيْهِ آبَاءَنَا﴾",
        ayahReference: "البقرة: ١٧٠",
        connectionExplanation:
            "\"ألفينا\" = تعودنا. القرآن حذر من اتباع العادة بدل الحقيقة. والعلم بيقول إن المخ بيخلط بين \"أنا متعود عليه\" و\"أنا محتاجه\".",
        userFriendlyInsight:
            "لو الشخص ده اختفى بكره — هتفتقده فعلاً ولا هتفتقد العادة؟ المخ بيخلط بين الاتنين.",
    },

    illusion_of_control: {
        biasType: "illusion_of_control",
        titleAr: "وهم السيطرة",
        titleEn: "Illusion of Control",
        researchSummary:
            "Ellen Langer أثبتت إن الناس بتفتكر عندها سيطرة على حاجات عشوائية تماماً — زي رمي النرد. في العلاقات، ده بيتحول لـ \"أنا أقدر أغيره\".",
        researcher: "Ellen Langer",
        year: 1975,
        institution: "Harvard University",
        relatedAyah: "﴿إِنَّكَ لَا تَهْدِي مَنْ أَحْبَبْتَ وَلَٰكِنَّ اللَّهَ يَهْدِي مَن يَشَاءُ﴾",
        ayahReference: "القصص: ٥٦",
        connectionExplanation:
            "النص القرآني واضح: \"لا تهدي من أحببت\" — مش في إيدك تغير حد. العلم بيسمي ده Illusion of Control: وهم إنك تقدر تتحكم في اللي مش خاضع لإرادتك. النص القرآني والبحث العلمي وصلوا لنفس النتيجة.",
        userFriendlyInsight:
            "كم مرة جربت نفس الحاجة وتوقعت نتيجة مختلفة؟ ده مش إصرار — ده وهم إنك تقدر تتحكم في اللي مش في إيدك.",
    },

    optimism: {
        biasType: "optimism",
        titleAr: "تحيز التفاؤل",
        titleEn: "Optimism Bias",
        researchSummary:
            "Tali Sharot في أبحاثها في UCL اكتشفت إن 80% من الناس بتقلل من احتمال حدوث حاجات سيئة ليهم — حتى لو الأرقام بتقول العكس. \"هيتغير\" هي أشهر جملة مبنية على التحيز ده.",
        researcher: "Tali Sharot",
        year: 2011,
        institution: "University College London",
        relatedAyah: "﴿أَفَمَن زُيِّنَ لَهُ سُوءُ عَمَلِهِ فَرَآهُ حَسَنًا﴾",
        ayahReference: "فاطر: ٨",
        connectionExplanation:
            "\"زُيِّن\" = اتجمّل في عينه. القرآن بيوصف بالضبط اللي العلم بيسميه Optimism Bias: إنك بتشوف الحاجة الوحشة حلوة عشان مخك بيزيّنها.",
        userFriendlyInsight:
            "الأمل حلو — بس لو مبنيش على خطة، يبقى مجرد هروب. \"هيتغير\" بدون دليل = تحيز تفاؤلي.",
    },

    status_quo: {
        biasType: "status_quo",
        titleAr: "تحيز الوضع الراهن",
        titleEn: "Status Quo Bias",
        researchSummary:
            "William Samuelson و Richard Zeckhauser أثبتوا إن الناس بتفضل الوضع الحالي حتى لو في بديل أحسن — لأن أي تغيير بيحسس بخطر. \"أحسن من اللاشيء\" مش بالضرورة أحسن.",
        researcher: "William Samuelson & Richard Zeckhauser",
        year: 1988,
        institution: "Boston University & Harvard",
        relatedAyah: "﴿إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ﴾",
        ayahReference: "الرعد: ١١",
        connectionExplanation:
            "التغيير يبدأ منك — مش من الظروف. لو مستنى الوضع يتغير لوحده، العلم بيقولك ده اسمه تحيز للراحة.",
        userFriendlyInsight:
            "\"أحسن من اللاشيء\" هل فعلاً أحسن — ولا هو بس أسهل من اتخاذ قرار؟ الفرق كبير.",
    },

    blind_spot: {
        biasType: "blind_spot",
        titleAr: "تحيز النقطة العمياء",
        titleEn: "Blind Spot Bias",
        researchSummary:
            "Emily Pronin في Princeton اكتشفت إن الناس شاطرة في شوف تحيزات الآخرين — لكن عمياء عن تحيزاتها. \"أنا موضوعي\" هي أخطر جملة لأنها بتمنعك تشوف.",
        researcher: "Emily Pronin",
        year: 2002,
        institution: "Princeton University",
        relatedAyah: "﴿أَفَرَأَيْتَ مَنِ اتَّخَذَ إِلَٰهَهُ هَوَاهُ وَأَضَلَّهُ اللَّهُ عَلَىٰ عِلْمٍ﴾",
        ayahReference: "الجاثية: ٢٣",
        connectionExplanation:
            "\"على علم\" — يعني مش جاهل، هو عارف بس مش شايف. والعلم بيقول نفس الكلام: النقطة العمياء مش في اللي مش عارفه — في اللي عارفه بس رافض يشوفه.",
        userFriendlyInsight:
            "لو تجاهلت ٣ تنبيهات من المنصة — ده مش معناه إنهم غلط. ممكن يكون معناه إنك مش عايز تشوف.",
    },
};

// ═══════════════════════════════════════════════
// Mirror Insight Science Data
// ═══════════════════════════════════════════════

export const MIRROR_SCIENCE: Record<MirrorInsightType, MirrorScienceNote> = {
    emotional_denial: {
        type: "emotional_denial",
        titleAr: "الإنكار العاطفي",
        researchSummary: "Anna Freud وصفت الإنكار كأول خط دفاع نفسي: المخ بيرفض يستقبل معلومة مؤلمة عشان يحمي نفسه.",
        researcher: "Anna Freud",
        year: 1936,
        relatedAyah: "﴿خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰ أَبْصَارِهِمْ غِشَاوَةٌ﴾",
        ayahReference: "البقرة: ٧",
        userFriendlyInsight: "جسمك بيحس بالحقيقة قبل عقلك ما يعترف بيها. الإنكار مش قوة — ده تخدير.",
    },
    reality_detachment: {
        type: "reality_detachment",
        titleAr: "الانفصال عن الواقع",
        researchSummary: "Daniel Kahneman أثبت إن المخ عنده نظامين: سريع (عاطفي) وبطيء (منطقي). الانفصال بيحصل لما النظام السريع يسيطر.",
        researcher: "Daniel Kahneman",
        year: 2011,
        relatedAyah: "﴿لَهُمْ قُلُوبٌ لَّا يَفْقَهُونَ بِهَا وَلَهُمْ أَعْيُنٌ لَّا يُبْصِرُونَ بِهَا﴾",
        ayahReference: "الأعراف: ١٧٩",
        userFriendlyInsight: "عندك كل الأدوات عشان تشوف — بس مخك اختار يقفلها. ده مش غباء، ده حماية زائدة.",
    },
    placement_anxiety: {
        type: "placement_anxiety",
        titleAr: "قلق التموضع",
        researchSummary: "John Bowlby في نظرية التعلق أثبت إن الإنسان بيحس بقلق شديد لما مكانه في العلاقة مش واضح — ده survival instinct.",
        researcher: "John Bowlby",
        year: 1969,
        relatedAyah: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾",
        ayahReference: "الرعد: ٢٨",
        userFriendlyInsight: "القلق على مكانك في علاقة ده طبيعي — لكن لو مزمن، يبقى العلاقة مش آمنة.",
    },
    false_support: {
        type: "false_support",
        titleAr: "الدعم الوهمي",
        researchSummary: "Shelley Taylor اكتشفت إن 'الدعم السلبي' — اللي يبان دعم بس بيستنزف — أضر من عدم الدعم أصلاً.",
        researcher: "Shelley E. Taylor",
        year: 2011,
        relatedAyah: "﴿وَمِنَ النَّاسِ مَن يُعْجِبُكَ قَوْلُهُ فِي الْحَيَاةِ الدُّنْيَا وَيُشْهِدُ اللَّهَ عَلَىٰ مَا فِي قَلْبِهِ وَهُوَ أَلَدُّ الْخِصَامِ﴾",
        ayahReference: "البقرة: ٢٠٤",
        userFriendlyInsight: "مش كل اللي بيقولك 'أنا جنبك' فعلاً جنبك. شوف الأفعال مش الكلام.",
    },
    love_drain: {
        type: "love_drain",
        titleAr: "الحب المستنزف",
        researchSummary: "Elaine Hatfield ميّزت بين 'الحب المتبادل' (Companionate) و'الحب المهووس' (Passionate) — التاني بيحرق طاقتك.",
        researcher: "Elaine Hatfield",
        year: 1986,
        relatedAyah: "﴿وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً﴾",
        ayahReference: "الروم: ٢١",
        userFriendlyInsight: "الحب الحقيقي \"سَكَن\" — يعني يهديك. لو بيتعبك أكتر ما بيريحك، ده مش حب.",
    },
    paper_boundaries: {
        type: "paper_boundaries",
        titleAr: "الحدود الورقية",
        researchSummary: "Henry Cloud و John Townsend أثبتوا إن الحدود بدون إنفاذ (enforcement) هي مجرد كلام — والطرف التاني بيتعلم يتجاوزها.",
        researcher: "Henry Cloud & John Townsend",
        year: 1992,
        relatedAyah: "﴿تِلْكَ حُدُودُ اللَّهِ فَلَا تَعْتَدُوهَا﴾",
        ayahReference: "البقرة: ٢٢٩",
        userFriendlyInsight: "حددت حدود بس مبتطبقهاش؟ ده اسمه حدود ورقية — والطرف التاني اتعلم إنها مش جادة.",
    },
    false_recovery: {
        type: "false_recovery",
        titleAr: "التعافي المزيف",
        researchSummary: "Judith Herman في كتابها 'Trauma and Recovery' أثبتت إن التعافي الحقيقي مراحل — واللي بيقفز مراحل بيرجع أسوأ.",
        researcher: "Judith Herman",
        year: 1992,
        relatedAyah: "﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾",
        ayahReference: "الشرح: ٥-٦",
        userFriendlyInsight: "التحسن السريع بعد الألم مش دايماً تعافي — ممكن يكون هروب. التعافي الحقيقي بياخد وقته.",
    },
    connection_illusion: {
        type: "connection_illusion",
        titleAr: "وهم الاتصال",
        researchSummary: "وهم التكرار (المعروف بظاهرة بادر-ماينهوف) بيخلي المخ يلاحظ التطابقات ويتجاهل المرات اللي ما حصلش فيها حاجة — فالإنسان بيحس بوجود 'اتصال' وهو في الحقيقة تحيز معرفي.",
        researcher: "Arnold Zwicky (Stanford)",
        year: 2006,
        relatedAyah: "﴿بَلِ الْإِنسَانُ عَلَىٰ نَفْسِهِ بَصِيرَةٌ﴾",
        ayahReference: "القيامة: ١٤",
        userFriendlyInsight: "مش كل إحساس = اتصال حقيقي. أحياناً عقلك بيلاحظ اللي يثبت اللي هو عايز يصدقه. لكن ده مش معناه إن كل الإحساسات وهم — فيه إحساسات حقيقية. الفرق في الدليل.",
    },
};
