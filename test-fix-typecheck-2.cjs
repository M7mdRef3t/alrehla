const fs = require('fs');

// AtlasDashboard.tsx
let atlasDash = fs.readFileSync('src/components/AtlasDashboard.tsx', 'utf8');
atlasDash = atlasDash.replace(/payload: Array<\{ payload\?: \{ pathLabel\?: string; starts\?: number; \} \}> \| undefined/g, 'payload: any');
atlasDash = atlasDash.replace(/payload: Array<\{ payload\?: \{ date\?: string; \} \}> \| undefined/g, 'payload: any');
fs.writeFileSync('src/components/AtlasDashboard.tsx', atlasDash);

// TrajectoryDashboard.tsx
let trajDash = fs.readFileSync('src/components/Trajectory/TrajectoryDashboard.tsx', 'utf8');
trajDash = trajDash.replace(/import \{ SwarmStatusBadge \} from '\.\.\/CommandCenter\/SwarmStatusBadge';\n/, '');
trajDash = trajDash.replace(/\{swarmMetrics && \(\s*<SwarmStatusBadge[^>]*\/>\s*\)\}/g, '');
trajDash = trajDash.replace(/externalTension=\{externalTension\}\s*/g, '');
fs.writeFileSync('src/components/Trajectory/TrajectoryDashboard.tsx', trajDash);
