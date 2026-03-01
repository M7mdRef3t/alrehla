import fs from 'fs';

const filePath = 'src/components/Landing.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Force add imports if they are missing at top (check for designToggles instead)
if (!content.includes('import { designToggles }')) {
    content = content.replace(
        'import { isPublicPaymentsEnabled } from "../config/payments";',
        'import { isPublicPaymentsEnabled } from "../config/payments";\nimport { useABTestingVariant } from "../hooks/useABTestingVariant";\nimport { designToggles } from "../config/designToggles";'
    );
}

// Fix useLandingLiveData call
content = content.replace(
    /const landingLiveData = useLandingLiveData\(landingCopy\.testimonials \?\? \[\]\);/,
    'const landingLiveData = useLandingLiveData(landingCopy.testimonials ?? [], {\n    enableLiveMetrics: designToggles.enableLiveLandingSections,\n    enableLiveTestimonials: designToggles.enableLiveLandingSections\n  });'
);

// Fix FeatureShowcaseSection (remove liveEnabled if added by previous run)
content = content.replace(
    'liveEnabled={designToggles.enableLiveLandingSections}',
    ''
);

// Fix MetricsSection
if (!content.includes('metricsState={landingLiveData.metrics}\n          liveEnabled')) {
    content = content.replace(
        '<MetricsSection stagger={stagger} item={item(reduceMotion)} metricsState={landingLiveData.metrics} />',
        '<MetricsSection\n          stagger={stagger}\n          item={item(reduceMotion)}\n          metricsState={landingLiveData.metrics}\n          liveEnabled={designToggles.enableLiveLandingSections}\n        />'
    );
}

// Fix TestimonialsSection
if (!content.includes('testimonialsState={landingLiveData.testimonials}\n          liveEnabled')) {
    content = content.replace(
        '<TestimonialsSection\n          stagger={stagger}\n          item={item(reduceMotion)}\n          testimonials={landingCopy.testimonials ?? []}\n          testimonialsState={landingLiveData.testimonials}\n        />',
        '<TestimonialsSection\n          stagger={stagger}\n          item={item(reduceMotion)}\n          testimonials={landingCopy.testimonials ?? []}\n          testimonialsState={landingLiveData.testimonials}\n          liveEnabled={designToggles.enableLiveLandingSections}\n        />'
    );
}

fs.writeFileSync(filePath, content);
console.log('Landing.tsx fixed successfully.');
