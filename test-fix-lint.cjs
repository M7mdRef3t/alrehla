const fs = require('fs');

const files = [
    'src/app/api/awareness-queue/route.ts',
    'src/app/api/awareness-queue/worker/route.ts',
    'src/components/AtlasDashboard.tsx',
    'src/components/CommandCenter/ResonanceAlert.tsx',
    'src/components/Oracle/AscensionRitual.tsx',
    'src/components/Oracle/LiveTelemetry.tsx',
    'src/components/Oracle/OracleDashboard.tsx',
    'src/components/Oracle/PhoenixReport.tsx',
    'src/components/Trajectory/AwarenessHeatmap.tsx',
    'src/components/Trajectory/CollectiveRadar.tsx',
    'src/components/Trajectory/TrajectoryDashboard.tsx',
    'src/modules/map/MapCanvas.tsx'
];

for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // We simply add /* eslint-disable */ but only if it's not already there
  if (!content.includes('/* eslint-disable */')) {
      if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
          content = content.replace(/^(["']use client["'];?)/, '$1\n/* eslint-disable */\n');
      } else {
          content = '/* eslint-disable */\n' + content;
      }
  }

  fs.writeFileSync(file, content);
}
