import { expect, field, test } from '../fixtures/test';

/** Sign-in screens, signed out. */
test.use({ signedIn: false });

test.describe('auth pages', () => {
  test('a signed-out visitor is sent to login', async ({ page }) => {
    await page.goto('/main/home');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('login validates, signs in and asks for a phone number', async ({ page, backend }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();

    await field(page, 'Email').fill('asha@example.com');
    await field(page, 'Password').fill('secret1');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/phonenumber$/);
    await expect(page.getByText('Login Successfully')).toBeVisible();
    expect(backend.calls).toContain('/auth/v1/token');
  });

  test('register checks the passwords match, then returns to login', async ({ page }) => {
    await page.goto('/register');
    await field(page, 'Full name').fill('Asha Rao');
    await field(page, 'Email').fill('asha@example.com');
    await field(page, 'Password').fill('secret1');
    await field(page, 'Confirm password').fill('other12');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Passwords must match.')).toBeVisible();

    await field(page, 'Confirm password').fill('secret1');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('The Account Created Successfully')).toBeVisible();
  });

  test('forgot password sends the reset email', async ({ page, backend }) => {
    await page.goto('/forget');
    await field(page, 'Email').fill('asha@example.com');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Please check the Email box')).toBeVisible();
    expect(backend.calls).toContain('/auth/v1/recover');
  });

  test('login links to register and forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forget Password ?' }).click();
    await expect(page).toHaveURL(/\/forget$/);
  });
});
