import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { E2E_RIDER } from '../data/session';
import { ALERT, REGISTER } from '../data/selectors';
import { expect, test } from '../fixtures/test';

test.use({ signedIn: false });

test.describe('Registering', () => {
  test('rejects a confirmation that does not match', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.REGISTER);
    await page.locator(REGISTER.NAME).fill(E2E_RIDER.name);
    await page.locator(REGISTER.EMAIL).fill(E2E_RIDER.email);
    await page.locator(REGISTER.PASSWORD).fill(E2E_RIDER.password);
    await page.locator(REGISTER.CONFIRM).fill('something-else');
    await page.locator(REGISTER.SUBMIT).click();

    await expect(page.getByText('Passwords must match.')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.REGISTER}$`));
  });

  test('creates the account and opens personal information', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.REGISTER);
    await page.locator(REGISTER.NAME).fill(E2E_RIDER.name);
    await page.locator(REGISTER.EMAIL).fill(E2E_RIDER.email);
    await page.locator(REGISTER.PASSWORD).fill(E2E_RIDER.password);
    await page.locator(REGISTER.CONFIRM).fill(E2E_RIDER.password);
    await page.locator(REGISTER.SUBMIT).click();

    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.PERSONAL_INFORMATION}$`));
    await expect(page.locator(ALERT.MESSAGE)).toHaveText('The Account Created Successfully');
  });
});
