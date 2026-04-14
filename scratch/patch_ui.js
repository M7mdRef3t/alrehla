const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'modules', 'meta', 'OnboardingFlow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the dots array
content = content.replace(/const dots = \[0, 1, 2, 3, 4\];/, 'const dots = [0, 1, 2, 3, 4, 5, 6];');

// 2. Update the dots active logic (width/bg) - the original code used Math.min(step, 4)
content = content.replace(/Math\.min\(step, 4\)/g, 'step');

// 3. Update the step names in useEffect tracking
content = content.replace(/const stepNames = \[\s*"noise_check",\s*"inventory",\s*"mapping",\s*"insight",\s*"contact_capture",\s*"recovery_plan_preview"\s*\];/, 
`const stepNames = [
      "pain_dump",
      "noise_check", 
      "inventory", 
      "mapping", 
      "insight", 
      "contact_capture", 
      "recovery_plan_preview",
      "safety_route"
    ];`);

// 4. Update the render steps block
const oldRenderBlock = `          {step === 0 && <FirstSparkOnboarding onComplete={handleNoiseNext} gateContext={gateContext} />}
          {step === 1 && <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} mirrorName={seededMirrorName} />}
          {step === 2 && (
            <StepMapping 
              items={collectedItems as any} 
              onNext={handleMappingNext} 
              onRingSelected={handleRingSelected}
              onSkip={handleSkip} 
            />
          )}
          {step === 3 && <StepInsight items={collectedItems as any} onComplete={() => goTo(4)} onSkip={() => goTo(4)} />}
          {step === 4 && (
            <StepContactCapture
              initialName={name}
              onComplete={handleContactCapture}
              onSkip={() => {
                trackingService.recordFlow("onboarding_contact_skipped", {
                  meta: {
                    redCount: diagnosis?.metrics.redCount ?? 0,
                    yellowCount: diagnosis?.metrics.yellowCount ?? 0,
                    greenCount: diagnosis?.metrics.greenCount ?? 0
                  }
                });
                goTo(5);
              }}
            />
          )}
          {step === 5 && <StepResultsScreen userName={name} result={diagnosis as any} plan={primaryPlan} onComplete={handleComplete} />}`;

const newRenderBlock = `          {step === 0 && <StepPainDump onNext={handlePainDumpNext} />}
          {step === 1 && <FirstSparkOnboarding onComplete={handleNoiseNext} gateContext={gateContext} />}
          {step === 2 && <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} mirrorName={seededMirrorName} />}
          {step === 3 && (
            <StepMapping 
              items={collectedItems as any} 
              onNext={handleMappingNext} 
              onRingSelected={handleRingSelected}
              onSkip={handleSkip} 
            />
          )}
          {step === 4 && <StepInsight items={collectedItems as any} onComplete={() => goTo(5)} onSkip={() => goTo(5)} />}
          {step === 5 && (
            <StepContactCapture
              initialName={name}
              onComplete={handleContactCapture}
              onSkip={() => {
                trackingService.recordFlow("onboarding_contact_skipped", {
                  meta: {
                    redCount: diagnosis?.metrics.redCount ?? 0,
                    yellowCount: diagnosis?.metrics.yellowCount ?? 0,
                    greenCount: diagnosis?.metrics.greenCount ?? 0
                  }
                });
                goTo(6);
              }}
            />
          )}
          {step === 6 && <StepResultsScreen diagnosis={diagnosis!} onComplete={handleComplete} />}
          {step === 7 && <StepSafetyTriage />}`;

// Use simple string replacement for the block
content = content.replace(oldRenderBlock, newRenderBlock);

// 5. Add StepSafetyTriage component at the end of the file (before export)
const safetyStepComponent = `
const StepSafetyTriage = () => (
  <div className="text-center py-8 space-y-6">
    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
      <AlertTriangle className="w-10 h-10 text-red-500" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">أمانك هو الأولوية القصوى</h2>
    <p className="text-slate-300 leading-relaxed">
      من خلال كلماتك، يبدو أنك تمر بلحظة صعبة جداً وتتطلب دعماً فورياً متخصصاً.
    </p>
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-right">
      <p className="text-sm text-slate-400 mb-4">برجاء التواصل مع المتخصصين فوراً:</p>
      <ul className="space-y-3 text-white">
        <li>• الخط الساخن للأمان النفسي: 16328</li>
        <li>• أو التوجه لأقرب مستشفى للطوارئ.</li>
      </ul>
    </div>
    <p className="text-xs text-slate-500 italic">
      "رحلتك" منصة توعوية وليست بديلاً عن العلاج الطبي أو التدخل في الأزمات.
    </p>
  </div>
);
`;

content = content.replace(/export const OnboardingFlow/, safetyStepComponent + '\nexport const OnboardingFlow');

fs.writeFileSync(filePath, content);
console.log('OnboardingFlow Render Logic and Step Safety Triage implemented.');
