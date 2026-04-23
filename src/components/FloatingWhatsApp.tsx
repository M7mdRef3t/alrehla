import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { runtimeEnv } from "@/config/runtimeEnv";
import { normalizeWhatsAppPhone } from "@/utils/phoneNumber";
import { analyticsService } from "@/domains/analytics";
import { openInNewTab } from "@/services/clientDom";
import { Z_LAYERS } from "@/config/zIndices";
import { useJourneyProgress } from "@/domains/journey";

const DEFAULT_WHATSAPP_CONTACT = "201140111147";

interface FloatingWhatsAppProps {
  placement?: string;
  className?: string;
}

export const FloatingWhatsApp: FC<FloatingWhatsAppProps> = ({ 
  placement = "floating_fab",
  className = "" 
}) => {
  const mirrorName = useJourneyProgress().mirrorName;
  const whatsAppNumber = runtimeEnv.whatsappContactNumber || DEFAULT_WHATSAPP_CONTACT;
  
  const whatsAppLink = useMemo(() => {
    const normalized = normalizeWhatsAppPhone(whatsAppNumber);
    if (!normalized) return null;
    
    let link = `https://wa.me/${normalized}`;
    
    let sourceText = "";
    if (placement.includes("landing")) {
      sourceText = "[من صفحة البداية]";
    } else if (placement.includes("app")) {
      sourceText = "[من داخل المنصة]";
    } else {
      sourceText = `[المصدر: ${placement}]`;
    }

    const baseMessage = mirrorName 
      ? `أهلاً، أنا ${mirrorName}. كنت بمر في الرحلة ومحتاج مساعدة...`
      : `أهلاً، كنت بمر في الرحلة ومحتاج مساعدة...`;
      
    const fullMessage = `${baseMessage} ${sourceText}`;
    
    link = `${link}?text=${encodeURIComponent(fullMessage)}`;
    
    return link;
  }, [whatsAppNumber, mirrorName, placement]);

  const handleOpen = () => {
    if (!whatsAppLink) return;
    analyticsService.whatsapp({ placement });
    openInNewTab(whatsAppLink);
  };

  if (!whatsAppLink) return null;

  return (
    <motion.button
      type="button"
      title="تواصل عبر واتساب"
      onClick={handleOpen}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.9 }}
      className={`fixed left-6 bottom-8 w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 hover:bg-emerald-500 transition-colors ${className}`}
      style={{ zIndex: Z_LAYERS.SYSTEM_WHISPER }}
    >
      <MessageCircle className="w-6 h-6 shrink-0" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>
    </motion.button>
  );
};
