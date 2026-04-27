import { AlrehlaWordmark } from "./AlrehlaWordmark";
import { AlrehlaIcon } from "./AlrehlaIcon";

/**
 * AlrehlaLogo — الشعار الكامل (صقر الشاهين + اسم "الرحلة")
 * الصقر على اليمين، الاسم على اليسار (RTL layout)
 * 
 * لماذا الصقر؟
 * "Peregrine" = "المسافر" باللاتينية → نفس معنى "الرحلة"
 * الصقر المهاجر → ارتبط بحورس عند المصريين القدام → البصيرة والحماية
 * الشعار الثلاثي "ارتفع . شوف . اتحرك" = سلوك الصقر الحقيقي
 */
export function AlrehlaLogo({
  height = 48,
  showTagline = false,
  className,
  layout = "horizontal",
}: {
  height?: number;
  showTagline?: boolean;
  className?: string;
  layout?: "horizontal" | "vertical";
}) {
  const isMinimal = height < 40;

  if (layout === "vertical") {
    return (
      <div 
        className={`flex flex-col items-center gap-4 ${className}`}
        style={{ height }}
      >
        <AlrehlaIcon size={height * 0.7} />
        <AlrehlaWordmark height={height * 0.25} color="white" />
        
        {showTagline && !isMinimal && (
          <span className="text-[10px] text-[var(--horus-gold,#C9A84C)] font-medium tracking-widest uppercase opacity-80 mt-2">
            ارتفع . شوف . اتحرك
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      dir="ltr"
      className={`flex items-center gap-3 ${className}`}
      style={{ height }}
    >
      <div className="flex items-center">
        <AlrehlaWordmark 
          height={height * 0.45} 
          color="white"
        />
      </div>
      
      <div className="flex items-center">
        <AlrehlaIcon 
          size={height * 0.85} 
        />
      </div>

      {showTagline && !isMinimal && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-[10px] text-[var(--horus-gold,#C9A84C)] font-medium tracking-widest uppercase opacity-80">
            ارتفع . شوف . اتحرك
          </span>
        </div>
      )}
    </div>
  );
}
