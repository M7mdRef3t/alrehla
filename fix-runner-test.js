const fs = require('fs');

const path = 'src/agent/runner.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /availableFeatures: {[\s\S]*?},/,
  `availableFeatures: {
          dawayir_map: true,
          journey_tools: true,
          basic_diagnosis: true,
          mirror_tool: true,
          family_tree: true,
          internal_boundaries: true,
          generative_ui_mode: true,
          global_atlas: true,
          ai_field: true,
          pulse_check: true,
          pulse_weekly_recommendation: true,
          pulse_immediate_action: true,
          dynamic_routing_v2: true,
          dynamic_routing_owner_observability: true,
          golden_needle_enabled: true,
          language_switcher: true,
          armory_section: true,
          landing_live_metrics: true,
          landing_live_testimonials: true,
          dawayir_live: true,
          dawayir_live_couple: true,
          dawayir_live_coach: true,
          dawayir_live_camera: true
        },`
);

fs.writeFileSync(path, code);
