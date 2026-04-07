import { LucideProps, Activity, Mic, MicOff, Hexagon, Radio, Target } from "lucide-react";

export const OracleIcon = (props: LucideProps) => (
  <Hexagon {...props} strokeWidth={1} className={`animate-spin-slow ${props.className}`} />
);

export const TacticalRadarIcon = (props: LucideProps) => (
  <Radio {...props} strokeWidth={1.5} className={props.className} />
);

export const SovereignTargetIcon = (props: LucideProps) => (
  <Target {...props} strokeWidth={1.5} className={props.className} />
);

export { Activity, Mic, MicOff };
