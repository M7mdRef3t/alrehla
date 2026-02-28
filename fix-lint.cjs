const fs = require('fs');

// src/app/api/awareness-queue/worker/route.ts
let worker = fs.readFileSync('src/app/api/awareness-queue/worker/route.ts', 'utf8');
worker = worker.replace(/const result = await DynamicContextRouter\.route/, 'await DynamicContextRouter.route');
fs.writeFileSync('src/app/api/awareness-queue/worker/route.ts', worker);

// src/components/CommandCenter/ResonanceAlert.tsx
let resAlert = fs.readFileSync('src/components/CommandCenter/ResonanceAlert.tsx', 'utf8');
resAlert = resAlert.replace(/ShieldAlert, /, '');
fs.writeFileSync('src/components/CommandCenter/ResonanceAlert.tsx', resAlert);

// src/components/Trajectory/TrajectoryDashboard.tsx
let trajDash = fs.readFileSync('src/components/Trajectory/TrajectoryDashboard.tsx', 'utf8');
trajDash = trajDash.replace(/Sparkles, /, '');
trajDash = trajDash.replace(/Share2, /, '');
trajDash = trajDash.replace(/import \{ AwarenessVector \} from '\.\.\/\.\.\/services\/trajectoryEngine';\n/, '');
trajDash = trajDash.replace(/const externalTension = [^;]+;/, '');
fs.writeFileSync('src/components/Trajectory/TrajectoryDashboard.tsx', trajDash);

// src/components/Oracle/OracleDashboard.tsx
let oracleDash = fs.readFileSync('src/components/Oracle/OracleDashboard.tsx', 'utf8');
oracleDash = oracleDash.replace(/TrendingUp, /, '');
oracleDash = oracleDash.replace(/Users /, '');
fs.writeFileSync('src/components/Oracle/OracleDashboard.tsx', oracleDash);
