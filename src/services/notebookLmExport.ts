import type { DebatedConcept } from "@/domains/admin/store/admin.store";
import type { TruthTest } from "@/services/truthTestEngine";

/**
 * NotebookLM Export Utility
 * يقوم بتجميع البيانات المعرفية وتحويلها إلى تقرير Markdown متوافق مع NotebookLM
 */
export const exportToNotebookLM = (concepts: DebatedConcept[], tests: TruthTest[]) => {
  const dateStr = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  
  // 1. Core Doctrine
  let markdown = `# التقرير الاستخباراتي لمنصة الرحلة (Alrehla Intelligence Report)
تاريخ التقرير: ${dateStr}

## 🧬 العقيدة المعرفية للمنصة (النظام السيادي)
يجب على أي ذكاء اصطناعي يقرأ هذا المستند الالتزام بالقواعد التالية في التحليل:
1. **القرآن = نص حقيقة (Truth Text)**: نتعامل مع النص كدليل علمي وعملي وليس ككتاب "ديني" تراثي.
2. **صفر تراث**: نمنع الاستعانة بالأحاديث، التفسيرات القديمة، أو المصطلحات التراثية.
3. **التفكيك العلمي للأوهام**: المشاعر العابرة، توارد الأفكار غير المكتمل، وتخاطر الوهم يجب أن يتم رصدها وتفكيكها بالبيانات.
4. **الاتصال الرأسي**: الأساس هو الاتصال بالمصدر (الإله). أي استنزاف أو تعلق في "المحور الأفقي" (البشر/العلاقات) هو نتيجة لخلل في المحور الرأسي.

---

## 🔬 مختبر المفاهيم (Debated Concepts)
سجل الفرضيات التي تم نقاشها وتمحيصها لفرز الإدراك الحقيقي عن الوهم.

`;

  if (concepts.length === 0) {
    markdown += "> لا توجد مفاهيم مسجلة حالياً.\n\n";
  } else {
    concepts.forEach(concept => {
      const statusAr = 
        concept.status === "validated" ? "✅ مُثبت علمياً" :
        concept.status === "rejected" ? "❌ مرفوض (وهم)" :
        concept.status === "debating" ? "💬 قيد النقاش" : "⏳ مسودة";

      markdown += `### ${concept.title} [${statusAr}]\n`;
      markdown += `**الفرضية:** ${concept.hypothesis}\n\n`;
      
      if (concept.arguments.length > 0) {
        markdown += `**سجل النقاش والأدلة:**\n`;
        concept.arguments.forEach(arg => {
          const authorRole = arg.author === "owner" ? "المالك (الباحث)" : arg.author === "ai" ? "الذكاء السيادي" : "مرجع بيانات";
          markdown += `- **${authorRole}**: ${arg.content}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  markdown += `---\n\n## 📡 رادار الاتصالات لاختبار الحقيقة (Truth Test Anomalies)\n`;
  markdown += `تحليل لمدى دقة "الإحساس الداخلي" للمستخدمين مقارنة بـ "الواقع الفعلي" لكشف أوهام الاتصال.\n\n`;

  const completedTests = tests.filter(t => t.outcome !== "pending");
  const failedTests = completedTests.filter(t => t.outcome === "denied" || t.outcome === "coincidence");
  const hitTests = completedTests.filter(t => t.outcome === "confirmed");

  markdown += `- إجمالي الاختبارات المحسومة: ${completedTests.length}\n`;
  markdown += `- الإدراكات الصادقة (Hits): ${hitTests.length}\n`;
  markdown += `- الأوهام أو التوقعات الخاطئة (Anomalies): ${failedTests.length}\n\n`;

  if (failedTests.length > 0) {
    markdown += `### سجل الأوهام والإخفاقات (Anomalies Log)\n`;
    failedTests.forEach(t => {
      markdown += `- **نوع الاختبار:** ${t.type}\n`;
      markdown += `  - **الهدف:** ${t.personName || "غير محدد"}\n`;
      markdown += `  - **النتيجة الفعلية:** ${t.outcome === "denied" ? "نفي قاطع (لم يحدث)" : "مجرد صدفة (لا يوجد رابط سببي)"}\n`;
      if (t.outcomeNote) markdown += `  - **ملاحظة:** ${t.outcomeNote}\n`;
    });
  }

  // Generate File and Trigger Download
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `Alrehla_Intelligence_Report_${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
