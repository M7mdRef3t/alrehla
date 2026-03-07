import type { FC, HTMLAttributes } from "react";
import { cn } from "./utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export const Badge: FC<BadgeProps> = ({ className, ...props }) => {
  return <span className={cn("ds-badge", className)} {...props} />;
};
