import type { RecoveryPlan } from "../types/recoveryPlan";

export const recoveryPlans: Record<"green" | "yellow" | "red", RecoveryPlan> = {
  green: {
    ring: "green",
    duration: 30,
    weeks: [
      {
        week: 1,
        title: "الحفاظ على الصحة",
        description: "العلاقة صحية، لكن خليك واعي",
        steps: [
          { id: "g1-1", text: "استمر في التواصل المنتظم والصحي", completed: false },
          { id: "g1-2", text: "عبّر عن امتنانك للشخص ده", completed: false },
          { id: "g1-3", text: "اكتب 3 حاجات إيجابية عن العلاقة دي", completed: false }
        ]
      },
      {
        week: 2,
        title: "تعميق الثقة",
        description: "ابني على الأساس الصحي",
        steps: [
          { id: "g2-1", text: "شارك حاجة شخصية جديدة", completed: false },
          { id: "g2-2", text: "اطلب رأيه/رأيها في قرار مهم", completed: false },
          { id: "g2-3", text: "اعملوا نشاط مشترك ممتع", completed: false }
        ]
      },
      {
        week: 3,
        title: "الوقاية",
        description: "حط حدود وقائية خفيفة",
        steps: [
          { id: "g3-1", text: "وضّح وقتك الخاص (مثلاً: يوم للراحة)", completed: false },
          { id: "g3-2", text: "قول 'لا' لحاجة صغيرة بشكل ودي", completed: false },
          { id: "g3-3", text: "تأكد إن العلاقة متوازنة (عطاء وأخذ)", completed: false }
        ]
      },
      {
        week: 4,
        title: "التقييم",
        description: "تأكد إن كل حاجة ماشية صح",
        steps: [
          { id: "g4-1", text: "اعمل إعادة تقييم للعلاقة", completed: false },
          { id: "g4-2", text: "اسأل نفسك: هل لسه حاسس بالراحة؟", completed: false },
          { id: "g4-3", text: "احتفل بالعلاقة الصحية دي!", completed: false }
        ]
      }
    ]
  },
  yellow: {
    ring: "yellow",
    duration: 30,
    weeks: [
      {
        week: 1,
        title: "التقييم والمراقبة",
        description: "راقب الأنماط السلبية",
        steps: [
          { id: "y1-1", text: "سجّل المواقف اللي بتحسسك بعدم الراحة", completed: false },
          { id: "y1-2", text: "حدد الأوقات اللي بتحس فيها بضغط", completed: false },
          { id: "y1-3", text: "اكتب 3 حدود محتاج تحطها", completed: false }
        ]
      },
      {
        week: 2,
        title: "وضع الحدود الأولية",
        description: "ابدأ تقول 'لا' بوضوح",
        steps: [
          { id: "y2-1", text: "اختار جملة ثابتة للرفض: 'مش هقدر دلوقتي'", completed: false },
          { id: "y2-2", text: "ارفض طلب صغير من غير تبرير كتير", completed: false },
          { id: "y2-3", text: "لو حسيت بذنب، اكتب ليه ده حقك", completed: false }
        ]
      },
      {
        week: 3,
        title: "تقوية الحدود",
        description: "ثبّت على موقفك",
        steps: [
          { id: "y3-1", text: "قلل التواصل: من يومي لـ يوم ويوم", completed: false },
          { id: "y3-2", text: "متردش على المكالمات فوراً (استنى ساعة)", completed: false },
          { id: "y3-3", text: "لو ضغط عليك، قول: 'محتاج/محتاجة وقت أفكر'", completed: false }
        ]
      },
      {
        week: 4,
        title: "إعادة التقييم",
        description: "شوف التحسن",
        steps: [
          { id: "y4-1", text: "اعمل التحليل تاني", completed: false },
          { id: "y4-2", text: "لو التعامل بقى أسهل، استمر", completed: false },
          { id: "y4-3", text: "لو لسه صعب، فكر في مساعدة متخصصة", completed: false }
        ]
      }
    ]
  },
  red: {
    ring: "red",
    duration: 30,
    weeks: [
      {
        week: 1,
        title: "الإدراك والاعتراف",
        description: "اعترف إن العلاقة دي مضرة",
        steps: [
          { id: "r1-1", text: "اكتب كل الأذى اللي حصلك من العلاقة دي", completed: false },
          { id: "r1-2", text: "اقرا الكلام ده بصوت عالي لنفسك", completed: false },
          { id: "r1-3", text: "قول لنفسك: 'أنا مستحق/مستحقة أحسن من كده'", completed: false }
        ]
      },
      {
        week: 2,
        title: "التقليل التدريجي",
        description: "ابدأ تبعد بهدوء",
        steps: [
          { id: "r2-1", text: "قلل المكالمات: من يومي لـ مرة كل يومين", completed: false },
          { id: "r2-2", text: "متبادرش بالكلام - استنى يبدأ/تبدأ هو/هي", completed: false },
          { id: "r2-3", text: "خلي ردودك مختصرة ومحايدة", completed: false }
        ]
      },
      {
        week: 3,
        title: "بناء البديل",
        description: "املا الفراغ بحاجات صحية",
        steps: [
          { id: "r3-1", text: "ابدأ نشاط جديد (رياضة، قراءة، هواية)", completed: false },
          { id: "r3-2", text: "اتكلم مع صديق/صديقة تانية كل يوم", completed: false },
          { id: "r3-3", text: "انضم لمجموعة أو كوميونيتي جديدة", completed: false }
        ]
      },
      {
        week: 4,
        title: "القرار النهائي",
        description: "حدد المسار المستقبلي",
        steps: [
          { id: "r4-1", text: "اعمل التحليل تاني - شوف هل في تحسن؟", completed: false },
          { id: "r4-2", text: "قرر: قطع كامل أو حدود صارمة جداً؟", completed: false },
          { id: "r4-3", text: "لو محتاج، اطلب مساعدة متخصصة (ثيرابيست)", completed: false }
        ]
      }
    ]
  }
};
