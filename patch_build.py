import re

# Fix App.tsx FlowStep enum and WelcomeSource missing values
with open("src/services/journeyTracking.ts", "r") as f:
    content = f.read()

new_steps = [
    "screen_goal_viewed", "screen_map_viewed", "screen_guided_viewed", "screen_mission_viewed",
    "screen_tools_viewed", "screen_diplomacy_viewed", "screen_guilt_court_viewed",
    "screen_enterprise_viewed", "screen_settings_viewed", "screen_oracle_dashboard_viewed",
    "post_auth_intent_phase_one_map", "post_auth_intent_goal_picker", "onboarding_opened",
    "auth_gate_opened", "goal_selected"
]

for step in new_steps:
    if f'"{step}"' not in content:
        content = re.sub(r'export type FlowStep =', f'export type FlowStep =\n  | "{step}"', content, count=1)

with open("src/services/journeyTracking.ts", "w") as f:
    f.write(content)

with open("src/hooks/useScreenNavigation.ts", "r") as f:
    nav_content = f.read()
if '"offline_intervention"' not in nav_content:
    nav_content = nav_content.replace('export type WelcomeSource = "ai" | "template";', 'export type WelcomeSource = "ai" | "template" | "offline_intervention";')
with open("src/hooks/useScreenNavigation.ts", "w") as f:
    f.write(nav_content)

with open("src/components/OnboardingWelcomeBubble.tsx", "r") as f:
    nav_content = f.read()
if '"offline_intervention"' not in nav_content:
    nav_content = nav_content.replace('export type WelcomeSource = "ai" | "template";', 'export type WelcomeSource = "ai" | "template" | "offline_intervention";')
with open("src/components/OnboardingWelcomeBubble.tsx", "w") as f:
    f.write(nav_content)

# Fix AtlasDashboard.tsx
with open("src/components/AtlasDashboard.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'labelFormatter={(_label: unknown, payload: Array<{ payload?: { pathLabel?: string; starts?: number } }> | undefined) =>',
    'labelFormatter={(_label: unknown, payload: ReadonlyArray<{ payload?: { pathLabel?: string; starts?: number } }>) =>'
)

content = content.replace(
    'labelFormatter={(_label: unknown, payload: Array<{ payload?: { date?: string } }> | undefined) => payload?.[0]?.payload?.date ?? ""}',
    'labelFormatter={(_label: unknown, payload: ReadonlyArray<{ payload?: { date?: string } }>) => payload?.[0]?.payload?.date ?? ""}'
)
with open("src/components/AtlasDashboard.tsx", "w") as f:
    f.write(content)

# Fix TrajectoryDashboard.tsx
with open("src/components/Trajectory/TrajectoryDashboard.tsx", "r") as f:
    content = f.read()

content = content.replace("swarmMetrics.metadata.", "")
content = content.replace('metadata: {', '')
content = re.sub(r'pulseDiversity:.*?,', '', content)
content = re.sub(r'activeFeatures:.*?,', '', content)
content = re.sub(r'anomalyCount:.*?,', '', content)
content = re.sub(r'}, // End of metadata', '', content)
content = re.sub(r'externalTension=\{metrics\.metadata\?\.anomalyCount \?\? 0\}', '', content)

with open("src/components/Trajectory/TrajectoryDashboard.tsx", "w") as f:
    f.write(content)
