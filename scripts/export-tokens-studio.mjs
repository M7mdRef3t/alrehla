import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const TOKENS_PATH = resolve(ROOT, "design", "tokens.json");
const OUT_DIR = resolve(ROOT, "design", "figma");
const OUT_FILE = resolve(OUT_DIR, "tokens-studio.json");

function withValue(value, type) {
  return type ? { $type: type, $value: value } : { $value: value };
}

function parsePxOrRaw(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/-?\d+(\.\d+)?/);
  if (!match) return value;
  const num = Number(match[0]);
  if (trimmed.endsWith("rem")) return `${num * 16}px`;
  if (trimmed.endsWith("px")) return `${num}px`;
  return value;
}

function mapColor(tokens) {
  const color = tokens.color ?? {};
  const out = {};
  Object.entries(color).forEach(([group, values]) => {
    out[group] = {};
    Object.entries(values ?? {}).forEach(([k, entry]) => {
      if (entry && typeof entry === "object" && "value" in entry) {
        out[group][k] = withValue(entry.value, "color");
      } else if (entry && typeof entry === "object") {
        out[group][k] = {};
        Object.entries(entry).forEach(([nestedKey, nestedEntry]) => {
          if (nestedEntry && typeof nestedEntry === "object" && "value" in nestedEntry) {
            out[group][k][nestedKey] = withValue(nestedEntry.value, "color");
          }
        });
      }
    });
  });
  return out;
}

function mapSpacing(tokens) {
  const spacing = tokens.spacing ?? {};
  const out = {};
  Object.entries(spacing).forEach(([k, v]) => {
    out[k] = withValue(parsePxOrRaw(v?.value), "spacing");
  });
  return out;
}

function mapRadius(tokens) {
  const radius = tokens.radius ?? {};
  const out = {};
  Object.entries(radius).forEach(([k, v]) => {
    out[k] = withValue(parsePxOrRaw(v?.value), "borderRadius");
  });
  return out;
}

function mapShadow(tokens) {
  const shadow = tokens.shadow ?? {};
  const out = {};
  Object.entries(shadow).forEach(([k, v]) => {
    out[k] = withValue(v?.value ?? "", "boxShadow");
  });
  return out;
}

function mapTypography(tokens) {
  const typography = tokens.typography ?? {};
  const out = {
    fontFamily: {},
    scale: {}
  };

  Object.entries(typography.fontFamily ?? {}).forEach(([k, v]) => {
    out.fontFamily[k] = withValue(v, "fontFamilies");
  });

  Object.entries(typography.scale ?? {}).forEach(([k, v]) => {
    out.scale[k] = {
      size: withValue(parsePxOrRaw(v?.size ?? ""), "fontSizes"),
      weight: withValue(String(v?.weight ?? ""), "fontWeights"),
      lineHeight: withValue(String(v?.lineHeight ?? ""), "lineHeights")
    };
    if (v?.tracking != null) {
      out.scale[k].tracking = withValue(String(v.tracking), "letterSpacing");
    }
  });

  return out;
}

function mapGrid(tokens) {
  const grid = tokens.grid ?? {};
  return {
    columns: withValue(grid.columns?.value ?? 12, "number"),
    gap: withValue(parsePxOrRaw(grid.gap?.value ?? "8px"), "spacing"),
    maxWidth: withValue(parsePxOrRaw(grid.maxWidth?.value ?? "1280px"), "sizing"),
    paddingX: withValue(parsePxOrRaw(grid.paddingX?.value ?? "24px"), "spacing"),
    breakpoints: Object.fromEntries(
      Object.entries(grid.breakpoints ?? {}).map(([k, v]) => [k, withValue(parsePxOrRaw(v), "sizing")])
    )
  };
}

async function main() {
  const raw = await readFile(TOKENS_PATH, "utf8");
  const tokens = JSON.parse(raw);

  const payload = {
    meta: {
      name: "Alrehla Tokens Studio",
      source: "design/tokens.json",
      version: "1.0.0"
    },
    global: {
      color: mapColor(tokens),
      spacing: mapSpacing(tokens),
      radius: mapRadius(tokens),
      shadow: mapShadow(tokens),
      typography: mapTypography(tokens),
      grid: mapGrid(tokens)
    }
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(payload, null, 2), "utf8");
  console.log("Generated Tokens Studio file at design/figma/tokens-studio.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
