import { test, expect } from '../fixtures/test-fixtures';
import { allProducts, products } from '../test-data/products';
import { completeMessages } from '../test-data/checkout';

const orderedProducts = [products.backpack.name, products.fleeceJacket.name, products.onesie.name];

test.describe('Module 6: Order Confirmation @confirmation', () => {
  test.beforeEach(async ({ loggedInInventory: _inventory, shop, overviewPage, completePage }) => {
    await shop.goToOverview(orderedProducts);
    await overviewPage.finish();
    await completePage.expectLoaded();
  });

  test('CONF-001: successful order completion shows the confirmation page', async ({ page, completePage }) => {
    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(completePage.title).toHaveText('Checkout: Complete!');
    await expect(completePage.confirmationImage).toBeVisible();
  });

  test('CONF-002: "Thank you for your order!" message is displayed', async ({ completePage }) => {
    await expect(completePage.completeHeader).toHaveText(completeMessages.header);
  });

  test('CONF-003: order dispatch confirmation message is displayed', async ({ completePage }) => {
    await expect(completePage.completeText).toHaveText(completeMessages.text);
  });

  test('CONF-004: Back Home returns to a reset inventory page', async ({ completePage, inventoryPage }) => {
    await expect(completePage.backHomeButton).toBeEnabled();

    await completePage.backHome();

    await inventoryPage.expectLoaded();
    await expect(inventoryPage.page.getByRole('button', { name: 'Add to cart' })).toHaveCount(allProducts.length);
  });

  test('CONF-005: cart is empty after order completion', async ({ page, completePage, cartPage }) => {
    await completePage.header.openCart();

    await expect(cartPage.items).toHaveCount(0);
    const stored = await page.evaluate(() => window.localStorage.getItem('cart-contents'));
    expect(JSON.parse(stored ?? '[]')).toEqual([]);
  });

  test('CONF-006: cart badge disappears after order completion', async ({ completePage, page }) => {
    await completePage.header.expectCartCount(0);
    await page.reload();
    await completePage.header.expectCartCount(0);
  });
});
