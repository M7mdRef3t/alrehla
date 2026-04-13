import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AdminTooltip } from "../dashboard/Overview/components/AdminTooltip";

export function CollapsibleSection({
  title,
  icon,
  subtitle,
  tooltip,
  defaultExpanded = false,
  badge,
  children,
  headerColors = "border-white/10 bg-white/5 text-slate-300",
  headerAction,
}: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  tooltip?: string;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  headerColors?: string;
  headerAction?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${headerColors}`}>
      <div
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
          {badge}
        </div>
        <div className="flex items-center gap-4">
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          <div>
            <div className="flex items-center justify-end gap-2">
              {tooltip && <AdminTooltip content={tooltip} position="right" />}
              <p className="text-sm font-black flex items-center gap-1.5">{title} {icon}</p>
            </div>
            {subtitle && <p className="text-[11px] text-white/50 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {expanded && <div className="p-5 overflow-hidden animate-in fade-in slide-in-from-top-2 border-t border-white/5">{children}</div>}
    </div>
  );
}
