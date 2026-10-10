import { expect, field, test } from '../fixtures/test';

test.describe('table booking (signed in)', () => {
  test('the booking form requires every field', async ({ page }) => {
    await page.goto('/main/table-details?id=t1');
    await expect(page.getByText('Book a Table')).toBeVisible();
    await page.getByRole('button', { name: 'Book Table' }).click();
    await expect(page.getByText('Guests must be at least 1')).toBeVisible();
    await expect(page.getByText('Date is required')).toBeVisible();
    await expect(page.getByText('First name is required')).toBeVisible();
  });

  test('guests, date and time can be picked, then booking says not connected', async ({ page }) => {
    await page.goto('/main/table-details?id=t1');
    await page.getByRole('button', { name: 'Increase guests' }).click();
    await page.getByRole('button', { name: 'Pick a date' }).click();
    const picker = page.locator('ion-modal ion-datetime');
    await expect(picker).toBeVisible();
    // Next month, 15th, so every slot is in the future.
    await picker.getByRole('button', { name: 'Next month' }).click();
    await picker.locator('.calendar-day:not([disabled])', { hasText: /^15$/ }).first().click();
    await picker.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('button', { name: '19:30' }).click();
    await field(page, 'First name').fill('Asha');
    await field(page, 'Last name').fill('Rao');
    await field(page, 'Email').fill('asha@example.com');
    await page.getByRole('button', { name: 'Book Table' }).click();
    await expect(page.getByText('Not connected yet')).toBeVisible();
  });
});
