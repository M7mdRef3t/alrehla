import type { FC, HTMLAttributes } from "react";
import { cn } from "./utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card: FC<CardProps> = ({ className, ...props }) => {
  return <div className={cn("ds-card", className)} {...props} />;
};
