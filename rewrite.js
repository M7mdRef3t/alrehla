const fs = require('fs');
let code = fs.readFileSync('src/components/AddPersonModal/ResultScreen.tsx', 'utf8');

if (!code.includes('const [activeTab, setActiveTab]')) {
  code = code.replace(
    'const [ctaStatus, setCtaStatus] = useState<string | null>(null);',
    'const [ctaStatus, setCtaStatus] = useState<string | null>(null);\n  const [activeTab, setActiveTab] = useState<"diagnosis" | "roadmap" | "tools">("diagnosis");'
  );
}

if (!code.includes('Tabs Header')) {
  code = code.replace(
    '<motion.div\n        initial={{ opacity: 0, scale: 0.95, y: 20 }}\n        animate={{ opacity: 1, scale: 1, y: 0 }}\n        className="w-full max-w-3xl space-y-8"\n      >',
    `<motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl space-y-8"
      >
        {/* Tabs Header */}
        <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/10 shrink-0 shadow-xl">
          {[
            { id: "diagnosis", label: "التشخيص", icon: "👁️" },
            { id: "roadmap", label: "الخريطة", icon: "🗺️" },
            { id: "tools", label: "المفاهيم والعدة", icon: "🎒" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "diagnosis" | "roadmap" | "tools")}
              className={\`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-black transition-all \${activeTab === tab.id ? "bg-slate-900 border border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "text-slate-500 hover:text-white hover:bg-white/5"}\`}
            >
              <span className="text-lg opacity-80">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>`
  );
}

function wrapBlockSafe(codeStr, startStr, endStr, condStr) {
  const s = codeStr.indexOf(startStr);
  if (s === -1) return codeStr;
  let e = codeStr.indexOf(endStr, s + 1);
  if (e === -1) return codeStr;
  
  let before = codeStr.substring(0, s);
  let block = codeStr.substring(s, e);
  let after = codeStr.substring(e);
  
  if (block.includes(`{${condStr} && (`)) return codeStr; // already wrapped
  
  return before + `{${condStr} && (\n<>\n` + block + `\n</>\n)}\n` + after;
}

code = wrapBlockSafe(code, '<div ref={shareCardRef}', '{isEmotionalPrisoner && !summaryOnly && (', 'activeTab === "diagnosis"');

const r1 = '{addedNode && (\n          <div className="mb-6">\n            <RecoveryRoadmap';
if (code.includes(r1)) {
  code = code.replace(r1, '{activeTab === "roadmap" && addedNode && (\n          <div className="mb-6">\n            <RecoveryRoadmap');
}

const r2 = '{addedNode && (\n          <div className="mb-6">\n            <SuggestedPlacement';
if (code.includes(r2)) {
  code = code.replace(r2, '{activeTab === "roadmap" && addedNode && (\n          <div className="mb-6">\n            <SuggestedPlacement');
}

const r3 = '{addedNode && (addedNode.analysis?.selectedSymptoms?.length ?? 0) > 0 && (\n          <motion.div\n            initial={{ opacity: 0, y: 20 }}';
if (code.includes(r3)) {
  code = code.replace(r3, '{activeTab === "roadmap" && addedNode && (addedNode.analysis?.selectedSymptoms?.length ?? 0) > 0 && (\n          <motion.div\n            initial={{ opacity: 0, y: 20 }}');
}

// summaryOnly blocks -> diagnosis, except echo -> tools
const rs1 = '{summaryOnly && sovereigntySnapshot && (\n          <SovereigntySnapshotCard';
if (code.includes(rs1)) code = code.replace(rs1, '{activeTab === "diagnosis" && summaryOnly && sovereigntySnapshot && (\n          <SovereigntySnapshotCard');

const rs2 = '{summaryOnly && pressureSentence && (\n          <PressureSentenceCard';
if (code.includes(rs2)) code = code.replace(rs2, '{activeTab === "diagnosis" && summaryOnly && pressureSentence && (\n          <PressureSentenceCard');

const rs3 = '{summaryOnly && boundaryEvidence && (\n          <BoundaryEvidenceCard';
if (code.includes(rs3)) code = code.replace(rs3, '{activeTab === "diagnosis" && summaryOnly && boundaryEvidence && (\n          <BoundaryEvidenceCard');

const rs4 = '{summaryOnly && generationalEcho && (\n          <div className="p-1';
if (code.includes(rs4)) code = code.replace(rs4, '{activeTab === "tools" && summaryOnly && generationalEcho && (\n          <div className="p-1');

// Symptoms
const rp1 = '{isEmotionalPrisoner && !summaryOnly && (\n          <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-8';
if (code.includes(rp1)) code = code.replace(rp1, '{activeTab === "tools" && isEmotionalPrisoner && !summaryOnly && (\n          <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-8');

// Inside !summaryOnly
const b1 = '            <div className="p-8 rounded-3xl bg-blue-950/20 border border-blue-500/20 backdrop-blur-xl';
if (code.includes(b1)) code = code.replace(b1, '            {activeTab === "diagnosis" && (<>\n' + b1);

const b2 = '            <div className="p-8 rounded-3xl bg-amber-950/10 border border-amber-500/20 backdrop-blur-xl';
if (code.includes(b2)) code = code.replace(b2, '            </>)}\n            {activeTab === "tools" && (<>\n' + b2);

const b3 = '            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.02]';
if (code.includes(b3)) code = code.replace(b3, '            </>)}\n            {activeTab === "roadmap" && (<>\n' + b3);

const b4 = '            <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/20 backdrop-blur-xl text-right mb-8 shadow-2xl relative overflow-hidden transition-all hover:bg-rose-950/30">';
if (code.includes(b4)) code = code.replace(b4, '            </>)}\n            {activeTab === "tools" && (<>\n' + b4);

const b5 = '            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl text-right mb-8 shadow-2xl relative overflow-hidden group transition-all hover:bg-white/[0.04]">';
if (code.includes(b5)) code = code.replace(b5, '            </>)}\n            {activeTab === "diagnosis" && (<>\n' + b5);

const bEnd = '          </>\n        )}\n\n      {summaryOnly && onClose && (';
if (code.includes(bEnd)) code = code.replace(bEnd, '            </>)}\n' + bEnd);

fs.writeFileSync('src/components/AddPersonModal/ResultScreen.tsx', code);
