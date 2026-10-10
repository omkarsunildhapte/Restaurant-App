import { APP_ROUTE_LINKS, PUBLIC_ROUTES, SIGNED_IN_ROUTES } from '@constants/routes.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { E2E_RIDER } from '../data/session';
import { ALERT, LOGIN, SCREEN_MARKERS } from '../data/selectors';
import { expect, test } from '../fixtures/test';

test.describe('Every signed-in route', () => {
  for (const path of SIGNED_IN_ROUTES) {
    test(`/${path} opens with its own screen`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(`/${path}`);

      await expect(page).toHaveURL(new RegExp(`/${path}$`));
      await expect(page.locator(SCREEN_MARKERS[path])).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('the account screen shows the signed-in rider and signs out', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.ACCOUNT);
    await expect(page.locator(SCREEN_MARKERS['account'])).toHaveText(E2E_RIDER.name);

    await page.getByTestId('account-logout').click();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.LOGIN}$`));
  });

  test('saving UPI before personal information asks for it first', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.BANK_DETAILS);
    await page.locator('[data-testid="bank-upi"] input').fill('rider@okbank');
    await page.getByTestId('bank-submit').click();

    await expect(page.locator(ALERT.MESSAGE)).toHaveText(ERROR_MESSAGES.PROFILE_FIRST);
  });
});

test.describe('Every public route', () => {
  test.use({ signedIn: false });

  for (const path of PUBLIC_ROUTES) {
    test(`/${path} renders`, async ({ page }) => {
      await page.goto(`/${path}`);
      await expect(page).toHaveURL(new RegExp(`/${path}$`));
      await expect(page.locator('ion-button[type="submit"]')).toBeVisible();
    });
  }

  test('the root redirects to register', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.REGISTER}$`));
  });

  test('login links to register and forgot password', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.LOGIN);
    await expect(page.locator(LOGIN.SUBMIT)).toBeVisible();
    await page.getByRole('link', { name: 'Forget Password ?' }).click();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.FORGOT_PASSWORD}$`));
  });
});
