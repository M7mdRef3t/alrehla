import { Config } from "@measured/puck";
import { ReactNode } from "react";
import "@measured/puck/puck.css"; // Basic puck styling
import { AuthVisibilityWrapper } from "./components/puck/AuthVisibilityWrapper";
import { AnalyticsOverlay } from "./components/puck/AnalyticsOverlay";

type VisibilityMode = "all" | "guests" | "users";
type SpacingMode = "none" | "sm" | "md" | "lg" | "xl";

// Define the Component Props
type Props = {
  HeadingBlock: { title: string; subtitle?: string; align: "right" | "center" | "left"; padding: SpacingMode; visibility: VisibilityMode };
  TextBlock: { content: string; align: "right" | "center" | "left"; size: "sm" | "md" | "lg"; padding: SpacingMode; visibility: VisibilityMode };
  HeroBlock: { headline: string; description?: string; ctaText: string; ctaLink?: string; imageUrl?: string; padding: SpacingMode; visibility: VisibilityMode };
  CardBlock: { title: string; description: string; icon?: string; glowColor: "primary" | "tertiary" | "error"; align: "left" | "center" | "right"; variant: "glass" | "solid" | "outline"; padding: SpacingMode; visibility: VisibilityMode };
  MapBlock: { mapId: string; showLegend: boolean; particles: boolean; height: "compact" | "normal" | "tall"; bgTheme: "primary" | "tertiary" | "dark"; padding: SpacingMode; visibility: VisibilityMode };
  FeatureListBlock: { features: { title: string; description: string; icon?: string }[]; padding: SpacingMode; visibility: VisibilityMode };
  ButtonBlock: { text: string; url: string; variant: "default" | "outline" | "ghost"; size: "sm" | "default" | "lg"; align: "right" | "center" | "left"; padding: SpacingMode; visibility: VisibilityMode };
  SpacerBlock: { size: SpacingMode; visibility: VisibilityMode };
};

const visibilityField = {
  type: "radio",
  options: [
    { label: "الجميع (All)", value: "all" },
    { label: "الزوار (Guests)", value: "guests" },
    { label: "المسجلين (Users)", value: "users" },
  ],
} as any;

const paddingField = {
  type: "select",
  options: [
    { label: "بدون (None)", value: "none" },
    { label: "صغير (Small)", value: "sm" },
    { label: "متوسط (Medium)", value: "md" },
    { label: "كبير (Large)", value: "lg" },
    { label: "ضخم (X-Large)", value: "xl" },
  ],
} as any;

const getPaddingClass = (padding: SpacingMode) => {
  switch (padding) {
    case "none": return "p-0";
    case "sm": return "p-4";
    case "lg": return "p-12";
    case "xl": return "p-20";
    case "md":
    default:
      return "p-8";
  }
};

// Sovereign Core Configurations
export const config: Config<Props> = {
  components: {
    SpacerBlock: {
      fields: {
        size: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        size: "md",
        visibility: "all",
      },
      render: ({ size, visibility }) => {
        const heightClass = size === "none" ? "h-0" : size === "sm" ? "h-8" : size === "lg" ? "h-32" : size === "xl" ? "h-64" : "h-16";
        return (
          <AuthVisibilityWrapper visibility={visibility}>
            <div className={`w-full ${heightClass}`} />
          </AuthVisibilityWrapper>
        );
      }
    },
    HeadingBlock: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        align: {
          type: "radio",
          options: [
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
            { label: "Left", value: "left" },
          ],
        },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        title: "العنوان الرئيسي",
        align: "right",
        padding: "md",
        visibility: "all",
      },
      render: ({ title, subtitle, align, padding, visibility }) => (
        <AuthVisibilityWrapper visibility={visibility}>
          <AnalyticsOverlay id={`heading-${title}`}>
            <div className={`${getPaddingClass(padding)} ${align === "center" ? "text-center" : align === "left" ? "text-left" : "text-right"}`} dir={align === "left" ? "ltr" : "rtl"}>
              <h2 className="text-4xl font-extrabold text-on-background tracking-tight">{title}</h2>
              {subtitle && <p className="text-xl text-on-surface-variant mt-4 leading-relaxed font-medium">{subtitle}</p>}
            </div>
          </AnalyticsOverlay>
        </AuthVisibilityWrapper>
      ),
    },
    TextBlock: {
      fields: {
        content: { type: "textarea" },
        align: {
          type: "radio",
          options: [
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
            { label: "Left", value: "left" },
          ],
        },
        size: {
          type: "radio",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ]
        },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        content: "اكتب النص الخاص بك هنا...",
        align: "right",
        size: "md",
        padding: "md",
        visibility: "all",
      },
      render: ({ content, align, size, padding, visibility }) => {
        const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-lg";
        const alignClass = align === "center" ? "text-center" : align === "left" ? "text-left" : "text-right";
        return (
          <AuthVisibilityWrapper visibility={visibility}>
            <AnalyticsOverlay id={`text-${content.slice(0, 10)}`}>
              <div className={`${getPaddingClass(padding)} text-on-surface leading-relaxed whitespace-pre-wrap ${sizeClass} ${alignClass}`} dir={align === "left" ? "ltr" : "rtl"}>
                {content}
              </div>
            </AnalyticsOverlay>
          </AuthVisibilityWrapper>
        );
      },
    },
    HeroBlock: {
      fields: {
        headline: { type: "text" },
        description: { type: "textarea" },
        ctaText: { type: "text" },
        ctaLink: { type: "text" },
        imageUrl: { type: "text" },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        headline: "اكتشف خوارزمياتك السرية",
        description: "ابدأ رحلة التعمق في ذاتك.",
        ctaText: "ابدأ رحلتك الآن",
        ctaLink: "/onboarding",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      },
      render: ({ headline, description, ctaText, ctaLink, imageUrl, padding, visibility }) => (
        <AuthVisibilityWrapper visibility={visibility}>
          <AnalyticsOverlay id={`hero-${headline}`}>
            <section className={`relative overflow-hidden w-full flex items-center justify-center bg-background border-y border-on-background/5 ${getPaddingClass(padding)}`}>
              <div className="absolute inset-0 z-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Hero" className="w-full h-full object-cover opacity-20" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-tertiary/10"></div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]"></div>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-4xl px-4 py-16 backdrop-blur-sm rounded-3xl bg-background/30 border border-on-background/10 shadow-2xl">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-on-background drop-shadow-xl leading-tight">
                  {headline}
                </h1>
                {description && <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl">{description}</p>}
                
                <a href={ctaLink || "#"} className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-xl hover:bg-primary-container hover:text-on-primary-container hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(79,219,200,0.3)] ring-1 ring-primary/50">
                  {ctaText}
                </a>
              </div>
            </section>
          </AnalyticsOverlay>
        </AuthVisibilityWrapper>
      ),
    },
    ButtonBlock: {
      fields: {
        text: { type: "text" },
        url: { type: "text" },
        variant: {
          type: "radio",
          options: [
            { label: "Default", value: "default" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" }
          ]
        },
        size: {
          type: "radio",
          options: [
            { label: "Small", value: "sm" },
            { label: "Normal", value: "default" },
            { label: "Large", value: "lg" }
          ]
        },
        align: {
          type: "radio",
          options: [
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
            { label: "Left", value: "left" }
          ]
        },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        text: "اضغط هنا",
        url: "#",
        variant: "default",
        size: "default",
        align: "right",
        padding: "md",
        visibility: "all",
      },
      render: ({ text, url, variant, size, align, padding, visibility }) => {
        const alignClass = align === "center" ? "justify-center" : align === "left" ? "justify-start" : "justify-end";
        const sizeClass = size === "sm" ? "px-4 py-2 text-sm" : size === "lg" ? "px-8 py-4 text-xl" : "px-6 py-3 text-base";
        
        let colorClass = "bg-primary text-on-primary ring-1 ring-primary/50 shadow-[0_0_20px_rgba(79,219,200,0.2)] hover:bg-primary-container hover:text-on-primary-container hover:scale-105";
        if (variant === "outline") colorClass = "bg-transparent border-2 border-primary text-primary hover:bg-primary/10 hover:scale-105";
        if (variant === "ghost") colorClass = "bg-transparent text-primary hover:bg-primary/10 hover:scale-105";

        return (
          <AuthVisibilityWrapper visibility={visibility}>
            <AnalyticsOverlay id={`btn-${text}`}>
              <div className={`flex w-full ${alignClass} ${getPaddingClass(padding)}`} dir={align === "left" ? "ltr" : "rtl"}>
                 <a href={url || "#"} className={`rounded-full font-bold transition-all duration-300 ${sizeClass} ${colorClass}`}>
                   {text}
                 </a>
              </div>
            </AnalyticsOverlay>
          </AuthVisibilityWrapper>
        );
      }
    },
    FeatureListBlock: {
      fields: {
        features: {
          type: "array",
          arrayFields: {
            title: { type: "text" },
            description: { type: "textarea" },
            icon: { type: "text" }
          }
        },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        features: [
          { title: "الميزة الأولى", description: "تفاصيل الميزة الأولى هنا...", icon: "✨" }
        ],
        padding: "lg",
        visibility: "all"
      },
      render: ({ features, padding, visibility }) => {
        return (
           <AuthVisibilityWrapper visibility={visibility}>
             <AnalyticsOverlay id={`features-${features.length}`}>
               <div className={`${getPaddingClass(padding)} w-full bg-surface/10`} dir="rtl">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {features.map((feat, i) => (
                       <div key={i} className="flex gap-4 p-6 rounded-2xl bg-surface/40 backdrop-blur-md border border-on-surface/10 hover:shadow-xl transition-all group">
                         {feat.icon && (
                           <div className="text-3xl text-primary bg-primary/10 h-12 w-12 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
                             {feat.icon}
                           </div>
                         )}
                         <div>
                           <h4 className="text-lg font-bold text-on-surface mb-2">{feat.title}</h4>
                           <p className="text-on-surface-variant text-sm leading-relaxed">{feat.description}</p>
                         </div>
                       </div>
                     ))}
                  </div>
               </div>
             </AnalyticsOverlay>
           </AuthVisibilityWrapper>
        );
      }
    },
    CardBlock: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        icon: { type: "text" },
        glowColor: {
          type: "select",
          options: [
            { label: "Primary (Cyan)", value: "primary" },
            { label: "Tertiary (Purple)", value: "tertiary" },
            { label: "Error (Red)", value: "error" },
          ],
        },
        align: {
          type: "radio",
          options: [
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
            { label: "Left", value: "left" },
          ],
        },
        variant: {
          type: "radio",
          options: [
            { label: "Glassmorphism", value: "glass" },
            { label: "Solid", value: "solid" },
            { label: "Outline", value: "outline" },
          ],
        },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        title: "مسار الشفاء المعرفي",
        description: "تحليل دقيق وتتبع لأنماط التفكير الخاصة بك لإعادة هيكلة الدوافع وبناء وعي حقيقي.",
        icon: "🧠",
        glowColor: "primary",
        align: "right",
        variant: "glass",
        padding: "md",
        visibility: "all",
      },
      render: ({ title, description, icon, glowColor, align, variant, padding, visibility }) => {
        const alignClass = align === "center" ? "items-center text-center mx-auto" : align === "left" ? "items-start text-left ml-auto" : "items-start text-right mr-auto";
        const alignTextClass = align === "center" ? "text-center" : align === "left" ? "text-left" : "text-right";
        
        let variantClass = "bg-surface/40 backdrop-blur-md border border-on-surface/10";
        if (variant === "solid") variantClass = "bg-surface border border-transparent";
        if (variant === "outline") variantClass = "bg-transparent border-2 border-on-surface/20";

        let glowClass = "hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]";
        let iconBgClass = "bg-primary/10 ring-primary/20 group-hover:bg-primary/20 text-primary";
        if (glowColor === "primary") {
          glowClass = "hover:shadow-[0_8px_40px_rgba(79,219,200,0.15)]";
        } else if (glowColor === "tertiary") {
          glowClass = "hover:shadow-[0_8px_40px_rgba(206,147,216,0.15)]";
          iconBgClass = "bg-tertiary/10 ring-tertiary/20 group-hover:bg-tertiary/20 text-tertiary";
        } else if (glowColor === "error") {
          glowClass = "hover:shadow-[0_8px_40px_rgba(255,180,171,0.15)]";
          iconBgClass = "bg-error/10 ring-error/20 group-hover:bg-error/20 text-error";
        }

        return (
          <AuthVisibilityWrapper visibility={visibility}>
            <AnalyticsOverlay id={`card-${title}`}>
              <div className={`${getPaddingClass(padding)} w-full`}>
                <div className={`p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col gap-6 max-w-md group cursor-pointer ${variantClass} ${glowClass} ${alignClass}`} dir={align === "left" ? "ltr" : "rtl"}>
                  {icon && (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-all duration-300 ring-1 shadow-inner ${iconBgClass}`}>
                      {icon}
                    </div>
                  )}
                  <div className={`w-full ${alignTextClass}`}>
                    <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">{title}</h3>
                    <p className="text-on-surface-variant leading-relaxed text-lg">{description}</p>
                  </div>
                </div>
              </div>
            </AnalyticsOverlay>
          </AuthVisibilityWrapper>
        );
      },
    },
    MapBlock: {
      fields: {
        mapId: { type: "text" },
        showLegend: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        particles: { type: "radio", options: [{ label: "Enabled", value: true }, { label: "Disabled", value: false }] },
        bgTheme: {
          type: "select",
          options: [
            { label: "Dark (Default)", value: "dark" },
            { label: "Primary Tint", value: "primary" },
            { label: "Tertiary Tint", value: "tertiary" },
          ],
        },
        height: {
          type: "select",
          options: [
            { label: "Compact", value: "compact" },
            { label: "Normal", value: "normal" },
            { label: "Tall", value: "tall" },
          ],
        },
        padding: paddingField,
        visibility: visibilityField,
      },
      defaultProps: {
        mapId: "الخريطة الرئيسية",
        showLegend: true,
        particles: true,
        bgTheme: "dark",
        height: "normal",
        padding: "md",
        visibility: "all",
      },
      render: ({ mapId, showLegend, particles, bgTheme, height, padding, visibility }) => {
        let minHeight = "min-h-[400px]";
        if (height === "compact") minHeight = "min-h-[250px]";
        if (height === "tall") minHeight = "min-h-[600px] md:min-h-[800px]";

        let bgClass = "bg-surface-container-low/50 backdrop-blur-xl border border-on-surface/5";
        let gradientClass = "from-tertiary/5 via-transparent to-primary/5";
        
        if (bgTheme === "primary") {
          bgClass = "bg-primary/5 backdrop-blur-xl border border-primary/20 ring-1 ring-primary/10";
          gradientClass = "from-primary/10 via-background/50 to-primary/20";
        } else if (bgTheme === "tertiary") {
          bgClass = "bg-tertiary/5 backdrop-blur-xl border border-tertiary/20 ring-1 ring-tertiary/10";
          gradientClass = "from-tertiary/20 via-background/50 to-tertiary/10";
        }

        return (
          <AuthVisibilityWrapper visibility={visibility}>
            <AnalyticsOverlay id={`map-${mapId}`}>
              <div className={`${getPaddingClass(padding)} w-full relative`}>
                <div className={`relative overflow-hidden p-10 rounded-3xl flex flex-col items-center justify-center shadow-2xl group w-full max-w-5xl mx-auto transition-colors duration-500 ${bgClass} ${minHeight}`}>
                  {/* Decorative gradients */}
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-tr z-0 pointer-events-none transition-colors duration-500 ${gradientClass}`}></div>
                  
                  {particles && (
                    <div className="absolute inset-0 z-0 opacity-[0.15] mix-blend-screen bg-[url('/noise.svg')]"></div>
                  )}

                  <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-tertiary/20 to-primary/20 flex items-center justify-center border border-on-surface/10 shadow-inner group-hover:rotate-12 transition-transform duration-500 hover:scale-110">
                      <span className="text-5xl block">🗺️</span>
                    </div>
                    <h2 className="text-on-surface font-extrabold text-3xl mb-4 tracking-tighter drop-shadow-sm">
                      نموذج خريطة العلاقات
                      <span className="block text-xl font-medium text-on-surface-variant mt-2 opacity-80">({mapId})</span>
                    </h2>
                    {showLegend && (
                      <div className="mt-8 flex gap-4 opacity-80 justify-center flex-wrap">
                        <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold ring-1 ring-primary/20 shadow-sm backdrop-blur-md">📍 العقد (Nodes)</span>
                        <span className="px-4 py-2 bg-tertiary/10 text-tertiary rounded-full text-sm font-bold ring-1 ring-tertiary/20 shadow-sm backdrop-blur-md">🔗 الروابط (Edges)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AnalyticsOverlay>
          </AuthVisibilityWrapper>
        );
      }
    }
  },
};
