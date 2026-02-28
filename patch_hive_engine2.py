import re

with open("src/services/hiveEngine.ts", "r") as f:
    content = f.read()

# Add metadata to SwarmMetrics properly
if 'metadata?: any' not in content:
    content = re.sub(
        r'(export interface SwarmMetrics {)(.*?)(})',
        r'\1\2  metadata?: any;\n\3',
        content,
        flags=re.DOTALL
    )

with open("src/services/hiveEngine.ts", "w") as f:
    f.write(content)
