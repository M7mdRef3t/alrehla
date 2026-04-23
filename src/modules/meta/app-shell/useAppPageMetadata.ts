import { useEffect, useRef } from "react";
import type { AppScreen } from "@/navigation/navigationMachine";
import { trackPageView } from "@/services/analytics";
import { trackingService } from "@/domains/journey";
import { getDocumentOrNull } from "@/services/clientRuntime";
import { getOrigin, getPathname } from "@/services/navigation";

const PAGE_NAMES: Record<AppScreen, string> = {
  landing: "Landing",
  goal: "Choose Goal",
  map: "Relationship Map",
  guided: "Guided Journey",
  mission: "Mission Screen",
  tools: "Journey Tools",
  settings: "Settings",
  enterprise: "Enterprise Portal",
  "guilt-court": "Guilt Court",
  diplomacy: "Diplomatic Cables",
  "oracle-dashboard": "Oracle Council",
  armory: "Armory",
  survey: "Research Survey",
  "exit-scripts": "Exit Scripts",
  grounding: "Grounding Toolkit",
  stories: "Success Stories",
  about: "About",
  insights: "Insights",
  quizzes: "Quizzes",
  "behavioral-analysis": "Behavioral Analysis",
  resources: "Resources",
  profile: "Profile",
  sanctuary: "Sanctuary",
  "life-os": "Life OS",
  dawayir: "Dawayir Map",
  maraya: "Maraya Digital Twin",
  "session-intake": "Session Intake",
  "session-console": "SessionOS Console",
  atmosfera: "Atmosfera Experience",
  masarat: "Masarat Paths",
  baseera: "Baseera Dashboard",
  watheeqa: "Watheeqa Journal",
  mizan: "Mizan Progress",
  rifaq: "Rifaq Buddies",
  murshid: "Murshid Guide",
  taqrir: "Taqrir Report",
  bawsala: "Bawsala Compass",
  riwaya: "Riwaya Timeline",
  nadhir: "Nadhir Shield",
  wird: "Wird Rituals",
  markaz: "Markaz Command",
  sada: "Sada Nudges",
  hafiz: "Hafiz Vault",
  mirah: "Mirah Mirror",
  sijil: "Sijil Chronicle",
  naba: "Naba Inspiration",
  mithaq: "Mithaq Contract",
  sullam: "Sullam Growth",
  bathra: "Bathra Seeds",
  observatory: "Observatory",
  wasiyya: "Wasiyya Letters",
  khalwa: "Khalwa Focus",
  "ecosystem-hub": "Ecosystem Hub",
  tazkiya: "Tazkiya Purification",
  jisr: "Jisr Repair",
  risala: "Risala Messages",
  shahada: "Shahada Certificates",
  warsha: "Warsha Challenges",
  kanz: "Kanz Wisdom Bank",
  qalb: "Qalb Heart Health",
  athar: "Athar Impact Log",
  rafiq: "Rafiq Journey Companion",
  protocol: "Action Protocol",
  diagnosis: "Diagnosis OS",
  niyya: "Niyya Daily Intention",
  samt: "Samt Mindful Breathing",
  jathr: "Jathr Core Values",
  kharita: "Kharita Ecosystem Map",
  ruya: "Ruya Dream Journal",
  raya: "Raya Vision Board",
  yawmiyyat: "Yawmiyyat Daily Journal",
  qinaa: "Qinaa Mask Detection",
  nabd: "Nabd Pulse Check",
  raseed: "Raseed Capital Counter",
  dawra: "Dawra Cycle Tracker",
  zill: "Zill Shadow Work",
  sila: "Sila Relationship Tracker",
  basma: "Basma Identity Fingerprint",
  qutb: "Qutb North Star",
};

const SEO_BY_SCREEN: Record<AppScreen, { title: string; description: string }> = {
  landing: { title: "Alrehla", description: "Understand your relationships and boundaries." },
  goal: { title: "Choose Your Goal | Alrehla", description: "Choose the relationship goal you want to work on." },
  map: { title: "Relationship Map | Alrehla", description: "Visualize your relationship circles and boundaries." },
  guided: { title: "Guided Journey | Alrehla", description: "Follow a structured journey with practical steps." },
  mission: { title: "Mission Screen | Alrehla", description: "Complete mission steps and track progress." },
  tools: { title: "Journey Tools | Alrehla", description: "Access focused tools that help you take action." },
  settings: { title: "Settings | Alrehla", description: "Manage app settings and account-related options." },
  enterprise: { title: "Enterprise Portal | Alrehla", description: "B2B dashboard and organizational analytics." },
  "guilt-court": { title: "Guilt Court | Alrehla", description: "Dismantle irrational guilt through analysis." },
  diplomacy: { title: "Diplomatic Cables | Alrehla", description: "Message templates for strategic communication." },
  "oracle-dashboard": { title: "Oracle Council | Alrehla", description: "Review system anomalies and admin configs." },
  armory: { title: "Armory | Alrehla", description: "Advanced cognitive and psychological protocols." },
  survey: { title: "Research Survey | Alrehla", description: "Help us understand your needs through a quick survey." },
  "exit-scripts": { title: "Exit Scripts | Alrehla", description: "Ready-made exit phrases for hard situations." },
  grounding: { title: "Grounding Toolkit | Alrehla", description: "Body-first calming techniques to regulate." },
  stories: { title: "Stories | Alrehla", description: "Real stories of change and growth." },
  about: { title: "About | Alrehla", description: "Learn about the platform and its approach." },
  insights: { title: "Insights | Alrehla", description: "A holistic view of your relationship health." },
  quizzes: { title: "Quizzes | Alrehla", description: "Discover your patterns through interactive quizzes." },
  "behavioral-analysis": { title: "Behavioral Analysis | Alrehla", description: "Detect recurring behavioral patterns." },
  resources: { title: "Resources | Alrehla", description: "Videos, stories, and exercises to learn and practice." },
  profile: { title: "Profile | Alrehla", description: "Review your progress, achievements, and personal bio." },
  sanctuary: { title: "Sanctuary | Alrehla", description: "A private space for reflection and restoration." },
  "life-os": { title: "Life OS | Alrehla", description: "Your unified operating system for self-growth and decisions." },
  dawayir: { title: "خريطة الدوائر | Alrehla", description: "Visualize your relationship circles and social intelligence." },
  maraya: { title: "مرايا — التوأم الرقمي | Alrehla", description: "Explore your digital twin and uncover hidden patterns." },
  "session-intake": { title: "جلسة خاصة | Alrehla", description: "Request a private coaching or therapy session." },
  "session-console": { title: "لوحة تحكم الكوتش | Alrehla", description: "SessionOS Coach Console — manage intake, AI Pre-Brief, and sessions." },
  atmosfera: { title: "أجواء الرحلة | Alrehla", description: "Experience your emotional atmosphere — live, reactive, and personal." },
  masarat: { title: "مسارات | Alrehla", description: "اكتشف مسارك في علاقاتك — حدود، تعافٍ، ونمو." },
  baseera: { title: "بصيرة — الوعي الذاتي | Alrehla", description: "لوحة بصيرة — اعرف نفسك من خلال بياناتك الحقيقية." },
  watheeqa: { title: "وثيقة — سجّل رحلتك | Alrehla", description: "وثّق رحلتك يومياً — كلمة كلمة — واكتشف أنماطك." },
  mizan: { title: "ميزان — قياس التقدم | Alrehla", description: "شوف تقدمك الحقيقي — طاقة، علاقات، واستمرارية في رحلة واحدة." },
  rifaq: { title: "رفاق — رفاق الطريق | Alrehla", description: "لست وحدك في الرحلة — اكتشف رفاق بنفس الهدف وتحدّوا معاً." },
  murshid: { title: "مرشد — الذكاء الموجّه | Alrehla", description: "ذكاء يقرأ رحلتك — ينبّهك، يوجّهك، يحتفل معاك." },
  taqrir: { title: "تقرير — بياناتك في صفحة | Alrehla", description: "تقرير ذكي يجمع كل بياناتك — شاركه مع الكوتش أو احتفظ به." },
  bawsala: { title: "بوصلة — بوصلة القرارات | Alrehla", description: "كل قرار صعب عنده بوصلة — حلّل، قيّم، واختار." },
  riwaya: { title: "رواية — قصة رحلتك | Alrehla", description: "رحلتك كقصة — من البداية لهنا — بكل قمة ووادي." },
  nadhir: { title: "نذير — نظام الإنذار المبكر | Alrehla", description: "الدرع الأخير — تنفس، تأريض، وخطة أمان شخصية." },
  wird: { title: "وِرد — الطقوس اليومية | Alrehla", description: "كل يوم طقس — والطقس يبني العادة — صباح + مساء + أفعال صغيرة." },
  markaz: { title: "مركز — غرفة القيادة | Alrehla", description: "كل منتجاتك في نظرة واحدة — حالة المنظومة + إجراءات فورية." },
  sada: { title: "صدى — التنبيهات الذكية | Alrehla", description: "المنصة تتكلم معاك — تنبيهات مبنية على بياناتك الحقيقية." },
  hafiz: { title: "حافظ — خزنة الذكريات | Alrehla", description: "أهم لحظاتك محفوظة وقابلة للاسترجاع — مجموعات وبحث وذكريات مميّزة." },
  mirah: { title: "مرآة — الوعي الذاتي | Alrehla", description: "شوف نفسك بعيون البيانات — خريطة شخصية + رؤى + نمو + تأمّل." },
  sijil: { title: "سِجل — السجل المفتوح | Alrehla", description: "كل حركة في المنصة موثّقة — timeline + heatmap + اتجاهات + تفاعل." },
  naba: { title: "نبع — إلهام يومي | Alrehla", description: "كل يوم رشفة إلهام جديدة — اقتباسات + أسئلة + تحديات + حكم + تمارين." },
  mithaq: { title: "ميثاق — عقد مع النفس | Alrehla", description: "التزم بوعد — وراقب نفسك. check-in يومي + تقدم + تأمل ختامي." },
  sullam: { title: "سُلّم — سلالم النمو | Alrehla", description: "حطّ أهداف صغيرة — واصعد درجة درجة. تقدم بصري + ميلستونات + إنجازات." },
  bathra: { title: "بذرة — بذور العادات الصغيرة | Alrehla", description: "ازرع عادة صغيرة — واسقِها كل يوم. شاهدها تنمو من بذرة إلى شجرة في 21 يوم." },
  observatory: { title: "المرصد — الخريطة السلوكية | Alrehla", description: "اكتشف الأنماط الخفية بين مجالات نموك — خريطة سلوكية بصرية لرحلتك." },
  wasiyya: { title: "وصية — رسائل مختومة للمستقبل | Alrehla", description: "اكتب رسالة لنفسك المستقبلية — اختمها وانتظر اللحظة." },
  khalwa: { title: "خلوة — وضع التركيز العميق | Alrehla", description: "ادخل عزلة واعية — حدد نيتك، انغمس، واخرج بوضوح." },
  "ecosystem-hub": { title: "مركز القيادة — كل أدواتك في نظرة | Alrehla", description: "لوحة موحدة لـ 27 منتج في منظومة الرحلة." },
  tazkiya: { title: "تزكية — تطهير يومي للقلب | Alrehla", description: "اعترف بما يثقلك، سامح، واترك — دورة تطهير عاطفي في دقيقتين." },
  jisr: { title: "جسر — إصلاح العلاقات | Alrehla", description: "حدّد الكسر، عبّر بصدق، وابنِ جسراً بخطوة واحدة." },
  risala: { title: "رسالة — كلمات بين مسافرين | Alrehla", description: "أرسل تشجيع لمسافر مجهول، استقبل رسالة، أو التقط زجاجة من البحر." },
  shahada: { title: "شهادة — إنجازات رحلتك | Alrehla", description: "شهادات بصرية تؤرخ إنجازاتك في رحلة النمو الشخصي." },
  warsha: { title: "ورشة — تحديات 7 أيام | Alrehla", description: "اختر تحدي مصغر، أنجز مهمة كل يوم لمدة 7 أيام، واكسب بادج إتمام." },
  kanz: { title: "كنز — بنك حكمتك الشخصي | Alrehla", description: "اجمع دروسك، اقتباساتك، ولحظاتك المهمة في مكان واحد." },
  qalb: { title: "قلب — صحة قلبك العاطفي | Alrehla", description: "مؤشر موحّد يقيس صحة قلبك عبر 9 أبعاد من أدوات الرحلة." },
  athar: { title: "أثر — سجل حياتك في الرحلة | Alrehla", description: "كل فعل في رحلتك يـُكتب هنا تلقائياً ليصبح قصة حياتك." },
  rafiq: { title: "رفيق — مرافقك الذكي | Alrehla", description: "يقرأ رحلتك ويقترح الخطوة التالية دائماً." },
  protocol: { title: "Action Protocol | Alrehla", description: "Your active transformation protocol." },
  diagnosis: { title: "Diagnosis | Alrehla", description: "Understand your relationship diagnosis." },
  niyya: { title: "نية — نيتك اليومية | Alrehla", description: "حدّد نية واحدة واضحة لكل يوم — واعِش بوعي." },
  samt: { title: "صمت — تنفس واعي | Alrehla", description: "تنفس عميق بأنماط مختلفة — هدوء في دقائق." },
  jathr: { title: "جذر — قيمك الجذرية | Alrehla", description: "اكتشف وتتبع قيمك الأساسية — وعِش بتوافق." },
  kharita: { title: "خريطة — خريطة المنظومة | Alrehla", description: "نظرة بصرية شاملة لكل أدوات رحلتك." },
  ruya: { title: "رؤيا — سجّل أحلامك | Alrehla", description: "سجّل أحلامك وفسّرها — رسائل من لاوعيك." },
  raya: { title: "راية — رؤيتك طويلة المدى | Alrehla", description: "حدّد أهدافك لـ 90 يوم وتتبّع محطات الرحلة." },
  yawmiyyat: { title: "يوميّات — سجّل يومك | Alrehla", description: "سجّل لحظاتك، مزاجك، ودروسك — كل يوم قصة." },
  qinaa: { title: "قناع — اكشف أقنعتك | Alrehla", description: "اعرف الفجوة بين ذاتك الحقيقية وأقنعتك في كل سياق." },
  nabd: { title: "نبض — فحص مزاجك وطاقتك | Alrehla", description: "5 ثواني فقط — سجّل نبضك اليومي." },
  raseed: { title: "رصيد — رأس مالك النفسي | Alrehla", description: "6 أبعاد لرأس مالك النفسي — كل فعل واعي يضيف لرصيدك." },
  dawra: { title: "دورة — إيقاعاتك الشخصية | Alrehla", description: "اكتشف أنماطك المتكررة في الطاقة والمزاج والإنتاجية." },
  zill: { title: "ظل — واجه ظلالك | Alrehla", description: "استكشف الجوانب المخفية — shadow work للنمو الحقيقي." },
  sila: { title: "صلة — جودة علاقاتك | Alrehla", description: "تتبع جودة التواصل مع أهم أشخاص حياتك." },
  basma: { title: "بصمة — هويتك الفريدة | Alrehla", description: "حمضك النفسي — سماتك وقيمك وبيانات هويتك." },
  qutb: { title: "قطب — نجمك القطبي | Alrehla", description: "الهدف الأعلى الذي يوجّه كل شيء في حياتك." },
};

export function useAppPageMetadata(screen: AppScreen) {
  const screenFlowTrackInitializedRef = useRef(false);

  useEffect(() => {
    if (!screenFlowTrackInitializedRef.current) {
      screenFlowTrackInitializedRef.current = true;
      return;
    }

    if (screen === "goal") trackingService.recordFlow("screen_goal_viewed");
    if (screen === "map") trackingService.recordFlow("screen_map_viewed");
    if (screen === "guided") trackingService.recordFlow("screen_guided_viewed");
    if (screen === "mission") trackingService.recordFlow("screen_mission_viewed");
    if (screen === "tools") trackingService.recordFlow("screen_tools_viewed");
    if (screen === "diplomacy") trackingService.recordFlow("screen_diplomacy_viewed");
    if (screen === "guilt-court") trackingService.recordFlow("screen_guilt_court_viewed");
    if (screen === "enterprise") trackingService.recordFlow("screen_enterprise_viewed");
    if (screen === "settings") trackingService.recordFlow("screen_settings_viewed");
    if (screen === "oracle-dashboard") trackingService.recordFlow("screen_oracle_dashboard_viewed");
    if (screen === "armory") trackingService.recordFlow("screen_armory_viewed");
    if (screen === "exit-scripts") trackingService.recordFlow("screen_exit_scripts_viewed");
    if (screen === "grounding") trackingService.recordFlow("screen_grounding_viewed");
  }, [screen]);

  useEffect(() => {
    trackPageView(PAGE_NAMES[screen]);
  }, [screen]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const seo = SEO_BY_SCREEN[screen];
    const documentRef = getDocumentOrNull();
    if (!documentRef) return;

    documentRef.title = seo.title;

    const descriptionTag = documentRef.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute("content", seo.description);

    const setMeta = (selector: string, value: string) => {
      const tag = documentRef.querySelector(selector);
      if (tag) tag.setAttribute("content", value);
    };

    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);

    const canonical = documentRef.querySelector('link[rel="canonical"]');
    if (canonical) {
      const href = `${getOrigin()}${getPathname()}`;
      canonical.setAttribute("href", href);
      setMeta('meta[property="og:url"]', href);
    }

    const robotsTag = documentRef.querySelector('meta[name="robots"]');
    if (robotsTag) {
      const path = getPathname().toLowerCase();
      const isPrivatePath = path.startsWith("/admin") || path.startsWith("/analytics");
      robotsTag.setAttribute(
        "content",
        isPrivatePath
          ? "noindex,nofollow,noarchive"
          : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      );
    }
  }, [screen]);
}
