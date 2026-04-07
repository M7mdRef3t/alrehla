import type { FC, InputHTMLAttributes } from "react";
import { cn } from "./utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: FC<InputProps> = ({ className, ...props }) => {
  return <input className={cn("ds-input", className)} {...props} />;
};
