import { test, expect } from '../fixtures/test-fixtures';
import { allProducts, products, sortScenarios } from '../test-data/products';

const allNames = allProducts.map((p) => p.name);

test.describe('Module 3: Shopping Cart @cart', () => {
  test('CART-001: add one product to cart', async ({ loggedInInventory: inventory, page }) => {
    await inventory.addToCart(products.backpack.name);

    await inventory.header.expectCartCount(1);
    await expect(inventory.removeButton(products.backpack.name)).toBeVisible();
    await expect(inventory.addToCartButton(products.backpack.name)).toHaveCount(0);
    const stored = await page.evaluate(() => window.localStorage.getItem('cart-contents'));
    expect(JSON.parse(stored ?? '[]')).toEqual([products.backpack.id]);
  });

  test('CART-002: add multiple products to cart', async ({ loggedInInventory: inventory, shop, cartPage }) => {
    const selection = [products.backpack.name, products.boltTShirt.name, products.onesie.name];

    await shop.addToCartAndOpenCart(selection);

    await expect(cartPage.items).toHaveCount(selection.length);
    await expect(cartPage.itemNames).toHaveText(selection);
    await inventory.header.expectCartCount(selection.length);
  });

  test('CART-003: cart badge count tracks every add and remove', async ({ loggedInInventory: inventory }) => {
    await inventory.header.expectCartCount(0);
    for (const [index, name] of allNames.entries()) {
      await inventory.addToCart(name);
      await inventory.header.expectCartCount(index + 1);
    }
    for (const [index, name] of allNames.entries()) {
      await inventory.removeFromCart(name);
      await inventory.header.expectCartCount(allNames.length - index - 1);
    }
  });

  test('CART-004: remove product from inventory page', async ({ loggedInInventory: inventory, cartPage }) => {
    await inventory.addToCart(products.backpack.name, products.bikeLight.name);

    await inventory.removeFromCart(products.backpack.name);

    await inventory.header.expectCartCount(1);
    await inventory.header.openCart();
    await expect(cartPage.itemNames).toHaveText([products.bikeLight.name]);
    await expect(cartPage.item(products.backpack.name)).toHaveCount(0);
  });

  test('CART-005: remove product from cart page', async ({ loggedInInventory: inventory, shop, cartPage }) => {
    await shop.addToCartAndOpenCart([products.backpack.name, products.fleeceJacket.name]);

    await cartPage.removeItem(products.backpack.name);

    await expect(cartPage.itemNames).toHaveText([products.fleeceJacket.name]);
    await cartPage.header.expectCartCount(1);
    await cartPage.continueShopping();
    await expect(inventory.addToCartButton(products.backpack.name)).toBeVisible();
    await expect(inventory.removeButton(products.fleeceJacket.name)).toBeVisible();
  });

  test('CART-006: add all six products to cart', async ({ loggedInInventory: inventory, shop, cartPage }) => {
    await shop.addToCartAndOpenCart(allNames);

    await expect(cartPage.items).toHaveCount(6);
    await expect(cartPage.itemNames).toHaveText(allNames);
    await cartPage.header.expectCartCount(6);
    await cartPage.continueShopping();
    await expect(inventory.page.getByRole('button', { name: 'Add to cart' })).toHaveCount(0);
    await expect(inventory.page.getByRole('button', { name: 'Remove' })).toHaveCount(6);
  });

  test('CART-007: remove all products from cart', async ({ loggedInInventory: _inventory, shop, cartPage }) => {
    await shop.addToCartAndOpenCart(allNames);

    for (const name of allNames) {
      await cartPage.removeItem(name);
    }

    await expect(cartPage.items).toHaveCount(0);
    await cartPage.header.expectCartCount(0);
    await expect(cartPage.checkoutButton).toBeVisible();
  });

  test('CART-008: navigate to cart page via cart icon', async ({ loggedInInventory: inventory, cartPage }) => {
    await inventory.header.cartLink.click();

    await cartPage.expectLoaded();
    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.continueShoppingButton).toBeEnabled();
    await expect(cartPage.checkoutButton).toBeEnabled();
  });

  test('CART-009: product information in cart matches inventory', async ({ loggedInInventory: inventory, cartPage }) => {
    const selection = [products.bikeLight, products.redTShirt, products.fleeceJacket];
    const inventoryInfo = new Map<string, { price: string; description: string }>();
    for (const product of selection) {
      const card = inventory.item(product.name);
      inventoryInfo.set(product.name, {
        price: await card.getByTestId('inventory-item-price').innerText(),
        description: await card.getByTestId('inventory-item-desc').innerText(),
      });
    }

    await inventory.addToCart(...selection.map((p) => p.name));
    await inventory.header.openCart();

    for (const product of selection) {
      const row = cartPage.item(product.name);
      const expected = inventoryInfo.get(product.name)!;
      await expect(row.getByTestId('inventory-item-price')).toHaveText(expected.price);
      await expect(row.getByTestId('inventory-item-desc')).toHaveText(expected.description);
      await expect(row.getByTestId('item-quantity')).toHaveText('1');
    }
  });

  test('CART-010: continue shopping returns to inventory with cart intact', async ({ loggedInInventory: inventory, shop, cartPage }) => {
    await shop.addToCartAndOpenCart([products.onesie.name]);

    await cartPage.continueShopping();

    await inventory.expectLoaded();
    await inventory.header.expectCartCount(1);
    await expect(inventory.removeButton(products.onesie.name)).toBeVisible();
  });

  test('CART-011: cart contents persist across page navigation and reload', async ({ loggedInInventory: inventory, productDetailsPage, cartPage, page }) => {
    const selection = [products.backpack.name, products.bikeLight.name];
    await inventory.addToCart(...selection);

    await inventory.openProduct(products.backpack.name);
    await productDetailsPage.header.expectCartCount(2);
    await expect(productDetailsPage.removeButton).toBeVisible();

    await productDetailsPage.backToProducts();
    await inventory.header.expectCartCount(2);

    await inventory.header.openCart();
    await page.reload();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText(selection);
    await cartPage.header.expectCartCount(2);
  });

  test('CART-012: cart contents remain unchanged after sorting products', async ({ loggedInInventory: inventory, cartPage }) => {
    const selection = [products.boltTShirt.name, products.fleeceJacket.name];
    await inventory.addToCart(...selection);

    for (const scenario of sortScenarios) {
      await inventory.sortBy(scenario.option);
      await expect(inventory.activeSortOption).toHaveText(scenario.label);
      await inventory.header.expectCartCount(selection.length);
      for (const name of selection) {
        await expect(inventory.removeButton(name)).toBeVisible();
      }
    }

    await inventory.header.openCart();
    await expect(cartPage.itemNames).toHaveText(selection);
  });
});
