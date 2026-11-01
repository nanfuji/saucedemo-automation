import { test, expect } from '../fixtures/test-fixtures';
import { products } from '../test-data/products';
import { loginErrors } from '../test-data/users';

test.describe('Module 7: Navigation & User Session @navigation', () => {
  test('NAV-001: open sidebar menu', async ({ loggedInInventory: inventory }) => {
    await expect(inventory.header.menuPanel).toHaveAttribute('aria-hidden', 'true');

    await inventory.header.openMenu();

    for (const link of [inventory.header.allItemsLink, inventory.header.aboutLink, inventory.header.logoutLink, inventory.header.resetAppStateLink]) {
      await expect(link).toBeVisible();
    }
    await expect(inventory.header.allItemsLink).toHaveText('All Items');
    await expect(inventory.header.aboutLink).toHaveText('About');
    await expect(inventory.header.logoutLink).toHaveText('Logout');
    await expect(inventory.header.resetAppStateLink).toHaveText('Reset App State');
  });

  test('NAV-002: close sidebar menu', async ({ loggedInInventory: inventory }) => {
    await inventory.header.openMenu();

    await inventory.header.closeMenu();

    await expect(inventory.header.logoutLink).toBeHidden();
    await expect(inventory.header.menuButton).toBeVisible();
  });

  test('NAV-003: All Items returns to the inventory from another page', async ({ loggedInInventory: inventory, cartPage }) => {
    await inventory.header.openCart();
    await cartPage.expectLoaded();

    await cartPage.header.openMenu();
    await cartPage.header.allItemsLink.click();

    await inventory.expectLoaded();
  });

  test('NAV-004: About navigates to the Sauce Labs website', async ({ loggedInInventory: inventory, page }) => {
    await inventory.header.openMenu();
    await expect(inventory.header.aboutLink).toHaveAttribute('href', 'https://saucelabs.com/');

    await inventory.header.aboutLink.click();

    await expect(page).toHaveURL(/^https:\/\/saucelabs\.com\/?/);
  });

  test('NAV-005: Logout ends the session and shows the login page', async ({ loggedInInventory: inventory, loginPage, page }) => {
    await inventory.header.logout();

    await expect(page).toHaveURL(/saucedemo\.com\/$/);
    await loginPage.expectOnLoginPage();
    await expect(loginPage.usernameInput).toBeEmpty();
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'session-username')).toBe(false);
  });

  test('NAV-006: inventory is not accessible after logout', async ({ loggedInInventory: inventory, loginPage, page }) => {
    await inventory.header.logout();

    await page.goto('/inventory.html');

    await loginPage.expectError(loginErrors.unauthenticated('/inventory.html'));
    await expect(inventory.inventoryList).toHaveCount(0);
  });

  test('NAV-007: browser back and forward navigation keeps state consistent', async ({ loggedInInventory: inventory, productDetailsPage, cartPage, page }) => {
    await inventory.addToCart(products.backpack.name);
    await inventory.openProduct(products.backpack.name);
    await productDetailsPage.expectLoaded(products.backpack.id);
    await productDetailsPage.header.openCart();

    await page.goBack();
    await productDetailsPage.expectLoaded(products.backpack.id);
    await expect(productDetailsPage.removeButton).toBeVisible();

    await page.goBack();
    await inventory.expectLoaded();
    await inventory.header.expectCartCount(1);

    await page.goForward();
    await page.goForward();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText([products.backpack.name]);
  });

  test('NAV-008: refreshing the inventory keeps the session and cart', async ({ loggedInInventory: inventory, page }, testInfo) => {
    await inventory.addToCart(products.bikeLight.name);
    await inventory.sortBy('za');

    await page.reload();

    await inventory.expectLoaded();
    await expect(inventory.items).toHaveCount(6);
    await inventory.header.expectCartCount(1);
    await expect(inventory.removeButton(products.bikeLight.name)).toBeVisible();
    if ((await inventory.activeSortOption.innerText()) === 'Name (A to Z)') {
      testInfo.annotations.push({ type: 'observation', description: 'Selected sort order is not persisted across a page refresh (resets to Name A to Z).' });
    }
  });
});
