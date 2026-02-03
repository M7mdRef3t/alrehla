import type { FunctionDeclaration, FunctionDeclarationsTool } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";
import { symptomsDatabase } from "../data/symptoms";
import type { AgentActions } from "./types";
import type { Ring } from "../modules/map/mapTypes";

const ALL_SYMPTOM_IDS = new Set<string>(
  (["red", "yellow", "green"] as Ring[]).flatMap((ring) =>
    (symptomsDatabase[ring] || []).map((s) => s.id)
  )
);

/** تعريفات أدوات Gemini للـ Agent (مساعد ميداني) */
export function getAgentToolDeclarations(): FunctionDeclarationsTool {
  const declarations: FunctionDeclaration[] = [
    {
      name: "logSituation",
      description:
        "تسجيل موقف أو سجل لشخص على الخريطة. استخدمه عندما يذكر المستخدم موقفاً حدث مع شخص معين (مثلاً: تصرف، حديث، شعور). الشخص يُحدد بالاسم أو بمعرف العقدة.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          personLabelOrId: {
            type: SchemaType.STRING,
            description: "اسم الشخص كما على الخريطة أو معرف العقدة (مثل رقم)"
          },
          text: {
            type: SchemaType.STRING,
            description: "نص الموقف أو السجل (ماذا حدث، ماذا قال، ماذا شعر)"
          },
          emotionalTag: {
            type: SchemaType.STRING,
            description: "تصنيف عاطفي اختياري (مثل: غضب، ذنب، خوف، ارتياح)"
          }
        },
        required: ["personLabelOrId", "text"]
      }
    },
    {
      name: "addOrUpdateSymptom",
      description:
        "إضافة أو تحديث عرض مرتبط بشخص (من قائمة الأعراض المعروفة أو وصف قصير). استخدمه عندما المستخدم يصف كيف يحس مع شخص (ذنب، إرهاق، تفكير زائد، إلخ).",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          personLabelOrId: {
            type: SchemaType.STRING,
            description: "اسم الشخص أو معرف العقدة"
          },
          symptomIdOrText: {
            type: SchemaType.STRING,
            description:
              "معرف العرض من القائمة (مثل guilt, exhausted, ruminating) أو وصف قصير بالعربي"
          }
        },
        required: ["personLabelOrId", "symptomIdOrText"]
      }
    },
    {
      name: "updateRelationshipZone",
      description:
        "نقل شخص إلى دائرة على الخريطة: أحمر (خطر/استنزاف)، أصفر (قرب مشروط)، أخضر (قرب صحي). استخدمه عندما المستخدم يقرر أو يصف وضع العلاقة مع شخص.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          personLabelOrId: {
            type: SchemaType.STRING,
            description: "اسم الشخص أو معرف العقدة"
          },
          zone: {
            type: SchemaType.STRING as const,
            description: "الدائرة: red (أحمر)، yellow (أصفر)، green (أخضر). قيم مسموحة: red, yellow, green"
          } as { type: SchemaType; description: string }
        },
        required: ["personLabelOrId", "zone"]
      }
    },
    {
      name: "navigate",
      description:
        "فتح شاشة أو مسار في التطبيق: breathing (تمرين تنفس)، gym (صالة التدريب)، map (خريطة العلاقات)، baseline (القياس الأولي)، emergency (غرفة طوارئ)، أو person:nodeId لفتح نافذة شخص معين.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          route: {
            type: SchemaType.STRING,
            description:
              "المسار: breathing | gym | map | baseline | emergency | person:nodeId (مثال person:5)"
          }
        },
        required: ["route"]
      }
    },
    {
      name: "showOverlay",
      description:
        "فتح overlay على الشاشة. overlayId: emergency = غرفة الطوارئ (خلفية حمراء، تمرين تنفس، سيناريو رد).",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          overlayId: {
            type: SchemaType.STRING as const,
            description: "معرف الـ overlay: emergency (غرفة الطوارئ). القيمة المدعومة: emergency"
          } as { type: SchemaType; description: string }
        },
        required: ["overlayId"]
      }
    },
    {
      name: "showCard",
      description:
        "عرض بطاقة داخل المحادثة أسفل ردك. cardId: breathing = تمرين تنفس سريع، guilt_detox = محكمة الذنب / تهدئة الذنب.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          cardId: {
            type: SchemaType.STRING as const,
            description: "معرف البطاقة: breathing أو guilt_detox"
          } as { type: SchemaType; description: string }
        },
        required: ["cardId"]
      }
    },
    {
      name: "generateCustomExercise",
      description:
        "توليد تمرين مخصص حسب هدف المستخدم: عدّاد تنازلي (countdown) أو ساعة توقيت (stopwatch)، مع عنوان ومدة ثوانٍ اختيارية. استخدمه عندما المستخدم يطلب تمرين مثل «اصمد دقيقة» أو «عدّ معايا ٣٠ ثانية».",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          goal: {
            type: SchemaType.STRING,
            description: "وصف الهدف من المستخدم (مثل: اصمد دقيقة، عد ٣٠ ثانية)"
          },
          type: {
            type: SchemaType.STRING as const,
            description: "نوع التمرين: countdown (عدّ تنازلي) أو stopwatch (ساعة توقيت)"
          } as { type: SchemaType; description: string },
          title: {
            type: SchemaType.STRING,
            description: "عنوان التمرين بالعربي (مثل: اصمد دقيقة)"
          },
          durationSeconds: {
            type: SchemaType.INTEGER,
            description: "المدة بالثواني (للعدّ التنازلي فقط، مثلاً 60 لدقيقة)"
          }
        },
        required: ["goal", "type", "title"]
      }
    }
  ];
  return { functionDeclarations: declarations };
}

export type ToolName = "logSituation" | "addOrUpdateSymptom" | "updateRelationshipZone" | "navigate";

/** تنفيذ استدعاء أداة واحدة وإرجاع النتيجة للموديل */
export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  actions: AgentActions
): Promise<{ result: object; error?: string }> {
  try {
    if (name === "logSituation") {
      const person = String(args.personLabelOrId ?? "");
      const text = String(args.text ?? "");
      const emotionalTag = args.emotionalTag != null ? String(args.emotionalTag) : undefined;
      const out = await actions.logSituation(person, text, emotionalTag);
      return out.ok ? { result: { message: "تم تسجيل الموقف." } } : { result: {}, error: out.error };
    }
    if (name === "addOrUpdateSymptom") {
      const person = String(args.personLabelOrId ?? "");
      const symptomIdOrText = String(args.symptomIdOrText ?? "");
      const out = await actions.addOrUpdateSymptom(person, symptomIdOrText);
      return out.ok ? { result: { message: "تم تحديث الأعراض." } } : { result: {}, error: out.error };
    }
    if (name === "updateRelationshipZone") {
      const person = String(args.personLabelOrId ?? "");
      const zone = String(args.zone ?? "").toLowerCase();
      if (zone !== "red" && zone !== "yellow" && zone !== "green") {
        return { result: {}, error: "zone يجب أن يكون red أو yellow أو green" };
      }
      const out = await actions.updateRelationshipZone(person, zone as Ring);
      return out.ok ? { result: { message: `تم نقل الشخص إلى الدائرة ${zone}.` } } : { result: {}, error: out.error };
    }
    if (name === "navigate") {
      const route = String(args.route ?? "").trim();
      const valid =
        route === "breathing" ||
        route === "gym" ||
        route === "map" ||
        route === "baseline" ||
        route === "emergency" ||
        /^person:\d+$/.test(route);
      if (!valid) {
        return { result: {}, error: "route غير صالح. استخدم breathing | gym | map | baseline | emergency | person:nodeId" };
      }
      actions.navigate(route as Parameters<AgentActions["navigate"]>[0]);
      return { result: { message: `تم التنقل إلى: ${route}.` } };
    }
    if (name === "showOverlay") {
      const overlayId = String(args.overlayId ?? "").trim();
      if (overlayId !== "emergency") {
        return { result: {}, error: "overlayId المدعوم حالياً: emergency" };
      }
      actions.showOverlay?.(overlayId);
      return { result: { message: "تم فتح غرفة الطوارئ." } };
    }
    if (name === "showCard") {
      return { result: {}, error: "showCard يُنفَّذ من واجهة المحادثة فقط" };
    }
    if (name === "generateCustomExercise") {
      return { result: {}, error: "generateCustomExercise يُنفَّذ من واجهة المحادثة فقط" };
    }
    return { result: {}, error: `أداة غير معروفة: ${name}` };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { result: {}, error: err };
  }
}

/** هل النص يطابق معرف عرض معروف؟ */
export function isKnownSymptomId(value: string): boolean {
  return ALL_SYMPTOM_IDS.has(value.trim().toLowerCase());
}
