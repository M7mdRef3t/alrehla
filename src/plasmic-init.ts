import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: process.env.PLASMIC_PROJECT_ID || "REPLACE_WITH_YOUR_PROJECT_ID",
      token: process.env.PLASMIC_API_TOKEN || "REPLACE_WITH_YOUR_API_TOKEN",
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true to see unpublished changes.
  preview: process.env.NODE_ENV === "development",
});

// =========================================================================
// Code Components Registration
// يمكنك هنا تسجيل أي مكونات رياكت قمت ببرمجتها مسبقاً في ديثرونكس
// لتظهر لك كبلوكات جاهزة بداخل واجهة Plasmic وتسحبها وتفلتها مباشرة.
// =========================================================================

/* 
مثال لتسجيل الدارك مود كارد:
import { SovereignCard } from "./components/SovereignCard";
PLASMIC.registerComponent(SovereignCard, {
  name: "SovereignCard",
  props: {
    children: "slot",
    title: "string"
  }
});
*/
