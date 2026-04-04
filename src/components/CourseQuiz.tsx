"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Flag, Trophy, RotateCcw, Clock, BarChart2, Sparkles, CheckCircle, XCircle, Award, Brain } from "lucide-react";
import { fetchQuizQuestions, saveQuizSession, type DBQuizQuestion } from "../services/learningService";

/* ═══════ Types ═══════ */
type Difficulty = "easy" | "medium" | "hard";
type Category = "وعي_ذاتي" | "تعاطف" | "صراع" | "قيادة";

interface Q {
  id: string; text: string; scenario?: string;
  options: string[]; correctIndex: number; explanation: string;
  type: string; difficulty: Difficulty; category: Category;
  heatmap: number[]; // % per option (mock)
}
interface State {
  answers: Record<string, number>;
  confidence: Record<string, 1 | 2 | 3>;
  flagged: string[];
  currentIdx: number;
  timeLeft: number;
}
/* ═══════ Data ═══════ */
const QUESTIONS: Q[] = [
  { id:"q1", text:"ما الفرق الجوهري بين التعاطف والشفقة؟", options:["لا فرق بينهما","التعاطف يُشارك الألم، الشفقة تنظر إليه من بُعد","الشفقة أعمق عاطفياً","التعاطف أضعف في العلاقات"], correctIndex:1, explanation:"التعاطف يضعك في مكان الآخر، الشفقة تجعلك تنظر إليه من فوق.", type:"معرفي", difficulty:"easy", category:"تعاطف", heatmap:[5,72,12,11] },
  { id:"q2", text:"إذا لاحظت أن شريكك يمر بيوم صعب ولكنه لا يتحدث عن ذلك، فما هو التصرف الأكثر تعاطفاً؟", scenario:"سيناريو تحليلي", options:["الاستماع الفعال دون مقاطعة","التجاهل التام حتى يقرر الحديث بنفسه","منح المساحة مع عرض الدعم الصريح","الإلحاح في السؤال لمعرفة التفاصيل"], correctIndex:2, explanation:"منح المساحة مع إعلام الشريك بأنك موجود يُعبّر عن الاحترام والحب معاً.", type:"سيناريو تحليلي", difficulty:"medium", category:"تعاطف", heatmap:[31,15,42,12] },
  { id:"q3", text:"ما الهرمون المرتبط مباشرة بالشعور بالثقة والارتباط الاجتماعي؟", options:["الكورتيزول","الأوكسيتوسين","الأدرينالين","السيروتونين"], correctIndex:1, explanation:"الأوكسيتوسين يُطلَق عند اللمس الإيجابي والاستماع الحقيقي.", type:"معرفي", difficulty:"easy", category:"وعي_ذاتي", heatmap:[8,65,14,13] },
  { id:"q4", text:"وفقاً لنظرية التعلق، أي نمط يُفضي إلى الخوف المستمر من الهجران؟", options:["التعلق الآمن","التعلق التجنبي","التعلق القلق","التعلق المضطرب"], correctIndex:2, explanation:"التعلق القلق يجعل المرء يحتاج تأكيداً دائماً.", type:"معرفي", difficulty:"medium", category:"وعي_ذاتي", heatmap:[10,18,55,17] },
  { id:"q5", text:"ما التقنية الأفضل لتهدئة الجهاز العصبي خلال دقيقتين؟", options:["التنفس 4-7-8","الجري السريع","شرب الماء البارد","العد التنازلي من 100"], correctIndex:0, explanation:"شهيق 4 → احبس 7 → زفير 8 تُهدّئ اللوزة المخية بسرعة.", type:"تطبيقي", difficulty:"easy", category:"وعي_ذاتي", heatmap:[68,10,12,10] },
  { id:"q6", text:"في اجتماع عمل متوتر، زميلك يقاطعك باستمرار. ما ردّ الفعل الأذكى عاطفياً؟", scenario:"سيناريو قيادي", options:["مقاطعته بنفس الأسلوب","الصمت التام احتجاجاً","تسمية الظاهرة بهدوء: «لاحظت أننا نتكلم في نفس الوقت»","رفع شكوى للمدير فوراً"], correctIndex:2, explanation:"تسمية السلوك دون اتهام تفتح باب التعاون وتُوقف الدورة.", type:"سيناريو قيادي", difficulty:"hard", category:"صراع", heatmap:[9,14,61,16] },
  { id:"q7", text:"ما ركيزة الثقة الأساسية طويلة الأمد؟", options:["الكلمات الجميلة","الهدايا","الاتساق في الأفعال","الحضور في المناسبات"], correctIndex:2, explanation:"الثقة تتشكل من الأنماط المتكررة — الاتساق هو العملة الوحيدة.", type:"معرفي", difficulty:"easy", category:"قيادة", heatmap:[6,4,82,8] },
  { id:"q8", text:"اللغة الجسدية المغلقة (ذراعان متقاطعتان، تجنب النظر) تعني في الغالب:", options:["انفتاح تام","تعب جسدي فقط","حالة دفاعية أو انسحاب داخلي","لا يحمل معنى"], correctIndex:2, explanation:"اللغة الجسدية المغلقة تعكس حالة دفاعية حتى دون تعبير لفظي.", type:"تحليلي", difficulty:"easy", category:"تعاطف", heatmap:[3,18,67,12] },
  { id:"q9", text:"صديقك يشاركك قلقاً. أي استجابة تُعبّر عن التعاطف العميق؟", scenario:"سيناريو وجداني", options:["«هذا لا شيء، كل شيء سيتحسن»","«كيف تشعر بالضبط الآن؟»","«أنا مررت بأسوأ منها»","«ركّز على الإيجابيات»"], correctIndex:1, explanation:"السؤال عن المشاعر يمنح الشخص إذناً للتعبير دون حكم.", type:"سيناريو وجداني", difficulty:"medium", category:"تعاطف", heatmap:[12,56,8,24] },
  { id:"q10", text:"ما الفرق بين الحدود الصحية والجدران الدفاعية؟", options:["لا فرق بينهما","الحدود تحمي لكنها لا تُعزل، والجدران تُعزل","الجدران أكثر صحة","الحدود تعني رفض الآخرين"], correctIndex:1, explanation:"الحدود الصحية تسمح بالتواصل الآمن بينما تحمي. الجدران تُعزل كلياً.", type:"معرفي", difficulty:"medium", category:"وعي_ذاتي", heatmap:[7,61,14,18] },
  { id:"q11", text:"فريقك يفشل في مهمة. كيف يتصرف القائد صاحب الذكاء العاطفي؟", scenario:"سيناريو قيادي", options:["يلوم الأعضاء علناً","يتحمل المسؤولية ويحلل الأسباب مع الفريق","يتجاهل الفشل ويمضي","يلوم نفسه بشكل مُدمّر"], correctIndex:1, explanation:"القائد الذكي عاطفياً يتحمل ويتعلم، لا يلوم ولا يتجاهل.", type:"سيناريو قيادي", difficulty:"hard", category:"قيادة", heatmap:[11,58,8,23] },
  { id:"q12", text:"ما «الذكاء العاطفي السلبي» (Dark EQ)؟", options:["غياب المشاعر","استخدام فهم مشاعر الآخرين للتلاعب بهم","الخجل الاجتماعي","العجز العاطفي"], correctIndex:1, explanation:"استخدام مهارة قراءة الآخرين للتلاعب بدل الدعم — ظاهرة موثقة.", type:"معرفي", difficulty:"hard", category:"قيادة", heatmap:[8,54,22,16] },
  { id:"q13", text:"شعرت بغضب شديد في حوار. ما الخطوة الأولى الأذكى؟", options:["التعبير الفوري عن الغضب","مغادرة الموقف مؤقتاً مع إخبار الآخر","الصمت التام إلى الأبد","إنكار الغضب"], correctIndex:1, explanation:"التوقف المؤقت الواعي يمنح القشرة الأمامية وقتاً لإعادة التحكم.", type:"تطبيقي", difficulty:"medium", category:"وعي_ذاتي", heatmap:[22,52,14,12] },
  { id:"q14", text:"موظف في فريقك دائماً متأخر. كيف تخاطبه بذكاء عاطفي؟", scenario:"سيناريو إداري", options:["توبيخه أمام الفريق","تجاهل الأمر","«لاحظت تغيراً في مواعيدك — هل هناك شيء أستطيع دعمك به؟»","إنذار رسمي فوري"], correctIndex:2, explanation:"السؤال المفتوح دون اتهام يفتح باب الحل الحقيقي.", type:"سيناريو إداري", difficulty:"hard", category:"قيادة", heatmap:[14,7,62,17] },
  { id:"q15", text:"ما علاقة «النافذة الزمنية» بالتنظيم العاطفي؟", options:["لا علاقة","نافذة التسامح هي المدى الذي نعمل فيه مثالياً دون إفراط أو تجمّد","تعني الوقت المثالي للنوم","مصطلح تسويقي لا أساس علمي له"], correctIndex:1, explanation:"Window of Tolerance — النطاق الذي تكون فيه متوازناً بين فرط الاستثارة وتجمّدها.", type:"معرفي", difficulty:"hard", category:"وعي_ذاتي", heatmap:[5,62,18,15] },
  { id:"q16", text:"تتجادل مع شخص عنيد. ما أفضل تكتيك عاطفي؟", scenario:"سيناريو صراع", options:["رفع الصوت لإثبات الحق","طرح أسئلة لبناء الفهم المشترك","التخلي عن وجهة نظرك فوراً","تهديده بقطع العلاقة"], correctIndex:1, explanation:"الأسئلة الاستكشافية تُنقل المحادثة من صراع إلى حل.", type:"سيناريو صراع", difficulty:"hard", category:"صراع", heatmap:[16,55,11,18] },
  { id:"q17", text:"ما «التعاطف الانعكاسي» في العلاقات؟", options:["تعاطف مزيف","إعادة صياغة مشاعر الآخر ليشعر بأنه مسموع","التعاطف مع نفسك فقط","التعاطف بعد التفكير الطويل"], correctIndex:1, explanation:"Reflective Empathy — تعكس ما قاله الآخر ليشعر بالفهم الكامل.", type:"معرفي", difficulty:"medium", category:"تعاطف", heatmap:[10,64,16,10] },
  { id:"q18", text:"صديقتك تبكي. أي جملة أقل تعاطفاً؟", options:["«أنا هنا معك»","«يجب أن تتوقفي عن البكاء الآن»","«حدثيني أكثر عن ما تشعرين به»","«هذا الشعور صعب جداً»"], correctIndex:1, explanation:"الأمر بالتوقف عن البكاء يُلغي المشاعر ويُشعر الشخص بالعار.", type:"تطبيقي", difficulty:"easy", category:"تعاطف", heatmap:[4,78,8,10] },
  { id:"q19", text:"ما «التعب من التعاطف» (Compassion Fatigue)؟", options:["الملل من العلاقات","استنزاف عاطفي من التعاطف المتواصل دون تجديد","كراهية الآخرين","حالة سعادة مفرطة"], correctIndex:1, explanation:"مساعدو المهن العاطفية يُصابون بالإرهاق من استنزاف التعاطف المستمر.", type:"معرفي", difficulty:"medium", category:"قيادة", heatmap:[12,60,18,10] },
  { id:"q20", text:"في لحظة خلاف حاد، شريكك قال شيئاً مؤلماً جداً. ما الاستجابة الأكثر نضجاً عاطفياً؟", scenario:"سيناريو وجداني متقدم", options:["الردّ الفوري بنفس الحدة","المغادرة بغضب دون كلام","«ما قلته آلمني — هل يمكننا نتحدث عنه بهدوء لاحقاً؟»","تجاهل الأمر تماماً"], correctIndex:2, explanation:"التعبير عن الألم بوضوح مع طلب وقت للتهدئة — قمة النضج العاطفي.", type:"سيناريو وجداني متقدم", difficulty:"hard", category:"صراع", heatmap:[18,12,55,15] },
];

const PASS_THRESHOLD = 70;
const QUIZ_DURATION = 1200; // 20 min
const LS_KEY = "alrehla_quiz_state";

const glass = (bg = "rgba(255,255,255,0.03)", border = "rgba(255,255,255,0.07)"): React.CSSProperties => ({
  background: bg, border: `1px solid ${border}`, borderRadius: 16, backdropFilter: "blur(12px)",
});

function pad(n: number) { return n.toString().padStart(2, "0"); }
function formatTime(s: number) { return `${pad(Math.floor(s/60))}:${pad(s%60)}`; }

const catLabel: Record<Category, string> = { وعي_ذاتي:"وعي ذاتي", تعاطف:"تعاطف", صراع:"إدارة صراع", قيادة:"قيادة" };
const catColor: Record<Category, string> = { وعي_ذاتي:"#06B6D4", تعاطف:"#A78BFA", صراع:"#F43F5E", قيادة:"#10B981" };
const diffColor: Record<Difficulty, string> = { easy:"#10B981", medium:"#F59E0B", hard:"#F43F5E" };

/* ═══════ Report Card ═══════ */
function ReportCard({ questions, answers, onRetry, onClose, timeTaken, color }: {
  questions: typeof QUESTIONS; answers: Record<string,number>; onRetry:()=>void; onClose:()=>void; timeTaken:number; color:string;
}) {
  const correctCount = questions.filter(q => answers[q.id] === q.correctIndex).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= PASS_THRESHOLD;

  const byCategory = (["وعي_ذاتي","تعاطف","صراع","قيادة"] as Category[]).map(cat => {
    const qs = questions.filter(q => q.category === cat);
    if (!qs.length) return { cat, correct: 0, total: 0, pct: 0 };
    const correct = qs.filter(q => answers[q.id] === q.correctIndex).length;
    return { cat, correct, total: qs.length, pct: Math.round((correct/qs.length)*100) };
  }).filter(c => c.total > 0);

  const strengths = byCategory.filter(c => c.pct >= 70).map(c => catLabel[c.cat]);
  const needs = byCategory.filter(c => c.pct < 70).map(c => catLabel[c.cat]);

  return (
    <div style={{ padding:"20px 20px 40px", overflow:"auto", height:"100%" }}>
      {/* Score hero */}
      <div style={{ textAlign:"center", marginBottom:24, position:"relative" }}>
        <div style={{ position:"absolute", top:-20, left:"50%", transform:"translateX(-50%)", width:280, height:200, borderRadius:"50%", background: passed?"rgba(16,185,129,0.08)":"rgba(244,63,94,0.08)", filter:"blur(50px)", pointerEvents:"none" }} />
        <motion.p initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",damping:10}}
          style={{ fontSize:64, fontWeight:900, color: passed?"#10B981":"#F43F5E", lineHeight:1, margin:"0 0 4px" }}>
          {score}%
        </motion.p>
        <p style={{ fontSize:14, fontWeight:800, color:"#e2e8f0", margin:"0 0 12px" }}>
          {score>=90?"ممتاز 🏆":score>=80?"جيد جداً ⭐":score>=70?"جيد ✅":"يحتاج مراجعة 📚"}
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          {[{l:"صحيح",v:`${correctCount}/${QUESTIONS.length}`,c:"#10B981"},{l:"الوقت",v:formatTime(timeTaken),c:"#06B6D4"},{l:"النجاح",v:`≥${PASS_THRESHOLD}%`,c:"#F59E0B"}].map((s,i)=>(
            <div key={i} style={{...glass(`${s.c}08`,`${s.c}20`), padding:"8px 14px", borderRadius:12}}>
              <p style={{margin:0,fontSize:13,fontWeight:900,color:s.c}}>{s.v}</p>
              <p style={{margin:"1px 0 0",fontSize:8,color:"#475569"}}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ ...glass("rgba(255,255,255,0.02)","rgba(255,255,255,0.07)"), padding:16, borderRadius:16, marginBottom:14 }}>
        <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:900, color:"#94a3b8", display:"flex", alignItems:"center", gap:6 }}>
          <BarChart2 size={13}/> تقرير الأداء بالمجالات
        </p>
        {byCategory.map(({cat,correct,total,pct})=>(
          <div key={cat} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:10, color:"#94a3b8" }}>{catLabel[cat]}</span>
              <span style={{ fontSize:10, fontWeight:700, color: pct>=70?catColor[cat]:"#F43F5E" }}>{correct}/{total} ({pct}%)</span>
            </div>
            <div style={{ height:5, borderRadius:3, background:"rgba(255,255,255,0.07)" }}>
              <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8}}
                style={{ height:5, borderRadius:3, background:pct>=70?catColor[cat]:"#F43F5E" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & needs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {strengths.length>0&&(
          <div style={{...glass("rgba(16,185,129,0.06)","rgba(16,185,129,0.2)"),padding:12,borderRadius:14}}>
            <p style={{margin:"0 0 6px",fontSize:9,fontWeight:900,color:"#10B981"}}>💪 نقاط قوتك</p>
            {strengths.map((s,i)=><p key={i} style={{margin:"2px 0",fontSize:9,color:"#6EE7B7"}}>• {s}</p>)}
          </div>
        )}
        {needs.length>0&&(
          <div style={{...glass("rgba(245,158,11,0.06)","rgba(245,158,11,0.2)"),padding:12,borderRadius:14}}>
            <p style={{margin:"0 0 6px",fontSize:9,fontWeight:900,color:"#F59E0B"}}>📚 يحتاج مراجعة</p>
            {needs.map((s,i)=><p key={i} style={{margin:"2px 0",fontSize:9,color:"#FCD34D"}}>• {s}</p>)}
          </div>
        )}
      </div>

      {/* Certificate */}
      {passed&&(
        <div style={{...glass("rgba(245,158,11,0.06)","rgba(245,158,11,0.25)"),padding:"12px 16px",borderRadius:14,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <Award size={20} color="#F59E0B"/>
          <div>
            <p style={{margin:0,fontSize:11,fontWeight:900,color:"#F59E0B"}}>شهادة الإتمام 🎓</p>
            <p style={{margin:"1px 0 0",fontSize:9,color:"#92400E"}}>جاهزة للتحميل والمشاركة</p>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8}}>
        <button onClick={onRetry} style={{flex:1,padding:14,borderRadius:14,border:"none",cursor:"pointer",background:"rgba(255,255,255,0.06)",fontSize:12,fontWeight:900,color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <RotateCcw size={13}/> إعادة المحاولة
        </button>
        <button onClick={onClose} style={{flex:2,padding:14,borderRadius:14,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${color},#8B5CF6)`,fontSize:13,fontWeight:900,color:"#fff"}}>
          {passed?"🎓 العودة للدورة":"إغلاق"}
        </button>
      </div>
    </div>
  );
}

/* ═══════ Main ═══════ */
interface Props { isOpen:boolean; onClose:()=>void; courseId?:string; courseTitle?:string; color?:string; onPassed?:(score:number)=>void; }

export function CourseQuiz({ isOpen, onClose, courseId, courseTitle="إتقان الذكاء العاطفي", color="#06B6D4", onPassed }: Props) {
  // Load questions from Supabase; fall back to QUESTIONS mock
  const [dbQuestions, setDbQuestions] = useState<DBQuizQuestion[] | null>(null);
  useEffect(() => {
    if (!isOpen || !courseId) return;
    fetchQuizQuestions(courseId).then(qs => {
      if (qs.length > 0) setDbQuestions(qs);
    }).catch(console.error);
  }, [isOpen, courseId]);

  // Merge: use DB questions if available, else QUESTIONS mock
  const ACTIVE_QUESTIONS = dbQuestions
    ? dbQuestions.map(q => ({
        id: q.id,
        text: q.question,
        scenario: undefined as string | undefined,
        options: q.options,
        correctIndex: q.correct_index,
        explanation: q.explanation ?? "",
        type: q.category,
        difficulty: q.difficulty,
        category: (q.category as Category) in catLabel ? (q.category as Category) : "تعاطف" as Category,
        heatmap: [25, 25, 25, 25] as number[], // neutral while no real heatmap
      }))
    : QUESTIONS;
  const [phase, setPhase] = useState<"intro"|"quiz"|"result">("intro");
  const [answers, setAnswers] = useState<Record<string,number>>({});
  const [confidence, setConfidence] = useState<Record<string,1|2|3>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [timeTaken, setTimeTaken] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check(); window.addEventListener("resize",check); return ()=>window.removeEventListener("resize",check);
  },[]);

  // Adaptive difficulty: use harder questions if score > 60% in last 5
  const adaptedQuestions = (() => {
    const answered = Object.keys(answers);
    if (answered.length < 5) return ACTIVE_QUESTIONS;
    const last5 = answered.slice(-5);
    const correctLast5 = last5.filter(id => {
      const q = ACTIVE_QUESTIONS.find(q=>q.id===id);
      return q && answers[id]===q.correctIndex;
    }).length;
    if (correctLast5 >= 4) return [...ACTIVE_QUESTIONS].sort((a,b) => (b.difficulty==="hard"?1:0)-(a.difficulty==="hard"?1:0));
    if (correctLast5 <= 1) return [...ACTIVE_QUESTIONS].sort((a,b) => (a.difficulty==="easy"?-1:0)-(b.difficulty==="easy"?-1:0));
    return ACTIVE_QUESTIONS;
  })();

  const q = adaptedQuestions[currentIdx];
  const answered = answers[q?.id];
  const isCorrect = answered === q?.correctIndex;

  const startQuiz = () => {
    // Try to resume
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const s: State = JSON.parse(saved);
        setAnswers(s.answers); setConfidence(s.confidence);
        setFlagged(new Set(s.flagged)); setCurrentIdx(s.currentIdx);
        setTimeLeft(s.timeLeft);
      }
    } catch { /* fresh start */ }
    setPhase("quiz");
  };

  useEffect(()=>{
    if(phase==="quiz"){
      timerRef.current = setInterval(()=>{
        setTimeLeft(t=>{
          if(t<=1){ clearInterval(timerRef.current!); finishQuiz(); return 0; }
          return t-1;
        });
        setTimeTaken(p=>p+1);
      },1000);
    } else { if(timerRef.current) clearInterval(timerRef.current); }
    return ()=>{ if(timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase]);

  // Save progress
  useEffect(()=>{
    if(phase==="quiz"){
      const s: State = { answers, confidence, flagged:[...flagged], currentIdx, timeLeft };
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { return; }
    }
  },[answers,confidence,flagged,currentIdx,timeLeft,phase]);

  const finishQuiz = useCallback(()=>{
    const correct = ACTIVE_QUESTIONS.filter(q=>answers[q.id]===q.correctIndex).length;
    const score = Math.round((correct/ACTIVE_QUESTIONS.length)*100);
    if(score>=PASS_THRESHOLD) onPassed?.(score);
    // Persist to Supabase
    if (courseId) {
      saveQuizSession({
        courseId,
        answers,
        confidence: Object.fromEntries(Object.entries(confidence).map(([k,v])=>[k,Number(v)])),
        score,
        total: ACTIVE_QUESTIONS.length,
        passed: score >= PASS_THRESHOLD,
      }).catch(console.error);
    }
    setPhase("result");
    try { localStorage.removeItem(LS_KEY); } catch { return; }
  },[answers, confidence, onPassed, courseId, ACTIVE_QUESTIONS]);

  const handleSelect = (idx:number)=>{
    if(answered!==undefined) return;
    setAnswers(prev=>({...prev,[q.id]:idx}));
    setShowExplanation(true); setShowHeatmap(false);
  };

  const handleNext = ()=>{
    if(currentIdx<adaptedQuestions.length-1){ setCurrentIdx(i=>i+1); setShowExplanation(false); setShowHeatmap(false); }
    else finishQuiz();
  };

  const handlePrev = ()=>{ if(currentIdx>0){ setCurrentIdx(i=>i-1); setShowExplanation(false); setShowHeatmap(false); } };
  const toggleFlag = ()=>{ setFlagged(prev=>{ const n=new Set(prev); if (n.has(q.id)) { n.delete(q.id); } else { n.add(q.id); } return n; }); };

  const handleReset = ()=>{
    setPhase("intro"); setAnswers({}); setConfidence({}); setFlagged(new Set());
    setCurrentIdx(0); setTimeLeft(QUIZ_DURATION); setTimeTaken(0); setShowExplanation(false);
  };

  const handleClose = ()=>{ handleReset(); onClose(); };
  const answeredCount = Object.keys(answers).length;
  const progress = (currentIdx/ACTIVE_QUESTIONS.length)*100;

  /* ── Sidebar ── */
  const Sidebar = ()=>(
    <div style={{ width:isDesktop?200:"100%", flexShrink:0, display:"flex", flexDirection:"column", borderLeft: isDesktop?"1px solid rgba(255,255,255,0.06)":undefined, padding:"12px 10px", gap:8, overflowY:"auto" }}>
      <p style={{ margin:"0 0 4px", fontSize:9, fontWeight:900, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em" }}>سجل الإجابات</p>
      <p style={{ margin:"0 0 6px", fontSize:8, color:"#334155" }}>مستوى تقدمك في الاختبار</p>
      {[
        { label:"السؤال الحالي", value: currentIdx+1, color },
        { label:"الأسئلة المجابة", value: answeredCount, color:"#10B981" },
        { label:"محددة للمراجعة", value: flagged.size, color:"#F59E0B" },
        { label:"الأسئلة المتبقية", value: ACTIVE_QUESTIONS.length-answeredCount, color:"#475569" },
      ].map((item,i)=>(
        <div key={i} style={{...glass(`${item.color}06`,`${item.color}18`), padding:"8px 10px", borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontSize:9,color:"#64748B"}}>{item.label}</span>
          <span style={{fontSize:14,fontWeight:900,color:item.color}}>{item.value}</span>
        </div>
      ))}

      {/* Mini grid */}
      <div style={{ marginTop:4 }}>
        <p style={{ margin:"0 0 4px", fontSize:8, color:"#334155" }}>انقر للانتقال</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:3 }}>
          {ACTIVE_QUESTIONS.map((question,i)=>{
            const a = answers[question.id];
            const isAns = a!==undefined;
            const isFlag = flagged.has(question.id);
            const isCur = i===currentIdx;
            const correct = isAns && a===question.correctIndex;
            const bg = isCur ? color : isAns ? (correct?"#10B981":"#F43F5E") : isFlag?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.06)";
            return (
              <button key={i} onClick={()=>{setCurrentIdx(i);setShowExplanation(isAns);setSidebarOpen(false);}} style={{
                width:"100%", aspectRatio:"1", borderRadius:6, border:`1px solid ${isCur?color:"transparent"}`,
                background: bg, cursor:"pointer", fontSize:8, fontWeight:700,
                color: isAns||isCur?"#fff":"#475569", display:"flex", alignItems:"center", justifyContent:"center",
              }}>{i+1}</button>
            );
          })}
        </div>
      </div>

      {/* Category legend */}
      <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:3 }}>
        {(["وعي_ذاتي","تعاطف","صراع","قيادة"] as Category[]).map(cat=>(
          <div key={cat} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:2, background:catColor[cat] }}/>
            <span style={{ fontSize:7, color:"#334155" }}>{catLabel[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen&&(
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={handleClose}
            style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,backdropFilter:"blur(6px)" }} />
          <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
            transition={{type:"spring",damping:30,stiffness:280}} dir="rtl"
            style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:201,height:"97dvh",borderRadius:"24px 24px 0 0",
              background:"#07091a",border:"1px solid rgba(255,255,255,0.08)",borderBottom:"none",
              display:"flex",flexDirection:"column",overflow:"hidden" }}>

            {/* Handle */}
            <div style={{display:"flex",justifyContent:"center",paddingTop:10,flexShrink:0}}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.1)"}}/>
            </div>

            {/* Top bar */}
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 16px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0 }}>
              <button onClick={handleClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:8,cursor:"pointer",color:"#94a3b8"}}>
                <X size={16}/>
              </button>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:9,color:"#475569",fontWeight:700,letterSpacing:"0.08em"}}>الاختبار النهائي</p>
                <p style={{margin:"1px 0 0",fontSize:12,fontWeight:800,color:"#e2e8f0"}}>{courseTitle}</p>
              </div>
              {phase==="quiz"&&(
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {!isDesktop&&(
                    <button onClick={()=>setSidebarOpen(v=>!v)} style={{...glass("rgba(255,255,255,0.04)","rgba(255,255,255,0.08)"),padding:"5px 10px",borderRadius:10,cursor:"pointer",border:"none",fontSize:9,color:"#94a3b8"}}>
                      سجل الإجابات
                    </button>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:4,...glass(`${timeLeft<120?"#F43F5E":color}08`,`${timeLeft<120?"#F43F5E":color}25`),padding:"5px 10px",borderRadius:10}}>
                    <Clock size={11} color={timeLeft<120?"#F43F5E":color}/>
                    <span style={{fontSize:11,fontWeight:900,color:timeLeft<120?"#F43F5E":color,fontVariantNumeric:"tabular-nums"}}>{formatTime(timeLeft)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{flex:1,overflow:"hidden",position:"relative",display:"flex"}}>
              <AnimatePresence mode="wait">
                {/* ── INTRO ── */}
                {phase==="intro"&&(
                  <motion.div key="intro" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    style={{flex:1,overflowY:"auto",padding:"28px 20px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:16}}>
                    <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:`${color}08`,filter:"blur(50px)",pointerEvents:"none"}}/>
                    <div style={{width:80,height:80,borderRadius:24,background:`${color}15`,border:`2px solid ${color}25`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Brain size={36} color={color}/>
                    </div>
                    <div>
                      <h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:900,color:"#f1f5f9"}}>الاختبار النهائي الشامل</h2>
                      <p style={{margin:0,fontSize:12,color:"#94a3b8",lineHeight:1.8}}>{QUESTIONS.length} سؤال يقيس إتقانك للذكاء العاطفي</p>
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
                      {[{icon:<Clock size={13} color={color}/>,l:`${QUIZ_DURATION/60} دقيقة`},{icon:<CheckCircle size={13} color="#10B981"/>,l:`${QUESTIONS.length} سؤال`},{icon:<BarChart2 size={13} color="#A78BFA"/>,l:"4 مجالات"},{icon:<Trophy size={13} color="#F59E0B"/>,l:`نجاح ≥${PASS_THRESHOLD}%`}].map((item,i)=>(
                        <div key={i} style={{...glass("rgba(255,255,255,0.03)","rgba(255,255,255,0.08)"),padding:"8px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:6}}>
                          {item.icon}<span style={{fontSize:10,color:"#94a3b8",fontWeight:700}}>{item.l}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{...glass("rgba(167,139,250,0.06)","rgba(167,139,250,0.2)"),padding:"12px 16px",borderRadius:14,maxWidth:320}}>
                      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <Sparkles size={13} color="#A78BFA" style={{flexShrink:0,marginTop:2}}/>
                        <p style={{margin:0,fontSize:10,color:"#94a3b8",lineHeight:1.8}}>
                          الاختبار يتكيّف مع مستواك، ويشمل سيناريوهات واقعية، وشروحات لكل إجابة، وتقرير أداء مفصّل في النهاية.
                        </p>
                      </div>
                    </div>
                    {localStorage.getItem(LS_KEY)&&(
                      <p style={{fontSize:9,color:color,fontWeight:700}}>✓ يوجد تقدم محفوظ — سيتابع الاختبار من حيث توقفت</p>
                    )}
                    <button onClick={startQuiz} style={{padding:"14px 48px",borderRadius:16,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${color},#8B5CF6)`,fontSize:14,fontWeight:900,color:"#fff",boxShadow:`0 8px 32px ${color}30`}}>
                      ابدأ الاختبار
                    </button>
                  </motion.div>
                )}

                {/* ── QUIZ ── */}
                {phase==="quiz"&&(
                  <motion.div key="quiz" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    style={{flex:1,display:"flex",height:"100%",overflow:"hidden"}}>
                    {/* Sidebar — desktop always visible, mobile overlay */}
                    {(isDesktop||sidebarOpen)&&(
                      <motion.div initial={isDesktop?false:{x:200}} animate={{x:0}} exit={{x:200}}
                        style={{ position: isDesktop?"relative":"absolute", right:0, top:0, bottom:0, zIndex:10,
                          background:"#07091a", borderLeft:"1px solid rgba(255,255,255,0.06)", width: isDesktop?200:220,
                          display:"flex", flexDirection:"column", overflowY:"auto" }}>
                        <Sidebar/>
                      </motion.div>
                    )}

                    {/* Main quiz area */}
                    <div style={{flex:1,overflowY:"auto",padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:14}}>
                      {/* Progress */}
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontSize:9,color:"#475569"}}>سؤال {currentIdx+1} من {QUESTIONS.length}</span>
                          <span style={{fontSize:9,fontWeight:700,color}}>{Math.round(progress)}%</span>
                        </div>
                        <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)"}}>
                          <motion.div animate={{width:`${progress}%`}} transition={{duration:0.4}}
                            style={{height:4,borderRadius:2,background:`linear-gradient(90deg,${color},#8B5CF6)`}}/>
                        </div>
                      </div>

                      {/* Question card */}
                      <AnimatePresence mode="wait">
                        <motion.div key={q.id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:16}}>
                          {/* Tags */}
                          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                            <span style={{fontSize:8,fontWeight:900,color:color,background:`${color}15`,border:`1px solid ${color}25`,padding:"2px 8px",borderRadius:6}}>
                              {q.type}
                            </span>
                            <span style={{fontSize:8,fontWeight:900,color:catColor[q.category],background:`${catColor[q.category]}12`,padding:"2px 8px",borderRadius:6}}>
                              {catLabel[q.category]}
                            </span>
                            <span style={{fontSize:8,fontWeight:900,color:diffColor[q.difficulty],background:`${diffColor[q.difficulty]}12`,padding:"2px 8px",borderRadius:6}}>
                              {q.difficulty==="easy"?"سهل":q.difficulty==="medium"?"متوسط":"صعب"}
                            </span>
                          </div>

                          {/* Scenario */}
                          {q.scenario&&(
                            <div style={{...glass("rgba(255,255,255,0.02)","rgba(255,255,255,0.06)"),padding:"10px 12px",borderRadius:12,marginBottom:10}}>
                              <p style={{margin:"0 0 3px",fontSize:8,fontWeight:900,color:"#475569",textTransform:"uppercase"}}>سيناريو</p>
                              <p style={{margin:0,fontSize:10,color:"#64748B",lineHeight:1.7}}>{q.scenario}</p>
                            </div>
                          )}

                          {/* Question text */}
                          <div style={{...glass("rgba(255,255,255,0.03)","rgba(255,255,255,0.08)"),padding:"16px",borderRadius:16,marginBottom:12}}>
                            <p style={{margin:0,fontSize:14,fontWeight:800,color:"#f1f5f9",lineHeight:1.7}}>{q.text}</p>
                          </div>

                          {/* Options — 2×2 grid */}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {q.options.map((opt,i)=>{
                              const isSelected = answered===i;
                              const isCorrectOpt = i===q.correctIndex;
                              const showResult = answered!==undefined;
                              let bg="rgba(255,255,255,0.03)", border="rgba(255,255,255,0.08)", textC="#94a3b8";
                              if(showResult){
                                if(isCorrectOpt){bg="rgba(16,185,129,0.1)";border="rgba(16,185,129,0.35)";textC="#6EE7B7";}
                                else if(isSelected){bg="rgba(244,63,94,0.1)";border="rgba(244,63,94,0.35)";textC="#FDA4AF";}
                              } else if(isSelected){bg=`${color}12`;border=`${color}35`;textC="#e2e8f0";}
                              return (
                                <motion.button key={i} whileTap={{scale:0.97}} onClick={()=>handleSelect(i)}
                                  disabled={answered!==undefined}
                                  style={{padding:"12px 12px",borderRadius:14,cursor:answered!==undefined?"default":"pointer",
                                    background:bg,border:`1px solid ${border}`,textAlign:"right",transition:"all 0.25s",
                                    display:"flex",flexDirection:"column",gap:6}}>
                                  <div style={{width:22,height:22,borderRadius:"50%",
                                    background:showResult?isCorrectOpt?"rgba(16,185,129,0.2)":isSelected?"rgba(244,63,94,0.2)":"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)",
                                    border:`1px solid ${showResult?isCorrectOpt?"rgba(16,185,129,0.5)":isSelected?"rgba(244,63,94,0.5)":"rgba(255,255,255,0.1)":"rgba(255,255,255,0.12)"}`,
                                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:textC}}>
                                    {showResult?isCorrectOpt?<CheckCircle size={11} color="#10B981"/>:isSelected?<XCircle size={11} color="#F43F5E"/>:String.fromCharCode(65+i):String.fromCharCode(65+i)}
                                  </div>
                                  <span style={{fontSize:11,fontWeight:600,color:textC,lineHeight:1.5}}>{opt}</span>
                                  {/* Heatmap */}
                                  {showResult&&showHeatmap&&(
                                    <div style={{width:"100%"}}>
                                      <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.05)",marginBottom:2}}>
                                        <div style={{height:3,borderRadius:2,width:`${q.heatmap[i]}%`,background:isCorrectOpt?"#10B981":"rgba(255,255,255,0.15)",transition:"width 0.5s"}}/>
                                      </div>
                                      <span style={{fontSize:7,color:"#334155"}}>{q.heatmap[i]}% اختاروا هذا</span>
                                    </div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Post-answer actions */}
                          {answered!==undefined&&(
                            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                              {/* Explanation */}
                              {showExplanation&&(
                                <div style={{...glass(isCorrect?"rgba(16,185,129,0.07)":"rgba(244,63,94,0.07)",isCorrect?"rgba(16,185,129,0.2)":"rgba(244,63,94,0.2)"),padding:"12px 14px",borderRadius:14}}>
                                  <p style={{margin:"0 0 4px",fontSize:9,fontWeight:900,color:isCorrect?"#10B981":"#F43F5E"}}>{isCorrect?"✅ إجابة صحيحة!":"❌ إجابة خاطئة"}</p>
                                  <p style={{margin:0,fontSize:11,color:"#94a3b8",lineHeight:1.8}}>💡 {q.explanation}</p>
                                </div>
                              )}
                              {/* Confidence */}
                              {!confidence[q.id]&&(
                                <div style={{...glass("rgba(167,139,250,0.06)","rgba(167,139,250,0.15)"),padding:"10px 12px",borderRadius:12}}>
                                  <p style={{margin:"0 0 6px",fontSize:9,fontWeight:800,color:"#A78BFA"}}>🎯 كم أنت واثق من إجابتك؟</p>
                                  <div style={{display:"flex",gap:6}}>
                                    {([["1","غير متأكد","#F43F5E"],["2","متأكد نسبياً","#F59E0B"],["3","واثق تماماً","#10B981"]] as const).map(([v,l,c])=>(
                                      <button key={v} onClick={()=>setConfidence(prev=>({...prev,[q.id]:Number(v) as 1|2|3}))}
                                        style={{flex:1,padding:"6px 4px",borderRadius:10,border:`1px solid ${c}30`,cursor:"pointer",background:`${c}08`,fontSize:8,fontWeight:900,color:c}}>
                                        {v} — {l}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Heatmap toggle */}
                              <button onClick={()=>setShowHeatmap(v=>!v)} style={{background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:9,color:"#475569",display:"flex",alignItems:"center",gap:4}}>
                                <BarChart2 size={11}/> {showHeatmap?"إخفاء":"عرض"} توزيع إجابات المتعلمين الآخرين
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* ── RESULT ── */}
                {phase==="result"&&(
                  <motion.div key="result" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{flex:1,overflow:"hidden"}}>
                    <ReportCard questions={ACTIVE_QUESTIONS} answers={answers} onRetry={handleReset} onClose={onClose} timeTaken={timeTaken} color={color}/>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom nav (quiz phase only) */}
            {phase==="quiz"&&(
              <div style={{ position:"absolute",bottom:0,left:0,right:0, display:"flex",alignItems:"center",gap:8,padding:"10px 16px",
                background:"rgba(7,9,26,0.95)",backdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={handlePrev} disabled={currentIdx===0}
                  style={{padding:"10px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",cursor:currentIdx===0?"not-allowed":"pointer",background:"rgba(255,255,255,0.04)",color:currentIdx===0?"#334155":"#94a3b8",display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,opacity:currentIdx===0?0.4:1}}>
                  <ChevronRight size={14}/> السابق
                </button>
                <button onClick={toggleFlag}
                  style={{padding:"10px 14px",borderRadius:12,cursor:"pointer",border:`1px solid ${flagged.has(q?.id)?"rgba(245,158,11,0.35)":"rgba(255,255,255,0.08)"}`,
                    background:flagged.has(q?.id)?"rgba(245,158,11,0.12)":"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",gap:4,fontSize:9,fontWeight:900,color:flagged.has(q?.id)?"#F59E0B":"#475569"}}>
                  <Flag size={11}/> {flagged.has(q?.id)?"مُعلَّم":"للمراجعة"}
                </button>
                <div style={{flex:1,textAlign:"center"}}>
                  <span style={{fontSize:8,color:"#334155"}}>{answeredCount}/{ACTIVE_QUESTIONS.length} مجاب</span>
                </div>
                {currentIdx===ACTIVE_QUESTIONS.length-1
                  ? <button onClick={()=>finishQuiz()} style={{padding:"10px 20px",borderRadius:12,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${color},#8B5CF6)`,color:"#fff",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",gap:5}}>
                      <Trophy size={13}/> النتيجة
                    </button>
                  : <button onClick={handleNext}
                      style={{padding:"10px 16px",borderRadius:12,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${color},#8B5CF6)`,color:"#fff",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",gap:5}}>
                      التالي <ChevronLeft size={14}/>
                    </button>
                }
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
