const fs = require('fs');

const files = [
    'src/app/api/awareness-queue/worker/route.ts',
    'src/components/AtlasDashboard.tsx',
    'src/components/Oracle/OracleDashboard.tsx',
    'src/components/Oracle/PhoenixReport.tsx',
    'src/components/Trajectory/TrajectoryDashboard.tsx'
];

for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if(file === 'src/app/api/awareness-queue/worker/route.ts') {
    content = content.replace(/const result = await DynamicContextRouter\.route/, 'await DynamicContextRouter.route');
  }

  if(file === 'src/components/AtlasDashboard.tsx') {
    content = content.replace(/payload: any/g, 'payload: Array<{ payload?: { pathLabel?: string; starts?: number; date?: string; } }>');
  }

  if(file === 'src/components/Oracle/OracleDashboard.tsx') {
    content = content.replace(/import \{ TrendingUp, Users \} from 'lucide-react';/, "import { Activity, Shield, Zap, TrendingDown, RefreshCcw, CheckCircle2 } from 'lucide-react';");
    content = content.replace(/useEffect\(\(\) => \{[^}]+fetchTelemetry[^}]+\}, \[\]\);/g, "useEffect(() => { fetchTelemetry(); const interval = setInterval(fetchTelemetry, 3000); return () => clearInterval(interval); }, [oracleId]);");
  }

  if(file === 'src/components/Oracle/PhoenixReport.tsx') {
    content = content.replace(/TrendingDown, /, '');
    content = content.replace(/import \{ supabase \} from '\.\.\/\.\.\/services\/supabaseClient';\n/, '');
  }

  if(file === 'src/components/Trajectory/TrajectoryDashboard.tsx') {
    content = content.replace(/const externalTension = [^;]+;\n/, '');
  }

  fs.writeFileSync(file, content);
}
