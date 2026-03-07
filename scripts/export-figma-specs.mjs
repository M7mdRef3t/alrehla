import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const TOKENS_PATH = resolve(ROOT, "design", "tokens.json");
const OUT_DIR = resolve(ROOT, "design", "figma");

function toNumberPx(value, fallback = 0) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;
  const num = Number(match[0]);
  if (trimmed.endsWith("rem")) return num * 16;
  return num;
}

function flattenColorVariables(tokens) {
  const color = tokens.color ?? {};
  const out = [];
  const walk = (obj, path = []) => {
    Object.entries(obj).forEach(([k, v]) => {
      if (v && typeof v === "object" && "value" in v) {
        out.push({
          name: ["color", ...path, k].join("/"),
          value: v.value
        });
        return;
      }
      if (v && typeof v === "object") {
        walk(v, [...path, k]);
      }
    });
  };
  walk(color, []);
  return out;
}

function buildVariables(tokens) {
  const spacing = Object.entries(tokens.spacing ?? {}).map(([key, v]) => ({
    name: `spacing/${key}`,
    value: toNumberPx(v?.value, 0),
    type: "number"
  }));

  const radius = Object.entries(tokens.radius ?? {}).map(([key, v]) => ({
    name: `radius/${key}`,
    value: toNumberPx(v?.value, 0),
    type: "number"
  }));

  const typography = tokens.typography ?? {};
  const typoVars = [];
  if (typography.fontFamily?.display) {
    typoVars.push({ name: "font/family/display", value: typography.fontFamily.display, type: "string" });
  }
  if (typography.fontFamily?.sans) {
    typoVars.push({ name: "font/family/sans", value: typography.fontFamily.sans, type: "string" });
  }

  Object.entries(typography.scale ?? {}).forEach(([name, scale]) => {
    if (scale.size) typoVars.push({ name: `font/size/${name}`, value: scale.size, type: "string" });
    if (scale.weight) typoVars.push({ name: `font/weight/${name}`, value: String(scale.weight), type: "string" });
    if (scale.lineHeight) typoVars.push({ name: `line-height/${name}`, value: String(scale.lineHeight), type: "string" });
  });

  return {
    version: "1.0.0",
    source: "design/tokens.json",
    collections: [
      {
        name: "Color",
        mode: "Dark",
        variables: flattenColorVariables(tokens).map((v) => ({ ...v, type: "color" }))
      },
      {
        name: "Spacing",
        mode: "Base",
        variables: spacing
      },
      {
        name: "Radius",
        mode: "Base",
        variables: radius
      },
      {
        name: "Typography",
        mode: "Base",
        variables: typoVars
      }
    ]
  };
}

function buildTextStyles(tokens) {
  const scale = tokens.typography?.scale ?? {};
  return Object.entries(scale).map(([name, style]) => ({
    name: `Typography/${name}`,
    fontFamily: name.startsWith("h") || name === "display"
      ? "Almarai"
      : "IBM Plex Sans Arabic",
    fontSize: style.size,
    fontWeight: String(style.weight ?? ""),
    lineHeight: String(style.lineHeight ?? ""),
    letterSpacing: String(style.tracking ?? "0"),
    textCase: style.transform === "uppercase" ? "UPPER" : "ORIGINAL",
    direction: "RTL"
  }));
}

function buildColorStyles(tokens) {
  const colors = flattenColorVariables(tokens);
  return colors.map((c) => ({
    name: `Color/${c.name.replace(/^color\//, "")}`,
    value: c.value
  }));
}

function buildEffects(tokens) {
  const shadows = tokens.shadow ?? {};
  return Object.entries(shadows).map(([k, v]) => ({
    name: `Shadow/${k}`,
    value: v?.value ?? ""
  }));
}

function buildLayoutPresets(tokens) {
  const spacing = tokens.spacing ?? {};
  const radius = tokens.radius ?? {};
  return {
    frame: {
      desktop: { width: 1280, direction: "HORIZONTAL", overflow: "VERTICAL_SCROLL", background: "color/space/void" },
      tablet: { width: 768, direction: "HORIZONTAL", overflow: "VERTICAL_SCROLL", background: "color/space/void" },
      mobile: { width: 390, direction: "VERTICAL", overflow: "VERTICAL_SCROLL", background: "color/space/void" }
    },
    sidebar: {
      width: 240,
      direction: "VERTICAL",
      gap: toNumberPx(spacing["1"]?.value, 8),
      padding: {
        top: toNumberPx(spacing["3"]?.value, 24),
        right: toNumberPx(spacing["2"]?.value, 16),
        bottom: toNumberPx(spacing["3"]?.value, 24),
        left: toNumberPx(spacing["2"]?.value, 16)
      },
      background: "color/space/deep"
    },
    content: {
      direction: "VERTICAL",
      gap: toNumberPx(spacing["3"]?.value, 24),
      padding: toNumberPx(spacing["4"]?.value, 32)
    },
    components: {
      button: {
        direction: "HORIZONTAL",
        alignItems: "CENTER",
        justifyContent: "CENTER",
        gap: toNumberPx(spacing["1"]?.value, 8),
        paddingX: toNumberPx(spacing["3"]?.value, 24),
        paddingY: toNumberPx(spacing["2"]?.value, 16),
        radius: toNumberPx(radius.full?.value, 9999),
        minWidth: 120
      },
      card: {
        direction: "VERTICAL",
        gap: toNumberPx(spacing["2"]?.value, 16),
        padding: toNumberPx(spacing["3"]?.value, 24),
        radius: toNumberPx(radius.lg?.value, 20),
        stroke: "color/border/default",
        fill: "color/glass/default"
      },
      badge: {
        direction: "HORIZONTAL",
        alignItems: "CENTER",
        gap: 4,
        paddingX: 10,
        paddingY: 4,
        radius: toNumberPx(radius.full?.value, 9999)
      }
    }
  };
}

async function main() {
  const raw = await readFile(TOKENS_PATH, "utf8");
  const tokens = JSON.parse(raw);

  const variables = buildVariables(tokens);
  const styles = {
    version: "1.0.0",
    source: "design/tokens.json",
    text: buildTextStyles(tokens),
    colors: buildColorStyles(tokens),
    effects: buildEffects(tokens)
  };
  const presets = {
    version: "1.0.0",
    source: "design/alrehla_figma_specs.md + design/tokens.json",
    autoLayout: buildLayoutPresets(tokens)
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, "variables.json"), JSON.stringify(variables, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "styles.json"), JSON.stringify(styles, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "auto-layout-presets.json"), JSON.stringify(presets, null, 2), "utf8");

  const readme = `# Figma Export Artifacts

- \`variables.json\`: Figma Variables collections derived from \`design/tokens.json\`.
- \`styles.json\`: Text, color, and effect styles for designer handoff.
- \`auto-layout-presets.json\`: Frame/component auto-layout presets (RTL-first).

Generated by: \`node scripts/export-figma-specs.mjs\`
`;
  await writeFile(resolve(OUT_DIR, "README.md"), readme, "utf8");
  console.log("Generated Figma artifacts in design/figma/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
