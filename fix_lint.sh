sed -i 's/err: any/err: unknown/g' src/app/api/awareness-queue/route.ts
sed -i 's/const result = await processQueueBatch()/await processQueueBatch()/g' src/app/api/awareness-queue/worker/route.ts
sed -i 's/err: any/err: unknown/g' src/app/api/awareness-queue/worker/route.ts
sed -i 's/import { ShieldAlert } from "lucide-react";//g' src/components/CommandCenter/ResonanceAlert.tsx
sed -i 's/import { ShieldAlert, Zap } from "lucide-react";/import { ShieldAlert } from "lucide-react";/g' src/components/Oracle/AscensionRitual.tsx
sed -i 's/import { motion } from "framer-motion";//g' src/components/Oracle/LiveTelemetry.tsx
sed -i 's/import { Users, TrendingUp, Zap, Target }/import { Zap, Target }/g' src/components/Oracle/OracleDashboard.tsx
sed -i 's/import { Users, TrendingUp, Zap, Target, Activity }/import { Zap, Target, Activity }/g' src/components/Oracle/OracleDashboard.tsx
sed -i 's/\[oracleId\]/\[oracleId\]/g' src/components/Oracle/OracleDashboard.tsx
sed -i 's/(entry: any, index: number)/(entry: unknown, index: number)/g' src/components/Oracle/OracleDashboard.tsx
sed -i 's/import { TrendingDown, /import { /g' src/components/Oracle/PhoenixReport.tsx
sed -i 's/import { supabase } from "\.\.\/\.\.\/services\/supabaseClient";//g' src/components/Oracle/PhoenixReport.tsx
sed -i 's/(_, idx)/(_, _idx)/g' src/components/Oracle/PhoenixReport.tsx
sed -i 's/data: any/data: unknown/g' src/components/Trajectory/AwarenessHeatmap.tsx
sed -i 's/import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip }/import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip }/g' src/components/Trajectory/CollectiveRadar.tsx
sed -i 's/import { motion } from "framer-motion";//g' src/components/Trajectory/CollectiveRadar.tsx
sed -i 's/import { Target, Activity, Users, Zap, TrendingUp, ShieldAlert, Sparkles, Navigation, Globe, Crosshair, Share2 }/import { Target, Activity, Users, Zap, TrendingUp, ShieldAlert, Navigation, Globe, Crosshair }/g' src/components/Trajectory/TrajectoryDashboard.tsx
sed -i 's/import { AwarenessVector } from "\.\.\/\.\.\/services\/hiveEngine";//g' src/components/Trajectory/TrajectoryDashboard.tsx
