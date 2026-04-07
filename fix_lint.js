const fs = require('fs');

function removeUnusedImports(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    if (filePath.includes('FloatingActionMenu.tsx')) {
        content = content.replace(/import \{ \n  Activity,\n  Map,\n  Wind,\n  Shield,\n  Heart,\n\} from "lucide-react";/, 'import { Shield, Heart } from "lucide-react";');
        content = content.replace(/import \{ useAppOverlayState \} from "\.\.\/state\/appOverlayState";\n/, '');
        content = content.replace(/import \{ assignUrl \} from "\.\.\/navigation\/assignUrl";\n/, '');
    } else if (filePath.includes('BreathingOverlay.tsx')) {
        content = content.replace(/const handleClose = \(e: any\) => \{/g, 'const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {');
    } else if (filePath.includes('QuickQuestionsStep.tsx')) {
        content = content.replace(/const tier = profile\?\.subscription_status === "active"\n    \? profile\?\.role === "enterprise_admin" \? "coach" : "premium"\n    : "basic";\n/g, '');
        content = content.replace(/const tier = profile\?\.subscription_status === "active"\n        \? profile\?\.role === "enterprise_admin" \? "coach" : "premium"\n        : "basic";/g, '');
        content = content.replace(/const getOptionButtonClass = \(isSel: boolean, isRed: boolean\) => \{[\s\S]*?\};/, '');
    } else if (filePath.includes('activation/page.tsx')) {
        content = content.replace(/import \{ CheckCircle2, MessageCircle \} from "lucide-react";\n/, '');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

removeUnusedImports('src/components/FloatingActionMenu.tsx');
removeUnusedImports('src/components/BreathingOverlay.tsx');
removeUnusedImports('src/components/AddPersonModal/QuickQuestionsStep.tsx');
removeUnusedImports('app/activation/page.tsx');

console.log("Lint fixes applied.");
