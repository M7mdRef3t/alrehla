import fs from 'fs';

const filePath = 'src/components/Landing.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The file should already have imports and sections fixed from the previous run.
// Now we delete the three redundant AB testing useEffect blocks.

// Delete Hero AB useEffect
content = content.replace(/  useEffect\(\(\) => \{\s+const windowRef = getWindowOrNull\(\);\s+if \(!windowRef\) return;\s+try \{\s+const applyVariant = \(variant: "A" \| "B"\) => \{\s+setHeroVariant\(variant\);\s+\};\s+const now = Date\.now\(\);\s+const storage = windowRef\.localStorage;\s+const startedRaw = storage\.getItem\(HERO_VARIANT_STARTED_AT_KEY\);\s+const variantRaw = storage\.getItem\(HERO_VARIANT_KEY\);\s+const startedAt = startedRaw \? Number\(startedRaw\) : NaN;\s+const hasValidWindow = Number\.isFinite\(startedAt\) && now - startedAt <= HERO_AB_WINDOW_MS;\s+if \(!hasValidWindow\) \{[\s\S]*?\}\s+if \(variantRaw === "A" \|\| variantRaw === "B"\) \{\s+applyVariant\(variantRaw\);\s+\} else \{\s+const fallbackVariant: "A" \| "B" = Math\.random\(\) < 0\.5 \? "A" : "B";\s+storage\.setItem\(HERO_VARIANT_KEY, fallbackVariant\);\s+applyVariant\(fallbackVariant\);\s+\}\s+\} catch \{\s+\/\/ setHeroVariant fallback;\s+\}\s+ \}, \[\]\);/, '');

// Delete Subtitle AB useEffect
content = content.replace(/  useEffect\(\(\) => \{\s+const windowRef = getWindowOrNull\(\);\s+if \(!windowRef\) return;\s+try \{\s+const now = Date\.now\(\);\s+const storage = windowRef\.localStorage;\s+const startedRaw = storage\.getItem\(SUBTITLE_VARIANT_STARTED_AT_KEY\);\s+const variantRaw = storage\.getItem\(SUBTITLE_VARIANT_KEY\);\s+const startedAt = startedRaw \? Number\(startedRaw\) : NaN;\s+const hasValidWindow = Number\.isFinite\(startedAt\) && now - startedAt <= HERO_AB_WINDOW_MS;\s+if \(!hasValidWindow\) \{[\s\S]*?\}\s+if \(variantRaw === "A" \|\| variantRaw === "B"\) \{\s+setSubtitleVariant\(variantRaw\);\s+\} else \{\s+const fallback: "A" \| "B" = Math\.random\(\) < 0\.5 \? "A" : "B";\s+storage\.setItem\(SUBTITLE_VARIANT_KEY, fallback\);\s+setSubtitleVariant\(fallback\);\s+\}\s+\} catch \{\s+\/\/ setSubtitleVariant fallback;\s+\}\s+ \}, \[\]\);/, '');

// Delete Checkout CTA AB useEffect
content = content.replace(/  useEffect\(\(\) => \{\s+const windowRef = getWindowOrNull\(\);\s+if \(!windowRef\) return;\s+try \{\s+const now = Date\.now\(\);\s+const storage = windowRef\.localStorage;\s+const startedRaw = storage\.getItem\(CHECKOUT_CTA_VARIANT_STARTED_AT_KEY\);\s+const variantRaw = storage\.getItem\(CHECKOUT_CTA_VARIANT_KEY\);\s+const startedAt = startedRaw \? Number\(startedRaw\) : NaN;\s+const hasValidWindow = Number\.isFinite\(startedAt\) && now - startedAt <= HERO_AB_WINDOW_MS;\s+if \(!hasValidWindow\) \{[\s\S]*?\}\s+if \(variantRaw === "A" \|\| variantRaw === "B"\) \{\s+setCheckoutCtaVariant\(variantRaw\);\s+\} else \{\s+const fallback: "A" \| "B" = Math\.random\(\) < 0\.5 \? "A" : "B";\s+storage\.setItem\(CHECKOUT_CTA_VARIANT_KEY, fallback\);\s+setCheckoutCtaVariant\(fallback\);\s+\}\s+\} catch \{\s+\/\/ setCheckoutCtaVariant fallback;\s+\}\s+ \}, \[\]\);/, '');

fs.writeFileSync(filePath, content);
console.log('Landing.tsx cleanup complete.');
