const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'modules', 'meta', 'OnboardingFlow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `const finalName = providedName.trim() || seededMirrorName;
    const nextResult = derivedResult ?? deriveOnboardingResult(collectedItems);
    setDerivedResult(nextResult);`;

// We'll replace it with our new logic
content = content.replace(/const finalName = providedName\.trim\(\) \|\| seededMirrorName;\s*const nextResult = derivedResult \?\? deriveOnboardingResult\(collectedItems\);\s*setDerivedResult\(nextResult\);/, 
`const finalName = providedName.trim() || seededMirrorName;
    const currentDiagnosis = diagnosis || classifyState(painDump, {
      redCount: collectedItems.filter(c => c.ring === "red").length,
      yellowCount: collectedItems.filter(c => c.ring === "yellow").length,
      greenCount: collectedItems.filter(c => c.ring === "green").length,
    });`);

// Update the syncLead part
content = content.replace(/redCount: nextResult\.redCount,\s*yellowCount: nextResult\.yellowCount,\s*greenCount: nextResult\.greenCount,\s*protocol: nextResult\.protocolKey,\s*dominantPattern: nextResult\.primarySymptom/,
`redCount: currentDiagnosis.metrics.redCount,
          yellowCount: currentDiagnosis.metrics.yellowCount,
          greenCount: currentDiagnosis.metrics.greenCount,
          protocol: currentDiagnosis.protocol,
          dominantPattern: currentDiagnosis.primary_pattern,
          intent: currentDiagnosis.intent,
          poeticState: currentDiagnosis.state`);

// Update logic around line 1240 too (handleComplete)
content = content.replace(/meta: {\s*redCount: derivedResult\?\.redCount \?\? 0,\s*yellowCount: derivedResult\?\.yellowCount \?\? 0,\s*greenCount: derivedResult\?\.greenCount \?\? 0,\s*protocol: derivedResult\?\.protocolKey\s*}/,
`meta: {
          redCount: diagnosis?.metrics.redCount ?? 0,
          yellowCount: diagnosis?.metrics.yellowCount ?? 0,
          greenCount: diagnosis?.metrics.greenCount ?? 0,
          protocol: diagnosis?.protocol
        }`);

fs.writeFileSync(filePath, content);
console.log('OnboardingFlow handleContactCapture and metrics logic updated.');
