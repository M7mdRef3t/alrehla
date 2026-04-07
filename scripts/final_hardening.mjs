import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

const REPLACEMENTS = [
  // 1. dawayir-live private types
  {
    pattern: /from ['"]@\/agent\/types['"]/g,
    replacement: "from '../types'",
    include: [/src\/modules\/dawayir-live\/components\//]
  },
  {
    pattern: /from ['"]@\/agent\/types['"]/g,
    replacement: "from '../types'",
    include: [/src\/modules\/dawayir-live\/hooks\//]
  },
  {
    pattern: /from ['"]@\/agent\/types['"]/g,
    replacement: "from '../types'",
    include: [/src\/modules\/dawayir-live\/pages\//]
  },
  {
    pattern: /from ['"]@\/agent\/types['"]/g,
    replacement: "from '../types'",
    include: [/src\/modules\/dawayir-live\/server\//]
  },
  
  // 2. Relocated Components
  {
    pattern: /@\/components\/AwarenessSkeleton/g,
    replacement: '@/modules/meta/AwarenessSkeleton'
  },
  {
    pattern: /@\/components\/ShareableCard/g,
    replacement: '@/modules/exploration/ShareableCard'
  },
  {
    pattern: /@\/components\/AIGeneratedQuestionBadge/g,
    replacement: '@/modules/exploration/AIGeneratedQuestionBadge'
  },
  
  // 3. App dir deep relative imports to modular aliases
  {
    pattern: /\.\.\/\.\.\/src\/components\/AwarenessSkeleton/g,
    replacement: '@/modules/meta/AwarenessSkeleton'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/OnboardingFlow/g,
    replacement: '@/modules/meta/OnboardingFlow' // Wait, check if OnboardingFlow moved
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/PulseCheckModal/g,
    replacement: '@/modules/exploration/PulseCheckModal'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/CocoonModeModal/g,
    replacement: '@/modules/action/CocoonModeModal'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/BreathingOverlay/g,
    replacement: '@/modules/exploration/BreathingOverlay'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/AboutScreen/g,
    replacement: '@/modules/growth/AboutScreen'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/PlatformFooter/g,
    replacement: '@/modules/meta/PlatformFooter'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/BaselineAssessment/g,
    replacement: '@/modules/exploration/BaselineAssessment'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/debug\/DebugLogoLab/g,
    replacement: '@/modules/meta/debug/DebugLogoLab'
  },
  {
    pattern: /\.\.\/src\/components\/logo\/AlrehlaIcon/g,
    replacement: '@/modules/meta/logo/AlrehlaIcon'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/LegalPage/g,
    replacement: '@/modules/meta/LegalPage'
  },
  {
    pattern: /\.\.\/\.\.\/src\/components\/StoriesScreen/g,
    replacement: '@/modules/growth/StoriesScreen'
  },
  {
    pattern: /@\/components\/gate\/RadarBackground/g,
    replacement: '@/modules/meta/gate/RadarBackground'
  },
  {
    pattern: /@\/components\/gate\/LayerOneForm/g,
    replacement: '@/modules/meta/gate/LayerOneForm'
  },
  {
    pattern: /@\/components\/gate\/LayerTwoQualifier/g,
    replacement: '@/modules/meta/gate/LayerTwoQualifier'
  },
  {
    pattern: /@\/components\/PrivateCircleInvitationModal/g,
    replacement: '@/modules/meta/PrivateCircleInvitationModal' // Correct location? Let's check
  },
  {
    pattern: /@\/modules\/exploration\/PulseCheckModal['"]\).then\(\(m\) => \({ default: m\.PulseCheckModal }\)\)/g,
    replacement: "@/modules/exploration/PulseCheckModal').then((m) => ({ default: m.SafePulseCheckModal }))"
  },
  {
    pattern: /@\/modules\/action\/DynamicRecoveryPlan\/helpers/g,
    replacement: "@/modules/action/PulseCheckModalParts/helpers",
    include: [/PulseCheckModal\.tsx/]
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/agent['"]/g,
    replacement: "from '@/agent'",
    include: [/src\/modules\/meta\/app-shell\//]
  },
  {
    pattern: /import\(['"]\.\.\/\.\.\/agent['"]\)/g,
    replacement: "import('@/agent')",
    include: [/src\/modules\/meta\/app-shell\//]
  }
];

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(fullPath, callback);
      }
    } else {
      callback(fullPath);
    }
  }
}

console.log("Starting Final Hardening Script...");

let totalFixed = 0;

walk(ROOT_DIR, (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  
  for (const r of REPLACEMENTS) {
    if (r.include && !r.include.some(p => p.test(relativePath))) continue;
    if (r.exclude && r.exclude.some(p => p.test(relativePath))) continue;
    
    if (r.pattern.test(content)) {
      content = content.replace(r.pattern, r.replacement);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`[FIXED] ${relativePath}`);
    totalFixed++;
  }
});

console.log(`\nDONE! Total files fixed: ${totalFixed}`);
