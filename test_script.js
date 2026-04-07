const { execSync } = require('child_process');

try {
  execSync('LOGIC_FLOW_BASE_REF=main npm run logic-flow:gate', { stdio: 'inherit' });
  console.log("PASS logic flow");
} catch(e) {
  console.error("FAIL logic flow");
}
