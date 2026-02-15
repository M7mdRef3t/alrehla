import type { MapNode } from "../modules/map/mapTypes";
import { downloadBlobFile } from "./clientDom";
import { getDocumentOrNull } from "./clientRuntime";

let html2canvasLoader: Promise<typeof import("html2canvas")> | null = null;
let jsPdfLoader: Promise<typeof import("jspdf")> | null = null;

async function loadHtml2Canvas() {
  if (!html2canvasLoader) {
    html2canvasLoader = import("html2canvas");
  }
  const module = await html2canvasLoader;
  return module.default;
}

async function loadJsPdf() {
  if (!jsPdfLoader) {
    jsPdfLoader = import("jspdf");
  }
  const module = await jsPdfLoader;
  return module.default;
}

/**
 * تصدير الخريطة كصورة PNG
 */
export async function exportMapAsImage(elementId = "map-canvas"): Promise<Blob | null> {
  try {
    const html2canvas = await loadHtml2Canvas();
    const documentRef = getDocumentOrNull();
    if (!documentRef) throw new Error("DOM unavailable");
    const element = documentRef.getElementById(elementId);
    if (!element) {
      throw new Error("عنصر الخريطة غير موجود");
    }

    const canvas = await html2canvas(element, {
      backgroundColor: "#f8fafc",
      scale: 2, // دقة عالية
      logging: false,
      useCORS: true
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  } catch (error) {
    console.error("فشل في تصدير الخريطة كصورة:", error);
    return null;
  }
}

/**
 * تحميل صورة الخريطة
 */
export async function downloadMapImage(): Promise<void> {
  const blob = await exportMapAsImage();
  if (!blob) {
    throw new Error("فشل في إنشاء الصورة");
  }

  downloadBlobFile(blob, `journey-map-${Date.now()}.png`);
}

/**
 * تصدير الخريطة مع التفاصيل كـ PDF
 */
export async function exportMapToPDF(nodes: MapNode[]): Promise<void> {
  try {
    const JsPdf = await loadJsPdf();
    const pdf = new JsPdf({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // إضافة خط عربي (استخدام خط افتراضي متوافق)
    pdf.setFont("helvetica");
    pdf.setLanguage("ar");

    // العنوان
    pdf.setFontSize(20);
    pdf.text("خريطة علاقاتي — أداة دواير (الرحلة)", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // التاريخ
    pdf.setFontSize(10);
    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    pdf.text(dateStr, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // صورة الخريطة
    const mapBlob = await exportMapAsImage();
    if (mapBlob) {
      const imageData = await blobToDataURL(mapBlob);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = imgWidth * 0.75; // نسبة 4:3
      
      if (yPosition + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.addImage(imageData, "PNG", margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    }

    // إحصائيات
    const greenCount = nodes.filter(n => n.ring === "green").length;
    const yellowCount = nodes.filter(n => n.ring === "yellow").length;
    const redCount = nodes.filter(n => n.ring === "red").length;

    if (yPosition + 40 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text("Statistics:", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.text(`Green Circle (Healthy): ${greenCount} persons`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Yellow Circle (Needs Attention): ${yellowCount} persons`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Red Circle (Draining): ${redCount} persons`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Total: ${nodes.length} persons`, margin, yPosition);
    yPosition += 15;

    // قائمة الأشخاص حسب الدائرة
    const addSection = (title: string, color: string, sectionNodes: MapNode[]) => {
      if (sectionNodes.length === 0) return;

      if (yPosition + 30 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(color);
      pdf.text(title, margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      sectionNodes.forEach((node, index) => {
        if (yPosition + 10 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        const label = `${index + 1}. ${node.label}`;
        pdf.text(label, margin + 5, yPosition);
        yPosition += 6;

        // إضافة ملاحظات إن وُجدت
        if (node.notes && node.notes.length > 0) {
          node.notes.forEach((note) => {
            if (yPosition + 8 > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            const noteText = `   - ${note.text.substring(0, 80)}${note.text.length > 80 ? "..." : ""}`;
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(noteText, margin + 8, yPosition);
            yPosition += 5;
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
          });
        }

        yPosition += 2;
      });

      yPosition += 5;
    };

    const greenNodes = nodes.filter(n => n.ring === "green");
    const yellowNodes = nodes.filter(n => n.ring === "yellow");
    const redNodes = nodes.filter(n => n.ring === "red");

    addSection("Green Circle - Healthy Relationships", "#10b981", greenNodes);
    addSection("Yellow Circle - Needs Attention", "#f59e0b", yellowNodes);
    addSection("Red Circle - Draining Relationships", "#ef4444", redNodes);

    // حفظ الملف
    pdf.save(`journey-map-${Date.now()}.pdf`);
  } catch (error) {
    console.error("فشل في تصدير PDF:", error);
    throw new Error("حدث خطأ أثناء إنشاء ملف PDF");
  }
}

/**
 * تحويل Blob إلى Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
