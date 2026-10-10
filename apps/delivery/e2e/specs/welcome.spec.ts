import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { WELCOME } from '../data/selectors';
import { expect, test } from '../fixtures/test';

/**
 * Riders are invite-only: the restaurant's invite e-mail signs the rider in and lands on /welcome,
 * where they choose a password. The signed-in fixture stands in for the session the link creates.
 */
test.describe('Accepting an invite', () => {
  test('sets a password, then continues to personal information', async ({ page }) => {
    let passwordSent: unknown = null;
    await page.route('**/auth/v1/user**', async (route) => {
      if (route.request().method() === 'PUT') {
        passwordSent = route.request().postDataJSON()?.password ?? null;
      }
      await route.fallback();
    });

    await page.goto(APP_ROUTE_LINKS.WELCOME);
    await expect(page.locator(WELCOME.SUBMIT)).toBeVisible();

    await page.locator(WELCOME.PASSWORD).fill('short');
    await page.locator(WELCOME.CONFIRM).fill('different');
    await page.locator(WELCOME.SUBMIT).click();
    await expect(page.getByText('Password must be at least 8 characters long.')).toBeVisible();
    await expect(page.getByText('Passwords must match.')).toBeVisible();

    await page.locator(WELCOME.PASSWORD).fill('a-good-password');
    await page.locator(WELCOME.CONFIRM).fill('a-good-password');
    await page.locator(WELCOME.SUBMIT).click();

    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.PERSONAL_INFORMATION}$`));
    expect(passwordSent).toBe('a-good-password');
  });
});

test.describe('An expired invite link', () => {
  test.use({ signedIn: false });

  test('says so and offers sign in', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.WELCOME);
    await expect(page.getByTestId('welcome-expired')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('welcome-login').click();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.LOGIN}$`));
  });
});
