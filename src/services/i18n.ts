/**
 * i18n Service — نظام تعدد اللغات
 * ===================================
 * دعم العربية والإنجليزية مع قابلية التوسع لأي لغة.
 * بدون مكتبات خارجية — خفيف وسريع.
 */

const LANG_KEY = "dawayir-language";

export type Language = "ar" | "en" | "fr";

export interface Translations {
    // Navigation
    nav_dashboard: string;
    nav_map: string;
    nav_chat: string;
    nav_tools: string;

    // Dashboard
    dashboard_title: string;
    dashboard_subtitle: string;
    dashboard_status: string;
    dashboard_quick_exit: string;
    dashboard_share: string;
    dashboard_streak_days: string;
    dashboard_streak_at_risk: string;
    dashboard_open_map: string;
    dashboard_field_stats: string;

    // Quick Path
    quick_path_title: string;
    quick_path_subtitle: string;
    quick_path_choose: string;
    quick_path_context_label: string;
    quick_path_context_placeholder: string;
    quick_path_generate: string;
    quick_path_generating: string;
    quick_path_exit_phrase: string;
    quick_path_breathe: string;
    quick_path_next_step: string;
    quick_path_thanks: string;

    // Situations
    situation_pressure: string;
    situation_guilt: string;
    situation_anger: string;
    situation_overwhelmed: string;
    situation_boundary: string;
    situation_escape: string;

    // Emotional Compass
    compass_title: string;
    compass_subtitle: string;
    compass_skip: string;
    state_drained: string;
    state_anxious: string;
    state_angry: string;
    state_curious: string;
    state_calm: string;
    state_motivated: string;

    // Paywall
    paywall_ai_limit_title: string;
    paywall_ai_limit_desc: string;
    paywall_map_limit_title: string;
    paywall_map_limit_desc: string;
    paywall_upgrade_cta: string;
    paywall_continue_free: string;

    // Subscription
    tier_free: string;
    tier_commander: string;
    tier_general: string;

    // Referral
    referral_title: string;
    referral_subtitle: string;
    referral_my_code: string;
    referral_copy: string;
    referral_copied: string;
    referral_share: string;
    referral_count: string;
    referral_weeks: string;

    // Map
    map_safe_zone: string;
    map_caution_zone: string;
    map_danger_zone: string;
    map_empty: string;
    map_add_person: string;

    // AI Chat
    chat_placeholder: string;
    chat_send: string;
    chat_thinking: string;

    // General
    general_close: string;
    general_back: string;
    general_save: string;
    general_cancel: string;
    general_loading: string;
    general_error: string;
    general_success: string;
}

const AR: Translations = {
    nav_dashboard: "غرفة العمليات",
    nav_map: "الخريطة",
    nav_chat: "جارفيس",
    nav_tools: "الأدوات",

    dashboard_title: "غرفة العمليات المركزية",
    dashboard_subtitle: "حالة النظام: مستقر 🟢",
    dashboard_status: "مستقر",
    dashboard_quick_exit: "جملة خروج فورية",
    dashboard_share: "شارك",
    dashboard_streak_days: "يوم",
    dashboard_streak_at_risk: "الـ Streak في خطر! سجّل دخولك اليوم",
    dashboard_open_map: "فتح الخريطة الاستراتيجية",
    dashboard_field_stats: "إحصائيات الميدان",

    quick_path_title: "مسار سريع",
    quick_path_subtitle: "جملة خروج فورية",
    quick_path_choose: "إيه اللي بيحصل دلوقتي؟",
    quick_path_context_label: "في تفاصيل تساعدني أكون أدق؟",
    quick_path_context_placeholder: "مثلاً: ماما بتطلب مني حاجة مش قادر أرفضها...",
    quick_path_generate: "اعطني الجملة",
    quick_path_generating: "جارفيس بيحلل...",
    quick_path_exit_phrase: "جملة الخروج",
    quick_path_breathe: "تنفس",
    quick_path_next_step: "خطوة تالية (اختياري)",
    quick_path_thanks: "تمام، شكراً جارفيس 🫡",

    situation_pressure: "ضغط من شخص",
    situation_guilt: "إحساس بالذنب",
    situation_anger: "غضب",
    situation_overwhelmed: "إرهاق",
    situation_boundary: "محتاج أقول لأ",
    situation_escape: "محتاج أخرج",

    compass_title: "إيه إحساسك دلوقتي؟",
    compass_subtitle: "سؤال واحد بس — عشان جارفيس يكون معاك صح",
    compass_skip: "تخطّي",
    state_drained: "مستنزف",
    state_anxious: "قلقان",
    state_angry: "متضايق",
    state_curious: "فضولي",
    state_calm: "هادئ",
    state_motivated: "متحمس",

    paywall_ai_limit_title: "وصلت لحد رسائل اليوم",
    paywall_ai_limit_desc: "المستخدم المجاني يحصل على 5 رسائل يومياً. ارقَ للقائد وتحدث بلا حدود.",
    paywall_map_limit_title: "الخريطة وصلت للحد المجاني",
    paywall_map_limit_desc: "يمكنك إضافة 3 أشخاص مجاناً. ارقَ للقائد وأضف من تشاء.",
    paywall_upgrade_cta: "ارقَ للقائد الآن",
    paywall_continue_free: "استمر مجاناً (مع الحدود)",

    tier_free: "مجاني",
    tier_commander: "قائد 🎖️",
    tier_general: "جنرال 👑",

    referral_title: "ادعُ قائداً",
    referral_subtitle: "أسبوع بريميوم مجاني لكل إحالة",
    referral_my_code: "كودك الشخصي",
    referral_copy: "نسخ",
    referral_copied: "تم!",
    referral_share: "شارك الدعوة",
    referral_count: "إحالة ناجحة",
    referral_weeks: "أسبوع مكتسب",

    map_safe_zone: "دائرة الأمان",
    map_caution_zone: "دائرة الحذر",
    map_danger_zone: "دائرة الخطر",
    map_empty: "الرادار فاضي! ابدأ استطلاع محيطك.",
    map_add_person: "أضف شخص",

    chat_placeholder: "اكتب سؤالك هنا...",
    chat_send: "إرسال",
    chat_thinking: "جارفيس بيفكر...",

    general_close: "إغلاق",
    general_back: "رجوع",
    general_save: "حفظ",
    general_cancel: "إلغاء",
    general_loading: "جاري التحميل...",
    general_error: "حدث خطأ",
    general_success: "تم بنجاح",
};

const EN: Translations = {
    nav_dashboard: "Command Center",
    nav_map: "Map",
    nav_chat: "Jarvis",
    nav_tools: "Tools",

    dashboard_title: "Central Command",
    dashboard_subtitle: "System Status: Stable 🟢",
    dashboard_status: "Stable",
    dashboard_quick_exit: "Quick Exit Phrase",
    dashboard_share: "Share",
    dashboard_streak_days: "days",
    dashboard_streak_at_risk: "Streak at risk! Log in today to keep it.",
    dashboard_open_map: "Open Strategic Map",
    dashboard_field_stats: "Field Stats",

    quick_path_title: "Quick Path",
    quick_path_subtitle: "Instant Exit Phrase",
    quick_path_choose: "What's happening right now?",
    quick_path_context_label: "Any details to help me be more precise?",
    quick_path_context_placeholder: "e.g. My mom is asking me to do something I can't refuse...",
    quick_path_generate: "Give me the phrase",
    quick_path_generating: "Jarvis analyzing...",
    quick_path_exit_phrase: "Exit Phrase",
    quick_path_breathe: "Breathe",
    quick_path_next_step: "Next step (optional)",
    quick_path_thanks: "Got it, thanks Jarvis 🫡",

    situation_pressure: "Pressure from someone",
    situation_guilt: "Feeling guilty",
    situation_anger: "Anger",
    situation_overwhelmed: "Overwhelmed",
    situation_boundary: "Need to say no",
    situation_escape: "Need to leave",

    compass_title: "How are you feeling right now?",
    compass_subtitle: "One question — so Jarvis can be there for you right",
    compass_skip: "Skip",
    state_drained: "Drained",
    state_anxious: "Anxious",
    state_angry: "Upset",
    state_curious: "Curious",
    state_calm: "Calm",
    state_motivated: "Motivated",

    paywall_ai_limit_title: "Daily message limit reached",
    paywall_ai_limit_desc: "Free users get 5 messages per day with Jarvis. Upgrade to Commander for unlimited.",
    paywall_map_limit_title: "Free map limit reached",
    paywall_map_limit_desc: "Free users can add 3 people to their map. Upgrade to Commander for unlimited.",
    paywall_upgrade_cta: "Upgrade to Commander",
    paywall_continue_free: "Continue free (with limits)",

    tier_free: "Free",
    tier_commander: "Commander 🎖️",
    tier_general: "General 👑",

    referral_title: "Invite a Commander",
    referral_subtitle: "Earn a free premium week per referral",
    referral_my_code: "Your personal code",
    referral_copy: "Copy",
    referral_copied: "Copied!",
    referral_share: "Share invite",
    referral_count: "successful referral",
    referral_weeks: "week earned",

    map_safe_zone: "Safe Zone",
    map_caution_zone: "Caution Zone",
    map_danger_zone: "Danger Zone",
    map_empty: "Radar is empty! Start mapping your surroundings.",
    map_add_person: "Add person",

    chat_placeholder: "Type your question here...",
    chat_send: "Send",
    chat_thinking: "Jarvis is thinking...",

    general_close: "Close",
    general_back: "Back",
    general_save: "Save",
    general_cancel: "Cancel",
    general_loading: "Loading...",
    general_error: "An error occurred",
    general_success: "Done!",
};

const FR: Translations = {
    nav_dashboard: "Centre de Commandement",
    nav_map: "Carte",
    nav_chat: "Jarvis",
    nav_tools: "Outils",
    dashboard_title: "Commandement Central",
    dashboard_subtitle: "Statut du système: Stable 🟢",
    dashboard_status: "Stable",
    dashboard_quick_exit: "Phrase de sortie rapide",
    dashboard_share: "Partager",
    dashboard_streak_days: "jours",
    dashboard_streak_at_risk: "Série en péril ! Connectez-vous aujourd'hui.",
    dashboard_open_map: "Ouvrir la carte stratégique",
    dashboard_field_stats: "Stats de terrain",
    quick_path_title: "Chemin Rapide",
    quick_path_subtitle: "Phrase de sortie instantanée",
    quick_path_choose: "Que se passe-t-il en ce moment ?",
    quick_path_context_label: "Des détails pour m'aider ?",
    quick_path_context_placeholder: "ex: Ma mère me demande quelque chose...",
    quick_path_generate: "Donnez-moi la phrase",
    quick_path_generating: "Jarvis analyse...",
    quick_path_exit_phrase: "Phrase de sortie",
    quick_path_breathe: "Respirer",
    quick_path_next_step: "Prochaine étape (optionnel)",
    quick_path_thanks: "Compris, merci Jarvis 🫡",
    situation_pressure: "Pression de quelqu'un",
    situation_guilt: "Sentiment de culpabilité",
    situation_anger: "Colère",
    situation_overwhelmed: "Submergé",
    situation_boundary: "Besoin de dire non",
    situation_escape: "Besoin de partir",
    compass_title: "Comment vous sentez-vous ?",
    compass_subtitle: "Une question pour Jarvis",
    compass_skip: "Passer",
    state_drained: "Épuisé",
    state_anxious: "Anxieux",
    state_angry: "Fâché",
    state_curious: "Curieux",
    state_calm: "Calme",
    state_motivated: "Motivé",
    paywall_ai_limit_title: "Limite de messages atteinte",
    paywall_ai_limit_desc: "Les utilisateurs gratuits ont 5 messages. Passez à Commandant.",
    paywall_map_limit_title: "Limite de carte atteinte",
    paywall_map_limit_desc: "Passez à Commandant pour ajouter plus de personnes.",
    paywall_upgrade_cta: "Passer à Commandant",
    paywall_continue_free: "Continuer gratuitement",
    tier_free: "Gratuit",
    tier_commander: "Commandant 🎖️",
    tier_general: "Général 👑",
    referral_title: "Inviter un Commandant",
    referral_subtitle: "Gagnez une semaine premium par parrainage",
    referral_my_code: "Votre code personnel",
    referral_copy: "Copier",
    referral_copied: "Copié !",
    referral_share: "Partager l'invitation",
    referral_count: "parrainage réussi",
    referral_weeks: "semaine gagnée",
    map_safe_zone: "Zone de sécurité",
    map_caution_zone: "Zone de prudence",
    map_danger_zone: "Zone de danger",
    map_empty: "Le radar est vide !",
    map_add_person: "Ajouter une personne",
    chat_placeholder: "Tapez votre question ici...",
    chat_send: "Envoyer",
    chat_thinking: "Jarvis réfléchit...",
    general_close: "Fermer",
    general_back: "Retour",
    general_save: "Sauvegarder",
    general_cancel: "Annuler",
    general_loading: "Chargement...",
    general_error: "Une erreur est survenue",
    general_success: "Terminé !",
};

const TRANSLATIONS: Record<Language, Translations> = { ar: AR, en: EN, fr: FR };

/* ── Language state ── */
let currentLanguage: Language = "ar";

export function initLanguage(): void {
    try {
        const saved = localStorage.getItem(LANG_KEY) as Language | null;
        if (saved && (saved === "ar" || saved === "en" || saved === "fr")) {
            currentLanguage = saved;
        }
    } catch { /* noop */ }
}

export function setLanguage(lang: Language): void {
    currentLanguage = lang;
    try {
        localStorage.setItem(LANG_KEY, lang);
    } catch { /* noop */ }
    // Update document direction
    try {
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    } catch { /* noop */ }
}

export function getLanguage(): Language {
    return currentLanguage;
}

export function t(key: keyof Translations): string {
    return TRANSLATIONS[currentLanguage][key] ?? TRANSLATIONS.ar[key] ?? key;
}

export function isRTL(): boolean {
    return currentLanguage === "ar";
}

export const LANGUAGE_OPTIONS: Array<{ code: Language; label: string; flag: string }> = [
    { code: "ar", label: "العربية", flag: "🇪🇬" },
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
];
