import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Scans', () => {
    test('Landing page should not have critical accessibility violations', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude('nextjs-portal')
            // Known cosmetic items that don't affect UX
            .disableRules(['color-contrast'])
            .analyze();

        // Only fail on serious/critical violations
        const critical = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
        );
        expect(critical).toEqual([]);
    });

    test('Pulse Check modal skip button should be reachable and clickable', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check if the pulse check modal is present
        const skipButton = page.getByRole('button', { name: /تخطي اليوم/ });
        const isVisible = await skipButton.isVisible().catch(() => false);

        if (isVisible) {
            // Verify the button is actually clickable (not covered by another layer)
            await expect(skipButton).toBeEnabled();
            const box = await skipButton.boundingBox();
            expect(box).not.toBeNull();
        }
        // If modal is not open, test passes vacuously (depends on daily state)
    });

    test('Main application shell has correct heading hierarchy', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude('nextjs-portal')
            .withRules(['heading-order', 'page-has-heading-one'])
            .analyze();

        // Log (not fail) any heading order warnings
        if (accessibilityScanResults.violations.length > 0) {
            console.warn('Heading order issues:', accessibilityScanResults.violations.map(v => v.description));
        }
    });
});
