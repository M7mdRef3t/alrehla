import re

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix metadata usages by casting to any
content = re.sub(r'swarmMetrics\?\.metadata', '(swarmMetrics as any)?.metadata', content)
content = re.sub(r'metadata: \{', '// metadata: {', content)
content = re.sub(r'pulseDiversity: 0\.8,', '// pulseDiversity: 0.8,', content)
content = re.sub(r'activeFeatures: 42,', '// activeFeatures: 42,', content)
content = re.sub(r'anomalyCount: 2', '// anomalyCount: 2', content)
content = re.sub(r'\}, // End of metadata', '// }, // End of metadata', content)
content = re.sub(r'external_tension: 0\.62', '// external_tension: 0.62', content)
content = re.sub(r'last_signal_label: \'Rising Global Volatility\'', '// last_signal_label', content)
content = re.sub(r'externalTension=\{\(metrics as any\)\.metadata\?\.anomalyCount \?\? 0\}', '', content)

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
