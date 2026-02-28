import { readFileSync, writeFileSync } from 'fs';

const files = [
    './src/hooks/useScreenNavigation.ts',
    './src/components/OnboardingWelcomeBubble.tsx'
];

for (const file of files) {
    let code = readFileSync(file, 'utf8');
    code = code.replace(
        /export type WelcomeSource = "ai" \| "template";/,
        `export type WelcomeSource = "ai" | "template" | "offline_intervention";`
    );
    writeFileSync(file, code);
}
