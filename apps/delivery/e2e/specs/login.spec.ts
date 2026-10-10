import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { E2E_RIDER } from '../data/session';
import { ALERT, LOGIN } from '../data/selectors';
import { expect, test } from '../fixtures/test';

/* Signing in is what this spec is about, so it starts signed out. */
test.use({ signedIn: false });

test.describe('Signing in', () => {
  test('sends a rider without a session to the login screen', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.ORDER);

    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.LOGIN}$`));
    await expect(page.locator(LOGIN.SUBMIT)).toBeVisible();
  });

  test('shows the validation messages for an empty form', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.LOGIN);
    await page.locator(LOGIN.SUBMIT).click();

    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
  });

  test('signs in and continues onboarding', async ({ page }) => {
    await page.goto(APP_ROUTE_LINKS.LOGIN);
    await page.locator(LOGIN.EMAIL).fill(E2E_RIDER.email);
    await page.locator(LOGIN.PASSWORD).fill(E2E_RIDER.password);
    await page.locator(LOGIN.SUBMIT).click();

    await expect(page.locator(ALERT.MESSAGE)).toHaveText('Login Successfully');
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.PERSONAL_INFORMATION}$`));
  });

  test('stays on login when Supabase rejects the credentials', async ({ page }) => {
    /* Registered after the fixture's stub, so it runs first. */
    await page.route('**/auth/v1/token**', (route) => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', msg: 'Invalid login credentials' }) }));

    await page.goto(APP_ROUTE_LINKS.LOGIN);
    await page.locator(LOGIN.EMAIL).fill(E2E_RIDER.email);
    await page.locator(LOGIN.PASSWORD).fill('wrong-password');
    await page.locator(LOGIN.SUBMIT).click();

    await expect(page.locator(ALERT.MESSAGE)).toContainText('Invalid login credentials');
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.LOGIN}$`));
  });
});
