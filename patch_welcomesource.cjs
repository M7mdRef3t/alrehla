const fs = require('fs');

function addSource(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace('export type WelcomeSource = "ai" | "template";', 'export type WelcomeSource = "ai" | "template" | "offline_intervention";');
    fs.writeFileSync(file, content);
}

addSource('src/hooks/useScreenNavigation.ts');
addSource('src/components/OnboardingWelcomeBubble.tsx');
