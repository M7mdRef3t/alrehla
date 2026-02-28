import re

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("externalTension={externalTension}", "")

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
