const fs = require('fs');

const path = 'src/agent/runner.test.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /\(vi\.mocked\(useMapState\.getState\) as any\)/g,
  '(vi.mocked(useMapState.getState) as unknown as ReturnType<typeof vi.fn>)'
);

fs.writeFileSync(path, code);
