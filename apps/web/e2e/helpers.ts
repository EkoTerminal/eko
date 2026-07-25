import { expect, type Page } from '@playwright/test';

export async function boot(page: Page, path = '/trade') {
  await page.goto(path);
  await expect(page.getByText('EKO terminal', { exact: true })).toBeVisible();
}
