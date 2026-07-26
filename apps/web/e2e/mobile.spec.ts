import { expect, test } from '@playwright/test';
import { boot } from './helpers';

test('mobile: the EKO placeholder and wallet render without paper trading controls', async ({ page }) => {
  await boot(page);
  await expect(page.getByTestId('wallet-button')).toBeVisible();
  await expect(page.getByTestId('mode-switch')).toHaveCount(0);
  await expect(page.getByTestId('trade-buy')).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Settings', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Trade amounts' }).first()).toBeVisible();
});
