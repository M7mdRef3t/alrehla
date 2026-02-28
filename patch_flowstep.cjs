const fs = require('fs');
const file = 'src/services/journeyTracking.ts';
let content = fs.readFileSync(file, 'utf8');

const missingSteps = `  | "screen_goal_viewed"
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
  | "goal_selected"`;

content = content.replace('export type FlowStep =\n', 'export type FlowStep =\n' + missingSteps + '\n');
fs.writeFileSync(file, content);
