import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={cn("ds-button", className)}
    data-variant={variant}
    data-size={size}
    {...props}
  >
    {children}
    {icon}
  </button>
);

