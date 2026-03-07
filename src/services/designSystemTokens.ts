import designTokens from "../../design/tokens.json";
import { getDocumentOrNull } from "./clientRuntime";

type TokenLeaf = string | number;
type TokenNode = Record<string, unknown>;

const legacyAliases: Record<string, string> = {
  "--ds-space-1": "--ds-spacing-1",
  "--ds-space-2": "--ds-spacing-2",
  "--ds-space-3": "--ds-spacing-3",
  "--ds-space-4": "--ds-spacing-4",
  "--ds-space-5": "--ds-spacing-5",
  "--ds-space-6": "--ds-spacing-6",
  "--ds-space-8": "--ds-spacing-8",
  "--ds-space-10": "--ds-spacing-10",
  "--ds-space-12": "--ds-spacing-12",
  "--ds-font-sans": "--ds-typography-font-family-sans",
  "--ds-font-display": "--ds-typography-font-family-display",
  "--ds-text-display-size": "--ds-typography-scale-display-size",
  "--ds-text-h1-size": "--ds-typography-scale-h1-size",
  "--ds-text-h2-size": "--ds-typography-scale-h2-size",
  "--ds-text-h3-size": "--ds-typography-scale-h3-size",
  "--ds-text-body-size": "--ds-typography-scale-body-size",
  "--ds-text-caption-size": "--ds-typography-scale-caption-size",
  "--ds-motion-ease": "--ds-animation-ease",
  "--ds-motion-fast": "--ds-animation-dur-fast",
  "--ds-motion-base": "--ds-animation-dur-base",
  "--ds-motion-slow": "--ds-animation-dur-slow"
};

function isObject(value: unknown): value is TokenNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTokenLeaf(value: unknown): value is TokenLeaf {
  return typeof value === "string" || typeof value === "number";
}

function normalizeKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function collectTokenVars(node: unknown, path: string[], acc: Record<string, string>): void {
  if (isTokenLeaf(node)) {
    const varName = `--ds-${path.join("-")}`;
    acc[varName] = String(node);
    return;
  }

  if (!isObject(node)) return;

  if (isTokenLeaf(node.value)) {
    const varName = `--ds-${path.join("-")}`;
    acc[varName] = String(node.value);
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    collectTokenVars(value, [...path, normalizeKey(key)], acc);
  }
}

function buildRootVarMap(): Record<string, string> {
  const vars: Record<string, string> = {};
  collectTokenVars(designTokens, [], vars);

  for (const [legacyName, canonicalName] of Object.entries(legacyAliases)) {
    const canonicalValue = vars[canonicalName];
    if (canonicalValue != null) vars[legacyName] = canonicalValue;
  }

  return vars;
}

const rootVarMap = buildRootVarMap();

export function applyDesignSystemTokens(): void {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return;

  const root = documentRef.documentElement;
  for (const [name, value] of Object.entries(rootVarMap)) {
    root.style.setProperty(name, value);
  }
}

