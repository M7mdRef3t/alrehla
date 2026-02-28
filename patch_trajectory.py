import re

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the bad import
content = content.replace("import { SwarmStatusBadge } from '../CommandCenter/SwarmStatusBadge';", "")

# Replace SwarmStatusBadge component usage
content = re.sub(r'<SwarmStatusBadge[^>]*/>', '<div>Swarm Status</div>', content)

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
