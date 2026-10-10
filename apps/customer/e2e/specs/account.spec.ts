import { expect, field, labeledField, test } from '../fixtures/test';

test.describe('account (signed in)', () => {
  test('shows the customer and links to account information', async ({ page }) => {
    await page.goto('/main/account');
    await expect(page.getByText('Asha Rao')).toBeVisible();
    await page.getByText('Account information', { exact: true }).click();
    await expect(page).toHaveURL(/\/main\/account-information$/);
    await expect(field(page, 'Full name')).toHaveValue('Asha Rao');
    await expect(field(page, 'Email')).toHaveValue('asha@example.com');
  });

  test('saving account information validates the phone, then says not connected', async ({ page }) => {
    await page.goto('/main/account-information');
    await field(page, 'Phone number').fill('123');
    await page.getByRole('button', { name: 'Change Information' }).click();
    await expect(page.getByText('Phone Number must be 10 digits.')).toBeVisible();
    await field(page, 'Phone number').fill('9876543210');
    await page.getByRole('button', { name: 'Change Information' }).click();
    await expect(page.getByText('Not connected yet')).toBeVisible();
  });

  test('delivery location prefills the address from the device position', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 18.52, longitude: 73.85 });
    await page.route('http://localhost:4000/geocode/reverse**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ result: { placeId: 7, displayName: 'FC Road, Pune', lat: 18.52, lng: 73.85, address: { road: 'FC Road', city: 'Pune', country: 'India' } }, attribution: '© OpenStreetMap contributors' }),
      }),
    );
    await page.goto('/location');
    await page.getByText('Use my location').click();
    await expect(labeledField(page, 'City')).toHaveValue('Pune');
    await expect(page.getByText('© OpenStreetMap contributors')).toBeVisible();
  });
});
