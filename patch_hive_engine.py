import re

with open("src/services/hiveEngine.ts", "r") as f:
    content = f.read()

# Add metadata to SwarmMetrics
content = content.replace(
    'export interface SwarmMetrics {\n  collectiveTension: number;',
    'export interface SwarmMetrics {\n  collectiveTension: number;\n  metadata?: any;'
)

with open("src/services/hiveEngine.ts", "w") as f:
    f.write(content)
