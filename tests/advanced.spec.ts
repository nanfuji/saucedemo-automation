import { test, expect } from '../fixtures/test-fixtures';
import { allProducts, products } from '../test-data/products';
import { users, loginErrors } from '../test-data/users';
import { checkoutErrors, injectionPayloads, validCustomer } from '../test-data/checkout';
import { annotateKnownDefect, calculateOrderTotals, formatCents } from '../utils/helpers';

test.describe('Module 9: Advanced Testing @advanced', () => {
  for (const clicks of [5, 6]) {
    test(`ADV-001: rapidly clicking Add to Cart ${clicks} times leaves a consistent cart`, async ({ loggedInInventory: inventory, page }) => {
      const toggle = inventory.cartToggleButton(products.backpack.name);
      for (let i = 0; i < clicks; i++) {
        await toggle.click({ delay: 0 });
      }

      const inCart = clicks % 2 === 1;
      await inventory.header.expectCartCount(inCart ? 1 : 0);
      await expect(toggle).toHaveText(inCart ? 'Remove' : 'Add to cart');
      const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('cart-contents'))) ?? '[]');
      expect(stored).toEqual(inCart ? [products.backpack.id] : []);
    });
  }

  const protectedPages = [
    { id: 'ADV-002', name: 'inventory', path: '/inventory.html' },
    { id: 'ADV-003', name: 'cart', path: '/cart.html' },
    { id: 'ADV-004', name: 'checkout (step one)', path: '/checkout-step-one.html' },
    { id: 'ADV-004', name: 'checkout (overview)', path: '/checkout-step-two.html' },
    { id: 'ADV-004', name: 'checkout (complete)', path: '/checkout-complete.html' },
  ];

  for (const target of protectedPages) {
    test(`${target.id}: ${target.name} is not accessible without authentication`, async ({ page, loginPage }) => {
      await page.goto(target.path);

      await loginPage.expectError(loginErrors.unauthenticated(target.path));
      await loginPage.expectOnLoginPage();
      await expect(page.getByTestId('title')).toHaveCount(0);
      await expect(page.getByTestId('shopping-cart-link')).toHaveCount(0);
    });
  }

  test('ADV-005: refreshing during checkout preserves the order and allows completion', async ({ loggedInInventory: _inventory, shop, checkoutPage, overviewPage, completePage, page }, testInfo) => {
    const selection = [products.backpack.name, products.bikeLight.name];
    const expected = calculateOrderTotals([products.backpack.price, products.bikeLight.price]);
    await shop.goToCheckoutInformation(selection);
    await checkoutPage.fillInformation(validCustomer);

    await page.reload();
    await checkoutPage.expectLoaded();
    if ((await checkoutPage.firstNameInput.inputValue()) === '') {
      testInfo.annotations.push({ type: 'observation', description: 'Checkout information form is cleared on refresh; user must re-enter details.' });
    }
    await checkoutPage.submitInformation(validCustomer);
    await overviewPage.expectLoaded();

    await page.reload();
    await overviewPage.expectLoaded();
    await expect(overviewPage.itemNames).toHaveText(selection);
    await expect(overviewPage.totalLabel).toHaveText(`Total: ${formatCents(expected.totalCents)}`);

    await overviewPage.finish();
    await completePage.expectLoaded();
  });

  test('ADV-006: performance_glitch_user completes an end-to-end purchase', async ({ shop, inventoryPage, overviewPage, completePage }, testInfo) => {
    test.slow();
    const loginStart = Date.now();
    await shop.loginAs(users.performanceGlitch);
    const loginMs = Date.now() - loginStart;

    const sortStart = Date.now();
    await inventoryPage.sortBy('lohi');
    await expect(inventoryPage.itemNames.first()).toHaveText(products.onesie.name, { timeout: 20_000 });
    const sortMs = Date.now() - sortStart;

    const selection = [products.onesie.name, products.bikeLight.name];
    await shop.goToOverview(selection);
    const expected = calculateOrderTotals([products.onesie.price, products.bikeLight.price]);
    expect(await overviewPage.getDisplayedTotals()).toEqual(expected);
    await overviewPage.finish();
    await completePage.expectLoaded();

    testInfo.annotations.push({ type: 'performance', description: `login ${loginMs} ms, sort ${sortMs} ms` });
    annotateKnownDefect(testInfo.annotations, { user: 'performance_glitch_user', summary: `Artificial delay on login (${loginMs} ms) and sorting (${sortMs} ms).` });
  });

  test.describe('ADV-007: problem_user known anomalies (expected to fail until fixed)', () => {
    test.beforeEach(async ({ shop }) => {
      await shop.loginAs(users.problem);
    });

    test('ADV-007a: each product shows its own image', async ({ inventoryPage }, testInfo) => {
      annotateKnownDefect(testInfo.annotations, { user: 'problem_user', summary: 'Every product image is the same placeholder (sl-404) image.' });
      test.fail();
      const sources = (await inventoryPage.getDisplayedProducts()).map((p) => p.imageSrc);
      expect(new Set(sources).size).toBe(allProducts.length);
    });

    test('ADV-007b: sorting Name (Z to A) reorders products', async ({ inventoryPage }, testInfo) => {
      annotateKnownDefect(testInfo.annotations, { user: 'problem_user', summary: 'Sorting has no effect on the product order.' });
      test.fail();
      await inventoryPage.sortBy('za');
      await expect(inventoryPage.itemNames.first()).toHaveText(products.redTShirt.name, { timeout: 3_000 });
    });

    test('ADV-007c: every product can be added to the cart', async ({ inventoryPage }, testInfo) => {
      annotateKnownDefect(testInfo.annotations, { user: 'problem_user', summary: 'Add to cart does nothing for Bolt T-Shirt, Fleece Jacket and Test.allTheThings() T-Shirt.' });
      test.fail();
      for (const product of allProducts) {
        await inventoryPage.addToCartButton(product.name).click();
      }
      await inventoryPage.header.expectCartCount(allProducts.length);
    });

    test('ADV-007d: opening a product shows that product\'s details', async ({ inventoryPage, productDetailsPage }, testInfo) => {
      annotateKnownDefect(testInfo.annotations, { user: 'problem_user', summary: 'Product links open the wrong item (Backpack opens Fleece Jacket, id+1).' });
      test.fail();
      await inventoryPage.openProduct(products.backpack.name);
      await expect(productDetailsPage.name).toHaveText(products.backpack.name, { timeout: 3_000 });
    });

    test('ADV-007e: checkout accepts a last name', async ({ shop, checkoutPage, overviewPage }, testInfo) => {
      annotateKnownDefect(testInfo.annotations, { user: 'problem_user', summary: 'Typing in Last Name overwrites First Name; checkout fails with "Last Name is required".' });
      test.fail();
      await shop.goToCheckoutInformation([products.backpack.name]);
      await checkoutPage.submitInformation(validCustomer);
      await expect(checkoutPage.errorMessage).not.toHaveText(checkoutErrors.lastNameRequired, { timeout: 3_000 });
      await overviewPage.expectLoaded();
    });
  });

  test('ADV-008: login and add to cart using only the keyboard', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto();

    await page.keyboard.press('Tab');
    await expect(loginPage.usernameInput).toBeFocused();
    await page.keyboard.type(users.standard.username);
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
    await page.keyboard.type(users.standard.password);
    await page.keyboard.press('Tab');
    await expect(loginPage.loginButton).toBeFocused();
    await page.keyboard.press('Enter');
    await inventoryPage.expectLoaded();

    const firstAddButton = inventoryPage.addToCartButton(products.backpack.name);
    for (let i = 0; i < 10 && !(await firstAddButton.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(firstAddButton).toBeFocused();
    await page.keyboard.press('Enter');
    await inventoryPage.header.expectCartCount(1);
  });

  test('ADV-009: HTML/script injection in form inputs is rendered as text, never executed', async ({ page, loginPage, shop, checkoutPage, overviewPage }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await loginPage.goto();
    await loginPage.login(injectionPayloads.lastName, injectionPayloads.firstName);
    await loginPage.expectError(loginErrors.invalidCredentials);

    await shop.loginAs();
    await shop.goToCheckoutInformation([products.backpack.name]);
    await checkoutPage.fillInformation(injectionPayloads);
    await expect(checkoutPage.firstNameInput).toHaveValue(injectionPayloads.firstName);
    await checkoutPage.continueButton.click();
    await overviewPage.expectLoaded();

    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    await expect(page.locator('svg[onload]')).toHaveCount(0);
    expect(dialogs, 'no script-triggered dialogs should appear').toEqual([]);
  });

  test('ADV-010: protected pages remain inaccessible after logout', async ({ loggedInInventory: inventory, loginPage, page }, testInfo) => {
    await inventory.addToCart(products.backpack.name);
    await inventory.header.logout();
    await loginPage.expectOnLoginPage();

    await page.goBack();
    await loginPage.expectError(loginErrors.unauthenticated('/inventory.html'));

    for (const path of ['/inventory.html', '/cart.html', '/checkout-step-one.html', '/checkout-step-two.html', `/inventory-item.html?id=${products.backpack.id}`]) {
      await page.goto(path);
      await loginPage.expectError(loginErrors.unauthenticated(path.split('?')[0]));
    }

    const leftoverCart = await page.evaluate(() => localStorage.getItem('cart-contents'));
    if (leftoverCart && JSON.parse(leftoverCart).length > 0) {
      testInfo.annotations.push({ type: 'observation', description: 'Cart contents remain in localStorage after logout and reappear on next login.' });
    }
  });
});
