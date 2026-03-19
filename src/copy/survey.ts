export const surveyCopy = {
  title: "ساعدنا نفهمك أحسن",
  subtitle: "10 أسئلة سريعة. مجهول تماماً. بتساعدنا نبني أداة تفرق معاك فعلاً.",
  progress: (current: number, total: number) => `${current} من ${total}`,
  submit: "إرسال",
  submitting: "جاري الإرسال...",
  thankYou: "شكراً جداً 🙏",
  thankYouSub: "إجاباتك هتساعدنا نبني حاجة تفرق معاك فعلاً.",
  backToApp: "رجوع للتطبيق",
  required: "الإجابة مطلوبة",
  questions: [
    {
      id: "q1_exhaustion_frequency",
      text: "كام مرة في الأسبوع بتحس بإرهاق من علاقة معينة؟",
      type: "scale" as const,
      scaleMin: 1,
      scaleMax: 7,
      scaleLabels: { min: "نادراً", max: "كل يوم" }
    },
    {
      id: "q2_exhaustion_source",
      text: "إيه أكتر مصدر إرهاق عاطفي في حياتك دلوقتي؟",
      type: "mc" as const,
      options: [
        { value: "family", label: "العيلة" },
        { value: "love", label: "الحب" },
        { value: "work", label: "الشغل" },
        { value: "friends", label: "الأصدقاء" },
        { value: "money", label: "الفلوس" },
        { value: "unknown", label: "مش عارف" }
      ]
    },
    {
      id: "q3_guilt_coping",
      text: "لو حسيت بذنب من حد قريب — إيه أول حاجة بتعملها؟",
      type: "mc" as const,
      options: [
        { value: "silence", label: "بسكت وأستحمل" },
        { value: "overcompensate", label: "بعوّض وأعطي أكتر" },
        { value: "read", label: "بدوّر وأقرأ" },
        { value: "talk", label: "بتكلم مع حد" },
        { value: "nothing", label: "مش بعمل حاجة" }
      ]
    },
    {
      id: "q4_awareness_level",
      text: "كام من 10: قد إيه عندك وعي بمين بيستنزفك؟",
      type: "scale" as const,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: { min: "مش واعي خالص", max: "واعي تماماً" }
    },
    {
      id: "q5_boundary_attempt",
      text: "هل جربت تحط حدود مع حد قريب في آخر شهر؟",
      type: "mc" as const,
      options: [
        { value: "yes_success", label: "أيوا ونجحت" },
        { value: "yes_failed", label: "أيوا وفشلت" },
        { value: "wanted_but_no", label: "لأ بس عايز" },
        { value: "no_need", label: "لأ ومش محتاج" }
      ]
    },
    {
      id: "q6_daily_motivator",
      text: "إيه اللي ممكن يخليك تستخدم أداة زي دي يومياً؟",
      type: "open" as const,
      placeholder: "اكتب اللي في بالك بحرية…"
    },
    {
      id: "q7_app_trust",
      text: "كام من 10: قد إيه تثق إن تطبيق يقدر يساعدك في العلاقات؟",
      type: "scale" as const,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: { min: "مش واثق خالص", max: "واثق جداً" }
    },
    {
      id: "q8_app_hate",
      text: "إيه أكتر حاجة بتكرهها في تطبيقات الصحة النفسية؟",
      type: "mc" as const,
      options: [
        { value: "too_much_text", label: "كلام كتير" },
        { value: "scary_diagnosis", label: "تشخيصات مخيفة" },
        { value: "not_practical", label: "مش عملي" },
        { value: "not_my_language", label: "مش بلغتي" },
        { value: "slow", label: "بطيء" }
      ]
    },
    {
      id: "q9_first_person",
      text: "لو وفّرنالك خريطة بصرية لعلاقاتك — أول شخص هتحطه مين؟",
      type: "open" as const,
      placeholder: "ماما، أخويا، مديري..."
    },
    {
      id: "q10_willingness_to_pay",
      text: "كام تدفع في الشهر لأداة تساعدك تحط حدود صحية؟",
      type: "mc" as const,
      options: [
        { value: "0", label: "مجاناً بس" },
        { value: "25", label: "25 جنيه" },
        { value: "50", label: "50 جنيه" },
        { value: "100", label: "100 جنيه" },
        { value: "200+", label: "200+ جنيه" }
      ]
    }
  ]
};

export type SurveyQuestion = typeof surveyCopy.questions[number];
export type SurveyAnswers = Record<string, string | number>;
