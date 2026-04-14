import type { FC, HTMLAttributes } from "react";
import { cn } from "./utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card: FC<CardProps> = ({ className, onClick, ...props }) => {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn("ds-card", onClick && "cursor-pointer", className)}
      onClick={onClick}
      {...props}
    />
  );
};
