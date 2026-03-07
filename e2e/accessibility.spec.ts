import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Scans', () => {
    test('Landing page should not have accessibility violations', async ({ page }) => {
        // Navigate to the local server
        await page.goto('/');

        // Analyze the page with Axe (exclude Next.js dev overlay which has known issues)
        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude('nextjs-portal')
            .analyze();

        // Expect no violations
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    // Example test for specific components if they have separate pages or states
    test('Components should be accessible', async ({ page }) => {
        // Since we don't have a specific route for orbits right now, we can check 
        // the main landing page or any specific modal if it's opened.
        // For now, we ensure the AxeBuilder runs successfully.
        await page.goto('/');

        // You can also exclude certain elements if they are known issues you are working on
        const accessibilityScanResults = await new AxeBuilder({ page })
            // .exclude('#some-element-id')
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
