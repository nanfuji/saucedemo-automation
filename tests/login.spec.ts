import { test, expect } from '../fixtures/test-fixtures';
import { users, invalidCredentials, loginErrors } from '../test-data/users';

test.describe('Module 1: Login & Authentication @login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('LOGIN-001: login with valid credentials opens the inventory page', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.loginAs(users.standard);

    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items).toHaveCount(6);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'session-username')?.value).toBe(users.standard.username);
  });

  const negativeScenarios = [
    { id: 'LOGIN-002', title: 'invalid username', username: invalidCredentials.username, password: users.standard.password, error: loginErrors.invalidCredentials },
    { id: 'LOGIN-003', title: 'invalid password', username: users.standard.username, password: invalidCredentials.password, error: loginErrors.invalidCredentials },
    { id: 'LOGIN-004', title: 'invalid username and password', username: invalidCredentials.username, password: invalidCredentials.password, error: loginErrors.invalidCredentials },
    { id: 'LOGIN-005', title: 'empty username', username: '', password: users.standard.password, error: loginErrors.usernameRequired },
    { id: 'LOGIN-006', title: 'empty password', username: users.standard.username, password: '', error: loginErrors.passwordRequired },
    { id: 'LOGIN-007', title: 'both fields empty', username: '', password: '', error: loginErrors.usernameRequired },
  ];

  for (const scenario of negativeScenarios) {
    test(`${scenario.id}: login with ${scenario.title} is rejected`, async ({ page, loginPage }) => {
      await loginPage.login(scenario.username, scenario.password);

      await loginPage.expectError(scenario.error);
      await expect(page).toHaveURL(/saucedemo\.com\/$/);
      await loginPage.expectOnLoginPage();
      const cookies = await page.context().cookies();
      expect(cookies.some((c) => c.name === 'session-username')).toBe(false);
    });
  }

  test('LOGIN-008: locked_out_user is rejected with a lock-out message', async ({ page, loginPage }) => {
    await loginPage.loginAs(users.lockedOut);

    await loginPage.expectError(loginErrors.lockedOut);
    await expect(page).toHaveURL(/saucedemo\.com\/$/);
    await expect(page.getByTestId('inventory-list')).toHaveCount(0);
  });

  test('LOGIN-009: problem_user can log in and reach the inventory', async ({ loginPage, inventoryPage }) => {
    await loginPage.loginAs(users.problem);

    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items).toHaveCount(6);
    await expect(inventoryPage.header.cartLink).toBeVisible();
  });

  test('LOGIN-010: performance_glitch_user can log in despite delayed response', async ({ loginPage, inventoryPage }, testInfo) => {
    test.slow();
    const start = Date.now();
    await loginPage.loginAs(users.performanceGlitch);
    await expect(inventoryPage.title).toHaveText('Products', { timeout: 30_000 });
    const elapsedMs = Date.now() - start;

    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items).toHaveCount(6);
    testInfo.annotations.push({ type: 'performance', description: `performance_glitch_user login took ${elapsedMs} ms` });
  });

  test('LOGIN-011: password field masks entered characters', async ({ loginPage }) => {
    await loginPage.passwordInput.fill(users.standard.password);

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordInput).toHaveValue(users.standard.password);
    await expect(loginPage.usernameInput).toHaveAttribute('type', 'text');
  });

  test('LOGIN-012: login error message can be dismissed', async ({ loginPage }) => {
    await loginPage.login(invalidCredentials.username, invalidCredentials.password);
    await loginPage.expectError(loginErrors.invalidCredentials);

    await loginPage.errorDismissButton.click();

    await expect(loginPage.errorMessage).toBeHidden();
    await expect(loginPage.errorDismissButton).toBeHidden();
    await expect(loginPage.usernameInput).toHaveValue(invalidCredentials.username);
  });
});
