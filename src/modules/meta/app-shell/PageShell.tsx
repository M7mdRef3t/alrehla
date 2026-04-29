import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageShellProps {
  children: ReactNode;
  /** 
   * 'standard' - Full padding for header
   * 'compact' - Less padding
   * 'none' - No top padding
   */
  headerMode?: "standard" | "compact" | "none";
  /** Whether the mobile bottom tab bar is visible */
  tabBarVisible?: boolean;
  /** Whether the breadcrumb row is visible below the header */
  breadcrumbVisible?: boolean;
  /** Custom max-width for the content container */
  maxWidth?: string;
  /** Extra classes for the main container */
  className?: string;
  /** Option to disable the intro animation */
  disableAnimation?: boolean;
  /** Whether the page should span the full width without padding or max-width constraints */
  fullWidth?: boolean;
  /** Custom motion variants for the entrance animation */
  animationVariants?: {
    initial: any;
    animate: any;
    exit?: any;
    transition?: any;
  };
}

/**
 * PageShell: The unified layout wrapper for all screens in Alrehla.
 * It handles consistent spacing, responsive widths, and standard transitions.
 */
export function PageShell({
  children,
  headerMode = "standard",
  tabBarVisible = true,
  breadcrumbVisible = false,
  maxWidth = "max-w-[var(--phi-content-max)]", // Using the design system's content max width
  className = "",
  disableAnimation = false,
  fullWidth = false,
  animationVariants
}: PageShellProps) {
  
  // padding-top logic based on header and breadcrumb presence
  // These values should match the fixed header/breadcrumb heights precisely.
  const getPaddingTop = () => {
    if (headerMode === "none") return "pt-0";
    if (breadcrumbVisible) return "pt-[96px] md:pt-[104px]";
    return "pt-[56px] md:pt-[64px]";
  };

  // padding-bottom logic based on mobile tab bar presence
  const getPaddingBottom = () => {
    return tabBarVisible ? "pb-[80px] md:pb-6" : "pb-6";
  };

  const containerClasses = `
    flex-1 flex flex-col w-full ${fullWidth ? "" : "mx-auto px-4 sm:px-6 lg:px-10"}
    ${fullWidth ? "max-w-none" : maxWidth} ${getPaddingTop()} ${getPaddingBottom()} ${className}
  `.trim();

  if (disableAnimation) {
    return (
      <div className={containerClasses}>
        {children}
      </div>
    );
  }

  const variants = animationVariants || {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.35, ease: "easeOut" }
  };

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={variants.transition}
      className={containerClasses}
    >
      {children}
    </motion.div>
  );
}
