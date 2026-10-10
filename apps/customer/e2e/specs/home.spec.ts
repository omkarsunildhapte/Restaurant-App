import { expect, test } from '../fixtures/test';

test.describe('home and tabs (signed in)', () => {
  test('/ opens the home tab with the delivery header and empty menu', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/main\/home$/);
    await expect(page.getByText('Delivery to')).toBeVisible();
    await expect(page.getByText('No menu items yet.')).toBeVisible();
  });

  test('the tab bar switches screens', async ({ page }) => {
    await page.goto('/main/home');
    await page.locator('ion-tab-button', { hasText: 'Table Booking' }).click();
    await expect(page).toHaveURL(/\/main\/table$/);
    await expect(page.getByText('No tables to book yet.')).toBeVisible();
    await page.locator('ion-tab-button', { hasText: 'Account' }).click();
    await expect(page).toHaveURL(/\/main\/account$/);
  });
});
