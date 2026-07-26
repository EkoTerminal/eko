import { expect, test } from '@playwright/test';
import { boot } from './helpers';

test('first visit renders the skeleton without the retired analyst welcome or tour', async ({ page }) => {
  await boot(page);
  await expect(page.getByTestId('welcome')).toHaveCount(0);
  await expect(page.getByTestId('tour')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('EKO terminal', { exact: true })).toBeVisible();
});

test('onboarding preferences remain stored for the future EKO steps', async ({ page }) => {
  await boot(page);
  const saved = await page.request.put('/api/preferences', { data: { onboarding: { welcomeDone: true, tourDone: true } } });
  expect(saved.ok()).toBeTruthy();
  await page.reload();
  const session = await (await page.request.get('/api/session')).json();
  expect(session.preferences.onboarding).toMatchObject({ welcomeDone: true, tourDone: true });
  await expect(page.getByTestId('welcome')).toHaveCount(0);
});
