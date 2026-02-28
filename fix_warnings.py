import re

with open("src/app/api/awareness-queue/worker/route.ts", "r") as f: content = f.read()
content = re.sub(r'const result = await ', 'await ', content)
content = re.sub(r'\(err: any\)', '(err: unknown)', content)
with open("src/app/api/awareness-queue/worker/route.ts", "w") as f: f.write(content)

with open("src/components/Oracle/OracleDashboard.tsx", "r") as f: content = f.read()
content = re.sub(r'import { Users, TrendingUp, ', 'import { ', content)
with open("src/components/Oracle/OracleDashboard.tsx", "w") as f: f.write(content)

with open("src/components/Oracle/PhoenixReport.tsx", "r") as f: content = f.read()
content = re.sub(r'import { TrendingDown, ', 'import { ', content)
content = re.sub(r'import { supabase } from "\.\./\.\./services/supabaseClient";\n', '', content)
content = re.sub(r'\(_, idx\)', '(_, _idx)', content)
with open("src/components/Oracle/PhoenixReport.tsx", "w") as f: f.write(content)

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "r") as f: content = f.read()
content = re.sub(r'import { Sparkles, ', 'import { ', content)
content = re.sub(r', Share2 }', ' }', content)
content = re.sub(r'import { AwarenessVector } from "\.\./\.\./services/hiveEngine";\n', '', content)
content = re.sub(r'const externalTension = .*?\n', '', content)
with open("src/components/Trajectory/TrajectoryDashboard.tsx", "w") as f: f.write(content)
