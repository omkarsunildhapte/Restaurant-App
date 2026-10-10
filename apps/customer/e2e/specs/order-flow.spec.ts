import { expect, test } from '../fixtures/test';

/** Menu → cart → confirm with the data stubs: empty states, then "Not connected yet". */
test.describe('menu, cart and confirm order', () => {
  test('menu and cart show their empty states and link to each other', async ({ page }) => {
    await page.goto('/main/foods');
    await expect(page.getByText('No menu items yet.')).toBeVisible();

    await page.locator('ion-tab-button', { hasText: 'Cart' }).click();
    await expect(page).toHaveURL(/\/main\/add-cart$/);
    await expect(page.getByText('Your cart is empty.')).toBeVisible();

    await page.locator('ion-button', { hasText: 'Make Order' }).click();
    await expect(page).toHaveURL(/\/main\/foods$/);
  });

  test('confirming an order says the backend is not connected yet', async ({ page }) => {
    await page.goto('/main/confirm-order');
    await expect(page.getByText('Cash on Delivery')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.getByText('Not connected yet')).toBeVisible();
    await expect(page).toHaveURL(/\/main\/confirm-order$/);
  });

  test('an unknown menu item shows its unavailable state', async ({ page }) => {
    await page.goto('/main/food-review?id=missing');
    await expect(page.getByText('This item is not available.')).toBeVisible();
  });
});
