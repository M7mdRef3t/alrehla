import re

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('''                    // metadata: {
                        // external_tension: 0.62,
                        // last_signal_label
                    }''', '''                    // metadata: {
                        // external_tension: 0.62,
                        // last_signal_label
                    // }''')

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
