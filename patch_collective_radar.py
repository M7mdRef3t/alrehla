import re

with open("src/components/Trajectory/CollectiveRadar.tsx", "r") as f:
    content = f.read()

# Add externalTension to CollectiveRadarProps
content = content.replace(
    'interface CollectiveRadarProps {\n  userVector: any;',
    'interface CollectiveRadarProps {\n  userVector: any;\n  externalTension?: any;'
)

with open("src/components/Trajectory/CollectiveRadar.tsx", "w") as f:
    f.write(content)
