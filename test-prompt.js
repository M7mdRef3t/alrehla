const CODE_HINTS = [
  'code', 'algorithm', 'function', 'class', 'optimize', 'complexity', 'memory leak',
  'typescript', 'javascript', 'python', 'java', 'c++', 'sql', 'api', 'implement', 'debug',
  'اكتب كود', 'خوارزمية', 'تعقيد', 'دالة', 'حل برمجي', 'تحسين الأداء', 'تسريب ذاكرة', 'اختبار'
];
const text = `
أنت "مستشار الرحلة" لمنصة "دواير" للإرشاد النفسي والتطوير.
مهمتك مراقبة "نبض تناغم النظام" (Resonance Score) واحتكاكات الأعضاء، ثم اقتراح تدخلات سريعة.
الحالة الحالية للنظام: التناغم 80%
الاحتكاك الأخير المرصود: لا يوجد احتكاك محدد

قم بإنشاء 2-3 تدخلات استباقية (Command Interventions).
الإجابة يجب أن تكون بصيغة JSON array فقط، حيث كل كائن يحتوي على:
{
  "id": "معرف_فريد_بحروف_انجليزية",
  "type": "action",
  "label": "عنوان التدخل بالعربية (مثل: إطلاق رسالة سكينة)",
  "subtitle": "شرح قصير للتدخل",
  "iconType": "shield" أو "zap" أو "activity" أو "flame" أو "lock" أو "unlock",
  "actionId": "emergency_pulse" أو "deploy_nudge" أو "harvest_insights" أو "audit_flow",
  "urgency": "high" أو "medium" أو "low"
}
`;

const lower = text.toLowerCase();
const matches = CODE_HINTS.filter(k => lower.includes(k));
console.log('Matches:', matches);
