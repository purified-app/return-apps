import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Pin returnUrl', () => {
  test('demo caller round-trips a PIN via hash delivery', async ({ page }) => {
    await page.goto('/demo-caller');
    await page.getByRole('button', { name: 'Enter PIN' }).click();
    await expect(page.getByRole('heading', { name: /PIN|Skriv PIN|Enter PIN/i })).toBeVisible();

    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await page.getByRole('button', { name: /Done|Ferdig/ }).click();

    await expect(page).toHaveURL(/\/demo-caller/);
    await expect(page.locator('.meta__value')).toHaveText('1234');
    await expect(page.getByText('pin.digits')).toBeVisible();
  });

  test('PIN pad and home pass axe WCAG A/AA', async ({ page }) => {
    await page.goto('/');
    const pad = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(pad.violations, JSON.stringify(pad.violations, null, 2)).toEqual([]);

    await page.goto('/home');
    const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(home.violations, JSON.stringify(home.violations, null, 2)).toEqual([]);
  });
});
