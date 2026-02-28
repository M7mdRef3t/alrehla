import re

with open("src/components/Trajectory/CollectiveRadar.tsx", "r") as f:
    content = f.read()

# Add externalTension to CollectiveRadarProps properly
if 'externalTension?: any' not in content:
    content = re.sub(
        r'(interface CollectiveRadarProps {)(.*?)(})',
        r'\1\2  externalTension?: any;\n\3',
        content,
        flags=re.DOTALL
    )

with open("src/components/Trajectory/CollectiveRadar.tsx", "w") as f:
    f.write(content)
