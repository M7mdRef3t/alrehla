import type { FC } from "react";

export const kbdStyle: React.CSSProperties = {
  fontSize: 10, color: "#94a3b8",
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(4px)",
  padding: "3px 8px", borderRadius: 6,
  border: "1px solid #e2e8f0",
  fontFamily: "inherit"
};

export const ToolbarBtn: FC<{
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
}> = ({ children, onClick, active, title, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 8, border: "none",
      background: active ? "#e0e7ff" : "transparent",
      color: disabled ? "#cbd5e1" : active ? "#3b82f6" : "#475569",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.15s"
    }}
    onMouseEnter={e => {
      if (!active && !disabled) e.currentTarget.style.background = "#f1f5f9";
    }}
    onMouseLeave={e => {
      if (!active) e.currentTarget.style.background = "transparent";
    }}
  >
    {children}
  </button>
);
