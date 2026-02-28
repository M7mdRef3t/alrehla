import re

with open("src/services/journeyTracking.ts", "r") as f:
    content = f.read()

new_steps = """  | "screen_goal_viewed"
  | "screen_map_viewed"
  | "screen_guided_viewed"
  | "screen_mission_viewed"
  | "screen_tools_viewed"
  | "screen_diplomacy_viewed"
  | "screen_guilt_court_viewed"
  | "screen_enterprise_viewed"
  | "screen_settings_viewed"
  | "screen_oracle_dashboard_viewed"
  | "post_auth_intent_phase_one_map"
  | "post_auth_intent_goal_picker"
  | "onboarding_opened"
  | "auth_gate_opened"
  | "goal_selected" """

content = re.sub(
    r'(export type FlowStep =[^;]+)',
    r'\1\n' + new_steps,
    content
)

with open("src/services/journeyTracking.ts", "w") as f:
    f.write(content)
