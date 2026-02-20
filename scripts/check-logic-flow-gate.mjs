import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function getChangedFiles(baseRef) {
  const range = `${baseRef}...HEAD`;
  const out = run(`git diff --name-only ${range}`);
  return out ? out.split("\n").map((s) => s.trim()).filter(Boolean) : [];
}

function isCodePath(file) {
  const codeRoots = ["src/", "app/", "server/", "api/"];
  if (!codeRoots.some((root) => file.startsWith(root))) return false;
  if (file.endsWith(".md")) return false;
  if (file.includes(".test.") || file.includes(".spec.")) return false;
  return true;
}

function isLogicFlowDoc(file) {
  return file.startsWith("docs/logic-flows/") && file.endsWith(".md");
}

function main() {
  const baseRef = process.env.LOGIC_FLOW_BASE_REF || process.env.GITHUB_BASE_REF || "origin/main";

  try {
    run("git fetch --no-tags --depth=1 origin +refs/heads/*:refs/remotes/origin/*");
  } catch {
    // best effort; in local runs this may fail and we still try diff
  }

  const fullBaseRef = baseRef.startsWith("origin/") ? baseRef : `origin/${baseRef}`;
  const changed = getChangedFiles(fullBaseRef);

  const codeFiles = changed.filter(isCodePath);
  const logicFlowDocs = changed.filter(isLogicFlowDoc);

  if (codeFiles.length === 0) {
    console.log("[logic-flow-gate] No feature code changes detected. Pass.");
    process.exit(0);
  }

  if (logicFlowDocs.length === 0) {
    console.error("[logic-flow-gate] FAILED");
    console.error("Feature code changed without Logic Flow update.");
    console.error("Add/update at least one file under docs/logic-flows/*.md");
    console.error("Changed code files:");
    codeFiles.slice(0, 50).forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("[logic-flow-gate] PASS");
  console.log("Logic flow docs changed:");
  logicFlowDocs.forEach((f) => console.log(`- ${f}`));
}

main();
