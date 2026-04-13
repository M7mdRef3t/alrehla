const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'modules', 'meta', 'OnboardingFlow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean up the immediate duplicates I created
const duplicatesPattern = /const \[step, setStep\] = useState\(0\);\s*const \[, setPrevStep\] = useState\(-1\);\s*const \[name, setName\] = useState\(\(initialMirrorName \?\? ""\)\.trim\(\)\);\s*const \[painDump, setPainDump\] = useState\(\"\"\);\s*const \[diagnosis, setDiagnosis\] = useState<TransformationDiagnosis \| null>\(null\);\s*const \[isSafetyTriggered, setIsSafetyTriggered\] = useState\(false\);\s*const \[, setPrevStep\] = useState\(-1\);\s*const \[name, setName\] = useState\(\(initialMirrorName \?\? ""\)\.trim\(\)\);/g;

content = content.replace(duplicatesPattern, 
  `const [step, setStep] = useState(0);
  const [, setPrevStep] = useState(-1);
  const [name, setName] = useState((initialMirrorName ?? "").trim());
  const [painDump, setPainDump] = useState("");
  const [diagnosis, setDiagnosis] = useState<TransformationDiagnosis | null>(null);
  const [isSafetyTriggered, setIsSafetyTriggered] = useState(false);`
);

// 2. Replace derivedResult with diagnosis in the rest of the state block if it exists twice
content = content.replace(/const \[derivedResult, setDerivedResult\] = useState<DerivedOnboardingResult \| null>\(null\);/g, '');

fs.writeFileSync(filePath, content);
console.log('OnboardingFlow state cleaned up successfully.');
